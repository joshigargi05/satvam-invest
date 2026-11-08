-- ============================================================================
-- VestraAI (satvam-invest) — GCP Cloud SQL for PostgreSQL Production Schema
-- Supports: Web, Android Native, and iOS Native Multi-Platform Architecture
-- Engine: PostgreSQL 15+ / 16+ (Cloud SQL for PostgreSQL or AlloyDB)
-- ============================================================================

BEGIN;

-- Enable UUID generation and pgvector (for AI Copilot & Earnings Transcript RAG)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Uncomment on Cloud SQL if using vector embeddings for Earnings / Copilot RAG:
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 1. USERS & SECURITY CONFIGURATION
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   VARCHAR(255) NOT NULL UNIQUE,
    full_name               VARCHAR(150) NOT NULL,
    phone                   VARCHAR(40),
    role                    VARCHAR(50) NOT NULL DEFAULT 'Verified Investor',
    default_market          VARCHAR(10) NOT NULL DEFAULT 'US' CHECK (default_market IN ('US', 'INDIA')),
    
    -- Cryptographic Credentials (scrypt 64-byte hash + 16-byte salt)
    password_salt           VARCHAR(64) NOT NULL,
    password_hash           VARCHAR(256) NOT NULL,
    last_password_change    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Multi-Layer Mobile & Web Security Flags
    two_factor_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret       VARCHAR(128),
    pin_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
    pin_hash                VARCHAR(128),
    biometric_enabled       BOOLEAN NOT NULL DEFAULT FALSE,

    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

-- ============================================================================
-- 2. MULTI-PLATFORM DEVICE SESSIONS (WEB, ANDROID, IOS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id              VARCHAR(64) PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id               VARCHAR(128) NOT NULL,
    platform                VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
    device_name             VARCHAR(150) NOT NULL,
    ip_address              INET,
    user_agent              TEXT,
    refresh_token_hash      VARCHAR(256) NOT NULL UNIQUE,
    push_fcm_token          TEXT, -- Firebase Cloud Messaging token for Android/iOS Auto-Exit alerts
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at              TIMESTAMPTZ NOT NULL,
    revoked_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON user_sessions (user_id, device_id);

-- ============================================================================
-- 3. WEBAUTHN / BIOMETRIC PASSKEY CREDENTIALS (FACEID / TOUCHID / FINGERPRINT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_passkeys (
    credential_id           VARCHAR(255) PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key              TEXT NOT NULL,
    counter                 BIGINT NOT NULL DEFAULT 0,
    platform                VARCHAR(20) NOT NULL DEFAULT 'web',
    device_label            VARCHAR(120),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at            TIMESTAMPTZ
);

-- ============================================================================
-- 4. IMMUTABLE SECURITY AUDIT LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type              VARCHAR(64) NOT NULL, -- e.g. LOGIN_SUCCESS, 2FA_VERIFIED, PIN_UNLOCK_SUCCESS, SESSION_REVOKED
    platform                VARCHAR(20) NOT NULL DEFAULT 'web',
    ip_address              VARCHAR(64),
    details                 TEXT,
    metadata                JSONB DEFAULT '{}'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_user_time ON security_audit_logs (user_id, created_at DESC);

-- ============================================================================
-- 5. PORTFOLIO WALLETS & AUTONOMOUS AGENT SETTINGS (PER USER, PER MARKET)
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_wallets (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market                  VARCHAR(10) NOT NULL CHECK (market IN ('US', 'INDIA')),
    currency                VARCHAR(5) NOT NULL CHECK (currency IN ('$', '₹')),
    
    -- Exact Decimal Financial Ledger (Prevents IEEE-754 floating-point drift)
    liquid_cash_balance     NUMERIC(18, 4) NOT NULL DEFAULT 10000.0000 CHECK (liquid_cash_balance >= 0),
    
    -- Dual-Bucket & Autonomous Agent Configuration
    vault_divert_pct        NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (vault_divert_pct BETWEEN 0 AND 100),
    vault_autopilot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    agent_mode_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    agent_settings          JSONB NOT NULL DEFAULT '{
        "maxAllocationPct": 20,
        "riskLevel": "Moderate",
        "minConvictionThreshold": 70,
        "autoExecution": true,
        "weights": {"macro": 25, "derivatives": 25, "technical": 30, "fundamental": 20}
    }'::jsonb,

    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, market)
);

