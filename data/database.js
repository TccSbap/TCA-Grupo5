const bcrypt = require('bcryptjs');
const { pool, isConfigured, canUseDatabase } = require('../config/database');

const isTestEnvironment = Boolean(process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test');

// Cache em memória usado para leitura rápida e para o modo de teste
let users = [];
let denuncias = [];
let ongs = [];
let planos = [];
let noticias = [];
let doacoes = [];
let assinaturasPlano = [];
let mensagensContato = [];
const defaultPasswordHash = bcrypt.hashSync('123456', 10);
const hasDatabaseConnection = () => isConfigured;
const persistAsync = (operation, label) => {
    if (!hasDatabaseConnection()) {
        return;
    }

    Promise.resolve()
        .then(() => canUseDatabase())
        .then((dbAvailable) => {
            if (!dbAvailable) {
                if (!isTestEnvironment) {
                    throw new Error(`Banco de dados indisponível para persistir ${label}`);
                }
                return null;
            }
            return operation();
        })
        .catch((error) => {
            console.error(`Erro ao persistir ${label}:`, error);
        });
};
const toSqlDateTime = (value) => {
    const date = value ? new Date(value) : new Date();
    return date.toISOString().replace('T', ' ').replace('Z', '');
};
const toIsoString = (value) => {
    if (!value) {
        return new Date().toISOString();
    }

    return new Date(value).toISOString();
};
const parseJsonArray = (value, fallback = []) => {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value) {
        return fallback;
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        return fallback;
    }
};
const normalizeUserRow = (row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password_hash,
    type: row.type,
    ongName: row.ong_name,
    createdAt: toIsoString(row.created_at)
});
const normalizeOngRow = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    contact: row.contact_email,
    phone: row.phone,
    address: row.address,
    userId: row.user_id,
    focus: row.focus || row.description,
    createdAt: toIsoString(row.created_at)
});
const normalizeDenunciaRow = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    status: row.status,
    userId: row.user_id,
    userName: row.user_name,
    responses: [],
    createdAt: toIsoString(row.created_at)
});
const normalizePlanoRow = (row) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    subtitle: row.subtitle,
    features: parseJsonArray(row.features_json),
    createdAt: toIsoString(row.created_at)
});
const normalizeNoticiaRow = (row) => ({
    id: row.id,
    title: row.title,
    date: row.date_label,
    description: row.description,
    image: row.image,
    url: row.url,
    iconClass: row.icon_class || 'fas fa-newspaper',
    sortOrder: row.sort_order || 0,
    createdAt: toIsoString(row.created_at)
});
const normalizeDoacaoRow = (row) => ({
    id: row.id,
    ongId: row.ong_id,
    userId: row.user_id,
    donorName: row.donor_name,
    donorEmail: row.donor_email,
    donorPhone: row.donor_phone,
    donorDocument: row.donor_document,
    donorCep: row.donor_cep,
    donorStreet: row.donor_street,
    donorNumber: row.donor_number,
    donorNeighborhood: row.donor_neighborhood,
    donorCity: row.donor_city,
    donorState: row.donor_state,
    amount: Number(row.amount),
    message: row.message,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: toIsoString(row.created_at)
});
const normalizeAssinaturaPlanoRow = (row) => ({
    id: row.id,
    planId: row.plan_id,
    userId: row.user_id,
    planName: row.plan_name,
    planPrice: row.plan_price,
    subscriberName: row.subscriber_name,
    subscriberEmail: row.subscriber_email,
    subscriberPhone: row.subscriber_phone,
    subscriberDocument: row.subscriber_document,
    subscriberCep: row.subscriber_cep,
    subscriberStreet: row.subscriber_street,
    subscriberNumber: row.subscriber_number,
    subscriberNeighborhood: row.subscriber_neighborhood,
    subscriberCity: row.subscriber_city,
    subscriberState: row.subscriber_state,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: toIsoString(row.created_at)
});
const normalizeMensagemContatoRow = (row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    newsletter: !!row.newsletter,
    status: row.status,
    createdAt: toIsoString(row.created_at)
});

