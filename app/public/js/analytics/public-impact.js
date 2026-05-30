(function () {
    const payload = window.__PUBLIC_IMPACT__;

    if (!payload || typeof Chart === 'undefined') {
        return;
    }

    const { impacto } = payload;
    const colors = {
        blue: '#2563eb',
        green: '#10b981',
        amber: '#f59e0b',
        indigo: '#6366f1',
        blueLight: 'rgba(37, 99, 235, 0.16)'
    };

    Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'Inter, sans-serif';

    const monthlyCanvas = document.getElementById('impactMonthlyChart');
    if (monthlyCanvas) {
        new Chart(monthlyCanvas, {
            type: 'bar',
            data: {
                labels: impacto.monthlyActivity.labels,
                datasets: impacto.monthlyActivity.datasets.map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: dataset.backgroundColor || [colors.blue, colors.green, colors.amber, colors.indigo][index % 4],
                    borderRadius: 10,
                    borderSkipped: false
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    }

    const distributionCanvas = document.getElementById('impactDistributionChart');
    if (distributionCanvas) {
        new Chart(distributionCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Casos abertos', 'Casos respondidos', 'Casos resolvidos'],
                datasets: [{
                    data: [
                        impacto.casesOpenedThisMonth,
                        impacto.casesResponded,
                        impacto.casesResolved
                    ],
                    backgroundColor: [colors.amber, colors.blue, colors.green],
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
}());
