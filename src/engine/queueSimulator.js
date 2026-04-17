/* ============================================
   NavSense AI — Queue State Simulator
   ============================================ */

NavSense.QueueSimulator = (() => {
    const store = NavSense.DataStore;
    let intervalId = null;

    // Phase-based queue intensity multipliers
    const phaseMultipliers = {
        'pre-match': { food: 0.6, restroom: 0.4, gate: 1.5 },
        'first-half': { food: 0.3, restroom: 0.3, gate: 0.1 },
        'halftime': { food: 1.8, restroom: 1.6, gate: 0.2 },
        'second-half': { food: 0.2, restroom: 0.4, gate: 0.1 },
        'post-match': { food: 0.3, restroom: 0.5, gate: 2.0 },
    };

    function update() {
        const state = store.getState();
        const stadium = store.getStadium();
        const multipliers = phaseMultipliers[state.currentPhase] || phaseMultipliers['pre-match'];

        // Update amenity queues
        stadium.amenities.filter(a => ['food', 'restroom'].includes(a.type)).forEach(amenity => {
            const q = state.queues[amenity.id];
            if (!q) return;

            const mult = multipliers[amenity.type] || 1;
            const baseWait = Math.round((Math.random() * 8 + 2) * mult);
            const basePeople = Math.round((Math.random() * 15 + 5) * mult);

            const newWait = Math.max(1, Math.round(q.wait * 0.7 + baseWait * 0.3 + (Math.random() - 0.5) * 2));
            const newPeople = Math.max(0, Math.round(q.people * 0.7 + basePeople * 0.3));

            const trend = newWait > q.wait + 1 ? 'rising' : newWait < q.wait - 1 ? 'falling' : 'stable';

            store.updateQueue(amenity.id, {
                wait: newWait,
                people: newPeople,
                trend
            });
        });

        // Update gate queues
        stadium.gates.forEach(gate => {
            const q = state.queues[gate.id];
            if (!q) return;

            const mult = multipliers.gate || 1;
            const baseWait = Math.round((Math.random() * 10 + 1) * mult);
            const basePeople = Math.round((Math.random() * 30 + 5) * mult);

            const newWait = Math.max(0, Math.round(q.wait * 0.7 + baseWait * 0.3 + (Math.random() - 0.5) * 3));
            const newPeople = Math.max(0, Math.round(q.people * 0.7 + basePeople * 0.3));

            const trend = newWait > q.wait + 1 ? 'rising' : newWait < q.wait - 1 ? 'falling' : 'stable';

            store.updateQueue(gate.id, { wait: newWait, people: newPeople, trend });
        });
    }

    // Pre-order system
    const preOrders = [];

    function placePreOrder(foodStallId, items, pickupTime) {
        const order = {
            id: 'ORD-' + Date.now().toString(36).toUpperCase(),
            stallId: foodStallId,
            items,
            pickupTime,
            status: 'confirmed',
            createdAt: new Date()
        };
        preOrders.push(order);
        store.emit('preOrder', order);

        // Simulate order ready
        setTimeout(() => {
            order.status = 'ready';
            store.emit('preOrderReady', order);
            store.addNotification({
                type: 'offer',
                title: 'Order Ready! 🎉',
                message: `Your order #${order.id} is ready for pickup at ${store.getStadium().amenities.find(a => a.id === foodStallId)?.name || 'counter'}.`,
                icon: 'package-check',
                priority: 'medium'
            });
        }, 15000 / (store.getState().simulationSpeed || 1));

        return order;
    }

    function getPreOrders() {
        return [...preOrders];
    }

    function start() {
        if (intervalId) return;
        const speed = store.getState().simulationSpeed || 1;
        intervalId = setInterval(update, Math.max(800, 3000 / speed));
    }

    function stop() {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    function restart() { stop(); start(); }

    store.on('stateChange:simulationSpeed', () => restart());

    return { start, stop, restart, update, placePreOrder, getPreOrders };
})();