// Inicializar dados padrão
const initializeData = () => {
    // Usuários padrão (10 admins de ONGs + 1 usuário comum)
    users = [
        {
            id: 1,
            name: 'Admin ONG Água Limpa',
            email: 'admin@agualimpa.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'ONG Água Limpa',
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            name: 'Admin Saneamento para Todos',
            email: 'admin@saneamento.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Saneamento para Todos',
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            name: 'Admin Rios Vivos',
            email: 'admin@riosvivos.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Rios Vivos',
            createdAt: new Date().toISOString()
        },
        {
            id: 4,
            name: 'Admin Água para a Vida',
            email: 'admin@aguavida.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Água para a Vida',
            createdAt: new Date().toISOString()
        },
        {
            id: 5,
            name: 'Admin Cidadania e Saneamento',
            email: 'admin@cidadaniasaneamento.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Cidadania e Saneamento',
            createdAt: new Date().toISOString()
        },
        {
            id: 6,
            name: 'Admin Planeta Água',
            email: 'admin@planetaagua.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Planeta Água',
            createdAt: new Date().toISOString()
        },
        {
            id: 7,
            name: 'Admin Esgoto Zero',
            email: 'admin@esgotozero.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Esgoto Zero',
            createdAt: new Date().toISOString()
        },
        {
            id: 8,
            name: 'Admin Saúde Hídrica',
            email: 'admin@saudehidrica.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Saúde Hídrica',
            createdAt: new Date().toISOString()
        },
        {
            id: 9,
            name: 'Admin Água é Direito',
            email: 'admin@aguadireito.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Água é Direito',
            createdAt: new Date().toISOString()
        },
        {
            id: 10,
            name: 'Admin Comunidade Sustentável',
            email: 'admin@comunidadesustentavel.org',
            password: defaultPasswordHash,
            type: 'admin',
            ongName: 'Comunidade Sustentável',
            createdAt: new Date().toISOString()
        },
        {
            id: 11,
            name: 'João Silva',
            email: 'joao@email.com',
            password: defaultPasswordHash,
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
    planos = [
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
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
        }
    ];

    noticias = [
        {
            id: 1,
            title: 'Mutirao leva agua filtrada para 12 comunidades',
            date: '12 de Janeiro de 2025',
            description: 'A acao conjunta entre ONGs e voluntarios instalou novos pontos de distribuicao e orientou moradores sobre uso consciente da agua.',
            image: '/images/agua-potavel.webp',
            url: '/noticias?destaque=1',
            iconClass: 'fas fa-hand-holding-water',
            sortOrder: 1,
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
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
            createdAt: new Date().toISOString()
        }
    ];

    doacoes = [
        {
            id: 1,
            ongId: 1,
            userId: 11,
            donorName: 'João Silva',
            donorEmail: 'joao@email.com',
            donorPhone: '(11) 99999-0000',
            donorDocument: '12345678901',
            donorCep: '01001-000',
            donorStreet: 'Rua das Flores',
            donorNumber: '123',
            donorNeighborhood: 'Centro',
            donorCity: 'São Paulo',
            donorState: 'SP',
            amount: 40.00,
            message: 'Obrigado pelo trabalho de vocês!',
            paymentMethod: 'pix',
            status: 'confirmada',
            createdAt: new Date('2025-01-10').toISOString()
        },
        {
            id: 2,
            ongId: 3,
            userId: 11,
            donorName: 'Mariana Souza',
            donorEmail: 'mariana@exemplo.com',
            donorPhone: '(21) 98888-1111',
            donorDocument: '98765432100',
            donorCep: '20000-000',
            donorStreet: 'Avenida Central',
            donorNumber: '456',
            donorNeighborhood: 'Botafogo',
            donorCity: 'Rio de Janeiro',
            donorState: 'RJ',
            amount: 80.00,
            message: 'Contem comigo para continuar a ação.',
            paymentMethod: 'cartao',
            status: 'pendente',
            createdAt: new Date('2025-01-12').toISOString()
        },
        {
            id: 3,
            ongId: 7,
            userId: 11,
            donorName: 'Carlos Pereira',
            donorEmail: 'carlos@exemplo.com',
            donorPhone: '(31) 97777-2222',
            donorDocument: '11122233344',
            donorCep: '30100-000',
            donorStreet: 'Rua do Comércio',
            donorNumber: '789',
            donorNeighborhood: 'Savassi',
            donorCity: 'Belo Horizonte',
            donorState: 'MG',
            amount: 120.00,
            message: 'Apoio ao projeto de despoluição.',
            paymentMethod: 'boleto',
            status: 'confirmada',
            createdAt: new Date('2025-01-15').toISOString()
        }
    ];

    assinaturasPlano = [
        {
            id: 1,
            planId: 1,
            userId: 1,
            planName: 'Plano Essencial',
            planPrice: 'R$40/mês',
            subscriberName: 'ONG Água Limpa',
            subscriberEmail: 'contato@agualimpa.org',
            subscriberPhone: '(11) 9999-1111',
            subscriberDocument: '00011122233',
            subscriberCep: '01000-000',
            subscriberStreet: 'Rua das Águas',
            subscriberNumber: '100',
            subscriberNeighborhood: 'Centro',
            subscriberCity: 'São Paulo',
            subscriberState: 'SP',
            paymentMethod: 'pix',
            status: 'ativa',
            createdAt: new Date('2025-01-03').toISOString()
        },
        {
            id: 2,
            planId: 2,
            userId: 2,
            planName: 'Plano Avançado',
            planPrice: 'R$80/mês',
            subscriberName: 'Saneamento para Todos',
            subscriberEmail: 'contato@saneamento.org',
            subscriberPhone: '(21) 9999-2222',
            subscriberDocument: '11122233344',
            subscriberCep: '20000-000',
            subscriberStreet: 'Avenida Saúde',
            subscriberNumber: '200',
            subscriberNeighborhood: 'Centro',
            subscriberCity: 'Rio de Janeiro',
            subscriberState: 'RJ',
            paymentMethod: 'cartao',
            status: 'ativa',
            createdAt: new Date('2025-01-04').toISOString()
        },
        {
            id: 3,
            planId: 3,
            userId: 3,
            planName: 'Plano Premium',
            planPrice: 'R$120/mês',
            subscriberName: 'Rios Vivos',
            subscriberEmail: 'contato@riosvivos.org',
            subscriberPhone: '(31) 9999-3333',
            subscriberDocument: '22233344455',
            subscriberCep: '30000-000',
            subscriberStreet: 'Rua da Preservação',
            subscriberNumber: '300',
            subscriberNeighborhood: 'Savassi',
            subscriberCity: 'Belo Horizonte',
            subscriberState: 'MG',
            paymentMethod: 'boleto',
            status: 'pendente',
            createdAt: new Date('2025-01-05').toISOString()
        }
    ];

    mensagensContato = [
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

const loadFromDatabase = async () => {
    const [userRows] = await pool.execute(
        'SELECT id, name, email, password_hash, type, ong_name, created_at FROM users ORDER BY id'
    );
    const [ongRows] = await pool.execute(
        'SELECT id, name, description, contact_email, phone, address, user_id, created_at FROM ongs ORDER BY id'
    );
    const [planRows] = await pool.execute(
        'SELECT id, title, price, subtitle, features_json, created_at FROM plans ORDER BY id'
    );
    const [newsRows] = await pool.execute(
        'SELECT id, title, date_label, description, image, url, icon_class, sort_order, created_at FROM news ORDER BY sort_order ASC, id ASC'
    );
    const [donationRows] = await pool.execute(
        'SELECT id, ong_id, user_id, donor_name, donor_email, donor_phone, donor_document, donor_cep, donor_street, donor_number, donor_neighborhood, donor_city, donor_state, amount, message, payment_method, status, created_at FROM donations ORDER BY id'
    );
    const [subscriptionRows] = await pool.execute(
        'SELECT id, plan_id, user_id, plan_name, plan_price, subscriber_name, subscriber_email, subscriber_phone, subscriber_document, subscriber_cep, subscriber_street, subscriber_number, subscriber_neighborhood, subscriber_city, subscriber_state, payment_method, status, created_at FROM plan_subscriptions ORDER BY id'
    );
    const [contactRows] = await pool.execute(
        'SELECT id, user_id, name, email, subject, message, newsletter, status, created_at FROM contact_messages ORDER BY id'
    );
    const [denunciaRows] = await pool.execute(
        'SELECT id, title, description, location, category, status, user_id, user_name, created_at FROM denuncias ORDER BY id'
    );
    const [responseRows] = await pool.execute(
        'SELECT id, denuncia_id, ong_id, ong_name, response_text, created_at FROM denuncia_responses ORDER BY id'
    );

    users = userRows.map(normalizeUserRow);
    ongs = ongRows.map(normalizeOngRow);
    planos = planRows.map(normalizePlanoRow);
    noticias = newsRows.map(normalizeNoticiaRow);
    doacoes = donationRows.map(normalizeDoacaoRow);
    assinaturasPlano = subscriptionRows.map(normalizeAssinaturaPlanoRow);
    mensagensContato = contactRows.map(normalizeMensagemContatoRow);
    denuncias = denunciaRows.map(normalizeDenunciaRow);

    const denunciasById = new Map(denuncias.map(denuncia => [denuncia.id, denuncia]));
    for (const response of responseRows) {
        const denuncia = denunciasById.get(response.denuncia_id);
        if (!denuncia) {
            continue;
        }

        denuncia.responses.push({
            id: response.id,
            text: response.response_text,
            ongName: response.ong_name,
            ongId: response.ong_id,
            createdAt: toIsoString(response.created_at)
        });
    }
};

const ensureDataLoaded = async () => {
    if (typeof ensureDataLoaded.ready !== 'undefined') {
        return ensureDataLoaded.ready;
    }

    if (!isConfigured) {
        ensureDataLoaded.ready = false;
        return ensureDataLoaded.ready;
    }

    ensureDataLoaded.ready = (async () => {
        if (await canUseDatabase()) {
            try {
                await loadFromDatabase();
                return true;
            } catch (error) {
                return false;
            }
        }

        return false;
    })();

    return ensureDataLoaded.ready;
};

// Funções para usuários
const getUsers = () => users;
const saveUsers = (newUsers) => {
    users = newUsers;
    syncDatabaseFromCache();
};

const getUserByEmail = (email) => {
    return users.find(user => user.email === email);
};

const getUserById = (id) => {
    return users.find(user => user.id === parseInt(id));
};

const buildSessionUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.type,
    ongName: user.ongName || null,
    createdAt: user.createdAt
});

const authenticateUser = (email, password) => {
    const user = getUserByEmail(email);
    if (!user) {
        return null;
    }

    const passwordHash = user.password || user.password_hash || defaultPasswordHash;
    if (!bcrypt.compareSync(password, passwordHash)) {
        return null;
    }

    return buildSessionUser(user);
};

const buildUserRecord = (userData) => ({
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    ...userData,
    createdAt: new Date().toISOString()
});

const persistUserToDatabase = async (user) => {
    if (!(await canUseDatabase())) {
        throw new Error('Banco de dados indisponível para persistir usuário');
    }

    await pool.execute(
        `INSERT INTO users (id, name, email, password_hash, type, ong_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            email = VALUES(email),
            password_hash = VALUES(password_hash),
            type = VALUES(type),
            ong_name = VALUES(ong_name),
            created_at = VALUES(created_at)`,
        [
            user.id,
            user.name,
            user.email,
            user.password || user.password_hash || defaultPasswordHash,
            user.type,
            user.ongName || user.ong_name || null,
            toSqlDateTime(user.createdAt)
        ]
    );
};

const createUser = (userData) => {
    const newUser = buildUserRecord(userData);
    users.push(newUser);
    persistUser(newUser);
    return newUser;
};

const createUserAndPersist = async (userData) => {
    const newUser = buildUserRecord(userData);
    await persistUserToDatabase(newUser);
    users.push(newUser);
    return newUser;
};

// Funções para denúncias
const normalizeFilterId = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

const getDenuncias = (ongId = null) => {
    const normalizedOngId = normalizeFilterId(ongId);

    if (normalizedOngId === null) {
        return denuncias;
    }

    return denuncias.filter((denuncia) =>
        denuncia.responses.some((response) => response.ongId === normalizedOngId)
    );
};
const saveDenuncias = (newDenuncias) => {
    denuncias = newDenuncias;
    syncDatabaseFromCache();
};

const createDenuncia = (denunciaData) => {
    const newDenuncia = {
        id: denuncias.length > 0 ? Math.max(...denuncias.map(d => d.id)) + 1 : 1,
        ...denunciaData,
        status: 'pendente',
        responses: [],
        createdAt: new Date().toISOString()
    };
    denuncias.push(newDenuncia);
    persistDenuncia(newDenuncia);
    return newDenuncia;
};

const getDenunciaById = (id) => {
    return denuncias.find(d => d.id === parseInt(id));
};

const updateDenuncia = (id, updateData) => {
    const index = denuncias.findIndex(d => d.id === parseInt(id));
    if (index !== -1) {
        denuncias[index] = { ...denuncias[index], ...updateData };
        persistDenuncia(denuncias[index]);
        return denuncias[index];
    }
    return null;
};

// Funções para ONGs
const getOngs = (ongId = null) => {
    const normalizedOngId = normalizeFilterId(ongId);

    if (normalizedOngId === null) {
        return ongs;
    }

    return ongs.filter((ong) => ong.id === normalizedOngId);
};
const saveOngs = (newOngs) => {
    ongs = newOngs;
    syncDatabaseFromCache();
};

const getOngById = (id) => {
    return ongs.find(ong => ong.id === parseInt(id));
};

const getOngByUserId = (userId) => {
    return ongs.find(ong => ong.userId === parseInt(userId));
};

const buildOngRecord = (ongData) => ({
    id: ongs.length > 0 ? Math.max(...ongs.map(o => o.id)) + 1 : 1,
    ...ongData,
    focus: ongData.focus || ongData.description || ongData.name,
    createdAt: new Date().toISOString()
});

const persistOngToDatabase = async (ong) => {
    if (!(await canUseDatabase())) {
        throw new Error('Banco de dados indisponível para persistir ONG');
    }

    await pool.execute(
        `INSERT INTO ongs (id, name, description, contact_email, phone, address, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            contact_email = VALUES(contact_email),
            phone = VALUES(phone),
            address = VALUES(address),
            user_id = VALUES(user_id),
            created_at = VALUES(created_at)`,
        [
            ong.id,
            ong.name,
            ong.description,
            ong.contact || ong.contact_email,
            ong.phone || null,
            ong.address || null,
            ong.userId || ong.user_id || null,
            toSqlDateTime(ong.createdAt)
        ]
    );
};

const createOng = (ongData) => {
    const newOng = buildOngRecord(ongData);
    ongs.push(newOng);
    persistAsync(() => persistOngToDatabase(newOng), 'ONG');
    return newOng;
};

const createOngAndPersist = async (ongData) => {
    const newOng = buildOngRecord(ongData);
    await persistOngToDatabase(newOng);
    ongs.push(newOng);
    return newOng;
};

// Funções para planos
const getPlanos = () => planos;
const getPlanoById = (id) => planos.find(plano => plano.id === parseInt(id));

// Funções para notícias
const getNoticias = () => noticias;
const getNoticiaById = (id) => noticias.find(noticia => noticia.id === parseInt(id));

// Funções para doações
const getDoacoes = () => doacoes;
const createDoacao = (donationData) => {
    const newDoacao = {
        id: doacoes.length > 0 ? Math.max(...doacoes.map(item => item.id)) + 1 : 1,
        ...donationData,
        status: donationData.status || 'pendente',
        createdAt: new Date().toISOString()
    };
    doacoes.push(newDoacao);
    persistAsync(async () => {
        await pool.execute(
            `INSERT INTO donations (
                id, ong_id, user_id, donor_name, donor_email, donor_phone,
                donor_document, donor_cep, donor_street, donor_number,
                donor_neighborhood, donor_city, donor_state, amount, message,
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newDoacao.id,
                newDoacao.ongId || null,
                newDoacao.userId || null,
                newDoacao.donorName,
                newDoacao.donorEmail,
                newDoacao.donorPhone,
                newDoacao.donorDocument,
                newDoacao.donorCep,
                newDoacao.donorStreet,
                newDoacao.donorNumber,
                newDoacao.donorNeighborhood,
                newDoacao.donorCity,
                newDoacao.donorState,
                newDoacao.amount,
                newDoacao.message || null,
                newDoacao.paymentMethod,
                newDoacao.status,
                toSqlDateTime(newDoacao.createdAt)
            ]
        );
    }, 'doação');
    return newDoacao;
};

// Funções para assinaturas de plano
const getAssinaturasPlano = () => assinaturasPlano;
const createAssinaturaPlano = (subscriptionData) => {
    const newSubscription = {
        id: assinaturasPlano.length > 0 ? Math.max(...assinaturasPlano.map(item => item.id)) + 1 : 1,
        ...subscriptionData,
        status: subscriptionData.status || 'pendente',
        createdAt: new Date().toISOString()
    };
    assinaturasPlano.push(newSubscription);
    persistAsync(async () => {
        await pool.execute(
            `INSERT INTO plan_subscriptions (
                id, plan_id, user_id, plan_name, plan_price, subscriber_name,
                subscriber_email, subscriber_phone, subscriber_document,
                subscriber_cep, subscriber_street, subscriber_number,
                subscriber_neighborhood, subscriber_city, subscriber_state,
                payment_method, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newSubscription.id,
                newSubscription.planId || null,
                newSubscription.userId || null,
                newSubscription.planName,
                newSubscription.planPrice,
                newSubscription.subscriberName,
                newSubscription.subscriberEmail,
                newSubscription.subscriberPhone,
                newSubscription.subscriberDocument,
                newSubscription.subscriberCep,
                newSubscription.subscriberStreet,
                newSubscription.subscriberNumber,
                newSubscription.subscriberNeighborhood,
                newSubscription.subscriberCity,
                newSubscription.subscriberState,
                newSubscription.paymentMethod,
                newSubscription.status,
                toSqlDateTime(newSubscription.createdAt)
            ]
        );
    }, 'assinatura de plano');
    return newSubscription;
};

// Funções para mensagens de contato
const getMensagensContato = () => mensagensContato;
const createMensagemContato = (messageData) => {
    const newMessage = {
        id: mensagensContato.length > 0 ? Math.max(...mensagensContato.map(item => item.id)) + 1 : 1,
        ...messageData,
        newsletter: !!messageData.newsletter,
        status: messageData.status || 'nova',
        createdAt: new Date().toISOString()
    };
    mensagensContato.push(newMessage);
    persistAsync(async () => {
        await pool.execute(
            `INSERT INTO contact_messages (
                id, user_id, name, email, subject, message, newsletter, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newMessage.id,
                newMessage.userId || null,
                newMessage.name,
                newMessage.email,
                newMessage.subject,
                newMessage.message,
                newMessage.newsletter ? 1 : 0,
                newMessage.status,
                toSqlDateTime(newMessage.createdAt)
            ]
        );
    }, 'mensagem de contato');
    return newMessage;
};

const persistDenunciaWithResponses = async (denuncia) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.execute(
            `INSERT INTO denuncias (id, title, description, location, category, status, user_id, user_name, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                description = VALUES(description),
                location = VALUES(location),
                category = VALUES(category),
                status = VALUES(status),
                user_id = VALUES(user_id),
                user_name = VALUES(user_name),
                created_at = VALUES(created_at)`,
            [
                denuncia.id,
                denuncia.title,
                denuncia.description,
                denuncia.location,
                denuncia.category || 'geral',
                denuncia.status || 'pendente',
                denuncia.userId || denuncia.user_id || 11,
                denuncia.userName || denuncia.user_name || 'João Silva',
                toSqlDateTime(denuncia.createdAt)
            ]
        );

        await connection.execute('DELETE FROM denuncia_responses WHERE denuncia_id = ?', [denuncia.id]);

        const responses = Array.isArray(denuncia.responses) ? denuncia.responses : [];
        for (const response of responses) {
            await connection.execute(
                `INSERT INTO denuncia_responses (id, denuncia_id, ong_id, ong_name, response_text, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    response.id,
                    denuncia.id,
                    response.ongId || response.ong_id || null,
                    response.ongName || response.ong_name || null,
                    response.text || response.response_text || '',
                    toSqlDateTime(response.createdAt)
                ]
            );
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const persistUser = (user) => {
    persistAsync(async () => {
        await pool.execute(
            `INSERT INTO users (id, name, email, password_hash, type, ong_name, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                email = VALUES(email),
                password_hash = VALUES(password_hash),
                type = VALUES(type),
                ong_name = VALUES(ong_name),
                created_at = VALUES(created_at)`,
            [
                user.id,
                user.name,
                user.email,
                user.password || user.password_hash || defaultPasswordHash,
                user.type,
                user.ongName || user.ong_name || null,
                toSqlDateTime(user.createdAt)
            ]
        );
    }, 'usuário');
};

const persistDenuncia = (denuncia) => {
    persistAsync(() => persistDenunciaWithResponses(denuncia), 'denúncia');
};

const syncDatabaseFromCache = () => {
    persistAsync(async () => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('DELETE FROM contact_messages');
            await connection.execute('DELETE FROM plan_subscriptions');
            await connection.execute('DELETE FROM donations');
            await connection.execute('DELETE FROM denuncia_responses');
            await connection.execute('DELETE FROM denuncias');
            await connection.execute('DELETE FROM ongs');
            await connection.execute('DELETE FROM news');
            await connection.execute('DELETE FROM plans');
            await connection.execute('DELETE FROM users');

            for (const user of users) {
                await connection.execute(
                    `INSERT INTO users (id, name, email, password_hash, type, ong_name, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        user.id,
                        user.name,
                        user.email,
                        user.password || user.password_hash || defaultPasswordHash,
                        user.type,
                        user.ongName || user.ong_name || null,
                        toSqlDateTime(user.createdAt)
                    ]
                );
            }

            for (const ong of ongs) {
                await connection.execute(
                    `INSERT INTO ongs (id, name, description, contact_email, phone, address, user_id, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        ong.id,
                        ong.name,
                        ong.description,
                        ong.contact || ong.contact_email,
                        ong.phone || null,
                        ong.address || null,
                        ong.userId || ong.user_id || null,
                        toSqlDateTime(ong.createdAt)
                    ]
                );
            }

            for (const plano of planos) {
                await connection.execute(
                    `INSERT INTO plans (id, title, price, subtitle, features_json, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        plano.id,
                        plano.title,
                        plano.price,
                        plano.subtitle,
                        JSON.stringify(plano.features || []),
                        toSqlDateTime(plano.createdAt)
                    ]
                );
            }

            for (const noticia of noticias) {
                await connection.execute(
                    `INSERT INTO news (id, title, date_label, description, image, url, icon_class, sort_order, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        noticia.id,
                        noticia.title,
                        noticia.date,
                        noticia.description,
                        noticia.image,
                        noticia.url,
                        noticia.iconClass || 'fas fa-newspaper',
                        noticia.sortOrder || noticia.id,
                        toSqlDateTime(noticia.createdAt)
                    ]
                );
            }

            for (const denuncia of denuncias) {
                await connection.execute(
                    `INSERT INTO denuncias (id, title, description, location, category, status, user_id, user_name, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        denuncia.id,
                        denuncia.title,
                        denuncia.description,
                        denuncia.location,
                        denuncia.category || 'geral',
                        denuncia.status || 'pendente',
                        denuncia.userId || denuncia.user_id || 11,
                        denuncia.userName || denuncia.user_name || 'João Silva',
                        toSqlDateTime(denuncia.createdAt)
                    ]
                );

                for (const response of denuncia.responses || []) {
                    await connection.execute(
                        `INSERT INTO denuncia_responses (id, denuncia_id, ong_id, ong_name, response_text, created_at)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                            response.id,
                            denuncia.id,
                            response.ongId || response.ong_id || null,
                            response.ongName || response.ong_name || null,
                            response.text || response.response_text || '',
                            toSqlDateTime(response.createdAt)
                        ]
                    );
                }
            }

            for (const doacao of doacoes) {
                await connection.execute(
                    `INSERT INTO donations (
                        id, ong_id, user_id, donor_name, donor_email, donor_phone,
                        donor_document, donor_cep, donor_street, donor_number,
                        donor_neighborhood, donor_city, donor_state, amount,
                        message, payment_method, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        doacao.id,
                        doacao.ongId || null,
                        doacao.userId || null,
                        doacao.donorName,
                        doacao.donorEmail,
                        doacao.donorPhone,
                        doacao.donorDocument,
                        doacao.donorCep,
                        doacao.donorStreet,
                        doacao.donorNumber,
                        doacao.donorNeighborhood,
                        doacao.donorCity,
                        doacao.donorState,
                        doacao.amount,
                        doacao.message || null,
                        doacao.paymentMethod,
                        doacao.status || 'pendente',
                        toSqlDateTime(doacao.createdAt)
                    ]
                );
            }

            for (const assinatura of assinaturasPlano) {
                await connection.execute(
                    `INSERT INTO plan_subscriptions (
                        id, plan_id, user_id, plan_name, plan_price, subscriber_name,
                        subscriber_email, subscriber_phone, subscriber_document,
                        subscriber_cep, subscriber_street, subscriber_number,
                        subscriber_neighborhood, subscriber_city, subscriber_state,
                        payment_method, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        assinatura.id,
                        assinatura.planId || null,
                        assinatura.userId || null,
                        assinatura.planName,
                        assinatura.planPrice,
                        assinatura.subscriberName,
                        assinatura.subscriberEmail,
                        assinatura.subscriberPhone,
                        assinatura.subscriberDocument,
                        assinatura.subscriberCep,
                        assinatura.subscriberStreet,
                        assinatura.subscriberNumber,
                        assinatura.subscriberNeighborhood,
                        assinatura.subscriberCity,
                        assinatura.subscriberState,
                        assinatura.paymentMethod,
                        assinatura.status || 'pendente',
                        toSqlDateTime(assinatura.createdAt)
                    ]
                );
            }

            for (const mensagem of mensagensContato) {
                await connection.execute(
                    `INSERT INTO contact_messages (
                        id, user_id, name, email, subject, message, newsletter, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        mensagem.id,
                        mensagem.userId || null,
                        mensagem.name,
                        mensagem.email,
                        mensagem.subject,
                        mensagem.message,
                        mensagem.newsletter ? 1 : 0,
                        mensagem.status || 'nova',
                        toSqlDateTime(mensagem.createdAt)
                    ]
                );
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }, 'sincronização do banco');
};

// Inicializar dados ao carregar o módulo
const bootstrapData = () => {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
        initializeData();
        ensureDataLoaded.ready = Promise.resolve(false);
        return ensureDataLoaded.ready;
    }

    if (!isConfigured) {
        ensureDataLoaded.ready = Promise.resolve(false);
        return ensureDataLoaded.ready;
    }

    ensureDataLoaded.ready = ensureDataLoaded();
    return ensureDataLoaded.ready;
};

bootstrapData();

const resetData = () => {
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
        initializeData();
    }
    ensureDataLoaded.ready = Promise.resolve(false);
    syncDatabaseFromCache();
};

const __private__ = {
    hasDatabaseConnection,
    persistAsync,
    toSqlDateTime,
    toIsoString,
    parseJsonArray,
    normalizeUserRow,
    normalizeOngRow,
    normalizeDenunciaRow,
    normalizePlanoRow,
    normalizeNoticiaRow,
    normalizeDoacaoRow,
    normalizeAssinaturaPlanoRow,
    normalizeMensagemContatoRow,
    loadFromDatabase,
    initializeData,
    syncDatabaseFromCache,
    persistUser,
    persistDenuncia,
    persistDenunciaWithResponses,
    ensureDataLoaded
};

module.exports = {
    ensureDataLoaded,
    getUsers,
    saveUsers,
    getUserByEmail,
    getUserById,
    authenticateUser,
    buildSessionUser,
    createUser,
    createUserAndPersist,
    getDenuncias,
    saveDenuncias,
    createDenuncia,
    getDenunciaById,
    updateDenuncia,
    getOngs,
    saveOngs,
    getOngById,
    getOngByUserId,
    createOng,
    createOngAndPersist,
    getPlanos,
    getPlanoById,
    getNoticias,
    getNoticiaById,
    getDoacoes,
    createDoacao,
    getAssinaturasPlano,
    createAssinaturaPlano,
    getMensagensContato,
    createMensagemContato,
    resetData,
    canUseDatabase,
    __private__
};
