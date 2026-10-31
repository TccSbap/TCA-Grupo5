document.addEventListener('DOMContentLoaded', () => {
    const valorDoacaoInput = document.getElementById('valorDoacao');
    const donationAmountOptions = document.querySelector('.donation-amount-options');
    const doacaoForm = document.getElementById('doacaoForm');

    if (!doacaoForm) {
        return;
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

        document.querySelectorAll('.error-message').forEach((element) => {
            element.textContent = '';
        });

        if (window.validateDoacaoForm()) {
            if (window.submitOnce) {
                window.submitOnce.lock(doacaoForm);
            }

            doacaoForm.submit();
        }
    });
});
