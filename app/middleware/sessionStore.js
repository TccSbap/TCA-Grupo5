const session = require('express-session');

const DEFAULT_TABLE_NAME = 'app_sessions';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

class MySqlSessionStore extends session.Store {
    constructor(pool, options = {}) {
        super();

        this.pool = pool;
        this.tableName = options.tableName || DEFAULT_TABLE_NAME;
        this.cleanupIntervalMs = Number.isFinite(Number(options.cleanupIntervalMs))
            ? Number(options.cleanupIntervalMs)
            : DEFAULT_CLEANUP_INTERVAL_MS;
        this.createTablePromise = null;
        this.cleanupTimer = null;
    }

    async ensureTable() {
        if (!this.createTablePromise) {
            const tableName = `\`${this.tableName}\``;

            this.createTablePromise = this.pool.execute(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
                    expires_at BIGINT UNSIGNED NOT NULL,
                    session_data LONGTEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_${this.tableName}_expires_at (expires_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
        }

        await this.createTablePromise;

        if (this.cleanupIntervalMs > 0 && !this.cleanupTimer) {
            this.startCleanupTimer();
        }
    }

    getExpiresAt(sessionObject) {
        const cookie = sessionObject && sessionObject.cookie ? sessionObject.cookie : {};

        if (cookie.expires) {
            const expiresAt = new Date(cookie.expires).getTime();
            if (Number.isFinite(expiresAt)) {
                return expiresAt;
            }
        }

        if (typeof cookie.maxAge === 'number' && Number.isFinite(cookie.maxAge)) {
            return Date.now() + cookie.maxAge;
        }

        return Date.now() + DEFAULT_TTL_MS;
    }

    async pruneExpired() {
        await this.ensureTable();

        await this.pool.execute(
            `DELETE FROM \`${this.tableName}\` WHERE expires_at <= ?`,
            [Date.now()]
        );
    }

    startCleanupTimer() {
        if (this.cleanupTimer || this.cleanupIntervalMs <= 0) {
            return;
        }

        this.cleanupTimer = setInterval(() => {
            this.pruneExpired().catch((error) => {
                console.error('Falha ao limpar sessoes expiradas:', error);
            });
        }, this.cleanupIntervalMs);

        if (typeof this.cleanupTimer.unref === 'function') {
            this.cleanupTimer.unref();
        }
    }

    stopCleanupTimer() {
        if (!this.cleanupTimer) {
            return;
        }

        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
    }

    async get(sid, callback) {
        try {
            await this.ensureTable();

            const [rows] = await this.pool.execute(
                `SELECT session_data, expires_at FROM \`${this.tableName}\` WHERE session_id = ? LIMIT 1`,
                [sid]
            );

            if (!rows.length) {
                return callback(null, null);
            }

            const row = rows[0];
            if (Number(row.expires_at) <= Date.now()) {
                await this.destroy(sid, () => {});
                return callback(null, null);
            }

            return callback(null, JSON.parse(row.session_data));
        } catch (error) {
            return callback(error);
        }
    }

    async set(sid, sessionObject, callback) {
        try {
            await this.ensureTable();

            const expiresAt = this.getExpiresAt(sessionObject);
            const payload = JSON.stringify(sessionObject);

            await this.pool.execute(
                `INSERT INTO \`${this.tableName}\` (session_id, expires_at, session_data)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    expires_at = VALUES(expires_at),
                    session_data = VALUES(session_data)`,
                [sid, expiresAt, payload]
            );

            return callback && callback(null);
        } catch (error) {
            return callback && callback(error);
        }
    }

    async destroy(sid, callback) {
        try {
            await this.ensureTable();

            await this.pool.execute(
                `DELETE FROM \`${this.tableName}\` WHERE session_id = ?`,
                [sid]
            );

            return callback && callback(null);
        } catch (error) {
            return callback && callback(error);
        }
    }

    async touch(sid, sessionObject, callback) {
        try {
            await this.ensureTable();

            const expiresAt = this.getExpiresAt(sessionObject);

            await this.pool.execute(
                `UPDATE \`${this.tableName}\` SET expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
                [expiresAt, sid]
            );

            return callback && callback(null);
        } catch (error) {
            return callback && callback(error);
        }
    }

    close() {
        this.stopCleanupTimer();
    }
}

const createSessionStore = (pool, options = {}) => new MySqlSessionStore(pool, options);

module.exports = {
    MySqlSessionStore,
    createSessionStore
};
