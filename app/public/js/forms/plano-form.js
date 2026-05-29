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
            cartaoFields.style.display = 'none';
            pixFields.style.display = 'none';
            boletoFields.style.display = 'none';

            document.querySelectorAll('#cartao-fields input').forEach((input) => input.removeAttribute('required'));

            if (this.value === 'cartao') {
                cartaoFields.style.display = 'block';
                document.getElementById('numeroCartao').setAttribute('required', 'required');
                document.getElementById('validadeCartao').setAttribute('required', 'required');
                document.getElementById('cvvCartao').setAttribute('required', 'required');
            } else if (this.value === 'pix') {
                pixFields.style.display = 'block';
            } else if (this.value === 'boleto') {
                boletoFields.style.display = 'block';
            }
        });
    });

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
