const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getDenuncias, getOngs } = require('../data/database');

// Página inicial
router.get('/', (req, res) => {
    const allDenuncias = getDenuncias();
    const allOngs = getOngs();
    const denuncias = allDenuncias.slice(0, 3); // Últimas 3 denúncias
    const ongs = allOngs.slice(0, 3); // 3 ONGs em destaque
    
    res.render('index', {
        title: 'Água Consciente',
        denuncias,
        ongs,
        totalDenuncias: allDenuncias.length,
        totalOngs: allOngs.length
    });
});

// Dashboard (área logada)
router.get('/dashboard', requireAuth, (req, res) => {
    const user = req.session.user;
    const denuncias = getDenuncias();
    const ongs = getOngs();
    
    let userDenuncias = [];
    if (user.type === 'user') {
        userDenuncias = denuncias.filter(d => d.userId === user.id);
    }
    
    res.render('admin/dashboard_admin', {
        title: 'Dashboard',
        user,
        denuncias: userDenuncias,
        totalDenuncias: denuncias.length,
        totalOngs: ongs.length
    });
});

// Sobre
router.get('/sobre', (req, res) => {
    res.render('sobre', {
        title: 'Sobre o Projeto'
    });
});

// Contato
router.get('/contato', (req, res) => {
    res.render('contato', {
        title: 'Contato'
    });
});

module.exports = router;

router.get("/doacoes/:ongId/doar", (req, res) => {
    const ongs = getOngs();
    const ong = ongs.find(o => o.id == req.params.ongId);
    if (!ong) {
        return res.redirect("/doacoes"); // Ou renderizar uma página de erro
    }
    res.render("doacao_form", {
        title: `Doar para ${ong.name}`,
        ong: ong
    });
});

router.post("/doar", [
    // Validação de Nome Completo (Pagamento)
    body('nome_completo', 'Nome Completo inválido. Deve conter pelo menos 2 palavras, somente letras e espaços.').isAlpha('pt-BR', { ignore: ' ' }).isLength({ min: 10 }).custom(value => {
        if (value.trim().split(/\s+/).length < 2) {
            throw new Error('Nome Completo deve conter pelo menos 2 palavras (nome e sobrenome).');
        }
        return true;
    }),
    // Validação de CPF (Pagamento)
    body('cpf', 'CPF inválido. Deve ter 11 dígitos numéricos.').isLength({ min: 11, max: 14 }).custom(value => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length !== 11 || !/^\d{11}$/.test(cleaned)) {
            throw new Error('CPF deve ter 11 dígitos numéricos.');
        }
        return true;
    }),
    // Validação de Telefone (Pagamento)
    body('telefone', 'Telefone inválido. Deve ter 11 dígitos numéricos (DDD + 9 dígitos).').isLength({ min: 11, max: 15 }).custom(value => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length !== 11 || !/^\d{11}$/.test(cleaned)) {
            throw new Error('Telefone deve ter 11 dígitos numéricos (com ou sem pontuação).');
        }
        return true;
    }),
    // Validação de Bairro (Pagamento)
    body('bairro', 'Bairro inválido. Mínimo de 10 e máximo de 40 caracteres, apenas letras e espaços (com acentos).').isLength({ min: 10, max: 40 }).matches(/^[a-zA-Z\u00C0-\u00FF\s]+$/),
    // Validação de Rua (Pagamento)
    body('rua', 'Rua inválida. Mínimo de 3 caracteres, permitindo letras, números, espaços e símbolos (., ,, º, ª, -).').isLength({ min: 3 }).matches(/^[a-zA-Z0-9\u00C0-\u00FF\s.,ºª-]+$/),
    // Validação de Cidade (Pagamento)
    body('cidade', 'Cidade inválida. Mínimo de 5 caracteres, apenas letras e espaços.').isLength({ min: 5 }).isAlpha('pt-BR', { ignore: ' ' }),
    // Validação de Estado (Pagamento)
    body('estado', 'Estado inválido. Deve ser a sigla de 2 letras maiúsculas (ex: SP, RJ, BA).').isLength({ min: 2, max: 2 }).isUppercase()
], (req, res) => {
    const errors = validationResult(req);
    const ongs = getOngs();
    const ong = ongs.find(o => o.id == req.body.ongId); // Assumindo que o ongId é enviado no body

    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;
        
        // Redireciona de volta para o formulário com a mensagem de erro
        if (ong) {
            return res.render("doacao_form", {
                title: `Doar para ${ong.name}`,
                ong: ong,
                error: firstError
            });
        }
        return res.redirect("/doacoes"); // Se não encontrar a ONG, redireciona para a lista
    }

    // Por enquanto, apenas redireciona para uma página de sucesso ou de volta para a lista de ONGs.
    console.log("Doação recebida:", req.body);
    res.redirect("/doacoes"); 
});

