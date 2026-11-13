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

        if (typeof L === 'undefined') {
            status.textContent = 'O mapa não carregou. Você ainda pode registrar a denúncia sem marcar um ponto.';
            useLocationButton.disabled = true;
        } else {
            const reportMap = L.map(reportMapElement).setView([-23.510, -46.876], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            }).addTo(reportMap);

            let selectedMarker = null;
            const setSelectedPoint = (point) => {
                latitudeInput.value = point.lat.toFixed(6);
                longitudeInput.value = point.lng.toFixed(6);
                status.textContent = 'Região selecionada. O sistema guardará apenas uma área aproximada de cerca de 2 km.';
                clearLocationButton.disabled = false;

                if (!selectedMarker) {
                    selectedMarker = L.marker(point, { draggable: true }).addTo(reportMap);
                    selectedMarker.on('dragend', () => setSelectedPoint(selectedMarker.getLatLng()));
                } else {
                    selectedMarker.setLatLng(point);
                }
            };

            reportMap.on('click', (event) => setSelectedPoint(event.latlng));
            clearLocationButton.addEventListener('click', () => {
                if (selectedMarker) reportMap.removeLayer(selectedMarker);
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
                    const point = L.latLng(position.coords.latitude, position.coords.longitude);
                    reportMap.setView(point, 15);
                    setSelectedPoint(point);
                    useLocationButton.disabled = false;
                }, () => {
                    status.textContent = 'Não foi possível obter a localização. Você pode marcar o ponto manualmente no mapa.';
                    useLocationButton.disabled = false;
                }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
            });

            window.setTimeout(() => reportMap.invalidateSize(), 0);
        }
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
