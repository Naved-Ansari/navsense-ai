/* ============================================
   NavSense AI — Context Engine
   ============================================ */

NavSense.ContextEngine = (() => {
    const store = NavSense.DataStore;
    const userCtx = NavSense.UserContext;

    function getFullContext() {
        const state = store.getState();
        const user = userCtx.getUser();
        const stadium = store.getStadium();
        const avgDensity = store.getAvgDensity();
        const avgWait = store.getQueueAvgWait();
        const nearbyFood = userCtx.getNearbyAmenities('food');
        const nearbyRestRooms = userCtx.getNearbyAmenities('restroom');
        const nearestGates = userCtx.getNearestGate();
        const zoneDensity = state.crowdDensity[user.zone] || 0;

        return {
            phase: state.currentPhase,
            phaseTime: state.phaseTime,
            score: state.score,
            user: {
                name: user.name,
                zone: user.zone,
                seat: user.seat,
                position: user.position,
                preferences: user.preferences
            },
            environment: {
                avgDensity,
                avgWait,
                zoneDensity,
                densityLevel: store.getDensityLabel(zoneDensity)
            },
            nearby: {
                food: nearbyFood.slice(0, 3),
                restrooms: nearbyRestRooms.slice(0, 2),
                gates: nearestGates.slice(0, 2)
            },
            stadium: {
                name: stadium.name,
                event: stadium.event,
                capacity: stadium.capacity
            }
        };
    }

    // Determine user intent from text
    function classifyIntent(text) {
        const lower = text.toLowerCase();

        const intents = [
            { keywords: ['restroom', 'washroom', 'bathroom', 'toilet', 'loo'], intent: 'find_restroom' },
            { keywords: ['food', 'eat', 'hungry', 'snack', 'drink', 'biryani', 'pizza', 'coffee', 'tea'], intent: 'find_food' },
            { keywords: ['seat', 'my seat', 'find seat', 'where is my seat', 'section'], intent: 'find_seat' },
            { keywords: ['exit', 'leave', 'gate', 'go home', 'way out'], intent: 'find_exit' },
            { keywords: ['queue', 'wait', 'line', 'how long', 'waiting'], intent: 'check_queue' },
            { keywords: ['crowd', 'crowded', 'busy', 'congestion', 'packed'], intent: 'check_crowd' },
            { keywords: ['score', 'match', 'game', 'who is winning', 'result', 'runs'], intent: 'match_update' },
            { keywords: ['help', 'emergency', 'lost', 'medical', 'first aid', 'security'], intent: 'help' },
            { keywords: ['navigate', 'direction', 'route', 'how to get', 'way to', 'go to'], intent: 'navigate' },
            { keywords: ['merchandise', 'merch', 'shop', 'buy', 'souvenir', 'jersey'], intent: 'find_merch' },
            { keywords: ['order', 'pre-order', 'book'], intent: 'pre_order' },
            { keywords: ['best time', 'when should', 'recommend', 'suggest'], intent: 'recommendation' },
            { keywords: ['hi', 'hello', 'hey', 'good'], intent: 'greeting' },
        ];

        for (const { keywords, intent } of intents) {
            if (keywords.some(k => lower.includes(k))) return intent;
        }
        return 'general';
    }

    // Generate smart suggestions based on context
    function getSuggestions() {
        const context = getFullContext();
        const suggestions = [];

        if (context.phase === 'halftime') {
            suggestions.push('Best food stall now?');
            suggestions.push('Nearest restroom');
            suggestions.push('Any offers nearby?');
        } else if (context.phase === 'pre-match') {
            suggestions.push('Find my seat');
            suggestions.push('Nearest food court');
            suggestions.push("What's the schedule?");
        } else if (context.phase === 'post-match') {
            suggestions.push('Best exit route');
            suggestions.push('Shortest exit queue');
            suggestions.push('Call a cab');
        } else {
            suggestions.push("What's the score?");
            suggestions.push('Nearby restrooms');
            suggestions.push('Queue times');
        }

        if (context.environment.zoneDensity > 70) {
            suggestions.unshift('Find less crowded area');
        }

        return suggestions.slice(0, 4);
    }

    return { getFullContext, classifyIntent, getSuggestions };
})();
