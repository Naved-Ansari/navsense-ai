/* ============================================
   NavSense AI — Crowd Density Simulator
   ============================================ */

NavSense.CrowdSimulator = (() => {
    const store = NavSense.DataStore;
    let intervalId = null;

    // Phase-based base density profiles
    const phaseProfiles = {
        'pre-match': { seating: [15, 40], concourse: [30, 60], vip: [10, 25] },
        'first-half': { seating: [70, 95], concourse: [15, 30], vip: [80, 95] },
        'halftime': { seating: [40, 60], concourse: [60, 90], vip: [50, 70] },
        'second-half': { seating: [75, 98], concourse: [10, 25], vip: [85, 98] },
        'post-match': { seating: [20, 50], concourse: [70, 95], vip: [15, 30] },
    };

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function update() {
        const state = store.getState();
        const stadium = store.getStadium();
        const profile = phaseProfiles[state.currentPhase] || phaseProfiles['pre-match'];

        stadium.zones.forEach(zone => {
            if (zone.type === 'field') return;

            const typeKey = zone.type === 'vip' ? 'vip' : zone.type === 'concourse' ? 'concourse' : 'seating';
            const [min, max] = profile[typeKey];
            const target = randomInRange(min, max);
            const current = state.crowdDensity[zone.id] || 0;

            // Smooth interpolation with noise
            const noise = (Math.random() - 0.5) * 6;
            const newValue = Math.round(lerp(current, target, 0.08) + noise);
            store.updateDensity(zone.id, newValue);
        });
    }

    function start() {
        if (intervalId) return;
        const state = store.getState();
        const speed = state.simulationSpeed || 1;
        intervalId = setInterval(update, Math.max(500, 2500 / speed));
    }

    function stop() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function restart() {
        stop();
        start();
    }

    // Listen for speed changes
    store.on('stateChange:simulationSpeed', () => restart());

    return { start, stop, restart, update };
})();