-- ============================================================================
-- 6. PORTFOLIO HOLDINGS & AUTO-EXIT (TAKE-PROFIT / TARGET PRICE) RULES
-- ============================================================================
CREATE TABLE IF NOT EXISTS portfolio_holdings (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id               UUID NOT NULL REFERENCES portfolio_wallets(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    market                  VARCHAR(10) NOT NULL CHECK (market IN ('US', 'INDIA')),
    bucket                  VARCHAR(20) NOT NULL DEFAULT 'core' CHECK (bucket IN ('core', 'agent_vault')),
    
    ticker                  VARCHAR(32) NOT NULL,
    company_name            VARCHAR(150) NOT NULL,
    category                VARCHAR(80) DEFAULT 'Equity',
    asset_type              VARCHAR(20) NOT NULL DEFAULT 'stock' CHECK (asset_type IN ('stock', 'commodity', 'etf')),
    
    -- Position Quantities & Cost Basis
    shares                  NUMERIC(18, 6) NOT NULL CHECK (shares > 0),
    avg_buy_price           NUMERIC(18, 4) NOT NULL CHECK (avg_buy_price > 0),
    last_known_price        NUMERIC(18, 4) NOT NULL DEFAULT 0,

    -- Secondary Auto-Exit Strategy (Manual Sell is Default when auto_exit_enabled = FALSE)
    auto_exit_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
    auto_exit_mode          VARCHAR(20) CHECK (auto_exit_mode IN ('none', 'percentage', 'price')),
    auto_exit_profit_pct    NUMERIC(10, 2),
    auto_exit_target_price  NUMERIC(18, 4),
    auto_exit_armed_at      TIMESTAMPTZ,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (wallet_id, ticker, bucket)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user_market ON portfolio_holdings (user_id, market);
CREATE INDEX IF NOT EXISTS idx_holdings_armed_auto_exit ON portfolio_holdings (market, ticker) WHERE auto_exit_enabled = TRUE;

-- ============================================================================
-- 7. TRADE ORDERS & AUTO-EXIT EXECUTION LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS trade_orders (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id               UUID NOT NULL REFERENCES portfolio_wallets(id) ON DELETE CASCADE,
    market                  VARCHAR(10) NOT NULL CHECK (market IN ('US', 'INDIA')),
    bucket                  VARCHAR(20) NOT NULL DEFAULT 'core',
    
    ticker                  VARCHAR(32) NOT NULL,
    company_name            VARCHAR(150),
    side                    VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    order_trigger           VARCHAR(30) NOT NULL DEFAULT 'MANUAL' CHECK (
                                order_trigger IN ('MANUAL', 'AUTO_EXIT_PCT', 'AUTO_EXIT_PRICE', 'AGENT_AUTOPILOT', 'MACRO_SHUFFLE')
                            ),
    
    shares                  NUMERIC(18, 6) NOT NULL CHECK (shares > 0),
    execution_price         NUMERIC(18, 4) NOT NULL CHECK (execution_price > 0),
    total_amount            NUMERIC(18, 4) NOT NULL,
    
    -- Realized PnL populated on SELL orders (including Auto-Exit executions)
    avg_cost_basis          NUMERIC(18, 4),
    realized_pnl            NUMERIC(18, 4),
    realized_pnl_pct        NUMERIC(10, 2),
    target_price_at_exit    NUMERIC(18, 4),
    
    platform                VARCHAR(20) DEFAULT 'web',
    executed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_orders_user_time ON trade_orders (user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_orders_trigger ON trade_orders (user_id, order_trigger, executed_at DESC);

-- ============================================================================
-- 8. AUTONOMOUS PORTFOLIO REBALANCE (AUTO-SHUFFLE) AUDIT LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS rebalance_executions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id               UUID NOT NULL REFERENCES portfolio_wallets(id) ON DELETE CASCADE,
    market                  VARCHAR(10) NOT NULL,
    scenario_name           VARCHAR(200) NOT NULL,
    scope                   VARCHAR(20) NOT NULL CHECK (scope IN ('vault', 'full')),
    divert_pct              NUMERIC(5, 2) NOT NULL,
    
    total_net_worth         NUMERIC(18, 4) NOT NULL,
    deployed_capital        NUMERIC(18, 4) NOT NULL,
    core_capital_protected  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    remaining_cash          NUMERIC(18, 4) NOT NULL,
    orders_payload          JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    executed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rebalance_user_time ON rebalance_executions (user_id, executed_at DESC);

-- ============================================================================
-- 9. STABILIZED TOP 3 ALGO RECOMMENDATIONS & XGBOOST SNAPSHOTS
-- ============================================================================
-- Persists the Top 3 Recommended Stocks per trading session date so weekend
-- or Cloud Run container restarts never alter the locked session rankings.
CREATE TABLE IF NOT EXISTS algo_top_picks_snapshots (
    id                      BIGSERIAL PRIMARY KEY,
    market                  VARCHAR(10) NOT NULL CHECK (market IN ('US', 'INDIA')),
    trading_session_date    DATE NOT NULL, -- Anchored via getLastTradingSessionDate(market)
    is_market_open          BOOLEAN NOT NULL DEFAULT FALSE,
    top_3_picks             JSONB NOT NULL, -- Full 4-layer matrix, XGBoost drivers & target prices
    ranked_universe         JSONB NOT NULL,
    computed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (market, trading_session_date)
);

-- ============================================================================
-- 10. AI COPILOT CONVERSATIONS & DEEP ANALYSIS CACHE
-- ============================================================================
CREATE TABLE IF NOT EXISTS copilot_messages (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider                VARCHAR(30) NOT NULL DEFAULT 'gemini',
    sender_role             VARCHAR(10) NOT NULL CHECK (sender_role IN ('user', 'ai')),
    message_text            TEXT NOT NULL,
    chart_payload           JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copilot_user_time ON copilot_messages (user_id, created_at ASC);

-- ============================================================================
-- 11. ALGO STOCK TARGET MILESTONES & CELEBRATION AUDIT LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS algo_target_milestones (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker                  VARCHAR(32) NOT NULL,
    company_name            VARCHAR(150) NOT NULL,
    market                  VARCHAR(10) NOT NULL CHECK (market IN ('US', 'INDIA')),
    timeframe               VARCHAR(20) NOT NULL CHECK (timeframe IN ('Quarterly', '6 Months', '12 Months')),
    recommended_price       NUMERIC(18, 4) NOT NULL,
    target_price            NUMERIC(18, 4) NOT NULL,
    target_pct              NUMERIC(10, 2) NOT NULL,
    current_price           NUMERIC(18, 4) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'ACHIEVED', 'EXPIRED')),
    achieved_at             TIMESTAMPTZ,
    achieved_price          NUMERIC(18, 4),
    celebrated              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ticker, market, timeframe)
);

CREATE INDEX IF NOT EXISTS idx_algo_milestones_status ON algo_target_milestones (market, status);
CREATE INDEX IF NOT EXISTS idx_algo_milestones_celebrated ON algo_target_milestones (celebrated) WHERE status = 'ACHIEVED';

COMMIT;
