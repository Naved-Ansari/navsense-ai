/* ============================================
   NavSense AI — Admin Analytics View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.AdminAnalytics = (() => {
    const store = NavSense.DataStore;
    let charts = [];
    let updateInterval = null;

    function render() {
        const container = document.getElementById('main-content');
        const state = store.getState();

        container.innerHTML = `
            <div class="admin-container view-enter">
                <div class="admin-header">
                    <div>
                        <h1 class="admin-title">Analytics</h1>
                        <div class="admin-subtitle">Real-time crowd and queue insights</div>
                    </div>
                </div>

                <div class="admin-grid-2">
                    <!-- Zone Density Comparison -->
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <div class="admin-card-title">Zone Density Comparison</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="zone-bar-chart"></canvas>
                        </div>
                    </div>

                    <!-- Queue Wait Distribution -->
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <div class="admin-card-title">Queue Wait Distribution</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="queue-bar-chart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="admin-grid-2" style="margin-top:var(--space-4)">
                    <!-- Capacity Utilization -->
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <div class="admin-card-title">Capacity Utilization</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="capacity-doughnut-chart"></canvas>
                        </div>
                    </div>

                    <!-- Gate Flow -->
                    <div class="admin-card">
                        <div class="admin-card-header">
                            <div class="admin-card-title">Gate Queue Status</div>
                        </div>
                        <div class="chart-container">
                            <canvas id="gate-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Insights -->
                <div class="admin-card" style="margin-top:var(--space-4)">
                    <div class="admin-card-header">
                        <div class="admin-card-title">AI-Generated Insights</div>
                        <span class="badge badge-primary">Auto-analyzed</span>
                    </div>
                    <div id="ai-insights">
                        ${renderInsights()}
                    </div>
                </div>

                <div style="height: var(--space-8)"></div>
            </div>
        `;

        initCharts();
        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
        startUpdates();
    }

    function initCharts() {
        if (typeof Chart === 'undefined') return;
        const state = store.getState();
        const stadium = store.getStadium();

        // Zone density bar chart
        const zones = stadium.zones.filter(z => z.type !== 'field');
        const zoneCtx = document.getElementById('zone-bar-chart');
        if (zoneCtx) {
            const c = new Chart(zoneCtx, {
                type: 'bar',
                data: {
                    labels: zones.map(z => z.name.replace(' Stand', '').replace(' Pavilion', '').replace(' Concourse', '')),
                    datasets: [{
                        label: 'Density %',
                        data: zones.map(z => state.crowdDensity[z.id] || 0),
                        backgroundColor: zones.map(z => {
                            const d = state.crowdDensity[z.id] || 0;
                            if (d < 40) return '#10b98180';
                            if (d < 70) return '#f59e0b80';
                            return '#ef444480';
                        }),
                        borderColor: zones.map(z => {
                            const d = state.crowdDensity[z.id] || 0;
                            if (d < 40) return '#10b981';
                            if (d < 70) return '#f59e0b';
                            return '#ef4444';
                        }),
                        borderWidth: 1,
                        borderRadius: 6,
                    }]
                },
                options: chartOptions('Density (%)', 100)
            });
            charts.push(c);
        }

        // Queue wait bar chart
        const allQueues = [
            ...stadium.amenities.filter(a => ['food', 'restroom'].includes(a.type)),
            ...stadium.gates.map(g => ({ ...g, type: 'gate' }))
        ];
        const queueCtx = document.getElementById('queue-bar-chart');
        if (queueCtx) {
            const c = new Chart(queueCtx, {
                type: 'bar',
                data: {
                    labels: allQueues.map(q => q.name.replace('North ', 'N ').replace('South ', 'S ').replace('East ', 'E ').replace('West ', 'W ')),
                    datasets: [{
                        label: 'Wait (min)',
                        data: allQueues.map(q => state.queues[q.id]?.wait || 0),
                        backgroundColor: allQueues.map(q => {
                            const w = state.queues[q.id]?.wait || 0;
                            if (w <= 3) return '#10b98180';
                            if (w <= 8) return '#f59e0b80';
                            return '#ef444480';
                        }),
                        borderRadius: 6,
                    }]
                },
                options: chartOptions('Wait (min)')
            });
            charts.push(c);
        }

        // Capacity doughnut
        const avgDensity = store.getAvgDensity();
        const doughnutCtx = document.getElementById('capacity-doughnut-chart');
        if (doughnutCtx) {
            const c = new Chart(doughnutCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Occupied', 'Available'],
                    datasets: [{
                        data: [avgDensity, 100 - avgDensity],
                        backgroundColor: ['#00d4ff80', '#1e254020'],
                        borderColor: ['#00d4ff', '#1e2540'],
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
                    }
                }
            });
            charts.push(c);
        }

        // Gate chart
        const gateCtx = document.getElementById('gate-chart');
        if (gateCtx) {
            const c = new Chart(gateCtx, {
                type: 'bar',
                data: {
                    labels: stadium.gates.map(g => g.name.replace(' (', '\n(')),
                    datasets: [
                        {
                            label: 'Wait (min)',
                            data: stadium.gates.map(g => state.queues[g.id]?.wait || 0),
                            backgroundColor: '#3b82f680',
                            borderColor: '#3b82f6',
                            borderWidth: 1,
                            borderRadius: 6,
                        },
                        {
                            label: 'People',
                            data: stadium.gates.map(g => state.queues[g.id]?.people || 0),
                            backgroundColor: '#8b5cf680',
                            borderColor: '#8b5cf6',
                            borderWidth: 1,
                            borderRadius: 6,
                        }
                    ]
                },
                options: chartOptions('')
            });
            charts.push(c);
        }
    }

    function chartOptions(yLabel, yMax) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 9, family: 'Inter' }, maxRotation: 45 } },
                y: { min: 0, max: yMax, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10, family: 'Inter' } }, title: { display: !!yLabel, text: yLabel, color: '#64748b' } }
            }
        };
    }

    function renderInsights() {
        const state = store.getState();
        const stadium = store.getStadium();
        const avgDensity = store.getAvgDensity();
        const insights = [];

        // Find most crowded zone
        const zones = stadium.zones.filter(z => z.type !== 'field');
        const mostCrowded = zones.reduce((max, z) => (state.crowdDensity[z.id] || 0) > (state.crowdDensity[max.id] || 0) ? z : max, zones[0]);
        const mcDensity = state.crowdDensity[mostCrowded.id] || 0;

        if (mcDensity > 80) {
            insights.push({ icon: 'alert-triangle', color: 'var(--color-danger)', text: `<strong>${mostCrowded.name}</strong> is critically crowded at ${mcDensity}%. Consider deploying additional staff or redirecting foot traffic.` });
        }

        // Find longest queue
        const longestQueue = Object.entries(state.queues).reduce((max, [id, q]) => q.wait > (max[1]?.wait || 0) ? [id, q] : max, ['', { wait: 0 }]);
        if (longestQueue[1].wait > 10) {
            const point = [...stadium.amenities, ...stadium.gates].find(a => a.id === longestQueue[0]);
            insights.push({ icon: 'clock', color: 'var(--color-warning)', text: `<strong>${point?.name || longestQueue[0]}</strong> has the longest wait at ${longestQueue[1].wait} min. Recommend opening additional counters.` });
        }

        if (avgDensity < 40) {
            insights.push({ icon: 'trending-down', color: 'var(--color-info)', text: `Overall crowd density is low at ${avgDensity}%. Stadium is well within comfortable capacity.` });
        } else if (avgDensity > 70) {
            insights.push({ icon: 'trending-up', color: 'var(--color-danger)', text: `Overall crowd density is elevated at ${avgDensity}%. Monitor concourse areas for potential bottlenecks.` });
        }

        insights.push({ icon: 'brain', color: 'var(--brand-primary)', text: `Current phase: <strong>${NavSense.EventTimeline.getPhaseDisplay(state.currentPhase)}</strong>. AI predictions suggest ${state.currentPhase === 'halftime' ? 'food court congestion will peak in 2-3 minutes' : state.currentPhase === 'post-match' ? 'exit gates will see peak load in 5 minutes' : 'stable conditions for the next few minutes'}.` });

        return insights.map(i => `
            <div style="display:flex;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--border-primary);">
                <div style="width:32px;height:32px;border-radius:var(--radius-md);background:${i.color}15;color:${i.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i data-lucide="${i.icon}" style="width:16px;height:16px"></i>
                </div>
                <div style="font-size:var(--text-sm);color:var(--text-secondary);line-height:var(--leading-relaxed)">${i.text}</div>
            </div>
        `).join('');
    }

    function startUpdates() {
        stopUpdates();
        updateInterval = setInterval(() => {
            const insights = document.getElementById('ai-insights');
            if (insights) {
                insights.innerHTML = renderInsights();
                if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
            }
        }, 5000);
    }

    function stopUpdates() {
        if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
    }

    function unmount() {
        stopUpdates();
        charts.forEach(c => c.destroy());
        charts = [];
    }

    return { render, unmount };
})();
