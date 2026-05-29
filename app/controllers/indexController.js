const {
    validateDonation,
    validatePlanSubscription,
    validateContactMessage
} = require('../utils/validation');
const {
    buildAbsoluteUrl,
    buildCollectionPageStructuredData,
    buildItemListStructuredData,
    buildNewsArticleStructuredData,
    buildPageStructuredData,
    getSiteUrl
} = require('../utils/seo');
const {
    COOKIE_CONSENT_ACCEPTED,
    COOKIE_CONSENT_COOKIE_NAME,
    COOKIE_CONSENT_REJECTED,
    getClearCookieConsentOptions,
    getCookieConsentOptions,
    normalizeReturnTo
} = require('../utils/cookieConsent');

const pickOngFocus = (ong) => ong.focus || ong.description || 'Projeto socioambiental';

const formatOngForDonation = (ong) => ({
    ...ong,
    focus: pickOngFocus(ong)
});

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

const findOngById = async (data, id) => {
    if (typeof data.getOngById === 'function') {
        return data.getOngById(id);
    }

    return (await data.getOngs()).find((item) => item.id == id);
};

const findPlanoById = async (data, id) => {
    if (typeof data.getPlanoById === 'function') {
        return data.getPlanoById(id);
    }

    return (await data.getPlanos()).find((item) => item.id == id);
};

const createIndexController = (data) => ({
    async home(req, res) {
        const allDenuncias = await data.getDenuncias();
        const allOngs = await data.getOngs();
        const noticias = typeof data.getNoticias === 'function' ? await data.getNoticias() : [];
        const description = 'Conheça ONGs parceiras, acompanhe denúncias recentes e descubra como apoiar água limpa e saneamento básico.';

        res.render('index', {
            ...buildSeoPayload(res, '/', 'Água limpa e saneamento básico', description, {
                seoOgTitle: 'Água limpa e saneamento básico | Água Consciente'
            }),
            denuncias: allDenuncias.slice(0, 3),
            ongs: allOngs.slice(0, 3).map(formatOngForDonation),
            noticias: noticias.slice(0, 4),
            totalDenuncias: allDenuncias.length,
            totalOngs: allOngs.length
        });
    },

    async dashboard(req, res) {
        const user = req.session.user;
        const denuncias = await data.getDenuncias();
        const ongs = await data.getOngs();
        const doacoes = typeof data.getDoacoes === 'function' ? await data.getDoacoes() : [];
        const assinaturasPlano = typeof data.getAssinaturasPlano === 'function' ? await data.getAssinaturasPlano() : [];

        const userDenuncias = denuncias
            .filter((denuncia) => denuncia.userId === user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const userDoacoes = doacoes
            .filter((doacao) => doacao.userId === user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const userAssinaturas = assinaturasPlano
            .filter((assinatura) => assinatura.userId === user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.render('dashboard', {
            title: 'Meu Dashboard',
            user,
            ongs,
            denuncias: userDenuncias.slice(0, 5),
            doacoes: userDoacoes.slice(0, 5),
            assinaturasPlano: userAssinaturas.slice(0, 5),
            totalDenuncias: userDenuncias.length,
            totalDoacoes: userDoacoes.length,
            totalAssinaturas: userAssinaturas.length,
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

        await data.createDoacao({
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
            paymentMethod: req.body.metodoPagamento,
            status: 'confirmada'
        });

        return res.redirect('/doacoes?success=' + encodeURIComponent('Doação registrada com sucesso.'));
    },

    async doacoes(req, res) {
        const ongs = (await data.getOngs()).map(formatOngForDonation);
        res.render('doacoes', {
            ...buildSeoPayload(
                res,
                '/doacoes',
                'Doações para ONGs parceiras',
                'Conheça as ONGs parceiras e escolha uma organização para apoiar projetos de água limpa e saneamento.'
            ),
            ongs,
            success: req.query.success
        });
    },

    async planForm(req, res) {
        const plano = await findPlanoById(data, req.params.planoId);

        if (!plano) {
            return res.redirect('/planos');
        }

        res.render('plano_form', {
            ...buildSeoPayload(
                res,
                `/planos/${plano.id}/assinar`,
                `Assinar ${plano.title}`,
                `Assine o plano ${plano.title} para apoiar as ações da plataforma Água Consciente.`
            ),
            plano,
            error: req.query.error,
            success: req.query.success
        });
    },

    async subscribePlan(req, res) {
        const plano = await findPlanoById(data, req.body.planoId);

        if (!plano) {
            return res.redirect('/planos');
        }

        const error = validatePlanSubscription(req.body);
        if (error) {
            return res.render('plano_form', {
                ...buildSeoPayload(
                    res,
                    `/planos/${plano.id}/assinar`,
                    `Assinar ${plano.title}`,
                    `Assine o plano ${plano.title} para apoiar as ações da plataforma Água Consciente.`
                ),
                plano,
                error
            });
        }

        await data.createAssinaturaPlano({
            planId: plano.id,
            userId: req.session.user ? req.session.user.id : null,
            planName: req.body.planoNome || plano.title,
            planPrice: req.body.planoPreco || plano.price,
            subscriberName: req.body.nomeCompleto,
            subscriberEmail: req.body.emailComprador,
            subscriberPhone: req.body.telefoneComprador,
            subscriberDocument: req.body.documentoComprador,
            subscriberCep: req.body.cepComprador,
            subscriberStreet: req.body.ruaComprador,
            subscriberNumber: req.body.numeroComprador,
            subscriberNeighborhood: req.body.bairroComprador,
            subscriberCity: req.body.cidadeComprador,
            subscriberState: req.body.estadoComprador,
            paymentMethod: req.body.metodoPagamento,
            status: 'pendente'
        });

        return res.redirect('/planos?success=' + encodeURIComponent('Assinatura registrada com sucesso.'));
    },

    async planos(req, res) {
        res.render('planos', {
            ...buildSeoPayload(
                res,
                '/planos',
                'Planos de apoio',
                'Conheça os planos de apoio e escolha a melhor forma de contribuir com a plataforma.'
            ),
            planos: await data.getPlanos(),
            success: req.query.success
        });
    },

    async noticias(req, res) {
        const noticias = typeof data.getNoticias === 'function' ? await data.getNoticias() : [];
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
                        datePublished: noticia.createdAt
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
            noticias
        });
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
    validateDonation,
    validatePlanSubscription
};