// Doações
router.get('/doacoes', (req, res) => {
    const ongs = getOngs(); // Assumindo que getOngs() retorna a lista de ONGs
    res.render('doacoes', {
        title: 'Faça sua Doação',
        ongs: ongs
    });
});

const planosData = [
    {
        id: 1,
        title: "Plano Essencial",
        price: "R$40/mês",
        subtitle: "Ideal para ONGs que estão começando e querem visibilidade",
        features: [
            "Página pública da ONG no site (com nome, descrição, contato e redes sociais)",
            "Pode receber e responder denúncias relacionadas à sua área de atuação",
            "Inclusão nas listagens e mapas de ONGs parceiras",
            "Suporte por e-mail",
            "Até 3 campanhas ou projetos ativos visíveis no perfil"
        ]
    },
    {
        id: 2,
        title: "Plano Avançado",
        price: "R$80/mês",
        subtitle: "Para ONGs que desejam mais alcance e interação com o público",
        features: [
            "Todos os benefícios do plano Essencial, mais:",
            "Destaque nas listagens (posição superior e selo “ONG Ativa”)",
            "Possibilidade de criar até 10 campanhas ou projetos ativos",
            "Acesso a estatísticas de engajamento (quantidade de visitas, cliques e denúncias resolvidas)",
            "Pode interagir com outras ONGs e compartilhar ações conjuntas",
            "Recebe notificações de novas denúncias na região em tempo real",
            "Suporte por chat ou WhatsApp"
        ]
    },
    {
        id: 3,
        title: "Plano Premium",
        price: "R$120/mês",
        subtitle: "Para ONGs que querem impacto máximo e parcerias estratégicas",
        features: [
            "Todos os benefícios do plano Avançado, mais:",
            "Selo de ONG Verificada e Destaque Permanente no site",
            "Acesso completo a relatórios mensais com dados de impacto (número de denúncias atendidas, regiões mais críticas, estatísticas de engajamento)",
            "Pode criar campanhas regionais e eventos (mutirões, ações de limpeza, palestras, etc.)",
            "Prioridade nas parcerias com prefeituras e empresas cadastradas",
            "Página totalmente personalizada (banner, cores, vídeos, links externos)",
            "Suporte prioritário 24h",
            "Convite para participar de campanhas e projetos oficiais da plataforma"
        ]
    }
];

router.get("/planos/:planoId/assinar", (req, res) => {
    const plano = planosData.find(p => p.id == req.params.planoId);
    if (!plano) {
        return res.redirect("/planos");
    }
    res.render("plano_form", {
        title: `Assinar ${plano.title}`,
        plano: plano
    });
});

router.post("/assinar-plano", [
    // Validação de Nome Completo (Pagamento)
    body('nome_completo', 'Nome Completo inválido. Deve conter pelo menos 2 palavras, somente letras e espaços.').isAlpha('pt-BR', { ignore: ' ' }).isLength({ min: 10 }).custom(value => {
        if (value.trim().split(/\s+/).length < 2) {
            throw new Error('Nome Completo deve conter pelo menos 2 palavras (nome e sobrenome).');
        }
        return true;
    }),
    // Validação de CPF (Pagamento)
    body('cpf', 'CPF inválido. Deve ter 11 dígitos numéricos.').isLength({ min: 11, max: 14 }).custom(value => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length !== 11 || !/^\d{11}$/.test(cleaned)) {
            throw new Error('CPF deve ter 11 dígitos numéricos.');
        }
        return true;
    }),
    // Validação de Telefone (Pagamento)
    body('telefone', 'Telefone inválido. Deve ter 11 dígitos numéricos (DDD + 9 dígitos).').isLength({ min: 11, max: 15 }).custom(value => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length !== 11 || !/^\d{11}$/.test(cleaned)) {
            throw new Error('Telefone deve ter 11 dígitos numéricos (com ou sem pontuação).');
        }
        return true;
    }),
    // Validação de Bairro (Pagamento)
    body('bairro', 'Bairro inválido. Mínimo de 10 e máximo de 40 caracteres, apenas letras e espaços (com acentos).').isLength({ min: 10, max: 40 }).matches(/^[a-zA-Z\u00C0-\u00FF\s]+$/),
    // Validação de Rua (Pagamento)
    body('rua', 'Rua inválida. Mínimo de 3 caracteres, permitindo letras, números, espaços e símbolos (., ,, º, ª, -).').isLength({ min: 3 }).matches(/^[a-zA-Z0-9\u00C0-\u00FF\s.,ºª-]+$/),
    // Validação de Cidade (Pagamento)
    body('cidade', 'Cidade inválida. Mínimo de 5 caracteres, apenas letras e espaços.').isLength({ min: 5 }).isAlpha('pt-BR', { ignore: ' ' }),
    // Validação de Estado (Pagamento)
    body('estado', 'Estado inválido. Deve ser a sigla de 2 letras maiúsculas (ex: SP, RJ, BA).').isLength({ min: 2, max: 2 }).isUppercase()
], (req, res) => {
    const errors = validationResult(req);
    
    const planosData = [
        { id: 1, title: "Plano Essencial" },
        { id: 2, title: "Plano Avançado" },
        { id: 3, title: "Plano Premium" }
    ];
    const plano = planosData.find(p => p.id == req.body.planoId); // Assumindo que o planoId é enviado no body

    if (!errors.isEmpty()) {
        const firstError = errors.array()[0].msg;

        // Redireciona de volta para o formulário com a mensagem de erro
        if (plano) {
            return res.render("plano_form", {
                title: `Assinar ${plano.title}`,
                plano: plano,
                error: firstError
            });
        }
        return res.redirect("/planos"); // Se não encontrar o plano, redireciona para a lista
    }

    // Por enquanto, apenas redireciona para uma página de sucesso ou de volta para a lista de planos.
    console.log("Assinatura de plano recebida:", req.body);
    res.redirect("/planos"); 
});

