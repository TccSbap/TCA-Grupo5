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
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.erro) {
                locationInput.value = `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`;
            } else {
                alert('CEP não encontrado. Verifique o número e tente novamente.');
                locationInput.value = '';
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            alert('Não foi possível buscar o CEP. Verifique sua conexão e tente novamente.');
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
