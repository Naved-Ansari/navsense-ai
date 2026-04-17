/* ============================================
   NavSense AI — Admin Overview View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.AdminOverview = (() => {
    const store = NavSense.DataStore;
    let updateInterval = null;

    function render() {
        const container = document.getElementById('main-content');
        const state = store.getState();
        const stadium = store.getStadium();
        const avgDensity = store.getAvgDensity();
        const avgWait = store.getQueueAvgWait();
        const totalPeople = Math.round(stadium.capacity * avgDensity / 100);
        const activeAlerts = state.notifications.filter(n => n.priority === 'high' && !n.read).length;

        container.innerHTML = `
            <div class="admin-container view-enter">
                <div class="admin-header">
                    <div>
                        <h1 class="admin-title">Dashboard</h1>
                        <div class="admin-subtitle">${stadium.event.name} • ${NavSense.EventTimeline.getPhaseDisplay(state.currentPhase)}</div>
                    </div>
                    <div class="admin-actions">
                        ${NavSense.Badge.phase(state.currentPhase)}
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="kpi-grid" id="kpi-grid">
                    <div class="metric-card">
                        <div class="metric-icon" style="background:rgba(var(--brand-primary-rgb),0.12);color:var(--brand-primary)">
                            <i data-lucide="users"></i>
                        </div>
                        <div class="metric-value" id="kpi-attendance">${totalPeople.toLocaleString()}</div>
                        <div class="metric-label">Estimated Attendance</div>
                        <div class="metric-trend up"><i data-lucide="trending-up" style="width:12px;height:12px"></i> of ${stadium.capacity.toLocaleString()} capacity</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon" style="background:rgba(var(--color-warning-rgb),0.12);color:var(--color-warning)">
                            <i data-lucide="gauge"></i>
                        </div>
                        <div class="metric-value" id="kpi-density" style="color:${store.getDensityColor(avgDensity)}">${avgDensity}%</div>
                        <div class="metric-label">Avg Crowd Density</div>
                        <div class="metric-trend ${avgDensity > 60 ? 'up' : 'down'}">${store.getDensityLabel(avgDensity)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon" style="background:rgba(var(--color-info-rgb),0.12);color:var(--color-info)">
                            <i data-lucide="clock"></i>
                        </div>
                        <div class="metric-value" id="kpi-wait" style="color:${store.getWaitColor(avgWait)}">${avgWait}<span style="font-size:var(--text-sm)">min</span></div>
                        <div class="metric-label">Avg Queue Wait</div>
                        <div class="metric-trend ${avgWait > 8 ? 'up' : 'down'}">${avgWait <= 5 ? 'Normal' : avgWait <= 10 ? 'Elevated' : 'High'}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon" style="background:rgba(var(--color-danger-rgb),0.12);color:var(--color-danger)">
                            <i data-lucide="alert-triangle"></i>
                        </div>
                        <div class="metric-value" id="kpi-alerts">${activeAlerts}</div>
                        <div class="metric-label">Active Alerts</div>
                        <div class="metric-trend ${activeAlerts > 0 ? 'up' : 'down'}">${activeAlerts > 0 ? 'Needs attention' : 'All clear'}</div>
                    </div>
                </div>

                <!-- Map & Zone Status -->
                <div class="admin-grid-3">
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <div class="admin-card-title">Live Crowd Heatmap</div>
                            <span style="font-size:var(--text-xs);color:var(--text-tertiary)">Auto-updating</span>
                        </div>
                        <div id="admin-map-container"></div>
                    </div>
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <div class="admin-card-title">Zone Status</div>
                        </div>
                        <div id="zone-status-list" style="max-height:380px;overflow-y:auto;">
                            ${renderZoneStatus()}
                        </div>
                    </div>
                </div>

                <!-- Crowd Flow Chart -->
                <div class="admin-card" style="margin-top:var(--space-4)">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Crowd Density Trend</div>
                        <div style="display:flex;gap:var(--space-2)">
                            <span class="chip active" data-chart-range="30">30s</span>
                            <span class="chip" data-chart-range="60">60s</span>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="density-chart"></canvas>
                    </div>
                </div>

                <!-- Queue Overview -->
                <div class="admin-card" style="margin-top:var(--space-4)">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Queue Performance</div>
                    </div>
                    <table class="zone-table">
                        <thead>
                            <tr>
                                <th>Point</th>
                                <th>Type</th>
                                <th>Wait</th>
                                <th>In Queue</th>
                                <th>Trend</th>
                            </tr>
                        </thead>
                        <tbody id="queue-table-body">
                            ${renderQueueTable()}
                        </tbody>
                    </table>
                </div>

                <div style="height: var(--space-8)"></div>
            </div>
        `;

        // Render map
        NavSense.StadiumMap.render(document.getElementById('admin-map-container'), {
            id: 'admin-stadium-map',
            showAmenities: true,
            showUser: false,
            onZoneClick: (zone) => {
                const density = state.crowdDensity[zone.id] || 0;
                NavSense.Toast.show({
                    title: zone.name,
                    message: `Density: ${density}% | Capacity: ${zone.capacity.toLocaleString()}`,
                    type: density > 75 ? 'danger' : density > 50 ? 'warning' : 'success'
                });
            }
        });

        // Init chart
        initDensityChart();

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
        startUpdates();
    }

    function renderZoneStatus() {
        const state = store.getState();
        const stadium = store.getStadium();

        return stadium.zones.filter(z => z.type !== 'field').map(zone => {
            const density = state.crowdDensity[zone.id] || 0;
            const people = Math.round(zone.capacity * density / 100);
            const color = store.getDensityColor(density);

            return `<div class="list-item" style="padding:var(--space-2) 0;">
                <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></div>
                <div class="list-item-content">
                    <div class="list-item-title" style="font-size:var(--text-xs)">${zone.name}</div>
                    <div class="list-item-subtitle">${people.toLocaleString()} / ${zone.capacity.toLocaleString()}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:var(--text-sm);font-weight:var(--font-bold);color:${color}">${density}%</div>
                </div>
            </div>`;
        }).join('');
    }

    function renderQueueTable() {
        const state = store.getState();
        const stadium = store.getStadium();
        const allPoints = [
            ...stadium.amenities.filter(a => ['food', 'restroom'].includes(a.type)),
            ...stadium.gates.map(g => ({ ...g, type: 'gate' }))
        ];

        return allPoints.map(p => {
            const q = state.queues[p.id] || { wait: 0, people: 0, trend: 'stable' };
            const typeLabels = { food: '🍕 Food', restroom: '🚻 Restroom', gate: '🚪 Gate' };
            return `<tr>
                <td style="font-weight:var(--font-semibold)">${p.name}</td>
                <td>${typeLabels[p.type] || p.type}</td>
                <td style="color:${store.getWaitColor(q.wait)};font-weight:var(--font-bold)">${q.wait} min</td>
                <td>${q.people}</td>
                <td>${NavSense.Badge.trend(q.trend)}</td>
            </tr>`;
        }).join('');
    }

    // Chart
    let densityChart = null;
    const chartData = { labels: [], datasets: [] };
    const chartHistory = {};

    function initDensityChart() {
        const ctx = document.getElementById('density-chart');
        if (!ctx || typeof Chart === 'undefined') return;

        const stadium = store.getStadium();
        const colors = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
        const mainZones = stadium.zones.filter(z => z.type === 'seating').slice(0, 4);

        chartData.labels = [];
        chartData.datasets = mainZones.map((z, i) => {
            chartHistory[z.id] = [];
            return {
                label: z.name,
                data: [],
                borderColor: colors[i % colors.length],
                backgroundColor: colors[i % colors.length] + '20',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 0,
            };
        });

        densityChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 }, color: '#94a3b8' } }
                },
                scales: {
                    x: { display: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
                    y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + '%' } }
                }
            }
        });
    }

    function updateChart() {
        if (!densityChart) return;
        const state = store.getState();
        const now = new Date().toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });

        chartData.labels.push(now);
        if (chartData.labels.length > 30) chartData.labels.shift();

        chartData.datasets.forEach((ds, i) => {
            const stadium = store.getStadium();
            const zones = stadium.zones.filter(z => z.type === 'seating').slice(0, 4);
            const zone = zones[i];
            if (zone) {
                ds.data.push(state.crowdDensity[zone.id] || 0);
                if (ds.data.length > 30) ds.data.shift();
            }
        });

        densityChart.update('none');
    }

    function startUpdates() {
        stopUpdates();
        updateInterval = setInterval(() => {
            // KPIs
            const state = store.getState();
            const stadium = store.getStadium();
            const avgDensity = store.getAvgDensity();
            const avgWait = store.getQueueAvgWait();
            const totalPeople = Math.round(stadium.capacity * avgDensity / 100);

            const el1 = document.getElementById('kpi-attendance');
            if (el1) el1.textContent = totalPeople.toLocaleString();

            const el2 = document.getElementById('kpi-density');
            if (el2) { el2.textContent = avgDensity + '%'; el2.style.color = store.getDensityColor(avgDensity); }

            const el3 = document.getElementById('kpi-wait');
            if (el3) { el3.innerHTML = avgWait + '<span style="font-size:var(--text-sm)">min</span>'; el3.style.color = store.getWaitColor(avgWait); }

            // Map
            NavSense.StadiumMap.updateDensities('admin-stadium-map');

            // Zone status
            const zsList = document.getElementById('zone-status-list');
            if (zsList) zsList.innerHTML = renderZoneStatus();

            // Queue table
            const qtBody = document.getElementById('queue-table-body');
            if (qtBody) qtBody.innerHTML = renderQueueTable();

            // Chart
            updateChart();
        }, 3000);
    }

    function stopUpdates() {
        if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
    }

    function unmount() {
        stopUpdates();
        if (densityChart) { densityChart.destroy(); densityChart = null; }
    }

    return { render, unmount };
})();