// Notícias
router.get("/planos", (req, res) => {
    res.render("planos", {
        title: "Nossos Planos",
        planos: planosData
    });
});

router.get("/noticias", (req, res) => {
    const noticias = [
        {
            id: 1,
            title: 'Brasil não tem progresso satisfatório em metas de água e saneamento do ODS 6',
            date: '14 de Outubro de 2025',
            description: 'Conclusão é da nona edição do Relatório Luz da Sociedade Civil sobre a Agenda 2030, que aponta retrocesso em metas como a redução da poluição da água.',
            image: '/images/agua-potavel.webp',
            url: 'https://www.aguaesaneamento.org.br/noticias/brasil-nao-tem-progresso-satisfatorio-em-metas-de-agua-e-saneamento-do-ods-6/'
        },
        {
            id: 2,
            title: 'Diretora-presidente da ANA destaca avanços do Brasil e importância da regulação no saneamento básico',
            date: '21 de Outubro de 2025',
            description: 'Veronica Rios enfatizou que o avanço do saneamento deve alcançar toda a população brasileira, com soluções adaptadas às diferentes realidades.',
            image: '/images/saneamento.webp',
            url: 'https://www.gov.br/ana/pt-br/assuntos/noticias-e-eventos/noticias/diretora-presidente-da-ana-destaca-avancos-do-brasil-e-importancia-da-regulacao-no-saneamento-basico-durante-abertura-da-fenasan-2025'
        },
        {
            id: 3,
            title: 'Falta de saneamento básico causa internação de mais de 300 mil cidadãos em 2024, diz estudo',
            date: '19 de Março de 2025',
            description: 'A melhora do saneamento no Brasil se arrasta. Em 16 anos, o abastecimento de água tratada cresceu apenas 4,6 pontos percentuais.',
            image: '/images/agua-potavel.webp',
            url: 'https://g1.globo.com/jornal-nacional/noticia/2025/03/19/falta-de-saneamento-basico-causa-internacao-de-mais-de-300-mil-cidadaos-em-2024-diz-estudo.ghtml'
        },
        {
            id: 4,
            title: 'Falta de acesso à água potável atinge 33 milhões de pessoas no Brasil',
            date: '22 de Março de 2024',
            description: 'No Brasil, cerca de 33 milhões de pessoas vivem sem acesso à água potável, segundo dados divulgados pelo Instituto Trata Brasil.',
            image: '/images/saneamento.webp',
            url: 'https://agenciabrasil.ebc.com.br/geral/noticia/2024-03/falta-de-acesso-agua-potavel-atinge-33-milhoes-de-pessoas-no-brasil'
        },
        {
            id: 5,
            title: 'A questão do clima se tornou inescapável em 2024',
            date: '18 de Dezembro de 2024',
            description: 'A realidade das mudanças climáticas se tornou uma pauta essencial para o campo do saneamento em 2024, com secas e inundações.',
            image: '/images/B3ooD536HBio.jpg',
            url: 'https://www.aguaesaneamento.org.br/noticias/a-questao-do-clima-se-tornou-inescapavel-em-2024/'
        },
        {
            id: 6,
            title: 'Universalização do saneamento pode atrasar quase 40 anos, aponta estudo',
            date: '15 de Julho de 2025',
            description: 'Dados de 2023 mostram que apenas 56% da população tem acesso a esgoto adequado, com tendência de estagnação em áreas fora dos grandes centros.',
            image: '/images/WSlJfDPMch2v.png',
            url: 'https://www.cnnbrasil.com.br/economia/macroeconomia/universalizacao-do-saneamento-pode-atrasar-quase-40-anos-aponta-estudo/'
        },
        {
            id: 7,
            title: 'Ausência de saneamento resulta em mais internações de criança e idoso',
            date: '27 de Março de 2025',
            description: 'Segundo estudo do Trata Brasil, 43,5% das internações por doenças ligadas à falta de saneamento atingem crianças até 4 anos e idosos acima de 60.',
            image: '/images/HKDAinacjrv4.png',
            url: 'https://tratabrasil.org.br/ausencia-saneamento-internacoes-crianca-idoso/'
        },
        {
            id: 8,
            title: 'Governo está comprometido com universalização do saneamento, diz ministro',
            date: '19 de Março de 2025',
            description: 'Serão R$ 2 bilhões para abastecimento de água urbano, R$ 4 bilhões para ampliação da coleta e tratamento de esgoto e R$ 600 milhões para gestão.',
            image: '/images/5OsB7ucNDVnY.jpg',
            url: 'https://www.gov.br/cidades/pt-br/assuntos/noticias-1/noticia-mcid-n-1014'
        },
        {
            id: 9,
            title: 'Mais de 620 mil pessoas recebem água potável pela 1ª vez',
            date: '14 de Outubro de 2025',
            description: 'Iniciativas de empresas privadas e públicas em 2024 levaram água tratada para mais de 620 mil brasileiros que não tinham acesso antes.',
            image: '/images/4GdFr6D2h9R9.webp',
            url: 'https://www.poder360.com.br/conteudo-de-marca/mais-de-620-mil-pessoas-recebem-agua-potavel-pela-1a-vez/'
        },
        {
            id: 10,
            title: 'ODS 6: Garantir disponibilidade e manejo sustentável da água e saneamento para todos',
            date: '04 de Junho de 2024',
            description: 'O saneamento básico é um direito humano e um fator crucial para a saúde pública e a economia, com meta de universalização até 2030.',
            image: '/images/DDtf46EAazit.jpeg',
            url: 'https://neomondo.org.br/noticias/ods-6-agua-limpa-e-saneamento-garantir-disponibilidade-e-manejo-sustentavel-da-agua-e-saneamento-para-todos'
        }
    ];

    res.render('noticias', {
        title: 'Notícias',
        noticias
    });
});



