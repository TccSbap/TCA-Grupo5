const createNoticiasCatalog = require('../../data/tables/noticias');

const NEWS_REVIEWED_AT = '2026-10-31';
const NEWS_TOPICS = { agua: 'Água potável', saneamento: 'Saneamento básico', clima: 'Clima e segurança hídrica' };

const normalizeNews = (item) => {
    if (!item || typeof item.title !== 'string' || !item.title.trim()) return null;
    let url;
    try { url = new URL(item.url); } catch { return null; }
    // Exemplos antigos apontavam à própria listagem. A leitura completa deve levar a uma fonte HTTPS.
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const rawDate = item.publishedAt || item.createdAt;
    const date = rawDate ? new Date(rawDate) : null;
    const publishedAt = date && Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
    return {
        ...item,
        url: url.href,
        sourceName: item.sourceName || url.hostname.replace(/^www\./, ''),
        topic: Object.hasOwn(NEWS_TOPICS, item.topic) ? item.topic : 'saneamento',
        publishedAt,
        date: publishedAt ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(date) : item.date || 'Data não informada',
        image: typeof item.image === 'string' && /^\/images\/[\w./-]+$/.test(item.image) ? item.image : '/images/saneamento.webp',
        imageAlt: item.imageAlt || 'Imagem ilustrativa sobre água e saneamento'
    };
};

const loadNoticias = async (data) => {
    const stored = typeof data.getNoticias === 'function' ? await data.getNoticias() : [];
    const byUrl = new Map();
    // Disponível também em MySQL, sem regravar ou apagar registros existentes.
    for (const item of [...(Array.isArray(stored) ? stored : []), ...createNoticiasCatalog()]) {
        const normalized = normalizeNews(item);
        if (normalized) byUrl.set(normalized.url, normalized);
    }
    return [...byUrl.values()].sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
};

const searchNoticias = (noticias, query, topic) => {
    const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const needle = normalize(query).trim();
    return noticias.filter((item) => (!topic || item.topic === topic)
        && (!needle || normalize(`${item.title} ${item.description} ${item.sourceName}`).includes(needle)));
};

module.exports = { loadNoticias, normalizeNews, searchNoticias, NEWS_TOPICS, NEWS_REVIEWED_AT };
