function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
    return emailRegex.test(email);
}

function validateNomeCompleto(nome) {
    return nome.trim().length >= 10;
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(password);
}

function validateConfirmPassword(password, confirmPassword) {
    return password === confirmPassword;
}

function validateTelefone(telefone) {
    const telefoneLimpo = telefone.replace(/\D/g, "");
    return telefoneLimpo.length === 11 && /^\d+$/.test(telefoneLimpo);
}

function validateCPF(cpf) {
    cpf = cpf.replace(/[.\-]/g, "");
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}

function validateBairro(bairro) {
    const bairroRegex = /^[A-Za-zÀ-ú\s]{10,40}$/;
    return bairro.trim().length >= 10 && bairro.trim().length <= 40 && bairroRegex.test(bairro);
}

function validateRua(rua) {
    const ruaRegex = /^[A-Za-z0-9À-ú\s.,ºª-]{3,}$/;
    return rua.trim().length >= 3 && ruaRegex.test(rua);
}

function validateCidade(cidade) {
    const cidadeRegex = /^[A-Za-zÀ-ú\s]{5,}$/;
    return cidade.trim().length >= 5 && cidadeRegex.test(cidade);
}

function validateEstado(estado) {
    const estadoRegex = /^[A-Z]{2}$/;
    return estadoRegex.test(estado);
}

function validateNomeCompletoPagamento(nome) {
    const partesNome = nome.trim().split(/\s+/);
    return partesNome.length >= 2 && /^[A-Za-zÀ-ú\s]+$/.test(nome);
}

function validateCadastroForm()  {
    let isValid = true;
    const userTypeInput = document.getElementById("userType");
    const isOngCadastro = userTypeInput && userTypeInput.value === "admin";


    const nameInput = document.getElementById("name");
    if (!validateNomeCompleto(nameInput.value)) {
        document.getElementById("name-error").textContent = "Nome Completo deve ter no mínimo 10 caracteres.";
        nameInput.style.borderColor = "red";
        isValid = false;
    } else {
        nameInput.style.borderColor = "";
    }


    const emailInput = document.getElementById("email");
    if (!validateEmail(emailInput.value)) {
        document.getElementById("email-error").textContent = "O e-mail deve conter @ e .com.";
        emailInput.style.borderColor = "red";
        isValid = false;
    } else if (emailInput.value.trim() !== "") {
        emailInput.style.borderColor = "";
    }


    const passwordInput = document.getElementById("password");
    if (!validatePassword(passwordInput.value)) {
        document.getElementById("password-error").textContent = "A senha deve ter no mínimo 8 caracteres e conter pelo menos uma letra maiúscula, uma minúscula e um número.";
        passwordInput.style.borderColor = "red";
        isValid = false;
    } else {
        passwordInput.style.borderColor = "";
    }


    const confirmPasswordInput = document.getElementById("confirmPassword");
    if (!validateConfirmPassword(passwordInput.value, confirmPasswordInput.value)) {
        document.getElementById("confirmPassword-error").textContent = "A confirmação de senha deve ser idêntica à senha.";
        isValid = false;
        confirmPasswordInput.style.borderColor = "red";
    } else {
        confirmPasswordInput.style.borderColor = "";
    }

    const ongFieldIds = ["ongName", "ongDescription", "ongContact", "ongPhone", "ongAddress"];
    if (isOngCadastro) {
        const OngNameInput = document.getElementById("ongName");
        if (OngNameInput && OngNameInput.value.trim() === "") {
            document.getElementById("ongName-error").textContent = "O nome da ONG é obrigatório.";
            OngNameInput.style.borderColor = "red";
            isValid = false;
        } else if (OngNameInput) {
            OngNameInput.style.borderColor = "";
        }

        const ongDescriptionInput = document.getElementById("ongDescription");
        if (ongDescriptionInput && ongDescriptionInput.value.trim() === "") {
            document.getElementById("ongDescription-error").textContent = "A descrição da ONG é obrigatória.";
            ongDescriptionInput.style.borderColor = "red";
            isValid = false;
        } else if (ongDescriptionInput) {
            ongDescriptionInput.style.borderColor = "";
        }

        const ongContactInput = document.getElementById("ongContact");
        if (!validateEmail(ongContactInput.value)) {
            document.getElementById("ongContact-error").textContent = "O e-mail da ONG deve conter @ e .com.";
            ongContactInput.style.borderColor = "red";
            isValid = false;
        } else if (ongContactInput.value.trim() !== "") {
            ongContactInput.style.borderColor = "";
        }

        const ongPhoneInput = document.getElementById("ongPhone");
        if (ongPhoneInput && ongPhoneInput.value.trim() !== "" && !validateTelefone(ongPhoneInput.value)) {
            document.getElementById("ongPhone-error").textContent = "O telefone da ONG é inválido. Deve ter 11 dígitos numéricos.";
            ongPhoneInput.style.borderColor = "red";
            isValid = false;
        } else {
            if (ongPhoneInput) {
                ongPhoneInput.style.borderColor = "";
            }
        }

        const ongAddressInput = document.getElementById("ongAddress");
        if (ongAddressInput) {
            ongAddressInput.style.borderColor = "";
        }
    } else {
        ongFieldIds.forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            const error = document.getElementById(`${fieldId}-error`);

            if (field) {
                field.style.borderColor = "";
            }

            if (error) {
                error.textContent = "";
            }
        });
    }
    return isValid;
}

