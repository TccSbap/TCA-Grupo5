document.addEventListener('DOMContentLoaded', () => {
    const valorDoacaoInput = document.getElementById('valorDoacao');
    const donationAmountOptions = document.querySelector('.donation-amount-options');
    const doacaoForm = document.getElementById('doacaoForm');
    const cepInput = document.getElementById('cepDoador');
    const cepLookupStatus = document.getElementById('cepDoador-status');

    if (!doacaoForm) {
        return;
    }

    const donationFieldIds = [
        'nomeCompleto', 'emailDoador', 'telefoneDoador', 'documentoDoador',
        'cepDoador', 'ruaDoador', 'numeroDoador', 'bairroDoador',
        'cidadeDoador', 'estadoDoador', 'valorDoacao', 'confirmacao'
    ];
    donationFieldIds.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.addEventListener('blur', () => window.validateDoacaoField(field));
        field.addEventListener('input', () => {
            if (field.getAttribute('aria-invalid') === 'true') window.validateDoacaoField(field);
        });
        field.addEventListener('change', () => {
            if (field.getAttribute('aria-invalid') === 'true') window.validateDoacaoField(field);
        });
    });

    if (cepInput) {
        let activeCepLookup = 0;
        let lastSuccessfulCep = '';

        const setCepLookupStatus = (message, state = '') => {
            if (!cepLookupStatus) return;
            cepLookupStatus.textContent = message;
            cepLookupStatus.className = `cep-lookup-status${state ? ` is-${state}` : ''}`;
        };

        cepInput.addEventListener('input', () => {
            activeCepLookup += 1;
            if (cepInput.value.replace(/\D/g, '') !== lastSuccessfulCep) {
                lastSuccessfulCep = '';
            }
            setCepLookupStatus('');
        });

        cepInput.addEventListener('blur', async () => {
            const cep = cepInput.value.replace(/\D/g, '');
            if (cep.length !== 8) {
                setCepLookupStatus('');
                return;
            }

            if (cep === lastSuccessfulCep) return;

            const lookupId = ++activeCepLookup;
            setCepLookupStatus('Buscando endereço pelo CEP...', 'loading');

            try {
                const response = await fetch(`/denuncias/cep/${cep}`, {
                    headers: { Accept: 'application/json' }
                });
                const address = await response.json();

                if (!response.ok) {
                    throw new Error(address.error || 'Não foi possível consultar este CEP.');
                }
                if (lookupId !== activeCepLookup || cepInput.value.replace(/\D/g, '') !== cep) return;

                const addressFields = {
                    ruaDoador: address.logradouro,
                    bairroDoador: address.bairro,
                    cidadeDoador: address.localidade,
                    estadoDoador: address.uf
                };
                Object.entries(addressFields).forEach(([fieldId, value]) => {
                    const field = document.getElementById(fieldId);
                    if (!field) return;
                    field.value = value || '';
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    window.validateDoacaoField(field);
                });

                cepInput.value = address.cep || `${cep.slice(0, 5)}-${cep.slice(5)}`;
                lastSuccessfulCep = cep;
                const hasMissingAddress = Object.values(addressFields).some((value) => !value);
                setCepLookupStatus(
                    hasMissingAddress
                        ? 'CEP encontrado. Complete manualmente os campos de endereço que ficaram vazios.'
                        : 'Endereço preenchido pelo CEP. Informe o número do imóvel.',
                    'success'
                );
            } catch (error) {
                if (lookupId !== activeCepLookup) return;
                setCepLookupStatus(error.message || 'Não foi possível consultar o CEP. Tente novamente.', 'error');
            }
        });
    }

    if (valorDoacaoInput && donationAmountOptions && valorDoacaoInput.value) {
        const initialButton = donationAmountOptions.querySelector(`button[data-value="${valorDoacaoInput.value}"]`);
        if (initialButton) {
            initialButton.classList.add('active');
        }
    }

    donationAmountOptions?.addEventListener('click', (event) => {
        if (event.target.tagName !== 'BUTTON') {
            return;
        }

        donationAmountOptions.querySelectorAll('button').forEach((button) => button.classList.remove('active'));
        event.target.classList.add('active');
        valorDoacaoInput.value = event.target.dataset.value;
        valorDoacaoInput.dispatchEvent(new Event('input'));
    });

    doacaoForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (window.submitOnce && window.submitOnce.isLocked(doacaoForm)) {
            return;
        }

        if (window.validateDoacaoForm()) {
            if (window.submitOnce) {
                window.submitOnce.lock(doacaoForm);
            }

            doacaoForm.submit();
        } else {
            doacaoForm.querySelector('[aria-invalid="true"]')?.focus();
        }
    });
});
