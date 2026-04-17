/* ============================================
   NavSense AI — Central Data Store
   ============================================ */

const NavSense = window.NavSense || {};
window.NavSense = NavSense;

NavSense.DataStore = (() => {
    // ── PubSub ──
    const listeners = {};

    function on(event, callback) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
        return () => off(event, callback);
    }

    function off(event, callback) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    }

    function emit(event, data) {
        if (listeners[event]) {
            listeners[event].forEach(cb => {
                try { cb(data); } catch (e) { console.error(`Event ${event} handler error:`, e); }
            });
        }
    }

    // ── Stadium Configuration ──
    const stadium = {
        name: 'National Arena',
        type: 'oval', // multi-purpose oval stadium
        capacity: 45000,
        event: {
            name: 'IPL 2026 — Final',
            teams: { home: { name: 'Mumbai', abbr: 'MI', color: '#004BA0' }, away: { name: 'Chennai', abbr: 'CSK', color: '#FDB913' } },
            date: '2026-04-17',
            time: '19:30'
        },
        zones: [
            { id: 'north-stand', name: 'North Stand', type: 'seating', capacity: 8000, x: 50, y: 12, w: 40, h: 12 },
            { id: 'south-stand', name: 'South Stand', type: 'seating', capacity: 8000, x: 50, y: 88, w: 40, h: 12 },
            { id: 'east-stand', name: 'East Stand', type: 'seating', capacity: 6000, x: 88, y: 50, w: 12, h: 40 },
            { id: 'west-stand', name: 'West Stand', type: 'seating', capacity: 6000, x: 12, y: 50, w: 12, h: 40 },
            { id: 'ne-pavilion', name: 'NE Pavilion', type: 'seating', capacity: 4000, x: 78, y: 22, w: 14, h: 14 },
            { id: 'nw-pavilion', name: 'NW Pavilion', type: 'seating', capacity: 4000, x: 22, y: 22, w: 14, h: 14 },
            { id: 'se-pavilion', name: 'SE Pavilion', type: 'seating', capacity: 4000, x: 78, y: 78, w: 14, h: 14 },
            { id: 'sw-pavilion', name: 'SW Pavilion', type: 'seating', capacity: 4000, x: 22, y: 78, w: 14, h: 14 },
            { id: 'vip-box', name: 'VIP Box', type: 'vip', capacity: 1000, x: 50, y: 22, w: 16, h: 6 },
            { id: 'concourse-n', name: 'North Concourse', type: 'concourse', capacity: 3000, x: 50, y: 28, w: 50, h: 5 },
            { id: 'concourse-s', name: 'South Concourse', type: 'concourse', capacity: 3000, x: 50, y: 72, w: 50, h: 5 },
            { id: 'field', name: 'Playing Field', type: 'field', capacity: 0, x: 50, y: 50, w: 38, h: 30 },
        ],
        gates: [
            { id: 'gate-1', name: 'Gate 1 (North)', x: 50, y: 2, zone: 'north-stand' },
            { id: 'gate-2', name: 'Gate 2 (East)', x: 98, y: 50, zone: 'east-stand' },
            { id: 'gate-3', name: 'Gate 3 (South)', x: 50, y: 98, zone: 'south-stand' },
            { id: 'gate-4', name: 'Gate 4 (West)', x: 2, y: 50, zone: 'west-stand' },
        ],
        amenities: [
            { id: 'food-1', name: 'North Food Court', type: 'food', x: 35, y: 26, zone: 'concourse-n', icon: 'utensils' },
            { id: 'food-2', name: 'South Food Court', type: 'food', x: 65, y: 74, zone: 'concourse-s', icon: 'utensils' },
            { id: 'food-3', name: 'East Snack Bar', type: 'food', x: 85, y: 40, zone: 'east-stand', icon: 'coffee' },
            { id: 'food-4', name: 'West Snack Bar', type: 'food', x: 15, y: 60, zone: 'west-stand', icon: 'coffee' },
            { id: 'rest-1', name: 'North Restrooms', type: 'restroom', x: 65, y: 26, zone: 'concourse-n', icon: 'bath' },
            { id: 'rest-2', name: 'South Restrooms', type: 'restroom', x: 35, y: 74, zone: 'concourse-s', icon: 'bath' },
            { id: 'rest-3', name: 'East Restrooms', type: 'restroom', x: 85, y: 60, zone: 'east-stand', icon: 'bath' },
            { id: 'rest-4', name: 'West Restrooms', type: 'restroom', x: 15, y: 40, zone: 'west-stand', icon: 'bath' },
            { id: 'merch-1', name: 'Fan Store', type: 'merchandise', x: 40, y: 26, zone: 'concourse-n', icon: 'shopping-bag' },
            { id: 'first-aid', name: 'First Aid', type: 'medical', x: 55, y: 74, zone: 'concourse-s', icon: 'heart-pulse' },
            { id: 'info-desk', name: 'Info Desk', type: 'info', x: 50, y: 26, zone: 'concourse-n', icon: 'info' },
        ]
    };

    // ── State ──
    const state = {
        currentPhase: 'pre-match', // pre-match, first-half, halftime, second-half, post-match
        phaseTime: 0, // seconds into current phase
        simulationSpeed: 1,
        crowdDensity: {}, // zone-id -> 0-100
        queues: {},       // amenity-id -> { wait, people, capacity }
        score: { home: 0, away: 0 },
        highlights: [],
        notifications: [],
        user: null,
        isAdmin: false,
        activeView: 'home',
    };

    // Init zone densities
    stadium.zones.forEach(z => {
        state.crowdDensity[z.id] = z.type === 'field' ? 0 : Math.floor(Math.random() * 20) + 10;
    });

    // Init queues
    [...stadium.amenities.filter(a => ['food', 'restroom'].includes(a.type)), ...stadium.gates].forEach(item => {
        state.queues[item.id] = {
            wait: Math.floor(Math.random() * 8) + 2,
            people: Math.floor(Math.random() * 20) + 5,
            capacity: item.type === 'food' ? 3 : item.type === 'restroom' ? 6 : 10,
            trend: 'stable'
        };
    });

    function getState() { return state; }
    function getStadium() { return stadium; }

    function setState(key, value) {
        const old = state[key];
        state[key] = value;
        emit('stateChange', { key, value, old });
        emit(`stateChange:${key}`, { value, old });
    }

    function updateDensity(zoneId, value) {
        state.crowdDensity[zoneId] = Math.max(0, Math.min(100, value));
        emit('densityChange', { zoneId, value: state.crowdDensity[zoneId] });
    }

    function updateQueue(id, data) {
        state.queues[id] = { ...state.queues[id], ...data };
        emit('queueChange', { id, data: state.queues[id] });
    }

    function addNotification(notification) {
        const n = {
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            read: false,
            ...notification
        };
        state.notifications.unshift(n);
        if (state.notifications.length > 50) state.notifications.pop();
        emit('notification', n);
        return n;
    }

    function addHighlight(highlight) {
        const h = {
            id: Date.now(),
            timestamp: new Date(),
            ...highlight
        };
        state.highlights.unshift(h);
        emit('highlight', h);
        return h;
    }

    function getAvgDensity() {
        const zones = stadium.zones.filter(z => z.type !== 'field');
        const total = zones.reduce((sum, z) => sum + (state.crowdDensity[z.id] || 0), 0);
        return Math.round(total / zones.length);
    }

    function getQueueAvgWait() {
        const queueIds = Object.keys(state.queues);
        if (!queueIds.length) return 0;
        const total = queueIds.reduce((sum, id) => sum + state.queues[id].wait, 0);
        return Math.round(total / queueIds.length);
    }

    function getDensityColor(value) {
        if (value < 20) return 'var(--heat-0)';
        if (value < 35) return 'var(--heat-2)';
        if (value < 50) return 'var(--heat-3)';
        if (value < 65) return 'var(--heat-4)';
        if (value < 75) return 'var(--heat-5)';
        if (value < 85) return 'var(--heat-6)';
        if (value < 95) return 'var(--heat-8)';
        return 'var(--heat-9)';
    }

    function getDensityLabel(value) {
        if (value < 25) return 'Low';
        if (value < 50) return 'Moderate';
        if (value < 75) return 'High';
        return 'Critical';
    }

    function getWaitColor(minutes) {
        if (minutes <= 3) return 'var(--color-success)';
        if (minutes <= 8) return 'var(--color-warning)';
        return 'var(--color-danger)';
    }

    return {
        on, off, emit, getState, getStadium, setState,
        updateDensity, updateQueue, addNotification, addHighlight,
        getAvgDensity, getQueueAvgWait, getDensityColor, getDensityLabel, getWaitColor
    };
})();
