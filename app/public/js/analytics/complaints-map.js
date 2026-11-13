(function () {
    const mapElement = document.getElementById('public-complaints-map');
    if (!mapElement) return;

    const statusElement = document.getElementById('complaint-map-summary');
    const emptyElement = document.getElementById('complaint-map-empty');
    const payload = window.__PUBLIC_IMPACT__ || {};
    const points = Array.isArray(payload.complaintMapPoints) ? payload.complaintMapPoints : [];

    if (typeof L === 'undefined') {
        if (statusElement) statusElement.textContent = 'Não foi possível carregar o mapa. Tente atualizar a página.';
        return;
    }

    const map = L.map(mapElement, { scrollWheelZoom: false }).setView([-14.235, -51.925], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    const circles = [];
    points.forEach((point) => {
        const latitude = Number(point.latitude);
        const longitude = Number(point.longitude);
        const count = Number(point.count);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isInteger(count) || count < 1) return;

        const circle = L.circleMarker([latitude, longitude], {
            radius: Math.min(30, 10 + Math.sqrt(count) * 5),
            color: '#1d4ed8',
            fillColor: '#2563eb',
            fillOpacity: 0.68,
            weight: 2
        }).bindPopup(`${count} ${count === 1 ? 'denúncia' : 'denúncias'} nesta área aproximada.`);

        circle.addTo(map);
        circles.push(circle);
    });

    if (circles.length) {
        emptyElement?.setAttribute('hidden', 'hidden');
        if (circles.length === 1) {
            map.setView(circles[0].getLatLng(), 12);
        } else {
            map.fitBounds(L.featureGroup(circles).getBounds().pad(0.16), { maxZoom: 12 });
        }
    }

    window.setTimeout(() => map.invalidateSize(), 0);
}());
