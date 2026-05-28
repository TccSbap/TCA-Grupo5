function normalizeDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function formatCPF(value) {
    const digits = normalizeDigits(value).slice(0, 11);

    return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
}

function formatCNPJ(value) {
    const digits = normalizeDigits(value).slice(0, 14);

    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/, '$1.$2.$3/$4-$5');
}

function formatTelefone(value) {
    const digits = normalizeDigits(value).slice(0, 11);

    if (!digits) {
        return '';
    }

    if (digits.length <= 2) {
        return `(${digits}`;
    }

    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);

    if (rest.length <= 4) {
        return `(${ddd}) ${rest}`;
    }

    if (rest.length <= 8) {
        return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }

    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

function formatRG(value) {
    const digits = normalizeDigits(value).slice(0, 9);

    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email || '').trim());
}

function validateNomeCompleto(nome) {
    return String(nome || '').trim().length >= 10;
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(String(password || ''));
}

function validateConfirmPassword(password, confirmPassword) {
    return password === confirmPassword;
}

function validateTelefone(telefone) {
    const telefoneLimpo = normalizeDigits(telefone);
    return (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) && /^\d+$/.test(telefoneLimpo);
}

function validateCPF(cpf) {
    cpf = normalizeDigits(cpf);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10), 10)) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11), 10)) return false;

    return true;
}

function validateCNPJ(cnpj) {
    const normalized = normalizeDigits(cnpj);

    if (normalized.length !== 14 || /^(\d)\1{13}$/.test(normalized)) {
        return false;
    }

    const calculateDigit = (base, weights) => {
        const sum = base
            .split('')
            .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
        const remainder = sum % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    };

    const firstDigit = calculateDigit(normalized.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const secondDigit = calculateDigit(normalized.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return firstDigit === Number(normalized[12]) && secondDigit === Number(normalized[13]);
}

function validateRG(rg) {
    const normalized = normalizeDigits(rg);
    return normalized.length === 9 && !/^(\d)\1{8}$/.test(normalized);
}

function validateBairro(bairro) {
    const bairroRegex = /^[A-Za-zÀ-ú\s]{10,40}$/;
    const normalized = String(bairro || '').trim();
    return normalized.length >= 10 && normalized.length <= 40 && bairroRegex.test(normalized);
}

function validateRua(rua) {
    const ruaRegex = /^[A-Za-z0-9À-ú\s.,ºª-]{3,}$/;
    const normalized = String(rua || '').trim();
    return normalized.length >= 3 && ruaRegex.test(normalized);
}

function validateCidade(cidade) {
    const cidadeRegex = /^[A-Za-zÀ-ú\s]{5,}$/;
    const normalized = String(cidade || '').trim();
    return normalized.length >= 5 && cidadeRegex.test(normalized);
}

function validateEstado(estado) {
    const estadoRegex = /^[A-Z]{2}$/;
    return estadoRegex.test(String(estado || '').trim());
}

function validateNomeCompletoPagamento(nome) {
    const normalized = String(nome || '').trim();
    const partesNome = normalized.split(/\s+/).filter(Boolean);
    return partesNome.length >= 2 && /^[A-Za-zÀ-ú\s]+$/.test(normalized);
}

function applyMask(input, formatter) {
    const formattedValue = formatter(input.value);
    if (input.value !== formattedValue) {
        input.value = formattedValue;
    }
}

function initInputMasks() {
    const maskFormatters = {
        cpf: formatCPF,
        cnpj: formatCNPJ,
        telefone: formatTelefone,
        rg: formatRG
    };

    document.querySelectorAll('[data-mask]').forEach((input) => {
        const formatter = maskFormatters[input.dataset.mask];

        if (!formatter) {
            return;
        }

        const handleInput = () => applyMask(input, formatter);

        input.addEventListener('input', handleInput);
        input.addEventListener('blur', handleInput);
        handleInput();
    });
}

document.addEventListener('DOMContentLoaded', initInputMasks);

function validateCadastroForm() {
    let isValid = true;
    const userTypeInput = document.getElementById('userType');
    const isOngCadastro = userTypeInput && userTypeInput.value === 'ong';

    const nameInput = document.getElementById('name');
    if (!validateNomeCompleto(nameInput.value)) {
        document.getElementById('name-error').textContent = 'Nome completo deve ter no mínimo 10 caracteres.';
        nameInput.style.borderColor = 'red';
        isValid = false;
    } else {
        nameInput.style.borderColor = '';
    }

    const emailInput = document.getElementById('email');
    if (!validateEmail(emailInput.value)) {
        document.getElementById('email-error').textContent = 'O e-mail deve ser válido.';
        emailInput.style.borderColor = 'red';
        isValid = false;
    } else if (emailInput.value.trim() !== '') {
        emailInput.style.borderColor = '';
    }

    const passwordInput = document.getElementById('password');
    if (!validatePassword(passwordInput.value)) {
        document.getElementById('password-error').textContent = 'A senha deve ter no mínimo 8 caracteres e conter pelo menos uma letra maiúscula, uma minúscula e um número.';
        passwordInput.style.borderColor = 'red';
        isValid = false;
    } else {
        passwordInput.style.borderColor = '';
    }

    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (!validateConfirmPassword(passwordInput.value, confirmPasswordInput.value)) {
        document.getElementById('confirmPassword-error').textContent = 'A confirmação de senha deve ser idêntica à senha.';
        confirmPasswordInput.style.borderColor = 'red';
        isValid = false;
    } else {
        confirmPasswordInput.style.borderColor = '';
    }

    const ongFieldIds = ['ongName', 'ongDescription', 'ongContact', 'ongCnpj', 'ongRg', 'ongPhone', 'ongAddress'];
    if (isOngCadastro) {
        const ongNameInput = document.getElementById('ongName');
        if (ongNameInput && ongNameInput.value.trim() === '') {
            document.getElementById('ongName-error').textContent = 'O nome da ONG é obrigatório.';
            ongNameInput.style.borderColor = 'red';
            isValid = false;
        } else if (ongNameInput) {
            ongNameInput.style.borderColor = '';
        }

        const ongDescriptionInput = document.getElementById('ongDescription');
        if (ongDescriptionInput && ongDescriptionInput.value.trim() === '') {
            document.getElementById('ongDescription-error').textContent = 'A descrição da ONG é obrigatória.';
            ongDescriptionInput.style.borderColor = 'red';
            isValid = false;
        } else if (ongDescriptionInput) {
            ongDescriptionInput.style.borderColor = '';
        }

        const ongContactInput = document.getElementById('ongContact');
        if (!validateEmail(ongContactInput.value)) {
            document.getElementById('ongContact-error').textContent = 'O e-mail da ONG deve ser válido.';
            ongContactInput.style.borderColor = 'red';
            isValid = false;
        } else if (ongContactInput.value.trim() !== '') {
            ongContactInput.style.borderColor = '';
        }

        const ongCnpjInput = document.getElementById('ongCnpj');
        if (ongCnpjInput && !validateCNPJ(ongCnpjInput.value)) {
            document.getElementById('ongCnpj-error').textContent = 'O CNPJ da ONG é inválido.';
            ongCnpjInput.style.borderColor = 'red';
            isValid = false;
        } else if (ongCnpjInput) {
            ongCnpjInput.style.borderColor = '';
        }

        const ongRgInput = document.getElementById('ongRg');
        if (ongRgInput && !validateRG(ongRgInput.value)) {
            document.getElementById('ongRg-error').textContent = 'O RG do responsável é inválido.';
            ongRgInput.style.borderColor = 'red';
            isValid = false;
        } else if (ongRgInput) {
            ongRgInput.style.borderColor = '';
        }

        const ongPhoneInput = document.getElementById('ongPhone');
        if (ongPhoneInput && ongPhoneInput.value.trim() !== '' && !validateTelefone(ongPhoneInput.value)) {
            document.getElementById('ongPhone-error').textContent = 'O telefone da ONG é inválido. Use 10 ou 11 dígitos numéricos.';
            ongPhoneInput.style.borderColor = 'red';
            isValid = false;
        } else if (ongPhoneInput) {
            ongPhoneInput.style.borderColor = '';
        }

        const ongAddressInput = document.getElementById('ongAddress');
        if (ongAddressInput) {
            ongAddressInput.style.borderColor = '';
        }
    } else {
        ongFieldIds.forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            const error = document.getElementById(`${fieldId}-error`);

            if (field) {
                field.style.borderColor = '';
            }

            if (error) {
                error.textContent = '';
            }
        });
    }

    return isValid;
}

