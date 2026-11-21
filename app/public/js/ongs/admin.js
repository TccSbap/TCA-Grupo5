(() => {
const initializeOngAdminTabs = () => {
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    if (!tabButtons.length || Array.from(tabButtons).every((button) => button.dataset.turboInitialized === 'true')) return;

    const showTab = (tabName, button) => {
        document.querySelectorAll('.tab-content').forEach((tab) => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.tab-btn').forEach((tabButton) => {
            tabButton.classList.remove('active');
        });

        const tab = document.getElementById(`${tabName}-tab`);
        if (tab) {
            tab.classList.add('active');
        }

        if (button) {
            button.classList.add('active');
        }
    };

    tabButtons.forEach((button) => {
        if (button.dataset.turboInitialized === 'true') return;
        button.dataset.turboInitialized = 'true';
        button.addEventListener('click', () => {
            showTab(button.dataset.tabTarget, button);
        });
    });
};

if (!window.__aguaOngAdminTabsTurboListener) {
    window.__aguaOngAdminTabsTurboListener = true;
    document.addEventListener('turbo:load', initializeOngAdminTabs);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOngAdminTabs, { once: true });
} else {
    initializeOngAdminTabs();
}
})();
