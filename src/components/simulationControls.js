/* ============================================
   NavSense AI — Simulation Controls
   ============================================ */

NavSense.SimControls = (() => {
    const store = NavSense.DataStore;

    function render() {
        const state = store.getState();
        const isAdmin = state.isAdmin;

        // Remove existing
        const existing = document.getElementById('sim-controls');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.id = 'sim-controls';
        div.className = `sim-controls ${isAdmin ? 'admin-mode' : ''}`;

        div.innerHTML = `
            <div class="sim-phase" id="sim-phase-display">${NavSense.EventTimeline.getPhaseDisplay(state.currentPhase)}</div>
            <button class="sim-speed-btn ${state.simulationSpeed === 1 ? 'active' : ''}" data-speed="1">1x</button>
            <button class="sim-speed-btn ${state.simulationSpeed === 5 ? 'active' : ''}" data-speed="5">5x</button>
            <button class="sim-speed-btn ${state.simulationSpeed === 10 ? 'active' : ''}" data-speed="10">10x</button>
            <button class="sim-speed-btn" data-action="next" title="Skip to next phase">⏭</button>
        `;

        div.querySelectorAll('[data-speed]').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.dataset.speed);
                store.setState('simulationSpeed', speed);
                div.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('active', parseInt(b.dataset.speed) === speed));
            });
        });

        div.querySelector('[data-action="next"]').addEventListener('click', () => {
            NavSense.EventTimeline.advancePhase();
        });

        document.getElementById('app').appendChild(div);

        // Update phase display
        store.on('phaseChange', (phase) => {
            const display = document.getElementById('sim-phase-display');
            if (display) display.textContent = NavSense.EventTimeline.getPhaseDisplay(phase);
        });
    }

    return { render };
})();
