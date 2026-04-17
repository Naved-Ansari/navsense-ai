/* ============================================
   NavSense AI — Navigate View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.Navigate = (() => {
    const store = NavSense.DataStore;
    let updateInterval = null;
    let selectedDest = null;

    function render() {
        const container = document.getElementById('main-content');
        const state = store.getState();
        const stadium = store.getStadium();

        container.innerHTML = `
            <div style="position:relative;height:100%;display:flex;flex-direction:column;" class="view-enter">
                <!-- Full map -->
                <div id="navigate-map" style="flex:1;min-height:0;"></div>

                <!-- Bottom Panel -->
                <div class="navigate-panel" id="navigate-panel">
                    <div class="modal-handle"></div>
                    <h4 style="margin-bottom:var(--space-3)">Where do you want to go?</h4>
                    <div class="destination-list" id="destination-list">
                        ${renderDestinations()}
                    </div>
                    <div id="route-info" style="display:none;"></div>
                </div>
            </div>
        `;

        renderMap();
        bindDestinations();
        startUpdates();
    }

    function renderDestinations() {
        const state = store.getState();
        const user = NavSense.UserContext.getUser();

        const destinations = [
            { id: 'my-seat', name: 'My Seat', sub: `${user.seat.section}, Row ${user.seat.row}`, icon: 'armchair', color: 'var(--brand-primary)', x: 45, y: 15 },
            { id: 'nearest-restroom', name: 'Nearest Restroom', sub: 'Auto-detect closest', icon: 'bath', color: 'var(--color-info)', x: 0, y: 0, auto: 'restroom' },
            { id: 'nearest-food', name: 'Nearest Food Court', sub: 'Shortest queue', icon: 'utensils', color: '#f59e0b', x: 0, y: 0, auto: 'food' },
            { id: 'nearest-exit', name: 'Best Exit', sub: 'Least congested', icon: 'log-out', color: 'var(--color-success)', x: 0, y: 0, auto: 'exit' },
            { id: 'fan-store', name: 'Fan Store', sub: 'North Concourse', icon: 'shopping-bag', color: 'var(--brand-secondary)', x: 40, y: 26 },
            { id: 'first-aid', name: 'First Aid', sub: 'South Concourse', icon: 'heart-pulse', color: 'var(--color-danger)', x: 55, y: 74 },
        ];

        return destinations.map(d => {
            const eta = d.auto ? '—' : NavSense.UserContext.getETAMinutes(d.x, d.y) + ' min';
            return `<div class="destination-item" data-dest='${JSON.stringify(d)}'>
                <div class="destination-icon" style="background:${d.color}15;color:${d.color}">
                    <i data-lucide="${d.icon}"></i>
                </div>
                <div class="destination-info">
                    <div class="destination-name">${d.name}</div>
                    <div class="destination-meta">${d.sub}</div>
                </div>
                <div class="destination-eta">${eta}</div>
            </div>`;
        }).join('');
    }

    function renderMap(route) {
        NavSense.StadiumMap.render(document.getElementById('navigate-map'), {
            id: 'navigate-stadium-map',
            fullscreen: true,
            showAmenities: true,
            showUser: true,
            route: route || null,
            onZoneClick: (zone) => {
                const density = store.getState().crowdDensity[zone.id] || 0;
                NavSense.Toast.show({
                    title: zone.name,
                    message: `Density: ${density}% — ${store.getDensityLabel(density)}`,
                    type: density > 75 ? 'danger' : density > 50 ? 'warning' : 'success'
                });
            },
            onAmenityClick: (amenity) => {
                selectDestination({ id: amenity.id, name: amenity.name, x: amenity.x, y: amenity.y, auto: false });
            }
        });
    }

    function bindDestinations() {
        document.querySelectorAll('.destination-item').forEach(el => {
            el.addEventListener('click', () => {
                const dest = JSON.parse(el.dataset.dest);
                selectDestination(dest);
            });
        });
        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function selectDestination(dest) {
        let target = { x: dest.x, y: dest.y };

        if (dest.auto === 'restroom') {
            const nearby = NavSense.UserContext.getNearbyAmenities('restroom', 100);
            if (nearby.length) {
                const best = nearby.sort((a, b) => {
                    const qa = store.getState().queues[a.id]?.wait || 99;
                    const qb = store.getState().queues[b.id]?.wait || 99;
                    return (qa + a.distance * 0.3) - (qb + b.distance * 0.3);
                })[0];
                target = { x: best.x, y: best.y };
                dest.name = best.name;
            }
        } else if (dest.auto === 'food') {
            const nearby = NavSense.UserContext.getNearbyAmenities('food', 100);
            if (nearby.length) {
                const best = nearby.sort((a, b) => {
                    const qa = store.getState().queues[a.id]?.wait || 99;
                    const qb = store.getState().queues[b.id]?.wait || 99;
                    return (qa + a.distance * 0.3) - (qb + b.distance * 0.3);
                })[0];
                target = { x: best.x, y: best.y };
                dest.name = best.name;
            }
        } else if (dest.auto === 'exit') {
            const gates = NavSense.UserContext.getNearestGate();
            if (gates.length) {
                target = { x: gates[0].x, y: gates[0].y };
                dest.name = gates[0].name;
            }
        }

        selectedDest = { ...dest, ...target };
        const eta = NavSense.UserContext.getETAMinutes(target.x, target.y);
        const zoneDensity = store.getAvgDensity();

        renderMap(target);

        const panel = document.getElementById('navigate-panel');
        panel.innerHTML = `
            <div class="modal-handle"></div>
            <div class="navigate-route-info">
                <div>
                    <div style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:2px">Route to</div>
                    <div style="font-size:var(--text-lg);font-weight:var(--font-bold)">${dest.name}</div>
                </div>
                <div style="text-align:right">
                    <div class="navigate-eta">${eta} min</div>
                    <div class="navigate-distance">${Math.round(NavSense.UserContext.getDistanceTo(target.x, target.y) * 3)}m walk</div>
                </div>
            </div>
            <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-3);">
                ${NavSense.Badge.density(zoneDensity)}
                <span class="badge badge-info">🚶 ${Math.round(NavSense.UserContext.getDistanceTo(target.x, target.y) * 3)} meters</span>
            </div>
            <div style="display:flex;gap:var(--space-2);">
                <button class="btn btn-primary btn-lg" style="flex:1" id="start-nav-btn">
                    <i data-lucide="navigation"></i> Start Navigation
                </button>
                <button class="btn btn-secondary btn-icon" id="back-destinations-btn">
                    <i data-lucide="arrow-left"></i>
                </button>
            </div>
        `;

        document.getElementById('back-destinations-btn')?.addEventListener('click', () => {
            render();
        });

        document.getElementById('start-nav-btn')?.addEventListener('click', () => {
            NavSense.Toast.show({
                title: 'Navigation Started',
                message: `Follow the route to ${dest.name}. ETA: ${eta} min.`,
                type: 'success',
                icon: 'navigation'
            });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function startUpdates() {
        stopUpdates();
        updateInterval = setInterval(() => {
            if (selectedDest) {
                NavSense.StadiumMap.updateDensities('navigate-stadium-map');
            } else {
                NavSense.StadiumMap.updateDensities('navigate-stadium-map');
            }
        }, 3000);
    }

    function stopUpdates() {
        if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
    }

    function unmount() {
        stopUpdates();
        selectedDest = null;
    }

    return { render, unmount };
})();