function validateDoacaoForm() {
    let isValid = true;


    const nomeCompletoInput = document.getElementById("nomeCompleto");
    if (!validateNomeCompletoPagamento(nomeCompletoInput.value)) {
        document.getElementById("nomeCompleto-error").textContent = "Nome Completo deve ter pelo menos 2 palavras e conter apenas letras e espaços.";
        isValid = false;
    }

    const emailDoadorInput = document.getElementById("emailDoador");
    if (!validateEmail(emailDoadorInput.value)) {
        document.getElementById("emailDoador-error").textContent = "O e-mail deve conter @ e .com.";
        isValid = false;
    }

    const bairroDoadorInput = document.getElementById("bairroDoador");
    if (!validateBairro(bairroDoadorInput.value)) {
        document.getElementById("bairroDoador-error").textContent = "Bairro deve ter entre 10 e 40 caracteres e conter apenas letras e espaços (com acentos).";
        isValid = false;
    }

    const ruaDoadorInput = document.getElementById("ruaDoador");
    if (!validateRua(ruaDoadorInput.value)) {
        document.getElementById("ruaDoador-error").textContent = "Rua deve ter no mínimo 3 caracteres e conter apenas letras, números, espaços e os símbolos .,ºª-.";
        isValid = false;
    }

    const cidadeDoadorInput = document.getElementById("cidadeDoador");
    if (!validateCidade(cidadeDoadorInput.value)) {
        document.getElementById("cidadeDoador-error").textContent = "Cidade deve ter no mínimo 5 caracteres e conter apenas letras e espaços.";
        isValid = false;
    }

    const estadoDoadorInput = document.getElementById("estadoDoador");
    if (!validateEstado(estadoDoadorInput.value)) {
        document.getElementById("estadoDoador-error").textContent = "Estado deve ser uma sigla de 2 letras maiúsculas (ex: SP, RJ, BA).";
        isValid = false;
    }

    const documentoDoadorInput = document.getElementById("documentoDoador");
    if (!validateCPF(documentoDoadorInput.value)) {
        document.getElementById("documentoDoador-error").textContent = "CPF inválido. Deve ter 11 dígitos numéricos.";
        isValid = false;
    }

    const telefoneDoadorInput = document.getElementById("telefoneDoador");
    if (!validateTelefone(telefoneDoadorInput.value)) {
        document.getElementById("telefoneDoador-error").textContent = "Telefone inválido. Deve ter 11 dígitos numéricos.";
        isValid = false;
    }

    return isValid;
}

function validatePlanoForm() {
    let isValid = true;

    const nomeCompletoInput = document.getElementById("nomeCompleto");
    if (!validateNomeCompletoPagamento(nomeCompletoInput.value)) {
        document.getElementById("nomeCompleto-error").textContent = "Nome Completo deve ter pelo menos 2 palavras e conter apenas letras e espaços.";
        isValid = false;
    }

    const emailCompradorInput = document.getElementById("emailComprador");
    if (!validateEmail(emailCompradorInput.value)) {
        document.getElementById("emailComprador-error").textContent = "O e-mail deve conter @ e .com.";
        isValid = false;
    }

    const bairroCompradorInput = document.getElementById("bairroComprador");
    if (!validateBairro(bairroCompradorInput.value)) {
        document.getElementById("bairroComprador-error").textContent = "Bairro deve ter entre 10 e 40 caracteres e conter apenas letras e espaços (com acentos).";
        isValid = false;
    }

    const ruaCompradorInput = document.getElementById("ruaComprador");
    if (!validateRua(ruaCompradorInput.value)) {
        document.getElementById("ruaComprador-error").textContent = "Rua deve ter no mínimo 3 caracteres e conter apenas letras, números, espaços e os símbolos .,ºª-.";
        isValid = false;
    }

    const cidadeCompradorInput = document.getElementById("cidadeComprador");
    if (!validateCidade(cidadeCompradorInput.value)) {
        document.getElementById("cidadeComprador-error").textContent = "Cidade deve ter no mínimo 5 caracteres e conter apenas letras e espaços.";
        isValid = false;
    }

    const estadoCompradorInput = document.getElementById("estadoComprador");
    if (!validateEstado(estadoCompradorInput.value)) {
        document.getElementById("estadoComprador-error").textContent = "Estado deve ser uma sigla de 2 letras maiúsculas (ex: SP, RJ, BA).";
        isValid = false;
    }

    const documentoCompradorInput = document.getElementById("documentoComprador");
    if (!validateCPF(documentoCompradorInput.value)) {
        document.getElementById("documentoComprador-error").textContent = "CPF inválido. Deve ter 11 dígitos numéricos.";
        isValid = false;
    }

    const telefoneCompradorInput = document.getElementById("telefoneComprador");
    if (!validateTelefone(telefoneCompradorInput.value)) {
        document.getElementById("telefoneComprador-error").textContent = "Telefone inválido. Deve ter 11 dígitos numéricos.";
        isValid = false;
    }

    return isValid;
}



