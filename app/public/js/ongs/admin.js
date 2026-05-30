document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('[data-tab-target]');

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
        button.addEventListener('click', () => {
            showTab(button.dataset.tabTarget, button);
        });
    });
});
