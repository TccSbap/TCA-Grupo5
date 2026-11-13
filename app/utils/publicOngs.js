const toPublicOngSummary = (ong = {}) => ({
    id: ong.id,
    name: ong.name,
    description: ong.description,
    focus: ong.focus || ong.description,
    contact: ong.contact || ong.contact_email || null,
    phone: ong.phone || null,
    address: ong.address || null,
    createdAt: ong.createdAt || ong.created_at || null
});

const toPublicOngProfile = (ong = {}) => ({
    id: ong.id,
    name: ong.name,
    contact: ong.contact || ong.contact_email || null,
    phone: ong.phone || null,
    address: ong.address || null,
    createdAt: ong.createdAt || ong.created_at || null
});

const loadPublicOngs = async (data) => {
    const ongs = typeof data.getPublicOngs === 'function'
        ? await data.getPublicOngs()
        : await data.getOngs();

    return ongs.map(toPublicOngSummary);
};

const loadPublicOngById = async (data, id) => {
    if (typeof data.getPublicOngById === 'function') {
        const ong = await data.getPublicOngById(id);
        return ong ? toPublicOngProfile(ong) : null;
    }

    if (typeof data.getOngById === 'function') {
        const ong = await data.getOngById(id);
        return ong ? toPublicOngProfile(ong) : null;
    }

    const ong = (await loadPublicOngs(data)).find((item) => Number(item.id) === Number(id));
    return ong ? toPublicOngProfile(ong) : null;
};

module.exports = {
    loadPublicOngById,
    loadPublicOngs,
    toPublicOngProfile,
    toPublicOngSummary
};
