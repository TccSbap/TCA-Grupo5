module.exports = () => [
    {
        id: 1,
        userId: null,
        name: 'Fernanda Lima',
        email: 'fernanda@exemplo.com',
        subject: 'duvida',
        message: 'Gostaria de entender como funciona o acompanhamento das denúncias.',
        newsletter: true,
        status: 'nova',
        createdAt: new Date('2025-01-02').toISOString()
    },
    {
        id: 2,
        userId: null,
        name: 'Ricardo Alves',
        email: 'ricardo@exemplo.com',
        subject: 'parceria',
        message: 'Temos interesse em apoiar a plataforma com uma ação conjunta.',
        newsletter: false,
        status: 'nova',
        createdAt: new Date('2025-01-06').toISOString()
    },
    {
        id: 3,
        userId: 11,
        name: 'João Silva',
        email: 'joao@email.com',
        subject: 'sugestao',
        message: 'Seria interessante exibir notícias por região em destaque.',
        newsletter: true,
        status: 'respondida',
        createdAt: new Date('2025-01-08').toISOString()
    }
];
