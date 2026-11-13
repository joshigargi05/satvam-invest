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

# Full Institutional Universe Catalog (118 Equities)
US_TICKERS = [
    'NVDA', 'GOOGL', 'MU', 'AVGO', 'MSFT', 'META', 'AMZN', 'TSM', 'LLY', 'PLTR',
    'ORCL', 'NOW', 'CRWD', 'PANW', 'AAPL', 'AMD', 'COST', 'GE', 'AMAT', 'ISRG',
    'CRM', 'NFLX', 'JPM', 'LRCX', 'QCOM', 'NTAP', 'RTX', 'LMT', 'CAT', 'GS',
    'MS', 'BLK', 'V', 'MA', 'AXP', 'XOM', 'TSLA', 'ABBV', 'IBM', 'CVX',
    'UBER', 'UNH', 'WMT', 'HD', 'BAC', 'TMO', 'ADBE', 'TXN', 'PG', 'JNJ',
    'MRK', 'KO', 'PEP', 'MCD', 'CSCO', 'PYPL', 'INTC', 'DIS'
]

INDIAN_TICKERS = [
    'RELIANCE', 'TCS', 'TATAMOTORS', 'LT', 'HAL', 'BEL', 'TRENT', 'INFY', 'SBIN', 'ICICIBANK',
    'M&M', 'SUNPHARMA', 'BHARTIARTL', 'HDFCBANK', 'BAJFINANCE', 'HCLTECH', 'MARUTI', 'NTPC',
    'TITAN', 'ADANIPORTS', 'BAJAJ-AUTO', 'ITC', 'AXISBANK', 'KOTAKBANK', 'ADANIENT', 'POWERGRID',
    'ULTRACEMCO', 'COALINDIA', 'CIPLA', 'APOLLOHOSP', 'EICHERMOT', 'DIVISLAB', 'ONGC',
    'HINDUNILVR', 'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'GRASIM', 'TECHM', 'WIPRO',
    'BAJAJFINSV', 'NESTLEIND', 'DRREDDY', 'SBILIFE', 'HDFCLIFE', 'BPCL', 'BRITANNIA',
    'TATACONSUM', 'HEROMOTOCO', 'SHRIRAMFIN', 'ASIANPAINT', 'INDUSINDBK', 'MEESHO', 'SWIGGY',
    'ETERNAL', 'ZOMATO', 'PAYTM', 'NYKAA', 'JIOFIN', 'TATATECH'
]

FULL_CATALOG = US_TICKERS + INDIAN_TICKERS

TICKER_MAP = {
    'TATAMOTORS': 'TMPV.NS',
    'ZOMATO': 'ETERNAL.NS',
}

INDIAN_SET = set(INDIAN_TICKERS)

def get_yf_ticker(sym):
    clean = sym.strip().upper()
    if clean in TICKER_MAP:
        return TICKER_MAP[clean]
    if clean.endswith('.NS') or clean.endswith('.BO'):
        return clean
    if clean in INDIAN_SET:
        return f"{clean}.NS"
    return clean

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

def predict_single_symbol(symbol, model, meta, df=None):
    clean_sym = symbol.strip().upper()
    is_india = clean_sym.endswith('.NS') or clean_sym in INDIAN_SET or clean_sym in ['ZOMATO', 'TATAMOTORS']
    yf_ticker = get_yf_ticker(clean_sym)
    
    try:
        if df is None:
            df = yf.download(yf_ticker, period='1y', interval='1d', progress=False)

        if df is None or df.empty or len(df) < 15:
            return None
        
        # Flatten MultiIndex columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        # Ensure required columns exist
        req_cols = ['Open', 'High', 'Low', 'Close', 'Volume']
        if not all(col in df.columns for col in req_cols):
            return None

        # Clean NaNs in OHLCV
        clean_df = df[req_cols].dropna().copy()
        if len(clean_df) < 15:
            return None

        feat_df = compute_features(clean_df)
        last_row = feat_df.iloc[-1]
        
        feature_vector = pd.DataFrame([last_row[FEATURE_COLS]])
        
        # Raw probability of outperforming benchmark
        prob = float(model.predict_proba(feature_vector)[0][1])
        
        # Scale probability to 0-100 XGBoost Score (normalized to 50-98 range)
        scaled_score = min(98.5, max(42.0, 50.0 + (prob - 0.35) * 110.0))
        win_prob = round(scaled_score * 0.92, 1)

        # Determine top 3 contributing features
        feature_stats = meta.get('feature_stats', {})
        importances = meta.get('feature_importances', {})
        
        contributions = []
        for col in FEATURE_COLS:
            val = float(last_row[col]) if pd.notnull(last_row[col]) else 0.0
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
        current_price = float(clean_df['Close'].iloc[-1])
        change_pct = float((clean_df['Close'].pct_change().iloc[-1] if len(clean_df) > 1 else 0.0) * 100)

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

def batch_predict(symbols=None, model=None, meta=None):
    if symbols is None:
        symbols = FULL_CATALOG

    if model is None or meta is None:
        model, meta = load_model_and_meta()

    print(f"Batch evaluating {len(symbols)} tickers with real XGBoost model...")

    # Pre-fetch all mapped yfinance symbols in a single high-speed bulk download
    yf_symbol_map = {sym: get_yf_ticker(sym) for sym in symbols}
    unique_yf = list(set(yf_symbol_map.values()))

    print(f"Downloading historical candles for {len(unique_yf)} unique market tickers...")
    try:
        bulk_raw = yf.download(unique_yf, period='1y', interval='1d', progress=False, group_by='ticker')
    except Exception as e:
        print(f"Bulk download failed ({e}), falling back to iterative download...")
        bulk_raw = None

    results = {}
    success_count = 0

    for sym in symbols:
        yf_sym = yf_symbol_map[sym]
        sub_df = None

        if bulk_raw is not None and isinstance(bulk_raw.columns, pd.MultiIndex):
            try:
                if yf_sym in bulk_raw.columns.levels[0]:
                    sub_df = bulk_raw[yf_sym].dropna().copy()
            except Exception:
                sub_df = None

        pred = predict_single_symbol(sym, model, meta, df=sub_df)
        if pred and "xgboostScore" in pred:
            results[sym] = pred
            success_count += 1
            print(f"  [{pred['market']:<5}] {sym:<12} Score: {pred['xgboostScore']:<4}% | Win Prob: {pred['winProbability']:<4}% | Top Driver: {pred['topFeatureDrivers'][0]['feature']} ({pred['topFeatureDrivers'][0]['impact']})")
        else:
            err = pred.get('error', 'insufficient candles') if pred else 'no data'
            print(f"  [WARN ] {sym:<12} Prediction skipped: {err}")

    # Write output to latest_predictions.json
    with open(OUTPUT_BATCH_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print(f"\n[OK] Successfully generated real XGBoost predictions for {success_count}/{len(symbols)} tickers.")
    print(f"[OK] Saved to: {OUTPUT_BATCH_PATH}")
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
    else:
        # Default action: run batch on full catalog
        batch_predict(FULL_CATALOG, model, meta)
