/* ============================================
   NavSense AI — User Context Tracker
   ============================================ */

NavSense.UserContext = (() => {
    const store = NavSense.DataStore;

    const user = {
        name: 'Naved Ahmed',
        seat: { section: 'North Stand', row: 'F', number: 24 },
        zone: 'north-stand',
        position: { x: 45, y: 15 },
        preferences: {
            food: ['biryani', 'pizza', 'cold drinks'],
            accessibility: false,
            notifications: true,
            language: 'en'
        },
        ticket: {
            type: 'Premium',
            gate: 'gate-1',
            barcode: 'NS-IPL2026-F24'
        }
    };

    store.setState('user', user);

    // Simulate gentle position drift
    let driftInterval = null;

    function startTracking() {
        if (driftInterval) return;
        driftInterval = setInterval(() => {
            user.position.x += (Math.random() - 0.5) * 0.5;
            user.position.y += (Math.random() - 0.5) * 0.5;
            user.position.x = Math.max(5, Math.min(95, user.position.x));
            user.position.y = Math.max(5, Math.min(95, user.position.y));
            store.emit('userPositionUpdate', user.position);
        }, 5000);
    }

    function stopTracking() {
        if (driftInterval) { clearInterval(driftInterval); driftInterval = null; }
    }

    function getUser() { return user; }

    function setPosition(x, y) {
        user.position = { x, y };
        // Determine zone
        const stadium = store.getStadium();
        let closestZone = null;
        let closestDist = Infinity;
        stadium.zones.forEach(z => {
            const dx = x - z.x;
            const dy = y - z.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                closestZone = z.id;
            }
        });
        if (closestZone) user.zone = closestZone;
        store.emit('userPositionUpdate', user.position);
    }

    function getNearbyAmenities(type, maxDistance) {
        const stadium = store.getStadium();
        maxDistance = maxDistance || 30;
        return stadium.amenities
            .filter(a => !type || a.type === type)
            .map(a => {
                const dx = user.position.x - a.x;
                const dy = user.position.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return { ...a, distance: dist };
            })
            .filter(a => a.distance <= maxDistance)
            .sort((a, b) => a.distance - b.distance);
    }

    function getNearestGate() {
        const stadium = store.getStadium();
        const state = store.getState();
        return stadium.gates
            .map(g => {
                const dx = user.position.x - g.x;
                const dy = user.position.y - g.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const queue = state.queues[g.id] || { wait: 0 };
                return { ...g, distance: dist, wait: queue.wait };
            })
            .sort((a, b) => (a.distance + a.wait * 2) - (b.distance + b.wait * 2));
    }

    function getDistanceTo(x, y) {
        const dx = user.position.x - x;
        const dy = user.position.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getETAMinutes(x, y) {
        const dist = getDistanceTo(x, y);
        // Rough: 1 unit ≈ 3 meters, walking speed ≈ 1.2 m/s
        const meters = dist * 3;
        const seconds = meters / 1.2;
        return Math.max(1, Math.round(seconds / 60));
    }

    return { getUser, setPosition, getNearbyAmenities, getNearestGate, getDistanceTo, getETAMinutes, startTracking, stopTracking };
})();
