const createUsersModel = require('./users.model');
const createOngsModel = require('./ongs.model');

module.exports = ({ pool, canUseDatabase, defaultPasswordHash }) => ({
    async createUserWithOng(userData, ongData) {
        if (!(await canUseDatabase())) throw new Error('Banco de dados indisponível para cadastrar ONG');
        const connection = await pool.getConnection();
        const options = { pool: connection, canUseDatabase: async () => true, defaultPasswordHash };
        try {
            await connection.beginTransaction();
            const user = await createUsersModel(options).createUser(userData);
            await createOngsModel(options).createOng({ ...ongData, userId: user.id });
            await connection.commit();
            return user;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
});