function validateDoacaoForm() {
    let isValid = true;

    const nomeCompletoInput = document.getElementById('nomeCompleto');
    if (!validateNomeCompletoPagamento(nomeCompletoInput.value)) {
        document.getElementById('nomeCompleto-error').textContent = 'Nome completo deve ter pelo menos 2 palavras e conter apenas letras e espaços.';
        isValid = false;
    }

    const emailDoadorInput = document.getElementById('emailDoador');
    if (!validateEmail(emailDoadorInput.value)) {
        document.getElementById('emailDoador-error').textContent = 'O e-mail deve ser válido.';
        isValid = false;
    }

    const bairroDoadorInput = document.getElementById('bairroDoador');
    if (!validateBairro(bairroDoadorInput.value)) {
        document.getElementById('bairroDoador-error').textContent = 'Bairro deve ter entre 10 e 40 caracteres e conter apenas letras e espaços.';
        isValid = false;
    }

    const ruaDoadorInput = document.getElementById('ruaDoador');
    if (!validateRua(ruaDoadorInput.value)) {
        document.getElementById('ruaDoador-error').textContent = 'Rua deve ter no mínimo 3 caracteres e conter apenas letras, números, espaços e os símbolos .,ºª-.';
        isValid = false;
    }

    const cidadeDoadorInput = document.getElementById('cidadeDoador');
    if (!validateCidade(cidadeDoadorInput.value)) {
        document.getElementById('cidadeDoador-error').textContent = 'Cidade deve ter no mínimo 5 caracteres e conter apenas letras e espaços.';
        isValid = false;
    }

    const estadoDoadorInput = document.getElementById('estadoDoador');
    if (!validateEstado(estadoDoadorInput.value)) {
        document.getElementById('estadoDoador-error').textContent = 'Estado deve ser uma sigla de 2 letras maiúsculas (ex: SP, RJ, BA).';
        isValid = false;
    }

    const documentoDoadorInput = document.getElementById('documentoDoador');
    if (!validateCPF(documentoDoadorInput.value)) {
        document.getElementById('documentoDoador-error').textContent = 'CPF inválido. Deve ter 11 dígitos numéricos.';
        isValid = false;
    }

    const telefoneDoadorInput = document.getElementById('telefoneDoador');
    if (!validateTelefone(telefoneDoadorInput.value)) {
        document.getElementById('telefoneDoador-error').textContent = 'Telefone inválido. Use 10 ou 11 dígitos numéricos.';
        isValid = false;
    }

    const confirmacaoInput = document.getElementById('confirmacao');
    if (confirmacaoInput && !confirmacaoInput.checked) {
        document.getElementById('confirmacao-error').textContent = 'Confirme os dados para continuar.';
        isValid = false;
    } else if (confirmacaoInput) {
        document.getElementById('confirmacao-error').textContent = '';
    }

    return isValid;
}

