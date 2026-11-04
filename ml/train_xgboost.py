import json
import os
import sys
import numpy as np
import pandas as pd
import yfinance as yf
import xgboost as xgb
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, classification_report
from datetime import datetime, timedelta

from features import FEATURE_COLS, compute_features

# Training Universe
US_TICKERS = [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'LLY', 'ORCL',
    'AMD', 'PLTR', 'JPM', 'GS', 'V', 'MA', 'XOM', 'CVX', 'WMT', 'HD',
    'PG', 'CAT', 'LMT', 'ISRG', 'CRM', 'NOW', 'PANW', 'CRWD', 'QCOM', 'TXN'
]

INDIA_TICKERS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'BHARTIARTL.NS', 'SBIN.NS', 'LT.NS', 'ITC.NS', 'HINDUNILVR.NS',
    'TATAMOTORS.NS', 'MARUTI.NS', 'SUNPHARMA.NS', 'TITAN.NS', 'ADANIENT.NS',
    'ADANIPORTS.NS', 'TATASTEEL.NS', 'HAL.NS', 'BEL.NS', 'TRENT.NS', 'M&M.NS'
]

def fetch_data(tickers, benchmark_sym, start_date, end_date):
    print(f"Fetching historical data for {len(tickers)} tickers + benchmark {benchmark_sym}...")
    all_syms = list(set(tickers + [benchmark_sym]))
    raw = yf.download(all_syms, start=start_date, end=end_date, progress=False, group_by='ticker')
    
    # Process benchmark forward returns
    bench_df = raw[benchmark_sym].dropna().copy()
    bench_fwd = (bench_df['Close'].shift(-20) / bench_df['Close']) - 1.0
    bench_fwd_map = bench_fwd.to_dict()

    dataset_rows = []
    
    for sym in tickers:
        try:
            if sym not in raw.columns.levels[0]:
                continue
            df = raw[sym].dropna().copy()
            if len(df) < 250:
                continue

            # Compute features
            feat_df = compute_features(df)
            
            # Forward 20-day return
            feat_df['fwd_ret_20d'] = (feat_df['Close'].shift(-20) / feat_df['Close']) - 1.0
            
            # Benchmark forward return aligned by date
            feat_df['bench_fwd_20d'] = feat_df.index.map(bench_fwd_map)
            
            # Alpha over benchmark
            feat_df['alpha_20d'] = feat_df['fwd_ret_20d'] - feat_df['bench_fwd_20d']
            
            # Binary target: outperforms benchmark by > 2.5% over next month
            feat_df['target'] = (feat_df['alpha_20d'] > 0.025).astype(int)
            feat_df['ticker'] = sym.replace('.NS', '')
            feat_df['market'] = 'INDIA' if '.NS' in sym else 'US'
            
            # Drop NaN rows (first 200 days for EMA200, last 20 days for forward target)
            valid = feat_df.dropna(subset=FEATURE_COLS + ['target', 'alpha_20d'])
            dataset_rows.append(valid)
        except Exception as e:
            print(f"Error processing {sym}: {e}")

    if not dataset_rows:
        return pd.DataFrame()

    return pd.concat(dataset_rows)

