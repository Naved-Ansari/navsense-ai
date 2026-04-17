/* ============================================
   NavSense AI — Home View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.Home = (() => {
    const store = NavSense.DataStore;
    let updateInterval = null;

    function render() {
        const container = document.getElementById('main-content');
        const state = store.getState();
        const stadium = store.getStadium();
        const user = NavSense.UserContext.getUser();
        const avgDensity = store.getAvgDensity();
        const avgWait = store.getQueueAvgWait();

        container.innerHTML = `
            <div class="view-container view-enter">
                <!-- Hero / Match Card -->
                <div class="home-hero" id="home-hero">
                    <div class="home-hero-event">
                        <span class="home-hero-live"><span></span>LIVE</span>
                        ${NavSense.Badge.phase(state.currentPhase)}
                    </div>
                    <div class="home-score">
                        <div class="home-team">
                            <div class="home-team-logo" style="border-color: ${stadium.event.teams.home.color}">${stadium.event.teams.home.abbr}</div>
                            <div class="home-team-name">${stadium.event.teams.home.name}</div>
                        </div>
                        <div>
                            <div class="home-vs" id="home-score-display">${state.score.home} - ${state.score.away}</div>
                            <div class="home-event-info">${stadium.event.name}</div>
                        </div>
                        <div class="home-team">
                            <div class="home-team-logo" style="border-color: ${stadium.event.teams.away.color}">${stadium.event.teams.away.abbr}</div>
                            <div class="home-team-name">${stadium.event.teams.away.name}</div>
                        </div>
                    </div>
                </div>

                <!-- Status Bar -->
                <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-5);">
                    <div class="card" style="flex:1;text-align:center;padding:var(--space-3);">
                        <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:${store.getDensityColor(avgDensity)}" id="home-density">${avgDensity}%</div>
                        <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em">Crowd</div>
                    </div>
                    <div class="card" style="flex:1;text-align:center;padding:var(--space-3);">
                        <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:${store.getWaitColor(avgWait)}" id="home-wait">${avgWait}<span style="font-size:var(--text-xs)">min</span></div>
                        <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em">Avg Wait</div>
                    </div>
                    <div class="card" style="flex:1;text-align:center;padding:var(--space-3);">
                        <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:var(--brand-primary)">${user.seat.row}${user.seat.number}</div>
                        <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em">Seat</div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="section-header">
                    <div class="section-title">Quick Actions</div>
                </div>
                <div class="quick-actions">
                    <div class="quick-action" data-action="navigate">
                        <div class="quick-action-icon" style="background:rgba(var(--brand-primary-rgb),0.12);color:var(--brand-primary)">
                            <i data-lucide="compass"></i>
                        </div>
                        <div class="quick-action-label">Navigate</div>
                        <div class="quick-action-sub">Find your way</div>
                    </div>
                    <div class="quick-action" data-action="queues">
                        <div class="quick-action-icon" style="background:rgba(var(--color-warning-rgb),0.12);color:var(--color-warning)">
                            <i data-lucide="clock"></i>
                        </div>
                        <div class="quick-action-label">Queues</div>
                        <div class="quick-action-sub">Check wait times</div>
                    </div>
                    <div class="quick-action" data-action="food">
                        <div class="quick-action-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">
                            <i data-lucide="utensils"></i>
                        </div>
                        <div class="quick-action-label">Food & Drinks</div>
                        <div class="quick-action-sub">Order ahead</div>
                    </div>
                    <div class="quick-action" data-action="assistant">
                        <div class="quick-action-icon" style="background:rgba(var(--brand-secondary-rgb),0.12);color:var(--brand-secondary)">
                            <i data-lucide="bot"></i>
                        </div>
                        <div class="quick-action-label">AI Assistant</div>
                        <div class="quick-action-sub">Ask anything</div>
                    </div>
                </div>

                <!-- Live Map Preview -->
                <div class="section-header" style="margin-top:var(--space-2)">
                    <div class="section-title">Live Crowd Map</div>
                    <div class="section-action" id="home-map-expand">View Full Map →</div>
                </div>
                <div id="home-map-container" style="margin-bottom:var(--space-5)"></div>

                <!-- Recent Highlights -->
                <div class="section-header">
                    <div class="section-title">Recent Updates</div>
                </div>
                <div id="home-highlights">
                    ${renderHighlights(state)}
                </div>

                <div style="height: var(--space-4)"></div>
            </div>
        `;

        // Render mini map
        NavSense.StadiumMap.render(document.getElementById('home-map-container'), {
            id: 'home-stadium-map',
            showAmenities: true,
            showUser: true,
            onZoneClick: (zone) => {
                const density = state.crowdDensity[zone.id] || 0;
                NavSense.Toast.show({
                    title: zone.name,
                    message: `Crowd density: ${density}% — ${store.getDensityLabel(density)}`,
                    type: density > 75 ? 'danger' : density > 50 ? 'warning' : 'success'
                });
            }
        });

        // Bind actions
        document.querySelectorAll('.quick-action').forEach(el => {
            el.addEventListener('click', () => {
                const action = el.dataset.action;
                if (action === 'food') {
                    NavSense.Router.navigate('queues');
                } else {
                    NavSense.Router.navigate(action);
                }
            });
        });

        document.getElementById('home-map-expand')?.addEventListener('click', () => {
            NavSense.Router.navigate('navigate');
        });

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });

        startUpdates();
    }

    function renderHighlights(state) {
        if (!state.highlights.length && !state.notifications.length) {
            return `<div class="card" style="text-align:center;padding:var(--space-6);">
                <div style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">🏟️</div>
                <p style="font-size:var(--text-sm);color:var(--text-tertiary)">Match updates will appear here</p>
            </div>`;
        }

        const items = [...state.highlights, ...state.notifications]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        return items.map(item => {
            const typeColors = {
                wicket: 'var(--color-danger)',
                boundary: 'var(--color-warning)',
                score: 'var(--color-info)',
                info: 'var(--brand-primary)',
                offer: 'var(--brand-secondary)',
                safety: 'var(--color-danger)',
                match: 'var(--brand-primary)',
                event: 'var(--color-info)',
                navigation: 'var(--brand-accent)',
                highlight: 'var(--color-warning)',
            };
            const color = typeColors[item.type] || 'var(--text-tertiary)';
            const ago = getTimeAgo(item.timestamp);

            return `<div class="notification-card" style="animation-delay:${Math.random() * 0.2}s">
                <div class="notification-icon-wrap" style="background:${color}15;color:${color}">
                    <i data-lucide="${item.icon || 'info'}"></i>
                </div>
                <div class="notification-body">
                    <div class="notification-title">${item.title}</div>
                    <div class="notification-text">${item.message}</div>
                    <div class="notification-time">${ago}</div>
                </div>
            </div>`;
        }).join('');
    }

    function getTimeAgo(ts) {
        const diff = Date.now() - new Date(ts).getTime();
        const secs = Math.floor(diff / 1000);
        if (secs < 60) return 'Just now';
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    }

    function startUpdates() {
        stopUpdates();
        updateInterval = setInterval(() => {
            const state = store.getState();
            // Update stats
            const avgDensity = store.getAvgDensity();
            const avgWait = store.getQueueAvgWait();

            const densityEl = document.getElementById('home-density');
            if (densityEl) {
                densityEl.textContent = avgDensity + '%';
                densityEl.style.color = store.getDensityColor(avgDensity);
            }

            const waitEl = document.getElementById('home-wait');
            if (waitEl) {
                waitEl.innerHTML = avgWait + '<span style="font-size:var(--text-xs)">min</span>';
                waitEl.style.color = store.getWaitColor(avgWait);
            }

            const scoreEl = document.getElementById('home-score-display');
            if (scoreEl) scoreEl.textContent = `${state.score.home} - ${state.score.away}`;

            // Update map
            NavSense.StadiumMap.updateDensities('home-stadium-map');

            // Update highlights
            const highlightsEl = document.getElementById('home-highlights');
            if (highlightsEl) {
                highlightsEl.innerHTML = renderHighlights(state);
                if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
            }
        }, 3000);
    }

    function stopUpdates() {
        if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
    }

    function unmount() {
        stopUpdates();
    }

    return { render, unmount };
})();
