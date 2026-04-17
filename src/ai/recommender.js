/* ============================================
   NavSense AI — Recommender Engine
   ============================================ */

NavSense.Recommender = (() => {
    const store = NavSense.DataStore;
    const userCtx = NavSense.UserContext;
    const context = NavSense.ContextEngine;

    function generateResponse(userMessage) {
        const intent = context.classifyIntent(userMessage);
        const ctx = context.getFullContext();

        switch (intent) {
            case 'greeting': return greeting(ctx);
            case 'find_restroom': return findRestroom(ctx);
            case 'find_food': return findFood(ctx);
            case 'find_seat': return findSeat(ctx);
            case 'find_exit': return findExit(ctx);
            case 'check_queue': return checkQueues(ctx);
            case 'check_crowd': return checkCrowd(ctx);
            case 'match_update': return matchUpdate(ctx);
            case 'help': return getHelp(ctx);
            case 'find_merch': return findMerch(ctx);
            case 'pre_order': return preOrderInfo(ctx);
            case 'recommendation': return getRecommendation(ctx);
            case 'navigate': return navigateHelp(ctx);
            default: return defaultResponse(ctx);
        }
    }

    function greeting(ctx) {
        const greetings = [
            `Hey ${ctx.user.name.split(' ')[0]}! 👋 Welcome to ${ctx.stadium.name}! I'm your AI assistant for today's match. How can I help?`,
            `Hello! 🏟️ Great to have you at the ${ctx.stadium.event.name}! What do you need?`,
            `Hi there! 😊 I'm NavSense AI, your smart stadium guide. Ask me anything about navigation, food, queues, or the match!`
        ];
        return { text: greetings[Math.floor(Math.random() * greetings.length)], type: 'text' };
    }

    function findRestroom(ctx) {
        const nearby = ctx.nearby.restrooms;
        if (!nearby.length) {
            return { text: "I couldn't find restrooms near you right now. Try heading to the nearest concourse area.", type: 'text' };
        }

        const state = store.getState();
        const best = nearby.map(r => ({
            ...r,
            queue: state.queues[r.id] || { wait: 5, people: 10 }
        })).sort((a, b) => (a.queue.wait + a.distance * 0.5) - (b.queue.wait + b.distance * 0.5));

        const top = best[0];
        const eta = userCtx.getETAMinutes(top.x, top.y);

        let text = `🚻 **${top.name}** is your best option!\n\n`;
        text += `⏱️ Wait: ~${top.queue.wait} min | 🚶 Walk: ~${eta} min\n`;
        text += `👥 ${top.queue.people} people in queue\n\n`;

        if (best.length > 1) {
            const alt = best[1];
            const altEta = userCtx.getETAMinutes(alt.x, alt.y);
            text += `Alternative: **${alt.name}** (~${alt.queue.wait} min wait, ${altEta} min walk)`;
        }

        return { text, type: 'rich', action: { type: 'navigate', target: top } };
    }

    function findFood(ctx) {
        const nearby = ctx.nearby.food;
        const state = store.getState();

        if (!nearby.length) {
            return { text: "No food courts are nearby. Check the concourse areas on the North or South side! 🍕", type: 'text' };
        }

        const best = nearby.map(f => ({
            ...f,
            queue: state.queues[f.id] || { wait: 5, people: 10 }
        })).sort((a, b) => (a.queue.wait + a.distance * 0.3) - (b.queue.wait + b.distance * 0.3));

        const top = best[0];
        const eta = userCtx.getETAMinutes(top.x, top.y);

        let text = `🍽️ **${top.name}** is closest with shortest wait!\n\n`;
        text += `⏱️ Wait: ~${top.queue.wait} min | 🚶 Walk: ~${eta} min\n`;
        text += `👥 ${top.queue.people} people ahead\n\n`;

        if (ctx.phase === 'halftime') {
            text += `💡 **Tip:** It's halftime — queues are longer than usual. Consider pre-ordering to skip the line!`;
        } else if (ctx.phase === 'first-half' || ctx.phase === 'second-half') {
            text += `💡 **Tip:** Going now means shorter queues but you might miss some action!`;
        }

        return { text, type: 'rich', action: { type: 'navigate', target: top } };
    }

    function findSeat(ctx) {
        const seat = ctx.user.seat;
        let text = `🪑 Your seat: **${seat.section}, Row ${seat.row}, Seat ${seat.number}**\n\n`;
        text += `📍 You're currently in the ${ctx.user.zone.replace(/-/g, ' ')} area.\n`;

        const zoneDensity = ctx.environment.zoneDensity;
        if (zoneDensity > 70) {
            text += `\n⚠️ Your area is quite crowded (${zoneDensity}% capacity). Take the outer concourse for easier access.`;
        } else {
            text += `\n✅ Crowd level is manageable. Head to your section and look for Row ${seat.row}.`;
        }

        return { text, type: 'rich' };
    }

    function findExit(ctx) {
        const gates = ctx.nearby.gates;
        const state = store.getState();

        let text = `🚪 **Best Exit Routes:**\n\n`;

        gates.forEach((g, i) => {
            const queue = state.queues[g.id] || { wait: 0 };
            const eta = userCtx.getETAMinutes(g.x, g.y);
            const marker = i === 0 ? '🏆 Recommended' : `Option ${i + 1}`;
            text += `**${marker}: ${g.name}**\n⏱️ Queue: ~${queue.wait} min | 🚶 Walk: ~${eta} min\n\n`;
        });

        if (ctx.phase === 'post-match') {
            text += `💡 **Tip:** Wait 10-15 minutes after the match ends for significantly shorter exit queues!`;
        }

        return { text, type: 'rich', action: { type: 'navigate', target: gates[0] } };
    }

    function checkQueues(ctx) {
        const state = store.getState();
        const queues = state.queues;
        let text = `📊 **Current Queue Times:**\n\n`;

        const stadium = store.getStadium();
        const allPoints = [...stadium.amenities.filter(a => ['food', 'restroom'].includes(a.type)), ...stadium.gates];

        const sorted = allPoints.map(p => ({
            ...p,
            queue: queues[p.id] || { wait: 0, people: 0 }
        })).sort((a, b) => a.queue.wait - b.queue.wait);

        sorted.slice(0, 6).forEach(p => {
            const icon = p.type === 'food' ? '🍕' : p.type === 'restroom' ? '🚻' : '🚪';
            const waitColor = p.queue.wait <= 3 ? '🟢' : p.queue.wait <= 8 ? '🟡' : '🔴';
            text += `${icon} ${p.name}: ${waitColor} ${p.queue.wait} min (${p.queue.people} people)\n`;
        });

        return { text, type: 'rich' };
    }

    function checkCrowd(ctx) {
        const state = store.getState();
        const stadium = store.getStadium();
        let text = `🗺️ **Crowd Density Overview:**\n\n`;
        text += `📊 Overall: **${ctx.environment.avgDensity}%** | Your area: **${ctx.environment.zoneDensity}%**\n\n`;

        const zones = stadium.zones.filter(z => z.type !== 'field').map(z => ({
            ...z,
            density: state.crowdDensity[z.id] || 0
        })).sort((a, b) => a.density - b.density);

        text += `**Least crowded:**\n`;
        zones.slice(0, 3).forEach(z => {
            text += `🟢 ${z.name}: ${z.density}%\n`;
        });

        text += `\n**Most crowded:**\n`;
        zones.slice(-3).reverse().forEach(z => {
            text += `🔴 ${z.name}: ${z.density}%\n`;
        });

        return { text, type: 'rich' };
    }

    function matchUpdate(ctx) {
        const score = ctx.score;
        const event = ctx.stadium.event;
        let text = `🏏 **${event.teams.home.name} vs ${event.teams.away.name}**\n\n`;
        text += `📊 Score: **${event.teams.home.abbr} ${score.home}** - **${score.away} ${event.teams.away.abbr}**\n`;
        text += `📍 Phase: ${NavSense.EventTimeline.getPhaseDisplay(ctx.phase)}\n\n`;

        const state = store.getState();
        if (state.highlights.length > 0) {
            text += `**Recent Highlights:**\n`;
            state.highlights.slice(0, 3).forEach(h => {
                text += `${h.title} — ${h.message}\n`;
            });
        }

        return { text, type: 'rich' };
    }

    function getHelp(ctx) {
        let text = `🆘 **How can I help?**\n\n`;
        text += `🏥 **First Aid:** Located at South Concourse (24/7 during event)\n`;
        text += `👮 **Security:** Dial *100 on any event phone, or ask any staff member\n`;
        text += `📦 **Lost & Found:** Visit the Info Desk at North Concourse\n`;
        text += `♿ **Accessibility:** Wheelchair assistance available at all gates\n\n`;
        text += `For emergencies, stay calm and follow staff instructions. Emergency exits are at all four gates.`;

        return { text, type: 'rich' };
    }

    function findMerch(ctx) {
        const merch = NavSense.UserContext.getNearbyAmenities('merchandise');
        if (merch.length > 0) {
            const shop = merch[0];
            const eta = userCtx.getETAMinutes(shop.x, shop.y);
            return {
                text: `🛍️ **${shop.name}** is ${eta} min walk from you!\n\nGet official jerseys, caps, and souvenirs. The halftime rush usually clears up 5 minutes after play resumes.`,
                type: 'rich',
                action: { type: 'navigate', target: shop }
            };
        }
        return { text: `🛍️ The Fan Store is located at the North Concourse. Check it out for official merchandise!`, type: 'text' };
    }

    function preOrderInfo(ctx) {
        let text = `📱 **Pre-Order & Skip the Line!**\n\n`;
        text += `You can pre-order from any food counter and pick up when it's ready:\n\n`;
        text += `1. Go to **Queues** tab\n`;
        text += `2. Select a food counter\n`;
        text += `3. Tap **Pre-Order** and choose your items\n`;
        text += `4. You'll be notified when your order is ready!\n\n`;
        text += `💡 Average pickup time: 5-8 minutes after ordering.`;
        return { text, type: 'rich' };
    }

    function getRecommendation(ctx) {
        let text = '';
        if (ctx.phase === 'first-half' || ctx.phase === 'second-half') {
            text = `💡 **Smart Recommendation:**\n\nThe best time to get food/use restrooms during play is in the next few minutes — queues are ${ctx.environment.avgWait <= 5 ? 'short' : 'moderate'} right now.\n\n`;
            if (ctx.environment.zoneDensity < 50) {
                text += `Your area has low crowd density, so you can easily return to your seat. Go now! ⏰`;
            } else {
                text += `⚠️ Your area is fairly crowded. Use the side aisles for easier movement.`;
            }
        } else if (ctx.phase === 'halftime') {
            text = `💡 **Halftime Tips:**\n\n🍕 Food queues are longest NOW. Pre-order or wait 5 min for them to ease.\n🚻 Restrooms are busy — try the East or West side ones for shorter lines.\n🏪 Great time to visit the Fan Store!`;
        } else {
            text = `💡 **Recommendation:** Explore the stadium, grab some snacks, and settle into your seat. Enjoy the atmosphere! 🎉`;
        }
        return { text, type: 'rich' };
    }

    function navigateHelp(ctx) {
        return {
            text: `🗺️ **Navigation Help:**\n\nTap the **Navigate** tab at the bottom to:\n\n📍 Find your seat\n🍕 Route to food courts\n🚻 Locate nearest restrooms\n🚪 Find the best exit\n\nI'll show you the fastest route and avoid crowded areas automatically!`,
            type: 'rich'
        };
    }

    function defaultResponse(ctx) {
        const responses = [
            `I'm here to help! You can ask me about:\n\n🗺️ Navigation & directions\n🍕 Food & drink locations\n🚻 Restroom queues\n🏏 Match updates\n🚪 Exit routes\n🆘 Help & safety`,
            `I didn't quite catch that. Try asking me something like "Where's the nearest restroom?" or "What's the score?"`,
            `I can help with navigation, queues, food recommendations, and match updates. What would you like to know?`
        ];
        return { text: responses[Math.floor(Math.random() * responses.length)], type: 'text' };
    }

    return { generateResponse };
})();
