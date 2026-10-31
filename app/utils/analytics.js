const MONTH_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const toValidDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const pad2 = (value) => String(value).padStart(2, '0');

const cloneUtcDate = (date) => new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
));

const getStartOfWeekUtc = (date) => {
    const start = cloneUtcDate(date);
    const day = start.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + diff);
    return start;
};

const getStartOfMonthUtc = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const formatDayLabel = (date) => `${pad2(date.getUTCDate())}/${pad2(date.getUTCMonth() + 1)}/${String(date.getUTCFullYear()).slice(-2)}`;

const formatMonthLabel = (date) => `${MONTH_ABBR[date.getUTCMonth()]}/${String(date.getUTCFullYear()).slice(-2)}`;

const formatPeriodLabel = (date, granularity) => {
    if (granularity === 'day' || granularity === 'week') {
        return formatDayLabel(date);
    }

    return formatMonthLabel(date);
};

const getPeriodStart = (date, granularity) => {
    if (granularity === 'day') {
        return cloneUtcDate(date);
    }

    if (granularity === 'week') {
        return getStartOfWeekUtc(date);
    }

    return getStartOfMonthUtc(date);
};

const advancePeriod = (date, granularity) => {
    const next = new Date(date.getTime());

    if (granularity === 'day') {
        next.setUTCDate(next.getUTCDate() + 1);
        return next;
    }

    if (granularity === 'week') {
        next.setUTCDate(next.getUTCDate() + 7);
        return next;
    }

    next.setUTCMonth(next.getUTCMonth() + 1);
    return next;
};

const getPeriodKey = (date, granularity) => {
    const start = getPeriodStart(date, granularity);
    return `${start.getUTCFullYear()}-${pad2(start.getUTCMonth() + 1)}-${pad2(start.getUTCDate())}`;
};

