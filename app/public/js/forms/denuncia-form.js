document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.denuncia-form');
    if (!form) return;

    const rules = {
        title: {
            validate: (value) => value.trim().length >= 10 && value.trim().length <= 200,
            message: 'O título deve ter entre 10 e 200 caracteres.'
        },
        location: {
            validate: (value) => value.trim().length >= 5 && value.trim().length <= 255,
            message: 'Informe uma localização com pelo menos 5 caracteres.'
        },
        description: {
            validate: (value) => value.trim().length >= 20 && value.trim().length <= 10000,
            message: 'A descrição deve ter entre 20 e 10.000 caracteres.'
        },
        cep: {
            validate: (value) => !value.trim() || /^\d{5}-?\d{3}$/.test(value.trim()),
            message: 'Se informar um CEP, use 8 dígitos.'
        }
    };

    const validateField = (field) => {
        const rule = rules[field.id];
        if (!rule) return true;

        const valid = rule.validate(field.value);
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) errorElement.textContent = valid ? '' : rule.message;
        field.setAttribute('aria-invalid', String(!valid));
        return valid;
    };

    Object.keys(rules).forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (!field) return;

        let errorElement = document.getElementById(`${fieldId}-error`);
        if (!errorElement) {
            errorElement = document.createElement('small');
            errorElement.className = 'error-message';
            errorElement.id = `${fieldId}-error`;
            errorElement.setAttribute('aria-live', 'polite');
            field.insertAdjacentElement('afterend', errorElement);
        }

        const describedBy = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
        if (!describedBy.includes(errorElement.id)) describedBy.push(errorElement.id);
        field.setAttribute('aria-describedby', describedBy.join(' '));

        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.getAttribute('aria-invalid') === 'true') validateField(field);
        });
        field.addEventListener('change', () => {
            if (field.getAttribute('aria-invalid') === 'true') validateField(field);
        });
    });

    form.addEventListener('submit', (event) => {
        const fields = Object.keys(rules)
            .map((fieldId) => document.getElementById(fieldId))
            .filter(Boolean);
        const invalidFields = fields.filter((field) => !validateField(field));

        if (invalidFields.length > 0) {
            event.preventDefault();
            invalidFields[0].focus();
        }
    });
});
