/* ============================================
   NavSense AI — Event Timeline Engine
   ============================================ */

NavSense.EventTimeline = (() => {
    const store = NavSense.DataStore;
    let intervalId = null;
    let phaseStartTime = Date.now();

    const phases = ['pre-match', 'first-half', 'halftime', 'second-half', 'post-match'];

    // Duration in real seconds for each phase (at 1x speed)
    const phaseDurations = {
        'pre-match': 60,
        'first-half': 120,
        'halftime': 45,
        'second-half': 120,
        'post-match': 60,
    };

    // Scripted highlights
    const scriptedHighlights = {
        'first-half': [
            { at: 15, type: 'wicket', title: '🏏 WICKET!', message: 'CSK loses early wicket! Caught at slip.', team: 'away' },
            { at: 40, type: 'boundary', title: '🔥 SIX!', message: 'MI smashes a massive six over mid-wicket!', team: 'home' },
            { at: 70, type: 'score', title: '📊 Score Update', message: 'MI: 87/2 after 10 overs. Run rate: 8.7', team: 'home' },
            { at: 100, type: 'boundary', title: '💥 FOUR!', message: 'Elegant cover drive races to the boundary!', team: 'home' },
        ],
        'halftime': [
            { at: 10, type: 'info', title: '🎤 Entertainment', message: 'Halftime show starting now at the main stage!', team: null },
            { at: 25, type: 'offer', title: '🍕 Flash Sale!', message: '20% off at North Food Court for the next 10 mins!', team: null },
        ],
        'second-half': [
            { at: 20, type: 'wicket', title: '🏏 WICKET!', message: 'MI gets a crucial breakthrough! LBW!', team: 'home' },
            { at: 50, type: 'boundary', title: '🔥 SIX!', message: 'CSK fires back with a towering six!', team: 'away' },
            { at: 80, type: 'score', title: '📊 Score Update', message: 'CSK: 112/4. Need 68 from 30 balls!', team: 'away' },
            { at: 100, type: 'boundary', title: '💥 FOUR! FOUR!', message: 'Back-to-back boundaries! The crowd goes wild!', team: 'away' },
            { at: 110, type: 'highlight', title: '🎯 Incredible Catch!', message: 'Stunning diving catch at the boundary! The stadium erupts!', team: 'home' },
        ]
    };

    const triggeredHighlights = new Set();

    function update() {
        const state = store.getState();
        const speed = state.simulationSpeed || 1;
        const elapsed = ((Date.now() - phaseStartTime) / 1000) * speed;

        store.setState('phaseTime', Math.floor(elapsed));

        // Check phase transition
        const duration = phaseDurations[state.currentPhase] || 60;
        if (elapsed >= duration) {
            advancePhase();
            return;
        }

        // Check scripted highlights
        const highlights = scriptedHighlights[state.currentPhase] || [];
        highlights.forEach(h => {
            const key = `${state.currentPhase}-${h.at}`;
            if (elapsed >= h.at && !triggeredHighlights.has(key)) {
                triggeredHighlights.add(key);
                triggerHighlight(h);
            }
        });

        // Random score updates
        if (state.currentPhase === 'first-half' || state.currentPhase === 'second-half') {
            if (Math.random() < 0.01 * speed) {
                const isHome = state.currentPhase === 'first-half';
                const team = isHome ? 'home' : 'away';
                const runs = [1, 1, 1, 2, 2, 4, 6][Math.floor(Math.random() * 7)];
                state.score[team] += runs;
                store.emit('scoreUpdate', state.score);
            }
        }
    }

    function triggerHighlight(h) {
        store.addHighlight({
            type: h.type,
            title: h.title,
            message: h.message,
            team: h.team
        });

        store.addNotification({
            type: h.type === 'offer' ? 'offer' : 'match',
            title: h.title,
            message: h.message,
            icon: getHighlightIcon(h.type),
            priority: h.type === 'wicket' ? 'high' : 'medium'
        });

        store.emit('highlight', h);
    }

    function getHighlightIcon(type) {
        const icons = { wicket: 'zap', boundary: 'flame', score: 'bar-chart-3', info: 'info', offer: 'tag', highlight: 'star' };
        return icons[type] || 'info';
    }

    function advancePhase() {
        const state = store.getState();
        const currentIdx = phases.indexOf(state.currentPhase);
        if (currentIdx < phases.length - 1) {
            const nextPhase = phases[currentIdx + 1];
            phaseStartTime = Date.now();
            store.setState('currentPhase', nextPhase);
            store.setState('phaseTime', 0);

            store.addNotification({
                type: 'event',
                title: getPhaseTitle(nextPhase),
                message: getPhaseMessage(nextPhase),
                icon: 'clock',
                priority: 'high'
            });

            store.emit('phaseChange', nextPhase);
        }
    }

    function setPhase(phaseName) {
        if (phases.includes(phaseName)) {
            phaseStartTime = Date.now();
            triggeredHighlights.clear();
            store.setState('currentPhase', phaseName);
            store.setState('phaseTime', 0);
            store.emit('phaseChange', phaseName);
        }
    }

    function getPhaseTitle(phase) {
        const titles = {
            'pre-match': '🏟️ Pre-Match',
            'first-half': '🏏 Match Started!',
            'halftime': '⏸️ Innings Break',
            'second-half': '🏏 2nd Innings!',
            'post-match': '🏆 Match Over!'
        };
        return titles[phase] || phase;
    }

    function getPhaseMessage(phase) {
        const msgs = {
            'pre-match': 'Welcome to the stadium! Find your seat and enjoy.',
            'first-half': 'The first innings is underway! MI batting first.',
            'halftime': 'Innings break — great time to grab food or visit restrooms.',
            'second-half': 'CSK comes out to bat. Game on!',
            'post-match': 'What a match! Please follow exit signs for smooth departure.'
        };
        return msgs[phase] || '';
    }

    function getPhaseDisplay(phase) {
        const labels = {
            'pre-match': 'Pre-Match',
            'first-half': '1st Innings',
            'halftime': 'Break',
            'second-half': '2nd Innings',
            'post-match': 'Post-Match'
        };
        return labels[phase] || phase;
    }

    function getPhaseProgress() {
        const state = store.getState();
        const duration = phaseDurations[state.currentPhase] || 60;
        return Math.min(100, (state.phaseTime / duration) * 100);
    }

    function start() {
        if (intervalId) return;
        phaseStartTime = Date.now();
        const speed = store.getState().simulationSpeed || 1;
        intervalId = setInterval(update, Math.max(200, 1000 / speed));
    }

    function stop() {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    function restart() { stop(); start(); }

    store.on('stateChange:simulationSpeed', () => restart());

    return { start, stop, restart, setPhase, advancePhase, getPhaseDisplay, getPhaseProgress, phases };
})();
