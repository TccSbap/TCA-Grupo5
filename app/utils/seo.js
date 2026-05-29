const DEFAULT_SITE_NAME = 'Água Consciente';
const DEFAULT_SITE_DESCRIPTION = 'Plataforma de denúncias e mobilização para água limpa e saneamento básico.';
const DEFAULT_SITE_URL = (process.env.SITE_URL || process.env.PUBLIC_SITE_URL || 'https://ods6.org').replace(/\/+$/, '');
const DEFAULT_OG_IMAGE_PATH = '/pwa/icon-512.png';

const PUBLIC_PATHS = [
    '/',
    '/sobre',
    '/contato',
    '/doacoes',
    '/planos',
    '/noticias',
    '/ongs',
    '/privacidade',
    '/lgpd',
    '/denuncias'
];

const NOINDEX_PATH_PATTERNS = [
    /^\/auth(\/|$)/,
    /^\/admin(\/|$)/,
    /^\/dashboard(\/|$)/,
    /^\/ongs\/admin(\/|$)/,
    /^\/doacoes\/\d+\/doar$/,
    /^\/planos\/\d+\/assinar$/,
    /^\/denuncias\/nova$/,
    /^\/__test(\/|$)/
];

const PAGE_DESCRIPTION_MAP = [
    [/^\/$/, DEFAULT_SITE_DESCRIPTION],
    [/^\/sobre$/, 'Saiba como a plataforma conecta cidadãos e ONGs na defesa do acesso à água limpa e saneamento.'],
    [/^\/contato$/, 'Entre em contato com a equipe da Água Consciente para dúvidas, sugestões e parcerias.'],
    [/^\/ongs$/, 'Conheça as ONGs parceiras e veja como cada organização atua em saneamento e água limpa.'],
    [/^\/ongs\/\d+$/, 'Veja a ficha da ONG parceira, sua atuação e os caminhos para apoiar o trabalho da organização.'],
    [/^\/denuncias$/, 'Acompanhe denúncias registradas e o andamento das ações relacionadas ao saneamento básico.'],
    [/^\/denuncias\/\d+$/, 'Consulte os detalhes de uma denúncia pública e acompanhe as respostas associadas.'],
    [/^\/doacoes$/, 'Contribua com ONGs parceiras e ajude projetos de água limpa e saneamento básico.'],
    [/^\/planos$/, 'Conheça os planos de apoio e escolha a melhor forma de contribuir com a plataforma.'],
    [/^\/noticias$/, 'Confira notícias e atualizações sobre saneamento básico, mobilização social e água limpa.'],
    [/^\/privacidade$/, 'Entenda como tratamos dados pessoais, cookies e direitos de privacidade na plataforma.'],
    [/^\/lgpd$/, 'Entenda como tratamos dados pessoais, cookies e direitos de privacidade na plataforma.'],
    [/^\/auth(\/|$)/, 'Área de autenticação da plataforma Água Consciente.'],
    [/^\/admin(\/|$)/, 'Área administrativa interna da plataforma Água Consciente.'],
    [/^\/dashboard(\/|$)/, 'Painel do usuário logado na plataforma Água Consciente.'],
    [/^\/ongs\/admin(\/|$)/, 'Painel administrativo da ONG parceira na plataforma Água Consciente.']
];

const PAGE_OG_TYPE_MAP = [
    [/^\/$/, 'website'],
    [/^\/sobre$/, 'article'],
    [/^\/contato$/, 'website'],
    [/^\/ongs$/, 'collection'],
    [/^\/ongs\/\d+$/, 'article'],
    [/^\/denuncias$/, 'collection'],
    [/^\/denuncias\/\d+$/, 'article'],
    [/^\/doacoes$/, 'website'],
    [/^\/planos$/, 'website'],
    [/^\/noticias$/, 'collection'],
    [/^\/privacidade$/, 'article'],
    [/^\/lgpd$/, 'article']
];

const normalizePathname = (pathname) => {
    if (typeof pathname !== 'string' || !pathname.trim()) {
        return '/';
    }

    const pathWithSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
    if (pathWithSlash === '/') {
        return '/';
    }

    return pathWithSlash.replace(/\/+$/, '') || '/';
};

const getSiteUrl = () => DEFAULT_SITE_URL;

