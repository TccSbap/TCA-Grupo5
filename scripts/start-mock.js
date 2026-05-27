process.env.USE_MOCK_DB = 'true';

const { startServer } = require('../app');

startServer().catch((error) => {
    console.error('Falha ao iniciar o servidor em modo mock:', error);
    process.exitCode = 1;
});
