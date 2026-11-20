// Funcionalidades JavaScript para o site ODS 6

window.submitOnce = window.submitOnce || (() => {
    const SUBMIT_SELECTOR = 'button[type="submit"], input[type="submit"]';

    const getSubmitControls = (form) => Array.from(form.querySelectorAll(SUBMIT_SELECTOR));

    const lock = (form) => {
        if (!form || form.dataset.submitLocked === 'true') {
            return false;
        }

        form.dataset.submitLocked = 'true';
        form.classList.add('is-submitting');
        form.setAttribute('aria-busy', 'true');

        getSubmitControls(form).forEach((control) => {
            if (typeof control.dataset.submitOnceOriginalDisabled === 'undefined') {
                control.dataset.submitOnceOriginalDisabled = control.disabled ? 'true' : 'false';
            }

            control.disabled = true;
            control.setAttribute('aria-disabled', 'true');
        });

        return true;
    };

    const unlock = (form) => {
        if (!form || form.dataset.submitLocked !== 'true') {
            return false;
        }

        delete form.dataset.submitLocked;
        form.classList.remove('is-submitting');
        form.removeAttribute('aria-busy');

        getSubmitControls(form).forEach((control) => {
            const wasDisabled = control.dataset.submitOnceOriginalDisabled === 'true';
            control.disabled = wasDisabled;
            control.removeAttribute('aria-disabled');
            delete control.dataset.submitOnceOriginalDisabled;
        });

        return true;
    };

    const isLocked = (form) => Boolean(form && form.dataset.submitLocked === 'true');

    return { lock, unlock, isLocked };
})();

const updatePasswordToggleState = (button, input) => {
    const isVisible = input.type === 'text';
    const icon = button.querySelector('i');

    button.setAttribute('aria-label', isVisible ? 'Ocultar senha' : 'Mostrar senha');
    button.setAttribute('aria-pressed', String(isVisible));

    if (icon) {
        icon.classList.toggle('fa-eye', !isVisible);
        icon.classList.toggle('fa-eye-slash', isVisible);
    }
};

const initPasswordToggles = () => {
    document.querySelectorAll('[data-password-toggle]').forEach((button) => {
        const targetId = button.getAttribute('data-password-toggle');
        const input = document.getElementById(targetId);

        if (!input) {
            return;
        }

        updatePasswordToggleState(button, input);

        button.addEventListener('click', () => {
            input.type = input.type === 'password' ? 'text' : 'password';
            updatePasswordToggleState(button, input);
            input.focus();
        });
    });
};

