import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SCHEMA_SQL_PATH = path.join(process.cwd(), 'db', 'schema.sql');

// Deterministic UUID v5-like generator from string IDs (e.g. 'usr_demo_satvam_01')
// so string IDs map cleanly to PostgreSQL UUID columns
export function toDeterministicUuid(inputStr) {
  const str = String(inputStr || 'default');
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) {
    return str.toLowerCase();
  }
  const hash = crypto.createHash('sha256').update(`vestraai:${str}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `a${hash.slice(17, 20)}`,
    hash.slice(20, 32)
  ].join('-');
}

let pgPool = null;
let dbState = {
  mode: 'local_json_fallback', // 'cloud_sql_postgres' | 'local_json_fallback'
  engine: 'Local JSON Store (data/users_store.json) — Cloud SQL Ready',
  connected: false,
  schemaInitialized: false,
  connectionTarget: 'local-file',
  lastSyncAt: null,
  lastError: null,
  tablesCount: 10,
  tables: [
    'users',
    'user_sessions',
    'user_passkeys',
    'security_audit_logs',
    'portfolio_wallets',
    'portfolio_holdings',
    'trade_orders',
    'rebalance_executions',
    'algo_top_picks_snapshots',
    'copilot_messages'
  ]
};

/**
 * Resolves PostgreSQL connection config for:
 * 1) Standard DATABASE_URL (Cloud Run / AlloyDB / Local Postgres)
 * 2) GCP Cloud SQL Unix Socket (INSTANCE_UNIX_SOCKET=/cloudsql/PROJECT:REGION:INSTANCE)
 * 3) Standard TCP env vars (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
 */
function resolvePostgresConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  const unixSocket = process.env.INSTANCE_UNIX_SOCKET; // e.g. /cloudsql/my-gcp-proj:us-central1:vestraai-pg
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME || 'vestraai';
  const dbPort = Number(process.env.DB_PORT || 5432);

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      targetLabel: databaseUrl.includes('/cloudsql/')
        ? 'GCP Cloud SQL Unix Socket (DATABASE_URL)'
        : 'PostgreSQL Connection URI (DATABASE_URL)'
    };
  }

  if (unixSocket && dbUser) {
    return {
      user: dbUser,
      password: dbPassword,
      database: dbName,
      host: unixSocket,
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      targetLabel: `GCP Cloud SQL Socket (${unixSocket})`
    };
  }

  if (dbHost && dbUser) {
    return {
      user: dbUser,
      password: dbPassword,
      database: dbName,
      host: dbHost,
      port: dbPort,
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      targetLabel: `PostgreSQL TCP (${dbHost}:${dbPort}/${dbName})`
    };
  }

  return null;
}

export async function initDatabaseAdapter() {
  const pgConfig = resolvePostgresConfig();
  if (!pgConfig) {
    return dbState;
  }

  try {
    const pgModule = await import('pg');
    const Pool = pgModule.default?.Pool || pgModule.Pool;
    const { targetLabel, ...poolOptions } = pgConfig;

    pgPool = new Pool(poolOptions);
    const client = await pgPool.connect();
    try {
      const versionRes = await client.query('SELECT version(), current_database()');
      const pgVersion = versionRes.rows?.[0]?.version || 'PostgreSQL 16';

      // Auto-initialize schema from db/schema.sql unless explicitly disabled
      if (process.env.AUTO_MIGRATE_SCHEMA !== 'false' && fs.existsSync(SCHEMA_SQL_PATH)) {
        const schemaSql = fs.readFileSync(SCHEMA_SQL_PATH, 'utf8');
        await client.query(schemaSql);
        dbState.schemaInitialized = true;
      }

      dbState = {
        ...dbState,
        mode: 'cloud_sql_postgres',
        engine: pgVersion.split(',')[0] || 'Cloud SQL for PostgreSQL 16',
        connected: true,
        connectionTarget: targetLabel,
        lastSyncAt: new Date().toISOString(),
        lastError: null
      };
      console.log(`[GCP DB] Connected to ${targetLabel} (${dbState.engine})`);
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn(`[GCP DB] PostgreSQL unavailable (${err.message}). Running on Local JSON Store fallback.`);
    dbState.lastError = err.message;
    dbState.connected = false;
    pgPool = null;
  }

  return dbState;
}

export function getDatabaseStatus() {
  return {
    ...dbState,
    poolTotalCount: pgPool ? pgPool.totalCount : 0,
    poolIdleCount: pgPool ? pgPool.idleCount : 0,
    poolWaitingCount: pgPool ? pgPool.waitingCount : 0,
    schemaFileExists: fs.existsSync(SCHEMA_SQL_PATH)
  };
}

/**
 * Synchronizes a user account, active device sessions, and recent audit logs to Cloud SQL PostgreSQL
 */
export async function syncUserToPostgres(user) {
  if (!pgPool || !dbState.connected || !user) return false;
  const userUuid = toDeterministicUuid(user.id);
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO users (
        id, email, full_name, phone, role, default_market,
        password_salt, password_hash, last_password_change,
        two_factor_enabled, pin_enabled, pin_hash, biometric_enabled, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        default_market = EXCLUDED.default_market,
        password_salt = EXCLUDED.password_salt,
        password_hash = EXCLUDED.password_hash,
        last_password_change = EXCLUDED.last_password_change,
        two_factor_enabled = EXCLUDED.two_factor_enabled,
        pin_enabled = EXCLUDED.pin_enabled,
        pin_hash = EXCLUDED.pin_hash,
        biometric_enabled = EXCLUDED.biometric_enabled,
        updated_at = NOW()`,
      [
        userUuid,
        user.email.toLowerCase(),
        user.name || 'Investor',
        user.phone || '',
        user.role || 'Verified Investor',
        user.defaultMarket === 'INDIA' ? 'INDIA' : 'US',
        user.passwordSalt,
        user.passwordHash,
        user.security?.lastPasswordChange || user.createdAt || new Date().toISOString(),
        Boolean(user.security?.twoFactorEnabled),
        Boolean(user.security?.pinEnabled),
        user.security?.pinHash || null,
        Boolean(user.security?.biometricEnabled),
        user.createdAt || new Date().toISOString()
      ]
    );

    // Sync active device sessions
    if (Array.isArray(user.sessions)) {
      for (const s of user.sessions) {
        const refreshHash = crypto.createHash('sha256').update(String(s.refreshToken || s.sessionId)).digest('hex');
        await client.query(
          `INSERT INTO user_sessions (
            session_id, user_id, device_id, platform, device_name,
            refresh_token_hash, created_at, last_active_at, expires_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (session_id) DO UPDATE SET
            last_active_at = EXCLUDED.last_active_at,
            expires_at = EXCLUDED.expires_at`,
          [
            s.sessionId,
            userUuid,
            s.deviceId || 'web_default',
            ['web', 'android', 'ios'].includes(s.platform) ? s.platform : 'web',
            s.deviceName || 'Web Session',
            refreshHash,
            s.createdAt || new Date().toISOString(),
            s.lastActiveAt || new Date().toISOString(),
            s.expiresAt || new Date(Date.now() + 30 * 86400 * 1000).toISOString()
          ]
        );
      }
    }

    // Insert latest security audit log if present
    const latestAudit = user.auditLogs?.[0];
    if (latestAudit) {
      await client.query(
        `INSERT INTO security_audit_logs (user_id, event_type, platform, ip_address, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userUuid,
          latestAudit.event || 'SECURITY_EVENT',
          latestAudit.platform || 'web',
          latestAudit.ip || '127.0.0.1',
          latestAudit.details || '',
          latestAudit.timestamp || new Date().toISOString()
        ]
      );
    }

    await client.query('COMMIT');
    dbState.lastSyncAt = new Date().toISOString();
    return true;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    dbState.lastError = err.message;
    console.error('[GCP DB] syncUserToPostgres error:', err.message);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Synchronizes a user's market portfolio (Wallet, Holdings, Auto-Exit rules) to Cloud SQL PostgreSQL
 */
export async function syncPortfolioToPostgres(user, market, portfolioState) {
  if (!pgPool || !dbState.connected || !user || !portfolioState) return false;
  const cleanMarket = market === 'INDIA' ? 'INDIA' : 'US';
  const currency = cleanMarket === 'INDIA' ? '₹' : '$';
  const userUuid = toDeterministicUuid(user.id);
  const walletUuid = toDeterministicUuid(`${user.id}:wallet:${cleanMarket}`);
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    // Ensure user exists in users table first
    await syncUserToPostgres(user);

    await client.query(
      `INSERT INTO portfolio_wallets (
        id, user_id, market, currency, liquid_cash_balance,
        vault_divert_pct, vault_autopilot_enabled, agent_mode_enabled, agent_settings, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      ON CONFLICT (user_id, market) DO UPDATE SET
        liquid_cash_balance = EXCLUDED.liquid_cash_balance,
        vault_divert_pct = EXCLUDED.vault_divert_pct,
        vault_autopilot_enabled = EXCLUDED.vault_autopilot_enabled,
        agent_mode_enabled = EXCLUDED.agent_mode_enabled,
        agent_settings = EXCLUDED.agent_settings,
        updated_at = NOW()`,
      [
        walletUuid,
        userUuid,
        cleanMarket,
        currency,
        Math.max(0, Number(portfolioState.cashBalance ?? 10000)),
        Math.min(100, Math.max(0, Number(portfolioState.vaultDivertPct ?? 20))),
        Boolean(portfolioState.vaultAutopilotEnabled),
        Boolean(portfolioState.agentModeEnabled ?? true),
        JSON.stringify(portfolioState.agentSettings || {})
      ]
    );

    // Replace current holdings snapshot for this wallet
    await client.query(`DELETE FROM portfolio_holdings WHERE wallet_id = $1`, [walletUuid]);

    const holdings = Array.isArray(portfolioState.holdings) ? portfolioState.holdings : [];
    for (const h of holdings) {
      if (!h.ticker || Number(h.shares) <= 0) continue;
      const autoExit = h.autoExit || { enabled: false, mode: 'none' };
      const holdingUuid = toDeterministicUuid(`${walletUuid}:${h.ticker}:${h.bucket || 'core'}`);

      await client.query(
        `INSERT INTO portfolio_holdings (
          id, wallet_id, user_id, market, bucket, ticker, company_name,
          category, asset_type, shares, avg_buy_price, last_known_price,
          auto_exit_enabled, auto_exit_mode, auto_exit_profit_pct, auto_exit_target_price, auto_exit_armed_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())`,
        [
          holdingUuid,
          walletUuid,
          userUuid,
          cleanMarket,
          h.bucket === 'agent_vault' ? 'agent_vault' : 'core',
          String(h.ticker).toUpperCase(),
          h.name || h.ticker,
          h.category || 'Equity',
          ['stock', 'commodity', 'etf'].includes(h.assetType) ? h.assetType : 'stock',
          Number(h.shares),
          Math.max(0.0001, Number(h.avgBuyPrice || h.currentPrice || 1)),
          Number(h.currentPrice || h.avgBuyPrice || 0),
          Boolean(autoExit.enabled),
          ['none', 'percentage', 'price'].includes(autoExit.mode) ? autoExit.mode : 'none',
          autoExit.profitPct !== undefined && autoExit.profitPct !== null ? Number(autoExit.profitPct) : null,
          autoExit.targetPrice !== undefined && autoExit.targetPrice !== null ? Number(autoExit.targetPrice) : null,
          autoExit.updatedAt || null
        ]
      );
    }

    await client.query('COMMIT');
    dbState.lastSyncAt = new Date().toISOString();
    return true;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    dbState.lastError = err.message;
    console.error('[GCP DB] syncPortfolioToPostgres error:', err.message);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Persists Stabilized Top 3 Stock Recommendations per trading session date into Cloud SQL
 */
export async function saveTopPicksSnapshotToPostgres(market, tradingSessionDate, isMarketOpen, top3Picks) {
  if (!pgPool || !dbState.connected || !Array.isArray(top3Picks)) return false;
  try {
    await pgPool.query(
      `INSERT INTO algo_top_picks_snapshots (market, trading_session_date, is_market_open, top_3_picks, ranked_universe, computed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (market, trading_session_date) DO UPDATE SET
         is_market_open = EXCLUDED.is_market_open,
         top_3_picks = EXCLUDED.top_3_picks,
         computed_at = NOW()`,
      [
        market === 'INDIA' ? 'INDIA' : 'US',
        tradingSessionDate,
        Boolean(isMarketOpen),
        JSON.stringify(top3Picks),
        JSON.stringify(top3Picks.map((p) => p.ticker))
      ]
    );
    return true;
  } catch (err) {
    console.error('[GCP DB] saveTopPicksSnapshotToPostgres error:', err.message);
    return false;
  }
}