function validatePlanoForm() {
    let isValid = true;

    const nomeCompletoInput = document.getElementById('nomeCompleto');
    if (!validateNomeCompletoPagamento(nomeCompletoInput.value)) {
        document.getElementById('nomeCompleto-error').textContent = 'Nome completo deve ter pelo menos 2 palavras e conter apenas letras e espaços.';
        isValid = false;
    }

    const emailCompradorInput = document.getElementById('emailComprador');
    if (!validateEmail(emailCompradorInput.value)) {
        document.getElementById('emailComprador-error').textContent = 'O e-mail deve ser válido.';
        isValid = false;
    }

    const bairroCompradorInput = document.getElementById('bairroComprador');
    if (!validateBairro(bairroCompradorInput.value)) {
        document.getElementById('bairroComprador-error').textContent = 'Bairro deve ter entre 10 e 40 caracteres e conter apenas letras e espaços.';
        isValid = false;
    }

    const ruaCompradorInput = document.getElementById('ruaComprador');
    if (!validateRua(ruaCompradorInput.value)) {
        document.getElementById('ruaComprador-error').textContent = 'Rua deve ter no mínimo 3 caracteres e conter apenas letras, números, espaços e os símbolos .,ºª-.';
        isValid = false;
    }

    const cidadeCompradorInput = document.getElementById('cidadeComprador');
    if (!validateCidade(cidadeCompradorInput.value)) {
        document.getElementById('cidadeComprador-error').textContent = 'Cidade deve ter no mínimo 5 caracteres e conter apenas letras e espaços.';
        isValid = false;
    }

    const estadoCompradorInput = document.getElementById('estadoComprador');
    if (!validateEstado(estadoCompradorInput.value)) {
        document.getElementById('estadoComprador-error').textContent = 'Estado deve ser uma sigla de 2 letras maiúsculas (ex: SP, RJ, BA).';
        isValid = false;
    }

    const documentoCompradorInput = document.getElementById('documentoComprador');
    if (!validateCPF(documentoCompradorInput.value)) {
        document.getElementById('documentoComprador-error').textContent = 'CPF inválido. Deve ter 11 dígitos numéricos.';
        isValid = false;
    }

    const telefoneCompradorInput = document.getElementById('telefoneComprador');
    if (!validateTelefone(telefoneCompradorInput.value)) {
        document.getElementById('telefoneComprador-error').textContent = 'Telefone inválido. Use 10 ou 11 dígitos numéricos.';
        isValid = false;
    }

    const confirmacaoInput = document.getElementById('confirmacao');
    if (confirmacaoInput && !confirmacaoInput.checked) {
        document.getElementById('confirmacao-error').textContent = 'Confirme os dados para continuar.';
        isValid = false;
    } else if (confirmacaoInput) {
        document.getElementById('confirmacao-error').textContent = '';
    }

    return isValid;
}

window.validateEmail = validateEmail;
window.validateNomeCompleto = validateNomeCompleto;
window.validatePassword = validatePassword;
window.validateConfirmPassword = validateConfirmPassword;
window.validateTelefone = validateTelefone;
window.validateCPF = validateCPF;
window.validateCNPJ = validateCNPJ;
window.validateRG = validateRG;
window.validateBairro = validateBairro;
window.validateRua = validateRua;
window.validateCidade = validateCidade;
window.validateEstado = validateEstado;
window.validateNomeCompletoPagamento = validateNomeCompletoPagamento;
window.validateCadastroForm = validateCadastroForm;
window.validateDoacaoForm = validateDoacaoForm;
window.validatePlanoForm = validatePlanoForm;
