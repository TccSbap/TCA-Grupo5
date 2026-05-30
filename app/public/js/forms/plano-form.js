document.addEventListener('DOMContentLoaded', () => {
    const metodoPagamentoRadios = document.querySelectorAll('input[name="metodoPagamento"]');
    const cartaoFields = document.getElementById('cartao-fields');
    const pixFields = document.getElementById('pix-fields');
    const boletoFields = document.getElementById('boleto-fields');
    const planoForm = document.getElementById('planoForm');

    if (!planoForm) {
        return;
    }

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

    planoForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (window.submitOnce && window.submitOnce.isLocked(planoForm)) {
            return;
        }

        document.querySelectorAll('.error-message').forEach((element) => {
            element.textContent = '';
        });

        if (window.validatePlanoForm()) {
            if (window.submitOnce) {
                window.submitOnce.lock(planoForm);
            }

            planoForm.submit();
        }
    });
});
