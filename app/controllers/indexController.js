const {
    validateDonation,
    validateContactMessage
} = require('../utils/validation');
const {
    createOngDonationOrder,
    isMarketplaceCheckoutConfigured
} = require('../services/mercadoPagoMarketplace');
const {
    createProjectDonationOrder,
    isProjectCheckoutConfigured
} = require('../services/mercadoPagoProject');
const {
    buildAbsoluteUrl,
    buildCollectionPageStructuredData,
    buildItemListStructuredData,
    buildNewsArticleStructuredData,
    buildPageStructuredData,
    getSiteUrl
} = require('../utils/seo');
const {
    buildPublicImpactAnalytics,
    buildCsv
} = require('../utils/analytics');
const { loadNoticias, searchNoticias, NEWS_TOPICS, NEWS_REVIEWED_AT } = require('../utils/noticias');
const { makeApproximateCoordinate } = require('../utils/coordinates');
const {
    COOKIE_CONSENT_ACCEPTED,
    COOKIE_CONSENT_COOKIE_NAME,
    COOKIE_CONSENT_REJECTED,
    getClearCookieConsentOptions,
    getCookieConsentOptions,
    normalizeReturnTo
} = require('../utils/cookieConsent');
const { loadPublicOngById, loadPublicOngs, toPublicOngSummary } = require('../utils/publicOngs');

const pickOngFocus = (ong) => ong.focus || ong.description || 'Projeto socioambiental';

const formatOngForDonation = (ong) => ({
    ...toPublicOngSummary(ong),
    focus: pickOngFocus(ong)
});

const buildComplaintMapPoints = (denuncias) => {
    const areas = new Map();

    for (const denuncia of denuncias) {
        if (denuncia.latitude === null || denuncia.latitude === undefined
            || denuncia.longitude === null || denuncia.longitude === undefined) {
            continue;
        }
        const latitude = Number(denuncia.latitude);
        const longitude = Number(denuncia.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
            || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            continue;
        }

        const approximate = makeApproximateCoordinate(latitude, longitude);
        const key = `${approximate.latitude},${approximate.longitude}`;
        const area = areas.get(key) || { ...approximate, count: 0 };
        area.count += 1;
        areas.set(key, area);
    }

    return [...areas.values()].sort((first, second) => second.count - first.count);
};

const buildSeoPayload = (res, pathname, title, description, options = {}) => ({
    title,
    seoCanonical: buildAbsoluteUrl(pathname, getSiteUrl()),
    seoDescription: description,
    seoOgDescription: options.seoOgDescription || description,
    seoOgTitle: options.seoOgTitle || title,
    seoOgType: options.seoOgType || 'website',
    seoStructuredData: buildPageStructuredData(
        res.locals.seoStructuredData,
        options.structuredData || []
    )
});

const findOngById = async (data, id) => loadPublicOngById(data, id);

