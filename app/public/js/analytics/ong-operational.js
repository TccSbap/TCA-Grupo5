(function () {
    const data = window.__ONG_ANALYTICS__;

    if (!data || typeof Chart === 'undefined') {
        return;
    }

    const colors = {
        blue: '#2563eb',
        blueLight: 'rgba(37, 99, 235, 0.16)',
        green: '#10b981',
        amber: '#f59e0b',
        red: '#ef4444',
        gray: '#64748b'
    };

    Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'Inter, sans-serif';

    const resolutionCanvas = document.getElementById('ongResolutionChart');
    if (resolutionCanvas) {
        new Chart(resolutionCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Em aberto', 'Resolvidos'],
                datasets: [{
                    data: [data.openCases.length, data.resolvedCases.length],
                    backgroundColor: [colors.amber, colors.green],
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    const responsesCanvas = document.getElementById('ongResponsesChart');
    if (responsesCanvas) {
        new Chart(responsesCanvas, {
            type: 'line',
            data: {
                labels: data.responsesByMonth.labels,
                datasets: [{
                    label: 'Respostas',
                    data: data.responsesByMonth.values,
                    borderColor: colors.blue,
                    backgroundColor: colors.blueLight,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    }

    const filter = document.getElementById('pendingCategoryFilter');
    const items = Array.from(document.querySelectorAll('[data-pending-item]'));
    const visibleCount = document.getElementById('pendingVisibleCount');

    const applyFilter = () => {
        const value = filter ? filter.value : 'all';
        let count = 0;

        items.forEach((item) => {
            const category = item.getAttribute('data-category');
            const isVisible = value === 'all' || value === category;
            item.dataset.hidden = isVisible ? 'false' : 'true';

            if (isVisible) {
                count += 1;
            }
        });

        if (visibleCount) {
            visibleCount.textContent = `${count} denúncia(s) visível(is)`;
        }
    };

    if (filter) {
        filter.addEventListener('change', applyFilter);
        applyFilter();
    }
}());
