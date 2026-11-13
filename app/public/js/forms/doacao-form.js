document.addEventListener('DOMContentLoaded', () => {
    const valorDoacaoInput = document.getElementById('valorDoacao');
    const donationAmountOptions = document.querySelector('.donation-amount-options');
    const doacaoForm = document.getElementById('doacaoForm');

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
