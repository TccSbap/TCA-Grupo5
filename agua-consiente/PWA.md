---
tags:
  - pwa
  - progressive-web-app
  - offline
created: 2026-05-13
---
# PWA (Progressive Web App)

#pwa #offline #serviceworker #manifest

---

## Visao Geral

O site ODS 6 possui suporte PWA, permitindo instalacao como aplicativo e funcionamento offline parcial.

---

## Manifest (public/manifest.webmanifest)

Define o aplicativo para instalacao no dispositivo com nome, icones (192px e 512px), tema azul e display standalone.

Referenciado em [[Views|layout.ejs]].

---

## Service Worker (public/sw.js)

Estrategia de cache:
- Cache First: CSS, JS, imagens, fontes, manifest
- Network First: navegacao (com fallback para offline.html)

---

## Offline (public/offline.html)

Pagina exibida quando o usuario esta offline e a pagina requisitada nao esta em cache. Contem logo, mensagem e botao Tentar Novamente.

---

## Meta Tags

Incluidas em layout.ejs: theme-color, application-name, apple-mobile-web-app-title, icones PWA, apple-touch-icon.

---

## Screenshots

public/pwa/screenshots/: home-desktop.png, home-mobile.png

---

## Registro do SW

Em public/js/main.js: registra o service worker (/sw.js) apos o carregamento da pagina.
