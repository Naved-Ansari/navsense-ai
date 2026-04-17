/* ============================================
   NavSense AI — Admin Bottlenecks View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.AdminBottlenecks = (() => {
    const store = NavSense.DataStore;
    let updateInterval = null;

    function render() {
        const container = document.getElementById('main-content');

        container.innerHTML = `
            <div class="admin-container view-enter">
                <div class="admin-header">
                    <div>
                        <h1 class="admin-title">Bottleneck Detection</h1>
                        <div class="admin-subtitle">Auto-detected congestion points and recommended actions</div>
                    </div>
                    <button class="btn btn-primary btn-sm" id="refresh-bottlenecks">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                </div>

                <!-- Map -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Congestion Map</div>
                    </div>
                    <div id="bottleneck-map-container"></div>
                </div>

                <!-- Bottleneck List -->
                <div style="margin-top:var(--space-4)">
                    <div id="bottleneck-list">
                        ${renderBottlenecks()}
                    </div>
                </div>

                <div style="height: var(--space-8)"></div>
            </div>
        `;

        NavSense.StadiumMap.render(document.getElementById('bottleneck-map-container'), {
            id: 'bottleneck-map',
            showAmenities: true,
            showUser: false
        });

        document.getElementById('refresh-bottlenecks')?.addEventListener('click', () => {
            document.getElementById('bottleneck-list').innerHTML = renderBottlenecks();
            NavSense.StadiumMap.updateDensities('bottleneck-map');
            if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
        startUpdates();
    }

    function renderBottlenecks() {
        const state = store.getState();
        const stadium = store.getStadium();

        // Detect bottlenecks
        const bottlenecks = [];

        // Zone-based bottlenecks
        stadium.zones.filter(z => z.type !== 'field').forEach(zone => {
            const density = state.crowdDensity[zone.id] || 0;
            if (density > 70) {
                const severity = density > 85 ? 'high' : density > 75 ? 'medium' : 'low';
                bottlenecks.push({
                    id: zone.id,
                    name: zone.name,
                    type: 'crowd',
                    severity,
                    density,
                    description: `Crowd density at ${density}%. ${density > 85 ? 'Critical congestion detected.' : 'Elevated crowd levels.'} Capacity: ${zone.capacity.toLocaleString()}.`,
                    actions: getRecommendedActions(severity, 'crowd', zone)
                });
            }
        });

        // Queue-based bottlenecks
        Object.entries(state.queues).forEach(([id, q]) => {
            if (q.wait > 8) {
                const point = [...stadium.amenities, ...stadium.gates].find(a => a.id === id);
                if (!point) return;
                const severity = q.wait > 15 ? 'high' : q.wait > 10 ? 'medium' : 'low';
                bottlenecks.push({
                    id,
                    name: point.name,
                    type: 'queue',
                    severity,
                    wait: q.wait,
                    description: `Queue wait time is ${q.wait} min with ${q.people} people waiting. ${q.trend === 'rising' ? 'Trend is rising.' : ''}`,
                    actions: getRecommendedActions(severity, 'queue', point)
                });
            }
        });

        // Sort by severity
        const severityOrder = { high: 0, medium: 1, low: 2 };
        bottlenecks.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        if (!bottlenecks.length) {
            return `<div class="admin-card" style="text-align:center;padding:var(--space-8);">
                <div style="font-size:var(--text-3xl);margin-bottom:var(--space-3)">✅</div>
                <h3 style="color:var(--color-success)">No Bottlenecks Detected</h3>
                <p style="font-size:var(--text-sm);color:var(--text-tertiary);margin-top:var(--space-2)">All zones and queues are operating within normal parameters.</p>
            </div>`;
        }

        return bottlenecks.map(b => {
            const severityColors = { high: 'var(--color-danger)', medium: 'var(--color-warning)', low: 'var(--color-info)' };
            const severityIcons = { high: 'alert-circle', medium: 'alert-triangle', low: 'info' };
            const color = severityColors[b.severity];

            return `<div class="bottleneck-card severity-${b.severity}">
                <div class="bottleneck-severity" style="background:${color}15;color:${color}">
                    <i data-lucide="${severityIcons[b.severity]}"></i>
                </div>
                <div class="bottleneck-info">
                    <div class="bottleneck-title">${b.name} <span class="badge badge-${b.severity === 'high' ? 'danger' : b.severity === 'medium' ? 'warning' : 'info'}">${b.severity.toUpperCase()}</span></div>
                    <div class="bottleneck-description">${b.description}</div>
                    <div class="bottleneck-actions">
                        ${b.actions.map(a => `<button class="btn btn-sm ${a.primary ? 'btn-primary' : 'btn-secondary'}" onclick="NavSense.Toast.show({title:'Action Taken',message:'${a.label} — dispatched.',type:'success'})">${a.label}</button>`).join('')}
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    function getRecommendedActions(severity, type, point) {
        const actions = [];
        if (type === 'crowd') {
            actions.push({ label: '👮 Deploy Staff', primary: severity === 'high' });
            actions.push({ label: '🔀 Redirect Flow', primary: false });
            if (severity === 'high') actions.push({ label: '📢 Send Alert', primary: false });
        } else {
            actions.push({ label: '➕ Open Counter', primary: severity === 'high' });
            actions.push({ label: '📣 Announce Alternative', primary: false });
        }
        return actions;
    }

    function startUpdates() {
        stopUpdates();
        updateInterval = setInterval(() => {
            const list = document.getElementById('bottleneck-list');
            if (list) {
                list.innerHTML = renderBottlenecks();
                NavSense.StadiumMap.updateDensities('bottleneck-map');
                if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
            }
        }, 5000);
    }

    function stopUpdates() {
        if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
    }

    function unmount() { stopUpdates(); }

    return { render, unmount };
})();