const initAccessibilityWidget = () => {
    const widget = document.querySelector('[data-accessibility-widget]');

    if (!widget) {
        return;
    }

    const trigger = widget.querySelector('[data-accessibility-toggle]');
    const panel = widget.querySelector('.accessibility-panel');
    const closeButton = widget.querySelector('[data-accessibility-close]');
    const panelTitle = widget.querySelector('#accessibility-panel-title');
    const themeSelect = widget.querySelector('[data-accessibility-theme]');
    const scaleOutput = widget.querySelector('[data-accessibility-scale-value]');
    const storageKey = 'agua-consciente:accessibility-preferences:v1';
    const defaults = {
        theme: 'system',
        textScale: 100,
        bold: false,
        highlightLinks: false,
        spacedText: false,
        reducedMotion: false
    };
    const supportedThemes = ['system', 'light', 'dark', 'contrast'];
    let settings = { ...defaults };

    try {
        const storedSettings = JSON.parse(window.localStorage.getItem(storageKey) || 'null');

        if (storedSettings && typeof storedSettings === 'object') {
            settings = {
                ...settings,
                ...storedSettings,
                theme: supportedThemes.includes(storedSettings.theme) ? storedSettings.theme : defaults.theme,
                textScale: Number.isFinite(Number(storedSettings.textScale))
                    ? Math.min(150, Math.max(80, Number(storedSettings.textScale)))
                    : defaults.textScale
            };

            ['bold', 'highlightLinks', 'spacedText', 'reducedMotion'].forEach((key) => {
                settings[key] = storedSettings[key] === true;
            });
        }
    } catch (error) {
        // O widget continua funcionando mesmo se o navegador bloquear o armazenamento local.
    }

    const resolveTheme = () => {
        if (settings.theme !== 'system') {
            return settings.theme;
        }

        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    };

    const syncControls = () => {
        if (themeSelect) {
            themeSelect.value = settings.theme;
        }

        if (scaleOutput) {
            scaleOutput.value = `${settings.textScale}%`;
            scaleOutput.textContent = `${settings.textScale}%`;
        }

        widget.querySelectorAll('[data-accessibility-setting]').forEach((button) => {
            const key = button.dataset.accessibilitySetting;
            button.setAttribute('aria-pressed', String(settings[key] === true));
        });
    };

    const applySettings = () => {
        const root = document.documentElement;
        root.dataset.accessibilityTheme = settings.theme;
        root.dataset.accessibilityEffectiveTheme = resolveTheme();
        root.style.setProperty('--accessibility-text-scale', `${settings.textScale}%`);
        root.dataset.accessibilityBold = String(settings.bold);
        root.dataset.accessibilityHighlightLinks = String(settings.highlightLinks);
        root.dataset.accessibilitySpacedText = String(settings.spacedText);
        root.dataset.accessibilityReducedMotion = String(settings.reducedMotion);
        syncControls();
    };

    const saveSettings = () => {
        applySettings();

        try {
            window.localStorage.setItem(storageKey, JSON.stringify(settings));
        } catch (error) {
            // Preferências são aplicadas à página mesmo quando não podem ser persistidas.
        }
    };

    const setPanelOpen = (isOpen, restoreFocus = false) => {
        panel.hidden = !isOpen;
        trigger.setAttribute('aria-expanded', String(isOpen));
        trigger.setAttribute('aria-label', isOpen ? 'Fechar opções de acessibilidade' : 'Abrir opções de acessibilidade');

        if (isOpen && panelTitle) {
            panelTitle.focus();
        } else if (restoreFocus) {
            trigger.focus();
        }
    };

    trigger.addEventListener('click', () => {
        setPanelOpen(trigger.getAttribute('aria-expanded') !== 'true');
    });

    closeButton.addEventListener('click', () => setPanelOpen(false, true));

    document.addEventListener('click', (event) => {
        if (trigger.getAttribute('aria-expanded') === 'true' && !widget.contains(event.target)) {
            setPanelOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
            setPanelOpen(false, true);
        }
    });

    themeSelect.addEventListener('change', () => {
        settings.theme = supportedThemes.includes(themeSelect.value) ? themeSelect.value : defaults.theme;
        saveSettings();
    });

    widget.querySelectorAll('[data-accessibility-scale]').forEach((button) => {
        button.addEventListener('click', () => {
            const change = Number(button.dataset.accessibilityScale) || 0;
            settings.textScale = Math.min(150, Math.max(80, settings.textScale + change));
            saveSettings();
        });
    });

    widget.querySelectorAll('[data-accessibility-setting]').forEach((button) => {
        button.addEventListener('click', () => {
            const key = button.dataset.accessibilitySetting;
            settings[key] = !settings[key];
            saveSettings();
        });
    });

    widget.querySelector('[data-accessibility-reset]').addEventListener('click', () => {
        settings = { ...defaults };
        saveSettings();
    });

    if (window.matchMedia) {
        const colorPreference = window.matchMedia('(prefers-color-scheme: dark)');
        const updateSystemTheme = () => {
            if (settings.theme === 'system') {
                applySettings();
            }
        };

        if (typeof colorPreference.addEventListener === 'function') {
            colorPreference.addEventListener('change', updateSystemTheme);
        } else if (typeof colorPreference.addListener === 'function') {
            colorPreference.addListener(updateSystemTheme);
        }
    }

    applySettings();
};

