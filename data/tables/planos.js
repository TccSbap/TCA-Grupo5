const createTimestamp = () => new Date().toISOString();

module.exports = () => [
    {
        id: 1,
        title: 'Plano Essencial',
        price: 'R$40/mês',
        subtitle: 'Ideal para ONGs que estão começando e querem visibilidade',
        features: [
            'Página pública da ONG no site',
            'Pode receber e responder denúncias',
            'Inclusão nas listagens e mapas',
            'Suporte por e-mail',
            'Até 3 campanhas ou projetos ativos'
        ],
        createdAt: createTimestamp()
    },
    {
        id: 2,
        title: 'Plano Avançado',
        price: 'R$80/mês',
        subtitle: 'Para ONGs que desejam mais alcance e interação com o público',
        features: [
            'Todos os benefícios do plano Essencial',
            'Destaque nas listagens',
            'Até 10 campanhas ou projetos ativos',
            'Estatísticas de engajamento',
            'Suporte por chat ou WhatsApp'
        ],
        createdAt: createTimestamp()
    },
    {
        id: 3,
        title: 'Plano Premium',
        price: 'R$120/mês',
        subtitle: 'Para ONGs que querem impacto máximo e parcerias estratégicas',
        features: [
            'Todos os benefícios do plano Avançado',
            'Selo de ONG Verificada',
            'Relatórios mensais com dados de impacto',
            'Páginas personalizadas',
            'Suporte prioritário 24h'
        ],
        createdAt: createTimestamp()
    }
];
