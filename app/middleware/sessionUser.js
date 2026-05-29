const toSessionUser = (user) => {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        type: user.type,
        ongName: user.ongName || null
    };
};

module.exports = {
    toSessionUser
};
