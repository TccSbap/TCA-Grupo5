const bcrypt = require('bcryptjs');

// Dados estáticos em memória (não persistem após reiniciar o servidor)
let users = [];
let denuncias = [];
let ongs = [];

// Inicializar dados padrão
const initializeData = async () => {
    // Usuários padrão (10 admins de ONGs + 1 usuário comum)
    users = [
        {
            id: 1,
            name: 'Admin ONG Água Limpa',
            email: 'admin@agualimpa.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'ONG Água Limpa',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Admin Saneamento para Todos',
            email: 'admin@saneamento.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Saneamento para Todos',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            name: 'Admin Rios Vivos',
            email: 'admin@riosvivos.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Rios Vivos',
            createdAt: new Date().toISOString()
        },
        {
            id: 4,
            name: 'Admin Água para a Vida',
            email: 'admin@aguavida.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Água para a Vida',
            createdAt: new Date().toISOString()
        },
        {
            id: 5,
            name: 'Admin Cidadania e Saneamento',
            email: 'admin@cidadaniasaneamento.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Cidadania e Saneamento',
            createdAt: new Date().toISOString()
        },
        {
            id: 6,
            name: 'Admin Planeta Água',
            email: 'admin@planetaagua.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Planeta Água',
            createdAt: new Date().toISOString()
        },
        {
            id: 7,
            name: 'Admin Esgoto Zero',
            email: 'admin@esgotozero.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Esgoto Zero',
            createdAt: new Date().toISOString()
        },
        {
            id: 8,
            name: 'Admin Saúde Hídrica',
            email: 'admin@saudehidrica.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Saúde Hídrica',
            createdAt: new Date().toISOString()
        },
        {
            id: 9,
            name: 'Admin Água é Direito',
            email: 'admin@aguadireito.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Água é Direito',
            createdAt: new Date().toISOString()
        },
        {
            id: 10,
            name: 'Admin Comunidade Sustentável',
            email: 'admin@comunidadesustentavel.org',
            password: await bcrypt.hash('123456', 10),
            type: 'admin',
            ongName: 'Comunidade Sustentável',
            createdAt: new Date().toISOString()
        },
        {
            id: 11,
            name: 'João Silva',
            email: 'joao@email.com',
            password: await bcrypt.hash('123456', 10),
            type: 'user',
            createdAt: new Date().toISOString()
        }
    ];

    // 10 ONGs padrão
    ongs = [
        {
            id: 1,
            name: 'ONG Água Limpa',
            description: 'Organização dedicada ao saneamento básico e acesso à água potável em comunidades carentes.',
            contact: 'contato@agualimpa.org',
            phone: '(11) 9999-1111',
            address: 'São Paulo, SP',
            userId: 1,
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Saneamento para Todos',
            description: 'Promovemos o acesso universal ao saneamento básico através de projetos comunitários e educação ambiental.',
            contact: 'contato@saneamento.org',
            phone: '(21) 9999-2222',
            address: 'Rio de Janeiro, RJ',
            userId: 2,
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            name: 'Rios Vivos',
            description: 'Atuamos na preservação e recuperação de rios urbanos, combatendo a poluição hídrica.',
            contact: 'contato@riosvivos.org',
            phone: '(31) 9999-3333',
            address: 'Belo Horizonte, MG',
            userId: 3,
            createdAt: new Date().toISOString()
        },
        {
            id: 4,
            name: 'Água para a Vida',
            description: 'Levamos água potável e saneamento para regiões remotas e comunidades vulneráveis.',
            contact: 'contato@aguavida.org',
            phone: '(85) 9999-4444',
            address: 'Fortaleza, CE',
            userId: 4,
            createdAt: new Date().toISOString()
        },
        {
            id: 5,
            name: 'Cidadania e Saneamento',
            description: 'Defendemos o direito ao saneamento básico como direito fundamental através de advocacy e mobilização social.',
            contact: 'contato@cidadaniasaneamento.org',
            phone: '(71) 9999-5555',
            address: 'Salvador, BA',
            userId: 5,
            createdAt: new Date().toISOString()
        },
        {
            id: 6,
            name: 'Planeta Água',
            description: 'Educação ambiental e projetos de conscientização sobre uso sustentável da água e saneamento.',
            contact: 'contato@planetaagua.org',
            phone: '(41) 9999-6666',
            address: 'Curitiba, PR',
            userId: 6,
            createdAt: new Date().toISOString()
        },
        {
            id: 7,
            name: 'Esgoto Zero',
            description: 'Combatemos o esgoto a céu aberto através de denúncias, fiscalização e projetos de infraestrutura.',
            contact: 'contato@esgotozero.org',
            phone: '(81) 9999-7777',
            address: 'Recife, PE',
            userId: 7,
            createdAt: new Date().toISOString()
        },
        {
            id: 8,
            name: 'Saúde Hídrica',
            description: 'Relacionamos saneamento e saúde pública, promovendo melhorias nas condições sanitárias das comunidades.',
            contact: 'contato@saudehidrica.org',
            phone: '(51) 9999-8888',
            address: 'Porto Alegre, RS',
            userId: 8,
            createdAt: new Date().toISOString()
        },
        {
            id: 9,
            name: 'Água é Direito',
            description: 'Lutamos pelo reconhecimento e efetivação do direito humano à água e ao saneamento.',
            contact: 'contato@aguadireito.org',
            phone: '(61) 9999-9999',
            address: 'Brasília, DF',
            userId: 9,
            createdAt: new Date().toISOString()
        },
        {
            id: 10,
            name: 'Comunidade Sustentável',
            description: 'Desenvolvemos soluções sustentáveis de saneamento em parceria com comunidades locais.',
            contact: 'contato@comunidadesustentavel.org',
            phone: '(92) 9999-0000',
            address: 'Manaus, AM',
            userId: 10,
            createdAt: new Date().toISOString()
        }
    ];

    // 16 Denúncias padrão
    denuncias = [
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
            title: 'Caixa d\'água comunitária contaminada',
            description: 'A caixa d\'água da comunidade está com água turva e com gosto estranho. Várias pessoas apresentaram problemas gastrointestinais.',
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
};

// Funções para usuários
const getUsers = () => users;
const saveUsers = (newUsers) => { /* Não persiste */ };

const getUserByEmail = (email) => {
    return users.find(user => user.email === email);
};

const createUser = (userData) => {
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        ...userData,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    return newUser;
};

// Funções para denúncias
const getDenuncias = () => denuncias;
const saveDenuncias = (newDenuncias) => { /* Não persiste */ };

const createDenuncia = (denunciaData) => {
    const newDenuncia = {
        id: denuncias.length > 0 ? Math.max(...denuncias.map(d => d.id)) + 1 : 1,
        ...denunciaData,
        status: 'pendente',
        responses: [],
        createdAt: new Date().toISOString()
    };
    denuncias.push(newDenuncia);
    return newDenuncia;
};

const getDenunciaById = (id) => {
    return denuncias.find(d => d.id === parseInt(id));
};

const updateDenuncia = (id, updateData) => {
    const index = denuncias.findIndex(d => d.id === parseInt(id));
    if (index !== -1) {
        denuncias[index] = { ...denuncias[index], ...updateData };
        return denuncias[index];
    }
    return null;
};

// Funções para ONGs
const getOngs = () => ongs;
const saveOngs = (newOngs) => { /* Não persiste */ };

const createOng = (ongData) => {
    const newOng = {
        id: ongs.length > 0 ? Math.max(...ongs.map(o => o.id)) + 1 : 1,
        ...ongData,
        createdAt: new Date().toISOString()
    };
    ongs.push(newOng);
    return newOng;
};

// Inicializar dados ao carregar o módulo
initializeData();

module.exports = {
    getUsers,
    saveUsers,
    getUserByEmail,
    createUser,
    getDenuncias,
    saveDenuncias,
    createDenuncia,
    getDenunciaById,
    updateDenuncia,
    getOngs,
    saveOngs,
    createOng
};
