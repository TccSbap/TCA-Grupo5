document.addEventListener('DOMContentLoaded', () => {
    const valorDoacaoInput = document.getElementById('valorDoacao');
    const donationAmountOptions = document.querySelector('.donation-amount-options');
    const metodoPagamentoRadios = document.querySelectorAll('input[name="metodoPagamento"]');
    const cartaoFields = document.getElementById('cartao-fields');
    const pixFields = document.getElementById('pix-fields');
    const boletoFields = document.getElementById('boleto-fields');
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

    metodoPagamentoRadios.forEach((radio) => {
        radio.addEventListener('change', function handlePaymentMethodChange() {
            cartaoFields.hidden = true;
            pixFields.hidden = true;
            boletoFields.hidden = true;

            document.querySelectorAll('#cartao-fields input').forEach((input) => input.removeAttribute('required'));

            if (this.value === 'cartao') {
                cartaoFields.hidden = false;
                document.getElementById('numeroCartao').setAttribute('required', 'required');
                document.getElementById('validadeCartao').setAttribute('required', 'required');
                document.getElementById('cvvCartao').setAttribute('required', 'required');
            } else if (this.value === 'pix') {
                pixFields.hidden = false;
            } else if (this.value === 'boleto') {
                boletoFields.hidden = false;
            }
        });
    });

    const selectedPaymentMethod = document.querySelector('input[name="metodoPagamento"]:checked');
    if (selectedPaymentMethod) {
        selectedPaymentMethod.dispatchEvent(new Event('change'));
    }

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