const buildAbsoluteUrl = (pathname, siteUrl = getSiteUrl()) => {
    const normalizedPath = normalizePathname(pathname);
    return normalizedPath === '/' ? `${siteUrl}/` : `${siteUrl}${normalizedPath}`;
};

const buildUrl = (url, siteUrl = getSiteUrl()) => {
    if (typeof url !== 'string' || !url.trim()) {
        return undefined;
    }

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    return buildAbsoluteUrl(url, siteUrl);
};

const getMatchedValue = (pathname, entries, fallback) => {
    const normalizedPath = normalizePathname(pathname);
    const match = entries.find(([pattern]) => pattern.test(normalizedPath));
    return match ? match[1] : fallback;
};

const shouldNoIndex = (pathname) => {
    const normalizedPath = normalizePathname(pathname);
    return NOINDEX_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath));
};

const getSeoDescriptionForPath = (pathname) => getMatchedValue(
    pathname,
    PAGE_DESCRIPTION_MAP,
    DEFAULT_SITE_DESCRIPTION
);

const getSeoOgTypeForPath = (pathname) => getMatchedValue(pathname, PAGE_OG_TYPE_MAP, 'website');

const buildDefaultStructuredData = (siteUrl = getSiteUrl()) => ([
    {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: DEFAULT_SITE_NAME,
        url: siteUrl,
        logo: buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl)
    },
    {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: DEFAULT_SITE_NAME,
        url: siteUrl
    }
]);

const toIsoDate = (value) => {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }

    return date.toISOString();
};

const buildBreadcrumbStructuredData = (items, siteUrl = getSiteUrl()) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (Array.isArray(items) ? items : [])
        .filter((item) => item && item.name && item.url)
        .map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: buildUrl(item.url, siteUrl)
        }))
});

const buildItemListStructuredData = (items, siteUrl = getSiteUrl(), options = {}) => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: options.name,
    description: options.description,
    url: buildUrl(options.url, siteUrl),
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: Array.isArray(items) ? items.length : 0,
    itemListElement: (Array.isArray(items) ? items : [])
        .filter(Boolean)
        .map((item, index) => {
            const resolvedName = item.name || item.title || `Item ${index + 1}`;
            const resolvedUrl = buildUrl(item.url, siteUrl);
            const listItem = {
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': item.type || options.itemType || 'Thing',
                    name: resolvedName
                }
            };

            if (resolvedUrl) {
                listItem.item.url = resolvedUrl;
            }

            if (item.description) {
                listItem.item.description = item.description;
            }

            if (item.image) {
                listItem.item.image = buildUrl(item.image, siteUrl);
            }

            if (item.datePublished) {
                listItem.item.datePublished = item.datePublished;
            }

            return listItem;
        })
});

const buildCollectionPageStructuredData = (options = {}, siteUrl = getSiteUrl()) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: buildUrl(options.url, siteUrl),
    mainEntity: options.mainEntity || undefined
});

const buildNewsArticleStructuredData = (noticia, siteUrl = getSiteUrl(), pageUrl) => ({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: noticia?.title,
    description: noticia?.description,
    image: buildUrl(noticia?.image, siteUrl),
    url: buildUrl(pageUrl || noticia?.url, siteUrl),
    datePublished: toIsoDate(noticia?.createdAt) || undefined,
    dateModified: toIsoDate(noticia?.createdAt) || undefined,
    author: {
        '@type': 'Organization',
        name: DEFAULT_SITE_NAME
    },
    publisher: {
        '@type': 'Organization',
        name: DEFAULT_SITE_NAME,
        logo: {
            '@type': 'ImageObject',
            url: buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl)
        }
    }
});

const buildOrganizationProfileStructuredData = (ong, siteUrl = getSiteUrl(), pageUrl) => {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: ong?.name,
        description: ong?.description,
        url: buildUrl(pageUrl, siteUrl),
        email: ong?.contact || undefined,
        telephone: ong?.phone || undefined,
        logo: buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl)
    };

    if (ong?.address) {
        schema.address = {
            '@type': 'PostalAddress',
            streetAddress: ong.address
        };
    }

    return schema;
};

