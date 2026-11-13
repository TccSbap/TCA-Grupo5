import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.mjs';

document.addEventListener('DOMContentLoaded', () => {
    const cepInput = document.getElementById('cep');
    const locationInput = document.getElementById('location');

    const reportMapElement = document.getElementById('denuncia-location-map');
    if (reportMapElement) {
        const latitudeInput = document.getElementById('latitude');
        const longitudeInput = document.getElementById('longitude');
        const status = document.getElementById('location-map-status');
        const useLocationButton = document.getElementById('use-my-location');
        const clearLocationButton = document.getElementById('clear-map-location');

        const reportMap = new maplibregl.Map({
            container: reportMapElement,
            style: '/map-data/styles/bright',
            center: [-46.876, -23.510],
            zoom: 12,
            scrollZoom: true
        });
        reportMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
        reportMap.on('load', () => reportMap.resize());
        reportMap.on('error', (event) => {
            console.error('Erro ao carregar o mapa da denúncia:', event.error);
            status.textContent = 'O mapa encontrou um erro ao carregar dados de fundo. Você ainda pode registrar a denúncia sem marcar um ponto.';
        });

        let selectedMarker = null;
        const setSelectedPoint = (point) => {
            latitudeInput.value = point.lat.toFixed(6);
            longitudeInput.value = point.lng.toFixed(6);
            status.textContent = 'Região selecionada. O sistema guardará apenas uma área aproximada de cerca de 2 km.';
            clearLocationButton.disabled = false;

            if (!selectedMarker) {
                selectedMarker = new maplibregl.Marker({ draggable: true })
                    .setLngLat([point.lng, point.lat])
                    .addTo(reportMap);
                selectedMarker.on('dragend', () => setSelectedPoint(selectedMarker.getLngLat()));
            } else {
                selectedMarker.setLngLat([point.lng, point.lat]);
            }
        };

        reportMap.on('click', (event) => setSelectedPoint(event.lngLat));
        clearLocationButton.addEventListener('click', () => {
            if (selectedMarker) selectedMarker.remove();
            selectedMarker = null;
            latitudeInput.value = '';
            longitudeInput.value = '';
            status.textContent = 'Nenhum ponto selecionado. Clique no mapa ou use sua localização.';
            clearLocationButton.disabled = true;
        });

        useLocationButton.addEventListener('click', () => {
            if (!navigator.geolocation) {
                status.textContent = 'Este navegador não oferece localização. Você pode marcar o ponto manualmente no mapa.';
                return;
            }

            useLocationButton.disabled = true;
            status.textContent = 'Obtendo sua localização para centralizar o mapa…';
            navigator.geolocation.getCurrentPosition((position) => {
                const point = { lat: position.coords.latitude, lng: position.coords.longitude };
                reportMap.jumpTo({ center: [point.lng, point.lat], zoom: 15 });
                setSelectedPoint(point);
                useLocationButton.disabled = false;
            }, () => {
                status.textContent = 'Não foi possível obter a localização. Você pode marcar o ponto manualmente no mapa.';
                useLocationButton.disabled = false;
            }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
        });

        window.setTimeout(() => reportMap.resize(), 0);
    }

    if (!cepInput || !locationInput) {
        return;
    }

    cepInput.addEventListener('blur', async function handleCepBlur() {
        const cep = this.value.replace(/\D/g, '');

        if (cep.length !== 8) {
            locationInput.value = '';
            return;
        }

        const originalPlaceholder = this.placeholder;
        this.placeholder = 'Buscando CEP...';

        try {
            const response = await fetch(`/denuncias/cep/${cep}`, {
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = 'Nao foi possivel buscar o CEP.';

                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (parseError) {
                    console.error('Erro ao interpretar a resposta do CEP:', parseError);
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (!data.erro) {
                const street = [data.logradouro, data.bairro].filter(Boolean).join(', ');
                const city = [data.localidade, data.uf].filter(Boolean).join('/');
                const locationParts = [];

                if (street) {
                    locationParts.push(street);
                }

                if (city) {
                    locationParts.push(city);
                }

                locationInput.value = locationParts.join(' - ');
            } else {
                alert('CEP nao encontrado. Verifique o numero e tente novamente.');
                locationInput.value = '';
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            alert(error.message || 'Nao foi possivel buscar o CEP. Verifique sua conexao e tente novamente.');
            locationInput.value = '';
        } finally {
            this.placeholder = originalPlaceholder;
        }
    });

    cepInput.addEventListener('keypress', function handleCepKeypress(event) {
        if (event.key === 'Enter') {
            this.dispatchEvent(new Event('blur'));
        }
    });
});
