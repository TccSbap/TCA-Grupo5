const createTimestamp = () => new Date().toISOString();

module.exports = (defaultPasswordHash) => [
    {
        id: 1,
        name: 'Admin ONG Água Limpa',
        email: 'admin@agualimpa.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'ONG Água Limpa',
        createdAt: createTimestamp()
    },
    {
        id: 2,
        name: 'Admin Saneamento para Todos',
        email: 'admin@saneamento.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Saneamento para Todos',
        createdAt: createTimestamp()
    },
    {
        id: 3,
        name: 'Admin Rios Vivos',
        email: 'admin@riosvivos.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Rios Vivos',
        createdAt: createTimestamp()
    },
    {
        id: 4,
        name: 'Admin Água para a Vida',
        email: 'admin@aguavida.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Água para a Vida',
        createdAt: createTimestamp()
    },
    {
        id: 5,
        name: 'Admin Cidadania e Saneamento',
        email: 'admin@cidadaniasaneamento.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Cidadania e Saneamento',
        createdAt: createTimestamp()
    },
    {
        id: 6,
        name: 'Admin Planeta Água',
        email: 'admin@planetaagua.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Planeta Água',
        createdAt: createTimestamp()
    },
    {
        id: 7,
        name: 'Admin Esgoto Zero',
        email: 'admin@esgotozero.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Esgoto Zero',
        createdAt: createTimestamp()
    },
    {
        id: 8,
        name: 'Admin Saúde Hídrica',
        email: 'admin@saudehidrica.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Saúde Hídrica',
        createdAt: createTimestamp()
    },
    {
        id: 9,
        name: 'Admin Água é Direito',
        email: 'admin@aguadireito.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Água é Direito',
        createdAt: createTimestamp()
    },
    {
        id: 10,
        name: 'Admin Comunidade Sustentável',
        email: 'admin@comunidadesustentavel.org',
        password: defaultPasswordHash,
        type: 'ong',
        ongName: 'Comunidade Sustentável',
        createdAt: createTimestamp()
    },
    {
        id: 12,
        name: 'Administrador da Plataforma',
        email: 'admin@ods6.org',
        password: defaultPasswordHash,
        type: 'admin',
        createdAt: createTimestamp()
    },
    {
        id: 11,
        name: 'João Silva',
        email: 'joao@email.com',
        password: defaultPasswordHash,
        type: 'user',
        createdAt: createTimestamp()
    }
];