const createIndexController = (data) => ({
    async home(req, res) {
        const allDenuncias = await data.getDenuncias();
        const allOngs = await loadPublicOngs(data);
        const noticias = await loadNoticias(data);
        const doacoes = typeof data.getDoacoes === 'function' ? await data.getDoacoes() : [];
        const mensagensContato = typeof data.getMensagensContato === 'function' ? await data.getMensagensContato() : [];
        const impacto = buildPublicImpactAnalytics({
            denuncias: allDenuncias,
            mensagensContato,
            doacoes
        });
        const description = 'Conheça ONGs parceiras, acompanhe denúncias recentes e descubra como apoiar água limpa e saneamento básico.';

        res.render('index', {
            ...buildSeoPayload(res, '/', 'Água limpa e saneamento básico', description, {
                seoOgTitle: 'Água limpa e saneamento básico | Água Consciente'
            }),
            extraStyles: ['/css/analytics.css'],
            denuncias: [...allDenuncias].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3),
            ongs: allOngs.slice(0, 3).map(formatOngForDonation),
            noticias: noticias.slice(0, 4),
            totalDenuncias: allDenuncias.length,
            totalOngs: allOngs.length,
            impacto
        });
    },

    async dashboard(req, res) {
        const user = req.session.user;
        const denuncias = await data.getDenuncias();
        const ongs = await loadPublicOngs(data);
        const doacoes = typeof data.getDoacoes === 'function' ? await data.getDoacoes() : [];

        const userDenuncias = denuncias
            .filter((denuncia) => denuncia.userId === user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const userDoacoes = doacoes
            .filter((doacao) => doacao.userId === user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.render('dashboard', {
            title: 'Meu Dashboard',
            user,
            ongs,
            denuncias: userDenuncias.slice(0, 5),
            doacoes: userDoacoes.slice(0, 5),
            totalDenuncias: userDenuncias.length,
            totalDoacoes: userDoacoes.length,
            totalOngs: ongs.length
        });
    },

    sobre(req, res) {
        res.render('sobre', {
            ...buildSeoPayload(
                res,
                '/sobre',
                'Sobre a plataforma',
                'Entenda como a plataforma conecta cidadãos e ONGs na defesa da água limpa e do saneamento básico.'
            )
        });
    },

    contato(req, res) {
        res.render('contato', {
            ...buildSeoPayload(
                res,
                '/contato',
                'Fale com a equipe',
                'Entre em contato com a equipe da Água Consciente para dúvidas, sugestões e parcerias.'
            ),
            error: req.query.error,
            success: req.query.success
        });
    },

    async submitContato(req, res) {
        const error = validateContactMessage(req.body);
        if (error) {
            return res.redirect('/contato?error=' + encodeURIComponent(error));
        }

        await data.createMensagemContato({
            userId: req.session.user ? req.session.user.id : null,
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            message: req.body.message,
            newsletter: req.body.newsletter === '1'
        });

        return res.redirect('/contato?success=' + encodeURIComponent('Mensagem enviada com sucesso. Em breve entraremos em contato.'));
    },

    async donateForm(req, res) {
        const ong = await findOngById(data, req.params.ongId);

        if (!ong) {
            return res.redirect('/doacoes');
        }

        res.render('doacao_form', {
            ...buildSeoPayload(
                res,
                `/doacoes/${ong.id}/doar`,
                `Doar para ${ong.name}`,
                `Faça uma doação para ${ong.name} e apoie projetos de água limpa e saneamento básico.`
            ),
            ong: formatOngForDonation(ong),
            error: req.query.error,
            success: req.query.success
        });
    },

    donateProjectForm(req, res) {
        res.render('doacao_form', {
            ...buildSeoPayload(
                res,
                '/doacoes/projeto/doar',
                'Doar para a Água Consciente',
                'Apoie o funcionamento e o desenvolvimento da plataforma Água Consciente.'
            ),
            ong: null,
            isProjectDonation: true,
            projectRecipientName: 'Água Consciente',
            error: req.query.error,
            success: req.query.success
        });
    },

    async donateProject(req, res) {
        const renderProjectDonationError = (message) => res.render('doacao_form', {
            ...buildSeoPayload(
                res,
                '/doacoes/projeto/doar',
                'Doar para a Água Consciente',
                'Apoie o funcionamento e o desenvolvimento da plataforma Água Consciente.'
            ),
            ong: null,
            isProjectDonation: true,
            projectRecipientName: 'Água Consciente',
            error: message
        });

        const error = validateDonation(req.body);
        if (error) return renderProjectDonationError(error);
        if (!isProjectCheckoutConfigured()) {
            return renderProjectDonationError('O checkout da conta geral ainda está sendo configurado. Tente novamente mais tarde.');
        }
        if (
            typeof data.setDoacaoMercadoPagoOrder !== 'function' ||
            typeof data.updateProjectDoacaoMercadoPagoOrderStatus !== 'function'
        ) {
            return renderProjectDonationError('A conexão de pagamentos não está disponível neste ambiente.');
        }

        const donation = await data.createDoacao({
            ongId: null,
            recipientType: 'projeto',
            userId: req.session.user ? req.session.user.id : null,
            donorName: req.body.nomeCompleto,
            donorEmail: req.body.emailDoador,
            donorPhone: req.body.telefoneDoador,
            donorDocument: req.body.documentoDoador,
            donorCep: req.body.cepDoador,
            donorStreet: req.body.ruaDoador,
            donorNumber: req.body.numeroDoador,
            donorNeighborhood: req.body.bairroDoador,
            donorCity: req.body.cidadeDoador,
            donorState: req.body.estadoDoador,
            amount: Number(String(req.body.valorDoacao).replace(',', '.')),
            message: req.body.mensagemOpcional || null,
            paymentMethod: null,
            status: 'pendente'
        });

        let createdOrder = null;
        try {
            createdOrder = await createProjectDonationOrder({ donation });
            const orderStored = await data.setDoacaoMercadoPagoOrder({
                donationId: donation.id,
                orderId: createdOrder.orderId,
                providerStatus: createdOrder.status,
                recipientType: 'projeto'
            });
            if (!orderStored) throw new Error('PROJECT_DONATION_ORDER_LINK_FAILED');
            return res.redirect(createdOrder.checkoutUrl);
        } catch (checkoutError) {
            console.error('Não foi possível preparar o checkout da doação ao projeto.', checkoutError.code || checkoutError.name || 'Erro');
            if (typeof data.updateProjectDoacaoMercadoPagoOrderFailure === 'function') {
                await data.updateProjectDoacaoMercadoPagoOrderFailure(donation.id).catch(() => {});
            }
            return renderProjectDonationError('Não foi possível iniciar o pagamento agora. Seus dados não foram cobrados; tente novamente.');
        }
    },

    async donate(req, res) {
        const ong = await findOngById(data, req.body.ongId);

        if (!ong) {
            return res.redirect('/doacoes');
        }

        const error = validateDonation(req.body);
        if (error) {
            return res.render('doacao_form', {
                ...buildSeoPayload(
                    res,
                    `/doacoes/${ong.id}/doar`,
                    `Doar para ${ong.name}`,
                    `Faça uma doação para ${ong.name} e apoie projetos de água limpa e saneamento básico.`
                ),
                ong: formatOngForDonation(ong),
                error
            });
        }

        const renderDonationError = (message) => res.render('doacao_form', {
            ...buildSeoPayload(
                res,
                `/doacoes/${ong.id}/doar`,
                `Doar para ${ong.name}`,
                `Faça uma doação para ${ong.name} e apoie projetos de água limpa e saneamento básico.`
            ),
            ong: formatOngForDonation(ong),
            error: message
        });

        if (!isMarketplaceCheckoutConfigured()) {
            return renderDonationError('O checkout Mercado Pago ainda está sendo configurado. Tente novamente mais tarde.');
        }
        if (typeof data.getOngPaymentAccount !== 'function' || typeof data.getOngPaymentCredentials !== 'function') {
            return renderDonationError('A conexão de pagamentos não está disponível neste ambiente.');
        }

        let paymentAccount;
        try {
            paymentAccount = await data.getOngPaymentAccount(ong.id);
        } catch (accountError) {
            console.error('Não foi possível consultar a conta Mercado Pago da ONG.');
            return renderDonationError('Não foi possível verificar a conta de recebimento da ONG.');
        }
        if (!paymentAccount) {
            return renderDonationError('Esta ONG ainda não conectou sua conta Mercado Pago para receber doações.');
        }

        const donation = await data.createDoacao({
            ongId: ong.id,
            userId: req.session.user ? req.session.user.id : null,
            donorName: req.body.nomeCompleto,
            donorEmail: req.body.emailDoador,
            donorPhone: req.body.telefoneDoador,
            donorDocument: req.body.documentoDoador,
            donorCep: req.body.cepDoador,
            donorStreet: req.body.ruaDoador,
            donorNumber: req.body.numeroDoador,
            donorNeighborhood: req.body.bairroDoador,
            donorCity: req.body.cidadeDoador,
            donorState: req.body.estadoDoador,
            amount: Number(String(req.body.valorDoacao).replace(',', '.')),
            message: req.body.mensagemOpcional || null,
            paymentMethod: null,
            status: 'pendente'
        });

        let createdOrder = null;
        try {
            createdOrder = await createOngDonationOrder({ data, ong, donation });
            const orderStored = await data.setDoacaoMercadoPagoOrder({
                donationId: donation.id,
                orderId: createdOrder.orderId,
                providerStatus: createdOrder.status
            });
            if (!orderStored) throw new Error('DONATION_ORDER_LINK_FAILED');
            return res.redirect(createdOrder.checkoutUrl);
        } catch (checkoutError) {
            console.error('Não foi possível preparar o checkout da doação.', checkoutError.code || checkoutError.name || 'Erro');
            if (typeof data.updateDoacaoMercadoPagoOrderFailure === 'function') {
                await data.updateDoacaoMercadoPagoOrderFailure(donation.id).catch(() => {});
            }
            return renderDonationError('Não foi possível iniciar o pagamento agora. Seus dados não foram cobrados; tente novamente.');
        }
    },

    async doacoes(req, res) {
        const ongs = (await loadPublicOngs(data)).map(formatOngForDonation);
        res.render('doacoes', {
            ...buildSeoPayload(
                res,
                '/doacoes',
                'Doações para ONGs parceiras',
                'Conheça as ONGs parceiras e escolha uma organização para apoiar projetos de água limpa e saneamento.'
            ),
            ongs,
            success: req.query.retorno === 'mp'
                ? 'Você voltou do Mercado Pago. A confirmação será atualizada após a notificação segura do pagamento.'
                : req.query.success
        });
    },

    async noticias(req, res) {
        const allNoticias = await loadNoticias(data);
        const newsQuery = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 120) : '';
        const newsTopic = typeof req.query.tema === 'string' && Object.hasOwn(NEWS_TOPICS, req.query.tema) ? req.query.tema : '';
        const noticias = searchNoticias(allNoticias, newsQuery, newsTopic);
        const noticiasPageUrl = '/noticias';
        const noticiasStructuredData = [
            buildCollectionPageStructuredData({
                name: 'Notícias sobre saneamento básico',
                description: 'Acompanhe as últimas notícias e atualizações sobre saneamento básico e água potável no Brasil.',
                url: noticiasPageUrl,
                mainEntity: buildItemListStructuredData(
                    noticias.map((noticia) => ({
                        type: 'NewsArticle',
                        name: noticia.title,
                        url: noticia.url,
                        description: noticia.description,
                        image: noticia.image,
                        datePublished: noticia.publishedAt
                    })),
                    getSiteUrl(),
                    {
                        name: 'Notícias sobre saneamento básico',
                        description: 'Itens destacados na página de notícias da Água Consciente.',
                        url: noticiasPageUrl,
                        itemType: 'NewsArticle'
                    }
                )
            }),
            ...noticias.map((noticia) => buildNewsArticleStructuredData(noticia, getSiteUrl(), noticia.url))
        ];

        res.render('noticias', {
            ...buildSeoPayload(
                res,
                noticiasPageUrl,
                'Notícias sobre saneamento básico',
                'Acompanhe as últimas notícias e atualizações sobre saneamento básico e água potável no Brasil.',
                {
                    seoOgTitle: 'Notícias sobre saneamento básico | Água Consciente',
                    structuredData: noticiasStructuredData
                }
            ),
            extraStyles: ['/css/noticias.css'],
            noticias,
            newsQuery,
            newsTopic,
            newsTopics: NEWS_TOPICS,
            newsTotal: allNoticias.length,
            newsReviewedAt: NEWS_REVIEWED_AT
        });
    },

    async impacto(req, res) {
        const [denuncias, ongs, mensagensContato, doacoes] = await Promise.all([
            data.getDenuncias(),
            loadPublicOngs(data),
            typeof data.getMensagensContato === 'function' ? data.getMensagensContato() : [],
            typeof data.getDoacoes === 'function' ? data.getDoacoes() : [],
        ]);

        const impacto = buildPublicImpactAnalytics({
            denuncias,
            mensagensContato,
            doacoes
        });
        const complaintMapPoints = buildComplaintMapPoints(denuncias);
        const mappedDenuncias = complaintMapPoints.reduce((total, area) => total + area.count, 0);

        const impactPageUrl = '/impacto';
        const impactDescription = 'Acompanhe indicadores de denuncias, doacoes e participacao comunitaria.';

        res.render('impacto', {
            ...buildSeoPayload(res, impactPageUrl, 'Painel de impacto da plataforma', impactDescription, {
                seoOgTitle: 'Painel de impacto da plataforma | Água Consciente',
                structuredData: [
                    {
                        '@context': 'https://schema.org',
                        '@type': 'WebPage',
                        name: 'Painel de impacto da plataforma',
                        description: impactDescription,
                        url: buildAbsoluteUrl(impactPageUrl, getSiteUrl())
                    }
                ]
            }),
            extraStyles: ['/css/analytics.css'],
            impacto,
            totalDenuncias: denuncias.length,
            complaintMapPoints,
            mappedDenuncias,
            totalOngs: ongs.length
        });
    },

    async impactoCsv(req, res) {
        const [denuncias, mensagensContato, doacoes] = await Promise.all([
            data.getDenuncias(),
            typeof data.getMensagensContato === 'function' ? data.getMensagensContato() : [],
            typeof data.getDoacoes === 'function' ? data.getDoacoes() : [],
        ]);

        const impacto = buildPublicImpactAnalytics({
            denuncias,
            mensagensContato,
            doacoes
        });

        const rows = [
            ['Seção', 'Indicador', 'Valor'],
            ['Resumo', 'Casos abertos no m\u00eas', impacto.casesOpenedThisMonth],
            ['Resumo', 'Casos resolvidos', impacto.casesResolved],
            ['Resumo', 'Doações recebidas', impacto.totalDonations]
        ];

        impacto.monthlyActivity.labels.forEach((label, index) => {
            impacto.monthlyActivity.datasets.forEach((dataset) => {
                rows.push(['Atividade mensal', `${dataset.label} - ${label}`, dataset.data[index] || 0]);
            });
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="painel-impacto.csv"');
        return res.send(buildCsv(rows));
    },

    async privacidade(req, res) {
        res.render('privacidade', {
            ...buildSeoPayload(
                res,
                '/privacidade',
                'Privacidade e cookies',
                'Entenda como tratamos dados pessoais, cookies e direitos de privacidade na plataforma.'
            ),
            cookieConsent: req.cookies?.[COOKIE_CONSENT_COOKIE_NAME] || null
        });
    },

    async setCookieConsent(req, res) {
        const consent = req.body.consent;
        const returnTo = normalizeReturnTo(req.body.returnTo);

        if (consent !== COOKIE_CONSENT_ACCEPTED && consent !== COOKIE_CONSENT_REJECTED) {
            return res.redirect(returnTo);
        }

        res.cookie(COOKIE_CONSENT_COOKIE_NAME, consent, getCookieConsentOptions(req));
        return res.redirect(returnTo);
    },

    async resetCookieConsent(req, res) {
        const returnTo = normalizeReturnTo(req.body.returnTo);

        res.clearCookie(COOKIE_CONSENT_COOKIE_NAME, getClearCookieConsentOptions(req));
        return res.redirect(returnTo);
    }
});

module.exports = {
    createIndexController,
    formatOngForDonation,
    validateContactMessage,
    validateDonation
};