const buildDenunciaStructuredData = (denuncia, siteUrl = getSiteUrl(), pageUrl) => {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Report',
        headline: denuncia?.title,
        name: denuncia?.title,
        description: denuncia?.description,
        url: buildUrl(pageUrl, siteUrl),
        datePublished: toIsoDate(denuncia?.createdAt) || undefined,
        about: denuncia?.category ? {
            '@type': 'Thing',
            name: denuncia.category
        } : undefined
    };

    if (denuncia?.location) {
        schema.locationCreated = {
            '@type': 'Place',
            name: denuncia.location
        };
    }

    return schema;
};

const buildPageStructuredData = (baseStructuredData, extraStructuredData = []) => [
    ...(Array.isArray(baseStructuredData) ? baseStructuredData : []),
    ...(Array.isArray(extraStructuredData) ? extraStructuredData : [extraStructuredData].filter(Boolean))
];

const getSeoMetadataForPath = (pathname, siteUrl = getSiteUrl()) => {
    const normalizedPath = normalizePathname(pathname);
    const description = getSeoDescriptionForPath(normalizedPath);
    const canonical = buildAbsoluteUrl(normalizedPath, siteUrl);
    const robots = shouldNoIndex(normalizedPath) ? 'noindex, nofollow' : 'index, follow';

    return {
        canonical,
        description,
        ogDescription: description,
        ogImage: buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH, siteUrl),
        ogType: getSeoOgTypeForPath(normalizedPath),
        robots,
        siteName: DEFAULT_SITE_NAME,
        structuredData: buildDefaultStructuredData(siteUrl)
    };
};

const getSitemapPaths = async (data) => {
    const paths = [...PUBLIC_PATHS];

    if (data && typeof data.getOngs === 'function') {
        const ongs = await data.getOngs();
        ongs.forEach((ong) => {
            if (ong && ong.id !== undefined && ong.id !== null) {
                paths.push(`/ongs/${ong.id}`);
            }
        });
    }

    return Array.from(new Set(paths));
};

const escapeXml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const getUrlPriority = (pathname) => {
    const normalizedPath = normalizePathname(pathname);

    if (normalizedPath === '/') {
        return '1.0';
    }

    if (normalizedPath === '/ongs') {
        return '0.9';
    }

    if (normalizedPath === '/denuncias' || normalizedPath === '/noticias') {
        return '0.8';
    }

    if (normalizedPath === '/sobre' || normalizedPath === '/contato' || normalizedPath === '/privacidade') {
        return '0.6';
    }

    return '0.5';
};

const buildSitemapXml = async (data, siteUrl = getSiteUrl()) => {
    const paths = await getSitemapPaths(data);
    const urls = paths
        .map((pathname) => {
            const loc = escapeXml(buildAbsoluteUrl(pathname, siteUrl));
            const priority = getUrlPriority(pathname);

            return [
                '  <url>',
                `    <loc>${loc}</loc>`,
                '    <changefreq>weekly</changefreq>',
                `    <priority>${priority}</priority>`,
                '  </url>'
            ].join('\n');
        })
        .join('\n');

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        '</urlset>'
    ].join('\n');
};

const buildRobotsTxt = (siteUrl = getSiteUrl()) => [
    'User-agent: *',
    'Allow: /',
    'Disallow: /auth/',
    'Disallow: /admin/',
    'Disallow: /dashboard',
    'Disallow: /ongs/admin',
    'Disallow: /__test/',
    `Sitemap: ${buildAbsoluteUrl('/sitemap.xml', siteUrl)}`
].join('\n');

const serializeJsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

module.exports = {
    DEFAULT_SITE_DESCRIPTION,
    DEFAULT_SITE_NAME,
    buildAbsoluteUrl,
    buildBreadcrumbStructuredData,
    buildDefaultStructuredData,
    buildCollectionPageStructuredData,
    buildDenunciaStructuredData,
    buildItemListStructuredData,
    buildNewsArticleStructuredData,
    buildOrganizationProfileStructuredData,
    buildPageStructuredData,
    buildRobotsTxt,
    buildSitemapXml,
    getSeoMetadataForPath,
    getSeoOgTypeForPath,
    getSeoDescriptionForPath,
    getSiteUrl,
    normalizePathname,
    shouldNoIndex,
    serializeJsonLd
};
