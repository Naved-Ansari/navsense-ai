/* ============================================
   NavSense AI — Proactive Notification Engine
   ============================================ */

NavSense.NotificationEngine = (() => {
    const store = NavSense.DataStore;
    let intervalId = null;
    let lastChecks = {};

    const COOLDOWNS = {
        densityAlert: 30000,
        queueTip: 45000,
        phaseTip: 60000,
        exitReminder: 60000,
    };

    function canTrigger(type) {
        const now = Date.now();
        if (lastChecks[type] && (now - lastChecks[type]) < COOLDOWNS[type]) return false;
        lastChecks[type] = now;
        return true;
    }

    function check() {
        const state = store.getState();
        const user = NavSense.UserContext.getUser();
        const zoneDensity = state.crowdDensity[user.zone] || 0;

        // High density alert
        if (zoneDensity > 85 && canTrigger('densityAlert')) {
            store.addNotification({
                type: 'safety',
                title: '⚠️ High Crowd Density',
                message: `Your area (${user.zone.replace(/-/g, ' ')}) is at ${zoneDensity}% capacity. Consider moving to a less crowded zone.`,
                icon: 'alert-triangle',
                priority: 'high'
            });
        }

        // Halftime food tip
        if (state.currentPhase === 'halftime' && canTrigger('queueTip')) {
            const queues = state.queues;
            const foodQueues = Object.entries(queues)
                .filter(([id]) => id.startsWith('food'))
                .sort((a, b) => a[1].wait - b[1].wait);

            if (foodQueues.length > 0) {
                const [bestId, bestQ] = foodQueues[0];
                const amenity = store.getStadium().amenities.find(a => a.id === bestId);
                if (amenity && bestQ.wait <= 5) {
                    store.addNotification({
                        type: 'offer',
                        title: '🍕 Quick Food Opportunity!',
                        message: `${amenity.name} has only a ${bestQ.wait} min wait right now!`,
                        icon: 'utensils',
                        priority: 'medium'
                    });
                }
            }
        }

        // Post-match exit reminder
        if (state.currentPhase === 'post-match' && canTrigger('exitReminder')) {
            const gates = NavSense.UserContext.getNearestGate();
            if (gates.length > 0) {
                const best = gates[0];
                const queue = state.queues[best.id] || { wait: 0 };
                store.addNotification({
                    type: 'navigation',
                    title: '🚪 Best Exit Right Now',
                    message: `${best.name} — ${queue.wait} min queue. Head there before it gets busier!`,
                    icon: 'log-out',
                    priority: 'high'
                });
            }
        }

        // Pre-match seat finder
        if (state.currentPhase === 'pre-match' && canTrigger('phaseTip')) {
            store.addNotification({
                type: 'info',
                title: '🪑 Find Your Seat',
                message: `Head to ${user.seat.section}, Row ${user.seat.row}. Use the Navigate tab for directions!`,
                icon: 'map-pin',
                priority: 'low'
            });
        }
    }

    function start() {
        if (intervalId) return;
        const speed = store.getState().simulationSpeed || 1;
        intervalId = setInterval(check, Math.max(3000, 10000 / speed));
    }

    function stop() {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    function restart() { stop(); start(); }

    store.on('stateChange:simulationSpeed', () => restart());

    return { start, stop, restart, check };
})();
