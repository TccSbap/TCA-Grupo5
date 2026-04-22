const createTimestamp = () => new Date().toISOString();

module.exports = () => [
    {
        id: 1,
        title: 'Mutirao leva agua filtrada para 12 comunidades',
        date: '12 de Janeiro de 2025',
        description: 'A acao conjunta entre ONGs e voluntarios instalou novos pontos de distribuicao e orientou moradores sobre uso consciente da agua.',
        image: '/images/agua-potavel.webp',
        url: '/noticias?destaque=1',
        iconClass: 'fas fa-hand-holding-water',
        sortOrder: 1,
        createdAt: createTimestamp()
    },
    {
        id: 2,
        title: 'Plataforma reduz tempo medio de resposta das denuncias',
        date: '28 de Fevereiro de 2025',
        description: 'Com triagem automatica e repasse por regiao, as denuncias passaram a chegar mais rapido as organizacoes responsaveis.',
        image: '/images/saneamento.webp',
        url: '/noticias?destaque=2',
        iconClass: 'fas fa-chart-line',
        sortOrder: 2,
        createdAt: createTimestamp()
    },
    {
        id: 3,
        title: 'Programa educativo alcanca 800 estudantes sobre saneamento',
        date: '14 de Marco de 2025',
        description: 'As oficinas abordaram higiene, economia de agua e prevencao de contaminacoes em escolas publicas parceiras.',
        image: '/images/agua-potavel.webp',
        url: '/noticias?destaque=3',
        iconClass: 'fas fa-graduation-cap',
        sortOrder: 3,
        createdAt: createTimestamp()
    },
    {
        id: 4,
        title: 'Parceria comunitaria instala reservatorios em area rural',
        date: '02 de Abril de 2025',
        description: 'Moradores receberam reservatorios, filtros e treinamento para manutencao simples dos equipamentos.',
        image: '/images/saneamento.webp',
        url: '/noticias?destaque=4',
        iconClass: 'fas fa-water',
        sortOrder: 4,
        createdAt: createTimestamp()
    },
    {
        id: 5,
        title: 'Novos planos solidarios ampliam apoio as ONGs locais',
        date: '20 de Maio de 2025',
        description: 'A adesao aos planos ajudou a financiar campanhas, materiais educativos e pequenas melhorias de infraestrutura.',
        image: '/images/WSlJfDPMch2v.png',
        url: '/noticias?destaque=5',
        iconClass: 'fas fa-heart',
        sortOrder: 5,
        createdAt: createTimestamp()
    },
    {
        id: 6,
        title: 'Mapeamento colaborativo identifica pontos criticos de esgoto',
        date: '09 de Junho de 2025',
        description: 'Usuarios da plataforma registraram areas com descarte irregular, facilitando o planejamento das equipes de campo.',
        image: '/images/DDtf46EAazit.jpeg',
        url: '/noticias?destaque=6',
        iconClass: 'fas fa-map-marked-alt',
        sortOrder: 6,
        createdAt: createTimestamp()
    }
];
