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

const groupResponsesByOng = (denuncias, ongs = [], limit = 6) => {
    const ongNames = new Map((Array.isArray(ongs) ? ongs : []).map((ong) => [ong.id, ong.name]));
    const counts = new Map();

    (Array.isArray(denuncias) ? denuncias : []).forEach((denuncia) => {
        (Array.isArray(denuncia.responses) ? denuncia.responses : []).forEach((response) => {
            const key = response.ongId || response.ongName || 'unknown';
            const label = ongNames.get(response.ongId) || response.ongName || 'ONG desconhecida';
            const current = counts.get(key) || { label, value: 0 };
            current.value += 1;
            counts.set(key, current);
        });
    });

    const items = Array.from(counts.values())
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);

    return {
        labels: items.map((item) => item.label),
        values: items.map((item) => item.value)
    };
};

const buildPeriodSeriesFromRecords = (records, getDateValue = (item) => item.createdAt) => buildMonthlySeries(records, getDateValue);

const calculateResolutionSummary = (denuncias) => {
    const total = Array.isArray(denuncias) ? denuncias.length : 0;
    const resolved = (Array.isArray(denuncias) ? denuncias : []).filter((denuncia) => denuncia.status === 'resolvida').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, resolved, rate };
};

const calculateAverageFirstResponseHours = (denuncias, ongId) => {
    const relevant = (Array.isArray(denuncias) ? denuncias : []).map((denuncia) => {
        const responseDates = (Array.isArray(denuncia.responses) ? denuncia.responses : [])
            .filter((response) => response.ongId === ongId)
            .map((response) => toValidDate(response.createdAt))
            .filter(Boolean)
            .sort((a, b) => a - b);

        if (responseDates.length === 0) {
            return null;
        }

        const openedAt = toValidDate(denuncia.createdAt);
        if (!openedAt) {
            return null;
        }

        return (responseDates[0].getTime() - openedAt.getTime()) / 36e5;
    }).filter((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0);

    if (relevant.length === 0) {
        return 0;
    }

    const total = relevant.reduce((sum, value) => sum + value, 0);
    return total / relevant.length;
};

const formatDurationFromHours = (hours) => {
    if (!Number.isFinite(hours) || hours <= 0) {
        return '0h';
    }

    const totalMinutes = Math.round(hours * 60);
    const days = Math.floor(totalMinutes / 1440);
    const remainingAfterDays = totalMinutes % 1440;
    const hrs = Math.floor(remainingAfterDays / 60);
    const mins = remainingAfterDays % 60;

    if (days > 0) {
        return `${days}d ${hrs}h`;
    }

    if (hrs > 0) {
        return `${hrs}h ${mins}m`;
    }

    return `${mins}m`;
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

const buildAdminAnalytics = ({ denuncias = [], ongs = [], mensagensContato = [], doacoes = [], assinaturasPlano = [] }) => {
    const timeline = {
        day: buildPeriodSeries(denuncias, 'day', (denuncia) => denuncia.createdAt),
        week: buildPeriodSeries(denuncias, 'week', (denuncia) => denuncia.createdAt),
        month: buildPeriodSeries(denuncias, 'month', (denuncia) => denuncia.createdAt)
    };

    const monthlyActivity = buildMonthlyComparisonSeries({
        'Mensagens de contato': mensagensContato,
        'Doações': doacoes,
        'Assinaturas': assinaturasPlano
    });

    const statusCounts = ['pendente', 'em_andamento', 'resolvida'].map((status) => ({
        label: status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
        value: (Array.isArray(denuncias) ? denuncias : []).filter((denuncia) => denuncia.status === status).length
    }));

    const resolution = calculateResolutionSummary(denuncias);
    const category = groupByCategory(denuncias);
    const responsesByOng = groupResponsesByOng(denuncias, ongs, 6);

    return {
        monthlyActivity,
        category,
        responsesByOng,
        resolution,
        statusCounts,
        timeline
    };
};

const buildOngOperationalAnalytics = ({ denuncias = [], ong }) => {
    const pendingDenuncias = (Array.isArray(denuncias) ? denuncias : [])
        .filter((denuncia) => denuncia.status === 'pendente')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const respondedCases = (Array.isArray(denuncias) ? denuncias : [])
        .filter((denuncia) => Array.isArray(denuncia.responses) && denuncia.responses.some((response) => response.ongId === ong.id));
        // keep the most recent cases at the top for operational review
    respondedCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const openCases = respondedCases.filter((denuncia) => denuncia.status !== 'resolvida');
    const resolvedCases = respondedCases.filter((denuncia) => denuncia.status === 'resolvida');

    const responseRecords = respondedCases.flatMap((denuncia) =>
        (Array.isArray(denuncia.responses) ? denuncia.responses : [])
            .filter((response) => response.ongId === ong.id)
            .map((response) => ({
                createdAt: response.createdAt
            }))
    );

    const responsesByMonth = buildMonthlySeries(responseRecords, (response) => response.createdAt);
    const pendingByCategory = groupByCategory(pendingDenuncias);
    const averageFirstResponseHours = calculateAverageFirstResponseHours(denuncias, ong.id);
    const resolutionRate = respondedCases.length > 0 ? Math.round((resolvedCases.length / respondedCases.length) * 100) : 0;
    const avgFirstResponseLabel = formatDurationFromHours(averageFirstResponseHours);
    const responseVolume = responseRecords.length;

    return {
        pendingByCategory,
        pendingDenuncias,
        respondedCases,
        openCases,
        resolvedCases,
        responsesByMonth,
        averageFirstResponseHours,
        avgFirstResponseLabel,
        resolutionRate,
        responseVolume
    };
};

const buildPublicImpactAnalytics = ({ denuncias = [], mensagensContato = [], doacoes = [], assinaturasPlano = [] }) => {
    const now = new Date();
    const currentMonthKey = getMonthKey(now);

    const casesOpenedThisMonth = (Array.isArray(denuncias) ? denuncias : [])
        .filter((denuncia) => {
            const date = toValidDate(denuncia.createdAt);
            return date && getMonthKey(date) === currentMonthKey;
        }).length;

    const casesResponded = (Array.isArray(denuncias) ? denuncias : [])
        .filter((denuncia) => Array.isArray(denuncia.responses) && denuncia.responses.length > 0).length;

    const casesResolved = (Array.isArray(denuncias) ? denuncias : [])
        .filter((denuncia) => denuncia.status === 'resolvida').length;

    const totalDonations = sumDonationAmounts(doacoes);
    const activeSubscriptions = (Array.isArray(assinaturasPlano) ? assinaturasPlano : []).filter(Boolean).length;
    const monthlyActivity = buildMonthlyComparisonSeries({
        Denúncias: denuncias,
        'Mensagens de contato': mensagensContato,
        Doações: doacoes,
        Assinaturas: assinaturasPlano
    });

    return {
        casesOpenedThisMonth,
        casesResponded,
        casesResolved,
        totalDonations,
        activeSubscriptions,
        monthlyActivity
    };
};

module.exports = {
    buildAdminAnalytics,
    buildMonthlyComparisonSeries,
    buildOngOperationalAnalytics,
    buildPeriodSeries,
    buildPublicImpactAnalytics,
    calculateAverageFirstResponseHours,
    calculateResolutionSummary,
    buildCsv,
    formatDurationFromHours,
    groupByCategory,
    escapeCsvValue,
    groupResponsesByOng,
    sumDonationAmounts
};