const initAiAssistantWidget = () => {
    const widget = document.querySelector('[data-ai-assistant]');
    if (!widget) return;

    const trigger = widget.querySelector('[data-ai-assistant-toggle]');
    const panel = widget.querySelector('.ai-assistant-panel');
    const closeButton = widget.querySelector('[data-ai-assistant-close]');
    const title = widget.querySelector('#ai-assistant-title');
    const enabled = widget.dataset.enabled === 'true';
    const form = widget.querySelector('[data-ai-assistant-form]');
    const messages = widget.querySelector('[data-ai-assistant-messages]');
    const csrfInput = widget.querySelector('[data-ai-assistant-csrf]');

    const setOpen = (isOpen, restoreFocus = false) => {
        panel.hidden = !isOpen;
        trigger.setAttribute('aria-expanded', String(isOpen));
        trigger.setAttribute('aria-label', isOpen ? 'Fechar assistente de inteligência artificial' : 'Abrir assistente de inteligência artificial');

        if (isOpen && enabled) {
            widget.querySelector('textarea')?.focus();
        } else if (isOpen) {
            title?.focus();
        } else if (restoreFocus) {
            trigger.focus();
        }
    };

    const addMessage = (text, type = 'assistant') => {
        const message = document.createElement('p');
        message.className = `ai-assistant-message${type === 'user' ? ' ai-assistant-message--user' : ''}${type === 'error' ? ' ai-assistant-message--error' : ''}`;
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    };

    trigger.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'));
    closeButton?.addEventListener('click', () => setOpen(false, true));

    document.addEventListener('click', (event) => {
        if (trigger.getAttribute('aria-expanded') === 'true' && !widget.contains(event.target)) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
            setOpen(false, true);
        }
    });

    if (!enabled || !form || !messages || !csrfInput) return;

    const hasLikelyPersonalData = (text) => {
        const digits = text.replace(/\D/g, '');
        const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(text)
            || digits.length === 11
            || digits.length === 14
            || /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4})[-.\s]?\d{4}\b/.test(text)
            || /\b(meu nome e|me chamo|meu cpf|meu cnpj|meu telefone|meu endereco|minha senha|numero do cartao)\b/.test(normalized)
            || /\b(minha|minhas|meu|meus)\s+(denuncia|denuncias|doacao|doacoes|cadastro|pagamento)\b/.test(normalized)
            || /\b(acompanhar|consultar|ver|status)\s+(?:(?:a|o|da|do|de|meu|minha)\s+)?denuncia\b/.test(normalized)
            || /\bdenuncia\s*(?:#|n(?:umero)?\.?\s*)\d+\b/.test(normalized)
            || /\b(rua|avenida|av\.?|travessa|alameda|estrada|rodovia)\s+[\p{L}\d .'-]{2,50},?\s+(?:n(?:umero)?\.?\s*)?\d{1,6}\b/iu.test(text);
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const textarea = form.querySelector('textarea[name="message"]');
        const submitButton = form.querySelector('button[type="submit"]');
        const question = textarea.value.trim();

        if (!question || question.length > 500) {
            textarea.setCustomValidity('Escreva uma pergunta de até 500 caracteres.');
            textarea.reportValidity();
            textarea.setCustomValidity('');
            return;
        }

        if (hasLikelyPersonalData(question)) {
            addMessage('Não envie informações pessoais. Remova nome, endereço, e-mail, telefone, documento ou dado de pagamento e tente com uma pergunta geral sobre o site.', 'error');
            textarea.focus();
            return;
        }

        addMessage(question, 'user');
        textarea.value = '';
        textarea.disabled = true;
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando…';
        const pendingMessage = addMessage('Consultando as informações públicas do site…');
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 25000);

        try {
            const response = await fetch('/api/assistant/chat', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfInput.value
                },
                body: JSON.stringify({ message: question }),
                signal: controller.signal
            });
            const payload = await response.json();
            if (typeof payload.csrfToken === 'string') csrfInput.value = payload.csrfToken;
            pendingMessage.remove();

            if (!response.ok) {
                addMessage(payload.error || 'Não consegui responder agora. Tente novamente.', 'error');
                return;
            }

            addMessage(payload.answer || 'Não encontrei uma resposta para essa pergunta.');
            if (Array.isArray(payload.links) && payload.links.length) {
                const linksContainer = document.createElement('div');
                linksContainer.className = 'ai-assistant-message-links';
                payload.links.forEach((link) => {
                    if (!link || typeof link.label !== 'string' || typeof link.href !== 'string') return;
                    const target = new URL(link.href, window.location.origin);
                    if (target.origin !== window.location.origin) return;
                    const anchor = document.createElement('a');
                    anchor.href = `${target.pathname}${target.search}${target.hash}`;
                    anchor.textContent = link.label;
                    linksContainer.appendChild(anchor);
                });
                if (linksContainer.childElementCount) messages.appendChild(linksContainer);
            }
            messages.scrollTop = messages.scrollHeight;
        } catch (error) {
            pendingMessage.remove();
            addMessage(error.name === 'AbortError'
                ? 'A resposta demorou demais. Tente novamente.'
                : 'Não consegui conectar ao assistente agora. Tente novamente ou consulte a página de contato.', 'error');
        } finally {
            window.clearTimeout(timeoutId);
            textarea.disabled = false;
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar';
            textarea.focus();
        }
    });
};

