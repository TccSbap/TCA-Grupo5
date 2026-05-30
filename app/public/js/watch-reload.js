(function () {
    let lastVersion = null;

    const checkVersion = async () => {
        try {
            const response = await fetch('/__watch-version', { cache: 'no-store' });
            if (!response.ok) {
                return;
            }

            const version = (await response.text()).trim();
            if (!version) {
                return;
            }

            if (lastVersion && version !== lastVersion) {
                window.location.reload();
                return;
            }

            lastVersion = version;
        } catch (error) {
            // If the server is restarting, the next poll will try again.
        }
    };

    checkVersion();
    setInterval(checkVersion, 1000);
})();