def train_pipeline():
    start_time = datetime.now()
    start_date = (start_time - timedelta(days=5 * 365)).strftime('%Y-%m-%d')
    end_date = start_time.strftime('%Y-%m-%d')
    
    print(f"===========================================================")
    print(f" Starting XGBoost Alpha Model Training (5-Year Lookback)")
    print(f" Window: {start_date} to {end_date}")
    print(f"===========================================================")

    # 1. Fetch US Data
    us_data = fetch_data(US_TICKERS, 'SPY', start_date, end_date)
    print(f"US Dataset: {len(us_data)} sample rows across {len(US_TICKERS)} tickers.")

    # 2. Fetch India Data
    india_data = fetch_data(INDIA_TICKERS, '^NSEI', start_date, end_date)
    print(f"India Dataset: {len(india_data)} sample rows across {len(INDIA_TICKERS)} tickers.")

    # Combine datasets
    full_df = pd.concat([us_data, india_data]).sort_index()
    print(f"Total Unified Training Samples: {len(full_df)}")

    # Temporal Train/Validation Split (Last 1.5 years for testing)
    split_date = (start_time - timedelta(days=int(1.5 * 365))).strftime('%Y-%m-%d')
    train_df = full_df[full_df.index < split_date]
    val_df = full_df[full_df.index >= split_date]

    print(f"Train samples (pre-{split_date}): {len(train_df)}")
    print(f"Validation samples (post-{split_date}): {len(val_df)}")

    X_train = train_df[FEATURE_COLS]
    y_train = train_df['target']
    X_val = val_df[FEATURE_COLS]
    y_val = val_df['target']

    pos_pct = (y_train.sum() / len(y_train)) * 100
    print(f"Positive Alpha Class Balance (Train): {pos_pct:.2f}%")

    # 3. Train XGBoost Classifier
    print("\nTraining XGBoost Classifier with Gradient-Boosted Trees...")
    scale_pos_weight = (len(y_train) - y_train.sum()) / max(1, y_train.sum())
    
    model = xgb.XGBClassifier(
        n_estimators=160,
        max_depth=4,
        learning_rate=0.035,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight,
        eval_metric='logloss',
        random_state=42
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_val, y_val)],
        verbose=False
    )

    # 4. Validation Metrics
    y_val_probs = model.predict_proba(X_val)[:, 1]
    y_val_preds = (y_val_probs >= 0.5).astype(int)

    val_auc = roc_auc_score(y_val, y_val_probs)
    val_acc = accuracy_score(y_val, y_val_preds)
    val_prec = precision_score(y_val, y_val_preds, zero_division=0)

    print("\n===========================================================")
    print(" Out-of-Sample Validation Results (No Lookahead Leakage)")
    print(f" ROC-AUC Score:      {val_auc:.4f} (Benchmark > 0.50 random)")
    print(f" Classification Acc: {val_acc * 100:.2f}%")
    print(f" Precision:          {val_prec * 100:.2f}%")
    print("===========================================================")

    # Feature Importances
    importances = model.feature_importances_
    feat_ranks = sorted(zip(FEATURE_COLS, importances), key=lambda x: x[1], reverse=True)
    
    print("\nTop 10 Most Predictive Features:")
    for rank, (feat, imp) in enumerate(feat_ranks[:10], 1):
        print(f"  {rank:2d}. {feat:<20} {imp * 100:6.2f}%")

    # 5. Export Model & Metadata
    os.makedirs('ml', exist_ok=True)
    model_path = 'ml/xgb_alpha_model.json'
    model.save_model(model_path)
    print(f"\n[OK] Saved trained XGBoost model to: {model_path}")

    # Compute baseline feature stats (mean and std) for normalization during live inference
    feature_stats = {}
    for col in FEATURE_COLS:
        feature_stats[col] = {
            'mean': float(X_train[col].mean()),
            'std': float(X_train[col].std() or 1.0),
            'min': float(X_train[col].min()),
            'max': float(X_train[col].max())
        }

    meta = {
        'trained_at': datetime.now().isoformat(),
        'samples_count': len(full_df),
        'train_samples': len(train_df),
        'val_samples': len(val_df),
        'metrics': {
            'roc_auc': round(float(val_auc), 4),
            'accuracy': round(float(val_acc), 4),
            'precision': round(float(val_prec), 4)
        },
        'feature_importances': {feat: round(float(imp), 5) for feat, imp in feat_ranks},
        'feature_stats': feature_stats,
        'feature_cols': FEATURE_COLS,
        'hyperparameters': {
            'n_estimators': 160,
            'max_depth': 4,
            'learning_rate': 0.035,
            'subsample': 0.85
        }
    }

    meta_path = 'ml/model_metadata.json'
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)
    print(f"[OK] Saved model metadata & feature statistics to: {meta_path}")

if __name__ == '__main__':
    train_pipeline()
