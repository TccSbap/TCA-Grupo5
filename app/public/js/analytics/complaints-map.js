import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.mjs';

(function () {
    const mapElement = document.getElementById('public-complaints-map');
    if (!mapElement) return;

    const statusElement = document.getElementById('complaint-map-summary');
    const emptyElement = document.getElementById('complaint-map-empty');
    const payload = window.__PUBLIC_IMPACT__ || {};
    const points = Array.isArray(payload.complaintMapPoints) ? payload.complaintMapPoints : [];
    const features = points.reduce((all, point) => {
        const latitude = Number(point.latitude);
        const longitude = Number(point.longitude);
        const count = Number(point.count);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isInteger(count) || count < 1) return all;
        all.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [longitude, latitude] },
            properties: { count }
        });
        return all;
    }, []);

    const map = new maplibregl.Map({
        container: mapElement,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-51.925, -14.235],
        zoom: 5.5,
        scrollZoom: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');

    map.on('load', () => {
        map.addSource('complaint-areas', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features }
        });
        map.addLayer({
            id: 'complaint-area-circles',
            type: 'circle',
            source: 'complaint-areas',
            paint: {
                'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 12, 4, 19, 10, 28],
                'circle-color': '#2563eb',
                'circle-opacity': 0.68,
                'circle-stroke-color': '#1d4ed8',
                'circle-stroke-width': 2
            }
        });

        map.on('click', 'complaint-area-circles', (event) => {
            const feature = event.features && event.features[0];
            if (!feature) return;
            const count = Number(feature.properties.count);
            const popupText = document.createElement('p');
            popupText.textContent = `${count} ${count === 1 ? 'denúncia' : 'denúncias'} nesta área aproximada.`;
            new maplibregl.Popup().setLngLat(event.lngLat).setDOMContent(popupText).addTo(map);
        });
        map.on('mouseenter', 'complaint-area-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'complaint-area-circles', () => { map.getCanvas().style.cursor = ''; });

        if (features.length) {
            if (emptyElement) emptyElement.hidden = true;
            const bounds = new maplibregl.LngLatBounds();
            features.forEach((feature) => bounds.extend(feature.geometry.coordinates));
            if (features.length === 1) {
                map.jumpTo({ center: features[0].geometry.coordinates, zoom: 12 });
            } else {
                map.fitBounds(bounds, { padding: 48, maxZoom: 12 });
            }
        } else if (emptyElement) {
            emptyElement.hidden = false;
        }

        map.resize();
    });

    map.on('error', (event) => {
        console.error('Erro ao carregar o mapa de denúncias:', event.error);
        if (statusElement && !statusElement.textContent.includes('erro ao carregar o mapa')) {
            statusElement.textContent = 'O mapa encontrou um erro ao carregar dados de fundo. Atualize a página ou tente novamente mais tarde.';
        }
    });
}());
