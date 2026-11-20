const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    answerFromWorkersAi,
    containsLikelyPersonalData,
    findRelevantFaqs,
    isIndividualRecordQuestion,
    isAssistantAvailable
} = require('../services/siteAssistant');

const createAssistantRouter = () => {
    const router = express.Router();
    const chatLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (req, res) => res.status(429).json({
            error: 'Você enviou várias perguntas em pouco tempo. Aguarde alguns minutos e tente novamente.',
            csrfToken: res.locals.csrfToken
        })
    });

    router.post('/chat', chatLimiter, async (req, res) => {
        res.set('Cache-Control', 'no-store');

        if (!isAssistantAvailable()) {
            return res.status(503).json({
                error: 'O assistente ainda está desativado enquanto confirmamos as condições de uso.',
                csrfToken: res.locals.csrfToken
            });
        }

        const question = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
        if (!question || question.length > 500) {
            return res.status(400).json({
                error: 'Escreva uma pergunta de até 500 caracteres.',
                csrfToken: res.locals.csrfToken
            });
        }

        if (containsLikelyPersonalData(question)) {
            return res.status(400).json({
                error: 'Não envie nomes, endereços, e-mails, telefones, documentos, senhas ou dados de pagamento. Faça uma pergunta geral sobre o site.',
                csrfToken: res.locals.csrfToken
            });
        }

        if (isIndividualRecordQuestion(question)) {
            return res.json({
                answer: 'Este assistente não consulta informações de denúncias, doações ou contas individuais. Consulte as páginas públicas do site ou fale com a equipe.',
                links: [{ label: 'Falar com a equipe', href: '/contato' }],
                csrfToken: res.locals.csrfToken
            });
        }

        const relevantFaqs = findRelevantFaqs(question);
        if (!relevantFaqs.length) {
            return res.json({
                answer: 'Não encontrei essa informação nas perguntas frequentes do site. A equipe pode ajudar pela página de contato.',
                links: [{ label: 'Falar com a equipe', href: '/contato' }],
                csrfToken: res.locals.csrfToken
            });
        }

        const links = [...new Map(relevantFaqs.flatMap((faq) => faq.links).map((link) => [link.href, link])).values()];

        try {
            const answer = await answerFromWorkersAi(relevantFaqs);
            return res.json({ answer, links, csrfToken: res.locals.csrfToken });
        } catch (error) {
            const isTimeout = error?.name === 'AbortError';
            if (isTimeout) {
                console.warn('Assistente Cloudflare excedeu o tempo limite.');
            } else if (error?.status) {
                console.warn('Workers AI recusou a solicitação:', JSON.stringify({
                    status: error.status,
                    errors: error.providerErrors || []
                }));
            } else {
                console.warn('Falha ao processar resposta do Workers AI:', error?.message || error?.name || 'erro desconhecido');
            }

            return res.json({
                answer: relevantFaqs[0].answer,
                links,
                fallback: true,
                csrfToken: res.locals.csrfToken
            });
        }
    });

    return router;
};

module.exports = { createAssistantRouter };
