(function () {
    const data = window.__ADMIN_ANALYTICS__;

    if (!data || typeof Chart === 'undefined') {
        return;
    }

    const colors = {
        blue: '#2563eb',
        blueLight: 'rgba(37, 99, 235, 0.16)',
        green: '#10b981',
        greenLight: 'rgba(16, 185, 129, 0.16)',
        amber: '#f59e0b',
        amberLight: 'rgba(245, 158, 11, 0.16)',
        indigo: '#6366f1',
        indigoLight: 'rgba(99, 102, 241, 0.16)',
        red: '#ef4444',
        redLight: 'rgba(239, 68, 68, 0.16)',
        slate: '#64748b'
    };

    Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue('--font-family').trim() || 'Inter, sans-serif';

    const makeCanvas = (id) => document.getElementById(id);
    const destroyIfExists = (chart) => {
        if (chart) {
            chart.destroy();
        }
    };

    const statusCanvas = makeCanvas('adminStatusChart');
    if (statusCanvas) {
        new Chart(statusCanvas, {
            type: 'doughnut',
            data: {
                labels: data.statusCounts.map((item) => item.label),
                datasets: [{
                    data: data.statusCounts.map((item) => item.value),
                    backgroundColor: [colors.amber, colors.blue, colors.green],
                    borderColor: '#fff',
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '66%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    const categoryCanvas = makeCanvas('adminCategoryChart');
    if (categoryCanvas) {
        new Chart(categoryCanvas, {
            type: 'bar',
            data: {
                labels: data.category.labels,
                datasets: [{
                    label: 'Denúncias',
                    data: data.category.values,
                    backgroundColor: [colors.blue, colors.green, colors.amber, colors.slate],
                    borderRadius: 10,
                    borderSkipped: false
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

    const responsesCanvas = makeCanvas('adminResponsesChart');
    if (responsesCanvas) {
        new Chart(responsesCanvas, {
            type: 'bar',
            data: {
                labels: data.responsesByOng.labels,
                datasets: [{
                    label: 'Respostas',
                    data: data.responsesByOng.values,
                    backgroundColor: colors.blueLight,
                    borderColor: colors.blue,
                    borderWidth: 1,
                    borderRadius: 10,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    }

    const monthlyCanvas = makeCanvas('adminMonthlyActivityChart');
    if (monthlyCanvas) {
        new Chart(monthlyCanvas, {
            type: 'bar',
            data: {
                labels: data.monthlyActivity.labels,
                datasets: data.monthlyActivity.datasets.map((dataset, index) => ({
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: dataset.backgroundColor || [colors.blue, colors.green, colors.amber][index % 3],
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
                    x: {
                        stacked: false,
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

    const timelineCanvas = makeCanvas('adminTimelineChart');
    let timelineChart = null;

    const renderTimeline = (period) => {
        const timelineData = data.timeline[period] || data.timeline.month || { labels: [], values: [] };
        destroyIfExists(timelineChart);
        timelineChart = new Chart(timelineCanvas, {
            type: 'line',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'Denúncias',
                    data: timelineData.values,
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
    };

    if (timelineCanvas) {
        renderTimeline('day');

        document.querySelectorAll('[data-admin-timeline]').forEach((button) => {
            button.addEventListener('click', () => {
                const period = button.getAttribute('data-admin-timeline');

                document.querySelectorAll('[data-admin-timeline]').forEach((item) => {
                    item.classList.toggle('is-active', item === button);
                });

                renderTimeline(period);
            });
        });
    }
}());
