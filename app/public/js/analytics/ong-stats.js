(function () {
    const payload = window.__ONG_STATS_ANALYTICS__;

    if (!payload || typeof Chart === 'undefined') {
        return;
    }

    const { analytics, stats } = payload;
    const colors = {
        blue: '#2563eb',
        blueLight: 'rgba(37, 99, 235, 0.16)',
        green: '#10b981',
        amber: '#f59e0b',
        gray: '#64748b'
    };

    Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'Inter, sans-serif';

    const pendingCanvas = document.getElementById('ongPendingByCategoryChart');
    if (pendingCanvas) {
        new Chart(pendingCanvas, {
            type: 'bar',
            data: {
                labels: analytics.pendingByCategory.labels,
                datasets: [{
                    label: 'Pendências',
                    data: analytics.pendingByCategory.values,
                    backgroundColor: [colors.blue, colors.green, colors.amber, colors.gray],
                    borderRadius: 10,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    }

    const responsesCanvas = document.getElementById('ongResponsesVolumeChart');
    if (responsesCanvas) {
        new Chart(responsesCanvas, {
            type: 'line',
            data: {
                labels: analytics.responsesByMonth.labels,
                datasets: [{
                    label: 'Respostas',
                    data: analytics.responsesByMonth.values,
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
                    legend: { display: false }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    }
}());
