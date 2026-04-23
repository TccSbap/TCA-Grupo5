module.exports = () => [
    {
        id: 1,
        title: 'Esgoto a céu aberto na Rua das Flores',
        description: 'Há mais de 2 meses existe um vazamento de esgoto na Rua das Flores, causando mau cheiro e risco à saúde dos moradores. Crianças brincam próximo ao local.',
        location: 'Rua das Flores, 123 - Centro, São Paulo/SP',
        category: 'esgoto',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-15').toISOString()
    },
    {
        id: 2,
        title: 'Falta de água há 5 dias no bairro',
        description: 'O bairro Jardim Esperança está sem abastecimento de água há 5 dias. Famílias estão comprando água mineral para consumo básico.',
        location: 'Jardim Esperança - Rio de Janeiro/RJ',
        category: 'agua',
        status: 'em_andamento',
        userId: 11,
        userName: 'João Silva',
        responses: [
            {
                id: 1,
                text: 'Estamos em contato com a concessionária local para resolver o problema. Previsão de normalização em 48h.',
                ongName: 'Saneamento para Todos',
                ongId: 2,
                createdAt: new Date('2024-09-17').toISOString()
            }
        ],
        createdAt: new Date('2024-09-16').toISOString()
    },
    {
        id: 3,
        title: 'Rio poluído com descarte irregular',
        description: 'O Rio Verde está sendo usado para descarte irregular de resíduos industriais. A água está com coloração escura e forte odor.',
        location: 'Margem do Rio Verde - Belo Horizonte/MG',
        category: 'poluicao',
        status: 'resolvida',
        userId: 11,
        userName: 'João Silva',
        responses: [
            {
                id: 1,
                text: 'Fiscalização realizada. Empresa responsável foi autuada e iniciou processo de despoluição.',
                ongName: 'Rios Vivos',
                ongId: 3,
                createdAt: new Date('2024-09-10').toISOString()
            }
        ],
        createdAt: new Date('2024-09-05').toISOString()
    },
    {
        id: 4,
        title: "Caixa d'água comunitária contaminada",
        description: "A caixa d'água da comunidade está com água turva e com gosto estranho. Várias pessoas apresentaram problemas gastrointestinais.",
        location: 'Comunidade Boa Vista - Fortaleza/CE',
        category: 'agua',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-18').toISOString()
    },
    {
        id: 5,
        title: 'Fossa séptica transbordando',
        description: 'A fossa séptica do condomínio está transbordando e o esgoto está escorrendo pela calçada, atingindo casas vizinhas.',
        location: 'Condomínio Solar do Atlântico - Salvador/BA',
        category: 'esgoto',
        status: 'em_andamento',
        userId: 11,
        userName: 'João Silva',
        responses: [
            {
                id: 1,
                text: 'Equipe técnica agendada para avaliação amanhã às 9h. Providenciaremos solução emergencial.',
                ongName: 'Cidadania e Saneamento',
                ongId: 5,
                createdAt: new Date('2024-09-19').toISOString()
            }
        ],
        createdAt: new Date('2024-09-18').toISOString()
    },
    {
        id: 6,
        title: 'Vazamento de água na rede pública',
        description: 'Grande vazamento na rede de distribuição está desperdiçando milhares de litros de água há semanas sem reparo.',
        location: 'Avenida Central, 456 - Curitiba/PR',
        category: 'agua',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-17').toISOString()
    },
    {
        id: 7,
        title: 'Esgoto sendo despejado na praia',
        description: 'Tubulação clandestina está despejando esgoto diretamente na praia. Banhistas relatam manchas e mau cheiro na água.',
        location: 'Praia de Boa Viagem - Recife/PE',
        category: 'poluicao',
        status: 'em_andamento',
        userId: 11,
        userName: 'João Silva',
        responses: [
            {
                id: 1,
                text: 'Denúncia encaminhada aos órgãos ambientais. Interdição da área solicitada até resolução.',
                ongName: 'Esgoto Zero',
                ongId: 7,
                createdAt: new Date('2024-09-20').toISOString()
            }
        ],
        createdAt: new Date('2024-09-19').toISOString()
    },
    {
        id: 8,
        title: 'Água com coloração amarelada',
        description: 'A água que sai das torneiras está com cor amarelada e sedimentos. Moradores estão com receio de consumir.',
        location: 'Vila Nova - Porto Alegre/RS',
        category: 'agua',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-20').toISOString()
    },
    {
        id: 9,
        title: 'Falta de saneamento básico na comunidade',
        description: 'Comunidade inteira não possui rede de esgoto. Moradores usam fossas precárias que contaminam o lençol freático.',
        location: 'Comunidade Esperança - Brasília/DF',
        category: 'esgoto',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-21').toISOString()
    },
    {
        id: 10,
        title: 'Córrego entupido causando alagamentos',
        description: 'Córrego está entupido com lixo e esgoto, causando alagamentos constantes nas casas próximas quando chove.',
        location: 'Rua do Comércio - Manaus/AM',
        category: 'poluicao',
        status: 'resolvida',
        userId: 11,
        userName: 'João Silva',
        responses: [
            {
                id: 1,
                text: 'Mutirão de limpeza realizado. Córrego desobstruído e sistema de drenagem restaurado.',
                ongName: 'Comunidade Sustentável',
                ongId: 10,
                createdAt: new Date('2024-09-15').toISOString()
            }
        ],
        createdAt: new Date('2024-09-10').toISOString()
    },
    {
        id: 11,
        title: 'Poço artesiano contaminado',
        description: 'Análise da água do poço comunitário detectou contaminação por coliformes fecais. É a única fonte de água da região.',
        location: 'Zona Rural - Goiânia/GO',
        category: 'agua',
        status: 'em_andamento',
        userId: 11,
        userName: 'João Silva',
        responses: [
            {
                id: 1,
                text: 'Providenciando tratamento emergencial e busca por fonte alternativa de água potável.',
                ongName: 'Água para a Vida',
                ongId: 4,
                createdAt: new Date('2024-09-22').toISOString()
            }
        ],
        createdAt: new Date('2024-09-21').toISOString()
    },
    {
        id: 12,
        title: 'Rede de esgoto rompida',
        description: 'Rede de esgoto rompeu e está vazando na rua. Moradores não conseguem sair de casa devido ao mau cheiro e risco à saúde.',
        location: 'Rua dos Trabalhadores, 789 - Campinas/SP',
        category: 'esgoto',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-22').toISOString()
    },
    {
        id: 13,
        title: 'Falta de tratamento de esgoto',
        description: 'Bairro inteiro não possui tratamento de esgoto. Dejetos são despejados diretamente no rio que corta a cidade.',
        location: 'Bairro Industrial - Natal/RN',
        category: 'esgoto',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-23').toISOString()
    },
    {
        id: 14,
        title: 'Água com forte odor de cloro',
        description: 'A água está chegando com odor muito forte de cloro, causando irritação na pele e nos olhos dos moradores.',
        location: 'Conjunto Habitacional Vitória - Vitória/ES',
        category: 'agua',
        status: 'em_andamento',
        userId: 11,
        userName: 'João Silva',
        responses: [
            {
                id: 1,
                text: 'Solicitamos análise da qualidade da água. Aguardando resultado dos testes laboratoriais.',
                ongName: 'Saúde Hídrica',
                ongId: 8,
                createdAt: new Date('2024-09-24').toISOString()
            }
        ],
        createdAt: new Date('2024-09-23').toISOString()
    },
    {
        id: 15,
        title: 'Lagoa contaminada por esgoto',
        description: 'Lagoa do bairro está completamente contaminada por esgoto clandestino. Peixes mortos e mau cheiro insuportável.',
        location: 'Lagoa do Parque - Florianópolis/SC',
        category: 'poluicao',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-24').toISOString()
    },
    {
        id: 16,
        title: 'Pressão da água muito baixa',
        description: 'A pressão da água está extremamente baixa, impossibilitando uso de chuveiros e dificultando atividades básicas do dia a dia.',
        location: 'Morro da Esperança - São Luís/MA',
        category: 'agua',
        status: 'pendente',
        userId: 11,
        userName: 'João Silva',
        responses: [],
        createdAt: new Date('2024-09-25').toISOString()
    }
];