window.addEventListener('pageshow', function(event) {
    if (!event.persisted) {
        return;
    }

    document.querySelectorAll('form[data-submit-locked="true"]').forEach((form) => {
        window.submitOnce.unlock(form);
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Menu mobile toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        const updateMenuState = (isOpen) => {
            navMenu.classList.toggle('active', isOpen);
            mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
            mobileMenuToggle.setAttribute(
                'aria-label',
                isOpen ? 'Fechar menu principal' : 'Abrir menu principal'
            );
        };

        mobileMenuToggle.addEventListener('click', function() {
            updateMenuState(!navMenu.classList.contains('active'));
        });

        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                updateMenuState(false);
            });
        });

        document.addEventListener('click', function(event) {
            const isClickInsideMenu = navMenu.contains(event.target) || mobileMenuToggle.contains(event.target);

            if (navMenu.classList.contains('active') && !isClickInsideMenu) {
                updateMenuState(false);
            }
        });

        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                updateMenuState(false);
            }
        });

        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                updateMenuState(false);
            }
        });
    }

    const bottomNavigationToggle = document.querySelector('[data-bottom-navigation-toggle]');
    const bottomNavigationMenu = document.getElementById('bottom-navigation-menu');

    if (bottomNavigationToggle && bottomNavigationMenu) {
        const setBottomNavigationMenuOpen = (isOpen, returnFocus = false) => {
            bottomNavigationToggle.setAttribute('aria-expanded', String(isOpen));
            bottomNavigationMenu.hidden = !isOpen;

            if (returnFocus) {
                bottomNavigationToggle.focus();
            }
        };

        bottomNavigationToggle.addEventListener('click', () => {
            const isOpen = bottomNavigationToggle.getAttribute('aria-expanded') === 'true';
            setBottomNavigationMenuOpen(!isOpen);
        });

        document.addEventListener('click', (event) => {
            if (!bottomNavigationMenu.contains(event.target) && !bottomNavigationToggle.contains(event.target)) {
                setBottomNavigationMenuOpen(false);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && bottomNavigationToggle.getAttribute('aria-expanded') === 'true') {
                setBottomNavigationMenuOpen(false, true);
            }
        });
    }

    initPasswordToggles();
    initAccessibilityWidget();
    initAiAssistantWidget();
    
    // Smooth scroll para links internos
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                if (targetElement.id === 'main-content') {
                    targetElement.focus({ preventScroll: true });
                }

                targetElement.scrollIntoView({
                    behavior: document.documentElement.dataset.accessibilityReducedMotion === 'true' ? 'auto' : 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Auto-hide alerts após 5 segundos
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    });
    
    // Validação de formulários
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitLockMode = (form.dataset.submitLockMode || 'auto').toLowerCase();
            const isPostForm = (form.getAttribute('method') || 'get').toUpperCase() === 'POST';

            if (submitLockMode === 'manual' || !isPostForm) {
                return;
            }

            if (window.submitOnce.isLocked(form)) {
                e.preventDefault();
                return;
            }

            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    
                    // Remove error class após correção
                    field.addEventListener('input', function() {
                        this.classList.remove('error');
                    });
                }
            });
            
            // Validação específica para senhas
            const password = form.querySelector('#password');
            const confirmPassword = form.querySelector('#confirmPassword');
            
            if (password && confirmPassword) {
                if (password.value !== confirmPassword.value) {
                    isValid = false;
                    confirmPassword.classList.add('error');
                    
                    // Mostrar mensagem de erro
                    let errorMsg = confirmPassword.parentNode.querySelector('.error-message');
                    if (!errorMsg) {
                        errorMsg = document.createElement('small');
                        errorMsg.className = 'error-message';
                        errorMsg.style.color = 'var(--error)';
                        confirmPassword.parentNode.appendChild(errorMsg);
                    }
                    errorMsg.textContent = 'As senhas não coincidem';
                    
                    confirmPassword.addEventListener('input', function() {
                        this.classList.remove('error');
                        const errorMsg = this.parentNode.querySelector('.error-message');
                        if (errorMsg) {
                            errorMsg.remove();
                        }
                    });
                }
            }
            
            if (!isValid) {
                window.submitOnce.unlock(form);
                e.preventDefault();
                return;
            }

            window.submitOnce.lock(form);
        });
    });
    
    // Animações de entrada para cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Aplicar animação aos cards
    const cards = document.querySelectorAll(".denuncia-card, .ong-card");
    cards.forEach((card, index) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px)";
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    
    // Filtros de denúncias
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Remove active class de todos os botões
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adiciona active class ao botão clicado
            this.classList.add('active');
        });
    });
    
    // Confirmação antes de ações importantes
    const dangerActions = document.querySelectorAll('[data-confirm]');
    dangerActions.forEach(action => {
        action.addEventListener('click', function(e) {
            const message = this.getAttribute('data-confirm');
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });
    
    // Tooltip simples
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.cssText = `
                position: absolute;
                background: var(--gray-800);
                color: var(--white);
                padding: var(--spacing-2) var(--spacing-3);
                border-radius: var(--border-radius);
                font-size: var(--font-size-sm);
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            
            setTimeout(() => tooltip.style.opacity = '1', 10);
            
            this.addEventListener('mouseleave', function() {
                tooltip.remove();
            }, { once: true });
        });
    });
    
    // Lazy loading para imagens
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
});

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    const icon = document.createElement('i');
    const iconClass = type === 'success'
        ? 'check-circle'
        : type === 'error'
            ? 'exclamation-circle'
            : 'info-circle';
    icon.className = `fas fa-${iconClass}`;

    const text = document.createElement('span');
    text.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.type = 'button';
    closeButton.textContent = '×';

    notification.append(icon, text, closeButton);
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--white);
        border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'primary-blue'});
        padding: var(--spacing-4);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: var(--spacing-3);
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Botão de fechar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Função para formatar datas
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Função para formatar números
function formatNumber(number) {
    return number.toLocaleString('pt-BR');
}

// Exportar funções para uso global
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatNumber = formatNumber;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
            console.error('Falha ao registrar o service worker:', error);
        });
    });
}
