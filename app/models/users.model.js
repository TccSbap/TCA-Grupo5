const bcrypt = require('bcryptjs');
const {
    normalizeUserRow,
    toSqlDateTime
} = require('./helpers');

module.exports = ({ pool, canUseDatabase, defaultPasswordHash }) => {
    const ensureDatabase = async () => {
        if (!(await canUseDatabase())) {
            throw new Error('Banco de dados indisponível para acessar usuários');
        }
    };

    const buildSessionUser = (user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        ongName: user.ongName || null,
        createdAt: user.createdAt
    });

    const getUsers = async () => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, name, email, password_hash, type, ong_name, created_at FROM users ORDER BY id'
        );
        return rows.map(normalizeUserRow);
    };

    const getUserByEmail = async (email) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, name, email, password_hash, type, ong_name, created_at FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        return rows.length > 0 ? normalizeUserRow(rows[0]) : null;
    };

    const getUserById = async (id) => {
        await ensureDatabase();
        const [rows] = await pool.execute(
            'SELECT id, name, email, password_hash, type, ong_name, created_at FROM users WHERE id = ? LIMIT 1',
            [parseInt(id, 10)]
        );

        return rows.length > 0 ? normalizeUserRow(rows[0]) : null;
    };

    const authenticateUser = async (email, password) => {
        const user = await getUserByEmail(email);
        if (!user) {
            return null;
        }

        const passwordHash = user.password || defaultPasswordHash;
        if (!passwordHash) {
            return null;
        }

        if (!bcrypt.compareSync(password, passwordHash)) {
            return null;
        }

        return buildSessionUser(user);
    };

    const createUser = async (userData) => {
        await ensureDatabase();

        const passwordHash = userData.password || userData.password_hash || defaultPasswordHash;
        if (!passwordHash) {
            throw new Error('Senha obrigatoria para criar usuario');
        }

        const createdAt = userData.createdAt || new Date().toISOString();
        const [result] = await pool.execute(
            `INSERT INTO users (name, email, password_hash, type, ong_name, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userData.name,
                userData.email,
                passwordHash,
                userData.type,
                userData.ongName || userData.ong_name || null,
                toSqlDateTime(createdAt)
            ]
        );

        return {
            id: result.insertId,
            name: userData.name,
            email: userData.email,
            password: passwordHash,
            type: userData.type,
            ongName: userData.ongName || userData.ong_name || null,
            createdAt
        };
    };

    const createUserAndPersist = async (userData) => createUser(userData);

    return {
        authenticateUser,
        buildSessionUser,
        createUser,
        createUserAndPersist,
        getUserByEmail,
        getUserById,
        getUsers
    };
};
