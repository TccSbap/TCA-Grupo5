const createTimestamp = () => new Date().toISOString();

module.exports = () => [
    {
        id: 1,
        name: 'ONG Água Limpa',
        description: 'Organização dedicada ao saneamento básico e acesso à água potável em comunidades carentes.',
        contact: 'contato@agualimpa.org',
        phone: '(11) 9999-1111',
        address: 'São Paulo, SP',
        userId: 1,
        createdAt: createTimestamp()
    },
    {
        id: 2,
        name: 'Saneamento para Todos',
        description: 'Promovemos o acesso universal ao saneamento básico através de projetos comunitários e educação ambiental.',
        contact: 'contato@saneamento.org',
        phone: '(21) 9999-2222',
        address: 'Rio de Janeiro, RJ',
        userId: 2,
        createdAt: createTimestamp()
    },
    {
        id: 3,
        name: 'Rios Vivos',
        description: 'Atuamos na preservação e recuperação de rios urbanos, combatendo a poluição hídrica.',
        contact: 'contato@riosvivos.org',
        phone: '(31) 9999-3333',
        address: 'Belo Horizonte, MG',
        userId: 3,
        createdAt: createTimestamp()
    },
    {
        id: 4,
        name: 'Água para a Vida',
        description: 'Levamos água potável e saneamento para regiões remotas e comunidades vulneráveis.',
        contact: 'contato@aguavida.org',
        phone: '(85) 9999-4444',
        address: 'Fortaleza, CE',
        userId: 4,
        createdAt: createTimestamp()
    },
    {
        id: 5,
        name: 'Cidadania e Saneamento',
        description: 'Defendemos o direito ao saneamento básico como direito fundamental através de advocacy e mobilização social.',
        contact: 'contato@cidadaniasaneamento.org',
        phone: '(71) 9999-5555',
        address: 'Salvador, BA',
        userId: 5,
        createdAt: createTimestamp()
    },
    {
        id: 6,
        name: 'Planeta Água',
        description: 'Educação ambiental e projetos de conscientização sobre uso sustentável da água e saneamento.',
        contact: 'contato@planetaagua.org',
        phone: '(41) 9999-6666',
        address: 'Curitiba, PR',
        userId: 6,
        createdAt: createTimestamp()
    },
    {
        id: 7,
        name: 'Esgoto Zero',
        description: 'Combatemos o esgoto a céu aberto através de denúncias, fiscalização e projetos de infraestrutura.',
        contact: 'contato@esgotozero.org',
        phone: '(81) 9999-7777',
        address: 'Recife, PE',
        userId: 7,
        createdAt: createTimestamp()
    },
    {
        id: 8,
        name: 'Saúde Hídrica',
        description: 'Relacionamos saneamento e saúde pública, promovendo melhorias nas condições sanitárias das comunidades.',
        contact: 'contato@saudehidrica.org',
        phone: '(51) 9999-8888',
        address: 'Porto Alegre, RS',
        userId: 8,
        createdAt: createTimestamp()
    },
    {
        id: 9,
        name: 'Água é Direito',
        description: 'Lutamos pelo reconhecimento e efetivação do direito humano à água e ao saneamento.',
        contact: 'contato@aguadireito.org',
        phone: '(61) 9999-9999',
        address: 'Brasília, DF',
        userId: 9,
        createdAt: createTimestamp()
    },
    {
        id: 10,
        name: 'Comunidade Sustentável',
        description: 'Desenvolvemos soluções sustentáveis de saneamento em parceria com comunidades locais.',
        contact: 'contato@comunidadesustentavel.org',
        phone: '(92) 9999-0000',
        address: 'Manaus, AM',
        userId: 10,
        createdAt: createTimestamp()
    }
];
