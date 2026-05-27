const normalizeText = (value) => String(value || '').trim();
const digitsOnly = (value) => normalizeText(value).replace(/\D/g, '');
const hasTwoWords = (value) => normalizeText(value).split(/\s+/).filter(Boolean).length >= 2;
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));
const isValidState = (value) => /^[A-Z]{2}$/.test(normalizeText(value));
const isLongEnough = (value, min) => normalizeText(value).length >= min;

const pickOngFocus = (ong) => ong.focus || ong.description || 'Projeto socioambiental';

const formatOngForDonation = (ong) => ({
    ...ong,
    focus: pickOngFocus(ong)
});

const validateDonation = (body) => {
    if (!hasTwoWords(body.nomeCompleto)) {
        return 'Nome Completo deve conter pelo menos 2 palavras.';
    }

    if (!isValidEmail(body.emailDoador)) {
        return 'E-mail do doador inválido.';
    }

    if (digitsOnly(body.telefoneDoador).length < 10) {
        return 'Telefone inválido.';
    }

    if (digitsOnly(body.documentoDoador).length !== 11) {
        return 'CPF inválido. Deve ter 11 dígitos numéricos.';
    }

    if (digitsOnly(body.cepDoador).length !== 8) {
        return 'CEP inválido. Deve ter 8 dígitos numéricos.';
    }

    if (!isLongEnough(body.ruaDoador, 3)) {
        return 'Rua inválida.';
    }

    if (!isLongEnough(body.numeroDoador, 1)) {
        return 'Número inválido.';
    }

    if (!isLongEnough(body.bairroDoador, 3)) {
        return 'Bairro inválido.';
    }

    if (!isLongEnough(body.cidadeDoador, 3)) {
        return 'Cidade inválida.';
    }

    if (!isValidState(body.estadoDoador)) {
        return 'Estado inválido. Use a sigla de 2 letras maiúsculas.';
    }

    const amount = Number(String(body.valorDoacao || '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount < 5) {
        return 'O valor da doação deve ser de pelo menos R$ 5,00.';
    }

    if (!['cartao', 'pix', 'boleto'].includes(body.metodoPagamento)) {
        return 'Selecione um método de pagamento válido.';
    }

    return null;
};

const validatePlanSubscription = (body) => {
    if (!hasTwoWords(body.nomeCompleto)) {
        return 'Nome Completo deve conter pelo menos 2 palavras.';
    }

    if (!isValidEmail(body.emailComprador)) {
        return 'E-mail do comprador inválido.';
    }

    if (digitsOnly(body.telefoneComprador).length < 10) {
        return 'Telefone inválido.';
    }

    if (digitsOnly(body.documentoComprador).length !== 11) {
        return 'CPF inválido. Deve ter 11 dígitos numéricos.';
    }

    if (digitsOnly(body.cepComprador).length !== 8) {
        return 'CEP inválido. Deve ter 8 dígitos numéricos.';
    }

    if (!isLongEnough(body.ruaComprador, 3)) {
        return 'Rua inválida.';
    }

    if (!isLongEnough(body.numeroComprador, 1)) {
        return 'Número inválido.';
    }

    if (!isLongEnough(body.bairroComprador, 3)) {
        return 'Bairro inválido.';
    }

    if (!isLongEnough(body.cidadeComprador, 3)) {
        return 'Cidade inválida.';
    }

    if (!isValidState(body.estadoComprador)) {
        return 'Estado inválido. Use a sigla de 2 letras maiúsculas.';
    }

    if (!['cartao', 'pix', 'boleto'].includes(body.metodoPagamento)) {
        return 'Selecione um método de pagamento válido.';
    }

    return null;
};

const validateContactMessage = (body) => {
    if (!hasTwoWords(body.name)) {
        return 'Informe seu nome completo.';
    }

    if (!isValidEmail(body.email)) {
        return 'Informe um e-mail válido.';
    }

    if (!normalizeText(body.subject)) {
        return 'Selecione um assunto.';
    }

    if (!isLongEnough(body.message, 10)) {
        return 'A mensagem deve ter pelo menos 10 caracteres.';
    }

    return null;
};

const createIndexController = (data) => ({
    async home(req, res) {
        const allDenuncias = await data.getDenuncias();
        const allOngs = await data.getOngs();
        const noticias = typeof data.getNoticias === 'function' ? await data.getNoticias() : [];

        res.render('index', {
            title: 'Água Consciente',
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
        const userDenuncias = user.type === 'admin' || user.type === 'ong'
            ? denuncias
            : denuncias.filter((denuncia) => denuncia.userId === user.id);

        res.render('admin/dashboard_admin', {
            title: 'Dashboard',
            user,
            denuncias: userDenuncias,
            totalDenuncias: denuncias.length,
            totalOngs: ongs.length
        });
    },

    sobre(req, res) {
        res.render('sobre', {
            title: 'Sobre o Projeto'
        });
    },

    contato(req, res) {
        res.render('contato', {
            title: 'Contato',
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
        const ong = typeof data.getOngById === 'function'
            ? await data.getOngById(req.params.ongId)
            : (await data.getOngs()).find((item) => item.id == req.params.ongId);

        if (!ong) {
            return res.redirect('/doacoes');
        }

        res.render('doacao_form', {
            title: `Doar para ${ong.name}`,
            ong: formatOngForDonation(ong),
            error: req.query.error,
            success: req.query.success
        });
    },

    async donate(req, res) {
        const ong = typeof data.getOngById === 'function'
            ? await data.getOngById(req.body.ongId)
            : (await data.getOngs()).find((item) => item.id == req.body.ongId);

        if (!ong) {
            return res.redirect('/doacoes');
        }

        const error = validateDonation(req.body);
        if (error) {
            return res.render('doacao_form', {
                title: `Doar para ${ong.name}`,
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
            title: 'Faça sua Doação',
            ongs,
            success: req.query.success
        });
    },

    async planForm(req, res) {
        const plano = typeof data.getPlanoById === 'function'
            ? await data.getPlanoById(req.params.planoId)
            : (await data.getPlanos()).find((item) => item.id == req.params.planoId);

        if (!plano) {
            return res.redirect('/planos');
        }

        res.render('plano_form', {
            title: `Assinar ${plano.title}`,
            plano,
            error: req.query.error,
            success: req.query.success
        });
    },

    async subscribePlan(req, res) {
        const plano = typeof data.getPlanoById === 'function'
            ? await data.getPlanoById(req.body.planoId)
            : (await data.getPlanos()).find((item) => item.id == req.body.planoId);

        if (!plano) {
            return res.redirect('/planos');
        }

        const error = validatePlanSubscription(req.body);
        if (error) {
            return res.render('plano_form', {
                title: `Assinar ${plano.title}`,
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
            title: 'Nossos Planos',
            planos: await data.getPlanos(),
            success: req.query.success
        });
    },

    async noticias(req, res) {
        res.render('noticias', {
            title: 'Notícias',
            noticias: typeof data.getNoticias === 'function' ? await data.getNoticias() : []
        });
    }
});

module.exports = {
    createIndexController,
    formatOngForDonation,
    validateContactMessage,
    validateDonation,
    validatePlanSubscription
};
