document.addEventListener('DOMContentLoaded', () => {
    const cepInput = document.getElementById('cep');
    const locationInput = document.getElementById('location');

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
