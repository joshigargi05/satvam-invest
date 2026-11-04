import numpy as np
import pandas as pd

FEATURE_COLS = [
    'ret_1d',
    'ret_5d',
    'ret_20d',
    'ret_60d',
    'ema_ratio_20_50',
    'ema_ratio_50_200',
    'price_to_ema20',
    'price_to_ema200',
    'rsi_14',
    'macd',
    'macd_signal',
    'macd_hist',
    'volatility_20d',
    'volatility_ratio',
    'atr_pct',
    'bb_pct_b',
    'bb_width',
    'volume_ratio_20',
    'volume_surge_5',
    'vwap_ratio',
    'high_low_spread',
    'stoch_k',
    'stoch_d'
]

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / (loss.replace(0, np.nan))
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)

def compute_features(df):
    """
    Computes 23 institutional quantitative features on a DataFrame containing
    ['Open', 'High', 'Low', 'Close', 'Volume'].
    """
    data = df.copy()

    # Returns
    data['ret_1d'] = data['Close'].pct_change(1)
    data['ret_5d'] = data['Close'].pct_change(5)
    data['ret_20d'] = data['Close'].pct_change(20)
    data['ret_60d'] = data['Close'].pct_change(60)

    # Moving Averages
    ema20 = data['Close'].ewm(span=20, adjust=False).mean()
    ema50 = data['Close'].ewm(span=50, adjust=False).mean()
    ema200 = data['Close'].ewm(span=200, adjust=False).mean()

    data['ema_ratio_20_50'] = (ema20 / ema50) - 1.0
    data['ema_ratio_50_200'] = (ema50 / ema200) - 1.0
    data['price_to_ema20'] = (data['Close'] / ema20) - 1.0
    data['price_to_ema200'] = (data['Close'] / ema200) - 1.0

    # Momentum - RSI(14)
    data['rsi_14'] = calculate_rsi(data['Close'], 14) / 100.0  # normalized [0, 1]

    # Momentum - MACD(12, 26, 9)
    ema12 = data['Close'].ewm(span=12, adjust=False).mean()
    ema26 = data['Close'].ewm(span=26, adjust=False).mean()
    macd_line = (ema12 - ema26) / data['Close']  # normalized by price
    macd_signal = macd_line.ewm(span=9, adjust=False).mean()
    macd_hist = macd_line - macd_signal

    data['macd'] = macd_line
    data['macd_signal'] = macd_signal
    data['macd_hist'] = macd_hist

    # Volatility
    daily_vol = data['ret_1d'].rolling(window=20).std()
    data['volatility_20d'] = daily_vol * np.sqrt(252)  # Annualized vol
    vol60 = data['ret_1d'].rolling(window=60).std() * np.sqrt(252)
    data['volatility_ratio'] = (data['volatility_20d'] / vol60.replace(0, np.nan)).fillna(1.0)

    # Average True Range (ATR)
    high_low = data['High'] - data['Low']
    high_close = (data['High'] - data['Close'].shift()).abs()
    low_close = (data['Low'] - data['Close'].shift()).abs()
    true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    atr = true_range.rolling(window=14).mean()
    data['atr_pct'] = (atr / data['Close']).fillna(0.02)

    # Bollinger Bands (20, 2)
    sma20 = data['Close'].rolling(window=20).mean()
    rolling_std = data['Close'].rolling(window=20).std()
    bb_upper = sma20 + (2.0 * rolling_std)
    bb_lower = sma20 - (2.0 * rolling_std)
    data['bb_pct_b'] = ((data['Close'] - bb_lower) / (bb_upper - bb_lower).replace(0, np.nan)).clip(-0.5, 1.5).fillna(0.5)
    data['bb_width'] = ((bb_upper - bb_lower) / sma20).fillna(0.05)

    # Volume Dynamics
    vol_sma20 = data['Volume'].rolling(window=20).mean()
    vol_sma5 = data['Volume'].rolling(window=5).mean()
    data['volume_ratio_20'] = (data['Volume'] / vol_sma20.replace(0, np.nan)).clip(0.1, 5.0).fillna(1.0)
    data['volume_surge_5'] = (vol_sma5 / vol_sma20.replace(0, np.nan)).clip(0.1, 4.0).fillna(1.0)

    # Rolling VWAP Proxy (20-day)
    typical_price = (data['High'] + data['Low'] + data['Close']) / 3.0
    cum_vol_price = (typical_price * data['Volume']).rolling(window=20).sum()
    cum_vol = data['Volume'].rolling(window=20).sum()
    rolling_vwap = cum_vol_price / cum_vol.replace(0, np.nan)
    data['vwap_ratio'] = ((data['Close'] / rolling_vwap) - 1.0).clip(-0.25, 0.25).fillna(0.0)

    # High-Low Range
    data['high_low_spread'] = ((data['High'] - data['Low']) / data['Close']).fillna(0.02)

    # Stochastic Oscillator (14, 3)
    low14 = data['Low'].rolling(window=14).min()
    high14 = data['High'].rolling(window=14).max()
    stoch_k = 100 * ((data['Close'] - low14) / (high14 - low14).replace(0, np.nan))
    data['stoch_k'] = (stoch_k / 100.0).clip(0, 1).fillna(0.5)
    data['stoch_d'] = (data['stoch_k'].rolling(window=3).mean()).clip(0, 1).fillna(0.5)

    return data
