document.addEventListener("DOMContentLoaded", function() {
    const cadastroForm = document.getElementById("cadastroForm");
    const userType = document.getElementById("userType");
    const ongFields = document.getElementById("ongFields");
    const ongFieldIds = ["ongName", "ongDescription", "ongContact", "ongCnpj", "ongRg", "ongPhone", "ongAddress"];
    const requiredOngFields = ["ongName", "ongDescription", "ongContact", "ongCnpj", "ongRg"];

    const clearError = (fieldId) => {
        const error = document.getElementById(`${fieldId}-error`);
        const field = document.getElementById(fieldId);

        if (error) {
            error.textContent = "";
        }

        if (field) {
            field.style.borderColor = "";
        }
    };

    const setError = (fieldId, message) => {
        const error = document.getElementById(`${fieldId}-error`);
        const field = document.getElementById(fieldId);

        if (error) {
            error.textContent = message;
        }

        if (field) {
            field.style.borderColor = "red";
        }
    };

    const isOngCadastro = () => userType && userType.value === "ong";

    const validateField = (fieldId) => {
        const field = document.getElementById(fieldId);
        if (!field) {
            return true;
        }

        if (!isOngCadastro() && ongFieldIds.includes(fieldId)) {
            clearError(fieldId);
            return true;
        }

        const value = field.value || "";
        let isValid = true;

        switch (fieldId) {
            case "name":
                isValid = validateNomeCompleto(value);
                if (!isValid) {
                    setError(fieldId, "Nome Completo deve ter no mínimo 10 caracteres.");
                }
                break;
            case "email":
                isValid = validateEmail(value);
                if (!isValid) {
                    setError(fieldId, "O e-mail deve ser válido.");
                }
                break;
            case "password":
                isValid = validatePassword(value);
                if (!isValid) {
                    setError(fieldId, "A senha deve ter no mínimo 8 caracteres e conter pelo menos uma letra maiúscula, uma minúscula e um número.");
                }
                break;
            case "confirmPassword":
                isValid = validateConfirmPassword(document.getElementById("password").value, value);
                if (!isValid) {
                    setError(fieldId, "A confirmação de senha deve ser idêntica à senha.");
                }
                break;
            case "ongName":
                isValid = value.trim().length >= 3;
                if (!isValid) {
                    setError(fieldId, "O nome da ONG é obrigatório.");
                }
                break;
            case "ongDescription":
                isValid = value.trim().length >= 10;
                if (!isValid) {
                    setError(fieldId, "A descrição da ONG é obrigatória.");
                }
                break;
            case "ongContact":
                isValid = validateEmail(value);
                if (!isValid) {
                    setError(fieldId, "O e-mail da ONG deve ser válido.");
                }
                break;
            case "ongCnpj":
                isValid = validateCNPJ(value);
                if (!isValid) {
                    setError(fieldId, "O CNPJ da ONG é inválido.");
                }
                break;
            case "ongRg":
                isValid = validateRG(value);
                if (!isValid) {
                    setError(fieldId, "O RG do responsável é inválido.");
                }
                break;
            case "ongPhone":
                isValid = value.trim() === "" || validateTelefone(value);
                if (!isValid) {
                    setError(fieldId, "O telefone da ONG é inválido. Use 10 ou 11 dígitos numéricos.");
                }
                break;
            default:
                clearError(fieldId);
                break;
        }

        if (isValid) {
            clearError(fieldId);
        }

        return isValid;
    };

    const validateCadastroForm = () => {
        let isValid = true;

        ["name", "email", "password", "confirmPassword"].forEach((fieldId) => {
            if (!validateField(fieldId)) {
                isValid = false;
            }
        });

        if (isOngCadastro()) {
            requiredOngFields.forEach((fieldId) => {
                if (!validateField(fieldId)) {
                    isValid = false;
                }
            });

            if (!validateField("ongPhone")) {
                isValid = false;
            }
        }

        return isValid;
    };

    window.toggleOngFields = function() {
        const showFields = isOngCadastro();
        ongFields.hidden = !showFields;

        ongFieldIds.forEach((fieldId) => {
            const field = document.getElementById(fieldId);
            if (!field) {
                return;
            }

            if (showFields && requiredOngFields.includes(fieldId)) {
                field.setAttribute("required", "required");
            } else {
                field.removeAttribute("required");
            }

            if (!showFields) {
                clearError(fieldId);
            }
        });
    };

    cadastroForm.addEventListener("submit", function(event) {
        event.preventDefault();

        if (window.submitOnce && window.submitOnce.isLocked(cadastroForm)) {
            return;
        }

        document.querySelectorAll(".error-message").forEach((error) => {
            error.textContent = "";
        });

        if (validateCadastroForm()) {
            if (window.submitOnce) {
                window.submitOnce.lock(cadastroForm);
            }

            HTMLFormElement.prototype.submit.call(cadastroForm);
        }
    });

    ["name", "email", "password", "confirmPassword", "ongName", "ongDescription", "ongContact", "ongCnpj", "ongRg", "ongPhone"].forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        if (!field) {
            return;
        }

        field.addEventListener("blur", () => validateField(fieldId));
        field.addEventListener("input", () => {
            clearError(fieldId);

            if (fieldId === "password") {
                validateField("confirmPassword");
            }

            if (fieldId === "confirmPassword" && document.getElementById("password").value) {
                validateField("confirmPassword");
            }
        });
    });

    userType.addEventListener("change", () => {
        toggleOngFields();
    });

    toggleOngFields();
});