const buildPeriodSeries = (items, granularity, getDateValue = (item) => item.createdAt) => {
    const dates = (Array.isArray(items) ? items : [])
        .map((item) => toValidDate(getDateValue(item)))
        .filter(Boolean)
        .sort((a, b) => a - b);

    if (dates.length === 0) {
        return { labels: [], values: [] };
    }

    const counts = new Map();
    dates.forEach((date) => {
        const key = getPeriodKey(date, granularity);
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    const labels = [];
    const values = [];
    let cursor = getPeriodStart(dates[0], granularity);
    const end = getPeriodStart(dates[dates.length - 1], granularity);

    while (cursor <= end) {
        const key = getPeriodKey(cursor, granularity);
        labels.push(formatPeriodLabel(cursor, granularity));
        values.push(counts.get(key) || 0);
        cursor = advancePeriod(cursor, granularity);
    }

    return { labels, values };
};

const buildMonthlySeries = (items, getDateValue = (item) => item.createdAt) => {
    const dates = (Array.isArray(items) ? items : [])
        .map((item) => toValidDate(getDateValue(item)))
        .filter(Boolean)
        .sort((a, b) => a - b);

    if (dates.length === 0) {
        return { labels: [], values: [] };
    }

    const counts = new Map();
    dates.forEach((date) => {
        const key = `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    const labels = [];
    const values = [];
    let cursor = getStartOfMonthUtc(dates[0]);
    const end = getStartOfMonthUtc(dates[dates.length - 1]);

    while (cursor <= end) {
        const key = `${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}`;
        labels.push(formatMonthLabel(cursor));
        values.push(counts.get(key) || 0);
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }

    return { labels, values };
};

const groupByCategory = (denuncias) => {
    const counts = {
        agua: 0,
        esgoto: 0,
        poluicao: 0,
        outros: 0
    };

    (Array.isArray(denuncias) ? denuncias : []).forEach((denuncia) => {
        const category = String(denuncia.category || '').toLowerCase();

        if (counts[category] !== undefined) {
            counts[category] += 1;
            return;
        }

        counts.outros += 1;
    });

    return {
        labels: ['Água', 'Esgoto', 'Poluição', 'Outros'],
        values: [counts.agua, counts.esgoto, counts.poluicao, counts.outros]
    };
};

const calculateResolutionSummary = (denuncias) => {
    const total = Array.isArray(denuncias) ? denuncias.length : 0;
    const resolved = (Array.isArray(denuncias) ? denuncias : []).filter((denuncia) => denuncia.status === 'resolvida').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, resolved, rate };
};

const getMonthKey = (date) => `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;

const buildMonthlyComparisonSeries = (seriesMap) => {
    const allDates = [];

    Object.values(seriesMap || {}).forEach((items) => {
        (Array.isArray(items) ? items : []).forEach((item) => {
            const date = toValidDate(item.createdAt);
            if (date) {
                allDates.push(date);
            }
        });
    });

    if (allDates.length === 0) {
        return { labels: [], datasets: [] };
    }

    const sorted = allDates.sort((a, b) => a - b);
    let cursor = getStartOfMonthUtc(sorted[0]);
    const end = getStartOfMonthUtc(sorted[sorted.length - 1]);
    const labels = [];
    const months = [];

    while (cursor <= end) {
        const key = getMonthKey(cursor);
        labels.push(formatMonthLabel(cursor));
        months.push(key);
        cursor = advancePeriod(cursor, 'month');
    }

    const datasets = Object.entries(seriesMap || {}).map(([label, items], index) => {
        const counts = new Map();
        (Array.isArray(items) ? items : []).forEach((item) => {
            const date = toValidDate(item.createdAt);
            if (!date) {
                return;
            }

            const key = getMonthKey(date);
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        return {
            label,
            data: months.map((monthKey) => counts.get(monthKey) || 0),
            backgroundColor: [
                'rgba(37, 99, 235, 0.75)',
                'rgba(16, 185, 129, 0.75)',
                'rgba(245, 158, 11, 0.75)',
                'rgba(99, 102, 241, 0.75)',
                'rgba(239, 68, 68, 0.75)'
            ][index % 5]
        };
    });

    return { labels, datasets };
};

const sumDonationAmounts = (doacoes) => {
    return (Array.isArray(doacoes) ? doacoes : []).reduce((sum, doacao) => {
        if (doacao.status !== 'confirmada') return sum;
        const amount = Number(doacao.amount || 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);
};

const escapeCsvValue = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = typeof value === 'string' ? value : String(value);
    if (/[",\n\r;]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
};

const buildCsv = (rows) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    return safeRows
        .map((row) => (Array.isArray(row) ? row : []).map(escapeCsvValue).join(','))
        .join('\r\n');
};

const buildAdminAnalytics = ({ denuncias = [], mensagensContato = [], doacoes = [] }) => {
    const timeline = {
        day: buildPeriodSeries(denuncias, 'day', (denuncia) => denuncia.createdAt),
        week: buildPeriodSeries(denuncias, 'week', (denuncia) => denuncia.createdAt),
        month: buildPeriodSeries(denuncias, 'month', (denuncia) => denuncia.createdAt)
    };

    const monthlyActivity = buildMonthlyComparisonSeries({
        'Mensagens de contato': mensagensContato,
        'Doações': doacoes,
    });

    const statusCounts = ['pendente', 'em_andamento', 'resolvida'].map((status) => ({
        label: status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        value: (Array.isArray(denuncias) ? denuncias : []).filter((denuncia) => denuncia.status === status).length
    }));

    const resolution = calculateResolutionSummary(denuncias);
    const category = groupByCategory(denuncias);

    return {
        monthlyActivity,
        category,
        resolution,
        statusCounts,
        timeline
    };
};

const buildPublicImpactAnalytics = ({ denuncias = [], mensagensContato = [], doacoes = [] }) => {
    const now = new Date();
    const currentMonthKey = getMonthKey(now);

    const casesOpenedThisMonth = (Array.isArray(denuncias) ? denuncias : [])
        .filter((denuncia) => {
            const date = toValidDate(denuncia.createdAt);
            return date && getMonthKey(date) === currentMonthKey;
        }).length;

    const casesResolved = (Array.isArray(denuncias) ? denuncias : [])
        .filter((denuncia) => denuncia.status === 'resolvida').length;

    const totalDonations = sumDonationAmounts(doacoes);
    const monthlyActivity = buildMonthlyComparisonSeries({
        Denúncias: denuncias,
        'Mensagens de contato': mensagensContato,
        Doações: doacoes,
    });

    return {
        casesOpenedThisMonth,
        casesResolved,
        totalDonations,
        monthlyActivity
    };
};

module.exports = {
    buildAdminAnalytics,
    buildMonthlyComparisonSeries,
    buildPeriodSeries,
    buildPublicImpactAnalytics,
    calculateResolutionSummary,
    buildCsv,
    groupByCategory,
    escapeCsvValue,
    sumDonationAmounts
};
