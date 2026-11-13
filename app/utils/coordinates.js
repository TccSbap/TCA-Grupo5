const GRID_SIZE = 0.02;

const parseCoordinate = (value, min, max) => {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string' && typeof value !== 'number') return NaN;
    if (typeof value === 'string' && !value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : NaN;
};

const makeApproximateCoordinate = (latitude, longitude) => {
    const latitudeIndex = Math.floor((latitude + 90) / GRID_SIZE);
    const longitudeIndex = Math.floor((longitude + 180) / GRID_SIZE);
    const approximateLatitude = Math.min(90 - GRID_SIZE / 2, -90 + (latitudeIndex + 0.5) * GRID_SIZE);
    const approximateLongitude = Math.min(180 - GRID_SIZE / 2, -180 + (longitudeIndex + 0.5) * GRID_SIZE);
    return {
        latitude: Number(approximateLatitude.toFixed(4)),
        longitude: Number(approximateLongitude.toFixed(4))
    };
};

const normalizeApproximateCoordinates = (latitudeValue, longitudeValue) => {
    const latitude = parseCoordinate(latitudeValue, -90, 90);
    const longitude = parseCoordinate(longitudeValue, -180, 180);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return { error: 'Selecione um ponto válido no mapa.' };
    if (latitude === null && longitude === null) return { latitude: null, longitude: null };
    if (latitude === null || longitude === null) return { error: 'Selecione um ponto válido no mapa.' };
    return makeApproximateCoordinate(latitude, longitude);
};

module.exports = { GRID_SIZE, makeApproximateCoordinate, normalizeApproximateCoordinates };