// Painel Administrativo (apenas para ONGs)
router.get('/admin', requireAuth, (req, res) => {
    const user = req.session.user;
    
    // Verificar se é administrador (ONG)
    if (user.type !== 'admin') {
        return res.redirect('/dashboard');
    }
    
    const allDenuncias = getDenuncias();
    const allOngs = getOngs();
    
    res.render('admin/dashboard', {
        title: 'Painel Administrativo',
        user,
        totalDenuncias: allDenuncias.length,
        totalOngs: allOngs.length,
        denunciasResolvidas: allDenuncias.filter(d => d.status === 'resolvida').length,
        denunciasEmAndamento: allDenuncias.filter(d => d.status === 'em_andamento').length,
        denunciasPendentes: allDenuncias.filter(d => d.status === 'pendente').length
    });
});

// Gerenciar denúncias (apenas para ONGs)
router.get('/admin/denuncias', requireAuth, (req, res) => {
    const user = req.session.user;
    
    if (user.type !== 'admin') {
        return res.redirect('/dashboard');
    }
    
    const allDenuncias = getDenuncias();
    
    res.render('admin/denuncias', {
        title: 'Gerenciar Denúncias',
        user,
        denuncias: allDenuncias
    });
});

// Gerenciar ONGs (apenas para ONGs)
router.get('/admin/ongs', requireAuth, (req, res) => {
    const user = req.session.user;
    
    if (user.type !== 'admin') {
        return res.redirect('/dashboard');
    }
    
    const allOngs = getOngs();
    
    res.render('admin/ongs', {
        title: 'Gerenciar ONGs',
        user,
        ongs: allOngs
    });
});

