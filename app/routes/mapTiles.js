const express = require('express');

const OPENFREEMAP_ORIGIN = 'https://tiles.openfreemap.org';
const LOCAL_MAP_PREFIX = '/map-data';
const ALLOWED_ROOTS = new Set(['styles', 'planet', 'natural_earth', 'fonts', 'sprites']);
const app = express.Router();

const rewriteMapUrls = (value) => {
    if (typeof value === 'string') {
        if (value.startsWith(`${OPENFREEMAP_ORIGIN}/`)) {
            return `${LOCAL_MAP_PREFIX}${value.slice(OPENFREEMAP_ORIGIN.length)}`;
        }
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(rewriteMapUrls);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rewriteMapUrls(item)]));
    }

    return value;
};

const isAllowedMapPath = (pathname) => {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch (error) {
        return false;
    }

    if (decodedPath.includes('\\') || decodedPath.includes('\0')) return false;
    const segments = decodedPath.split('/').filter(Boolean);
    if (!segments.length || !ALLOWED_ROOTS.has(segments[0])) return false;
    return segments.every((segment) => segment !== '.' && segment !== '..' && /^[A-Za-z0-9._@ ,+\-]+$/.test(segment));
};

app.use(async (req, res) => {
    if (req.method !== 'GET') {
        return res.sendStatus(405);
    }

    const requestUrl = new URL(req.originalUrl, 'http://localhost');
    const upstreamPath = requestUrl.pathname.slice(LOCAL_MAP_PREFIX.length);

    if (!isAllowedMapPath(upstreamPath)) {
        return res.sendStatus(404);
    }

    const upstreamUrl = new URL(`${upstreamPath}${requestUrl.search}`, OPENFREEMAP_ORIGIN);

    try {
        const upstream = await fetch(upstreamUrl, {
            headers: {
                Accept: req.get('accept') || '*/*',
                'User-Agent': 'AguaConsciente/1.0 (+https://agua-consciente.onrender.com)'
            },
            signal: AbortSignal.timeout(10000)
        });

        if (!upstream.ok) {
            return res.status(upstream.status).set('Cache-Control', 'no-store').end();
        }

        const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        res.status(upstream.status).set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
        });

        if (contentType.includes('json')) {
            const json = await upstream.json();
            return res.send(rewriteMapUrls(json));
        }

        return res.send(Buffer.from(await upstream.arrayBuffer()));
    } catch (error) {
        return res.status(502).set('Cache-Control', 'no-store').send('Map tiles are temporarily unavailable.');
    }
});

module.exports = { createMapTilesRouter: () => app };
