/* ============================================
   NavSense AI — Badge Component
   ============================================ */
NavSense.Badge = (() => {
    function create(text, type, options) {
        type = type || 'info';
        options = options || {};
        const dot = options.dot ? 'badge-dot' : '';
        const pulse = options.pulse ? 'badge-pulse' : '';
        return `<span class="badge badge-${type} ${dot} ${pulse}">${text}</span>`;
    }

    function density(value) {
        if (value < 25) return create('Low', 'success', { dot: true });
        if (value < 50) return create('Moderate', 'info', { dot: true });
        if (value < 75) return create('High', 'warning', { dot: true, pulse: true });
        return create('Critical', 'danger', { dot: true, pulse: true });
    }

    function trend(dir) {
        if (dir === 'rising') return create('↑ Rising', 'danger');
        if (dir === 'falling') return create('↓ Falling', 'success');
        return create('→ Stable', 'info');
    }

    function phase(name) {
        const types = {
            'pre-match': 'info',
            'first-half': 'success',
            'halftime': 'warning',
            'second-half': 'success',
            'post-match': 'secondary'
        };
        return create(NavSense.EventTimeline.getPhaseDisplay(name), types[name] || 'info', { dot: true, pulse: name.includes('half') });
    }

    return { create, density, trend, phase };
})();
