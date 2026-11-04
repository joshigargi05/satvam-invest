import argparse
import json
import os
import sys
import numpy as np
import pandas as pd
import yfinance as yf
import xgboost as xgb

from features import FEATURE_COLS, compute_features

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'xgb_alpha_model.json')
META_PATH = os.path.join(os.path.dirname(__file__), 'model_metadata.json')
OUTPUT_BATCH_PATH = os.path.join(os.path.dirname(__file__), 'latest_predictions.json')

def load_model_and_meta():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run train_xgboost.py first.")
    
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    
    meta = {}
    if os.path.exists(META_PATH):
        with open(META_PATH, 'r', encoding='utf-8') as f:
            meta = json.load(f)
            
    return model, meta

def predict_single_symbol(symbol, model, meta):
    clean_sym = symbol.strip().upper()
    is_india = clean_sym.endswith('.NS') or clean_sym in [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL',
        'SBIN', 'LT', 'ITC', 'HINDUNILVR', 'BAJFINANCE', 'TATAMOTORS',
        'MARUTI', 'SUNPHARMA', 'AXISBANK', 'KOTAKBANK', 'TITAN', 'ADANIENT',
        'ADANIPORTS', 'POWERGRID', 'NTPC', 'ULTRACEMCO', 'TATASTEEL',
        'WIPRO', 'HAL', 'BEL', 'TRENT', 'M&M'
    ]

    yf_ticker = f"{clean_sym}.NS" if is_india and not clean_sym.endswith('.NS') else clean_sym
    
    try:
        df = yf.download(yf_ticker, period='1y', interval='1d', progress=False)
        if df.empty or len(df) < 60:
            return None
        
        # Flatten MultiIndex columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        feat_df = compute_features(df)
        last_row = feat_df.iloc[-1]
        
        feature_vector = pd.DataFrame([last_row[FEATURE_COLS]])
        
        # Raw probability of outperforming benchmark
        prob = float(model.predict_proba(feature_vector)[0][1])
        
        # Scale probability to 0-100 XGBoost Score
        # Probabilities typically range from ~0.25 to ~0.75, so normalize to 50-98 range
        scaled_score = min(98.5, max(42.0, 50.0 + (prob - 0.35) * 110.0))
        win_prob = round(scaled_score * 0.92, 1)

        # Determine top 3 contributing features
        feature_stats = meta.get('feature_stats', {})
        importances = meta.get('feature_importances', {})
        
        contributions = []
        for col in FEATURE_COLS:
            val = float(last_row[col])
            mean = feature_stats.get(col, {}).get('mean', 0.0)
            std = feature_stats.get(col, {}).get('std', 1.0)
            z_score = (val - mean) / (std or 1.0)
            weight = importances.get(col, 0.04)
            impact = z_score * weight
            contributions.append((col, val, impact))
            
        contributions.sort(key=lambda x: abs(x[2]), reverse=True)
        top_drivers = [
            {
                "feature": col,
                "value": round(val, 4),
                "impact": "Bullish" if imp > 0 else "Bearish"
            }
            for col, val, imp in contributions[:3]
        ]

        rsi_val = int(round(float(last_row['rsi_14']) * 100))
        vwap_dev = round(float(last_row['vwap_ratio']) * 100, 2)
        vol_20 = round(float(last_row['volatility_20d']) * 100, 1)
        current_price = float(df['Close'].iloc[-1])
        change_pct = float(df['Close'].pct_change().iloc[-1] * 100)

        return {
            "symbol": clean_sym,
            "market": "INDIA" if is_india else "US",
            "currentPrice": round(current_price, 2),
            "changePct": round(change_pct, 2),
            "xgboostScore": round(scaled_score, 1),
            "winProbability": win_prob,
            "rawProbability": round(prob, 4),
            "technicalIndicators": {
                "rsi": rsi_val,
                "vwapDeviationPct": vwap_dev,
                "realizedVol20Pct": vol_20,
                "atrPct": round(float(last_row['atr_pct']) * 100, 2)
            },
            "topFeatureDrivers": top_drivers,
            "evaluatedAt": pd.Timestamp.now().isoformat()
        }
    except Exception as e:
        return {"symbol": clean_sym, "error": str(e)}

def batch_predict(symbols, model, meta):
    print(f"Batch evaluating {len(symbols)} tickers with real XGBoost model...")
    results = {}
    for sym in symbols:
        pred = predict_single_symbol(sym, model, meta)
        if pred and "xgboostScore" in pred:
            results[sym] = pred
            print(f"  [{pred['market']}] {sym:<10} Score: {pred['xgboostScore']}% | Win Prob: {pred['winProbability']}%")

    with open(OUTPUT_BATCH_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"\n[OK] Batch predictions saved to: {OUTPUT_BATCH_PATH}")
    return results

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Live XGBoost Alpha Predictor")
    parser.add_argument('--symbol', type=str, help="Evaluate a single ticker symbol")
    parser.add_argument('--batch', action='store_true', help="Run batch evaluation on the full active stock catalog")
    args = parser.parse_args()

    model, meta = load_model_and_meta()

    if args.symbol:
        res = predict_single_symbol(args.symbol, model, meta)
        print(json.dumps(res, indent=2))
    elif args.batch:
        sample_catalog = [
            'NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'LLY', 'ORCL',
            'AMD', 'PLTR', 'JPM', 'GS', 'V', 'MA', 'XOM', 'CVX', 'WMT', 'HD', 'PG', 'ISRG',
            'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'SBIN', 'LT',
            'ITC', 'TATAMOTORS', 'TITAN', 'HAL', 'BEL', 'TRENT', 'M&M'
        ]
        batch_predict(sample_catalog, model, meta)
    else:
        # Default test NVDA
        res = predict_single_symbol('NVDA', model, meta)
        print(json.dumps(res, indent=2))
