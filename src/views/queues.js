/* ============================================
   NavSense AI — Queues View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.Queues = (() => {
    const store = NavSense.DataStore;
    let updateInterval = null;
    let activeFilter = 'all';

    function render() {
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="view-container view-enter">
                <div class="section-header">
                    <div>
                        <div class="section-title">Queue Times</div>
                        <div class="section-subtitle">Real-time waiting estimates</div>
                    </div>
                    <div style="font-size:var(--text-xs);color:var(--text-tertiary)">
                        Updated live
                        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--color-success);margin-left:4px;animation:pulseScale 1.5s infinite;vertical-align:middle"></span>
                    </div>
                </div>

                <!-- Filters -->
                <div class="queue-filters" id="queue-filters">
                    <button class="chip active" data-filter="all">All</button>
                    <button class="chip" data-filter="food">🍕 Food</button>
                    <button class="chip" data-filter="restroom">🚻 Restrooms</button>
                    <button class="chip" data-filter="gate">🚪 Gates</button>
                </div>

                <!-- Queue List -->
                <div id="queue-list">
                    ${renderQueues()}
                </div>

                <div style="height: var(--space-4)"></div>
            </div>
        `;

        bindFilters();
        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
        startUpdates();
    }

    function renderQueues() {
        const state = store.getState();
        const stadium = store.getStadium();

        const allPoints = [
            ...stadium.amenities.filter(a => ['food', 'restroom'].includes(a.type)).map(a => ({ ...a, queueType: a.type })),
            ...stadium.gates.map(g => ({ ...g, type: 'gate', queueType: 'gate', icon: 'door-open' }))
        ];

        const filtered = activeFilter === 'all' ? allPoints : allPoints.filter(p => p.queueType === activeFilter);

        const sorted = filtered.map(p => ({
            ...p,
            queue: state.queues[p.id] || { wait: 0, people: 0, trend: 'stable', capacity: 5 }
        })).sort((a, b) => a.queue.wait - b.queue.wait);

        if (!sorted.length) {
            return `<div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="clock"></i></div>
                <h3>No queues found</h3>
                <p>Try a different filter</p>
            </div>`;
        }

        return sorted.map(p => {
            const q = p.queue;
            const waitColor = store.getWaitColor(q.wait);
            const fillPercent = Math.min(100, (q.people / (q.capacity * 5)) * 100);
            const typeIcon = p.queueType === 'food' ? 'utensils' : p.queueType === 'restroom' ? 'bath' : 'door-open';
            const typeColor = p.queueType === 'food' ? '#f59e0b' : p.queueType === 'restroom' ? 'var(--color-info)' : 'var(--color-success)';
            const eta = NavSense.UserContext.getETAMinutes(p.x, p.y);

            return `<div class="queue-card" data-queue-id="${p.id}">
                <div class="queue-card-header">
                    <div class="queue-card-name" style="color:${typeColor}">
                        <i data-lucide="${typeIcon}"></i>
                        <span class="queue-card-title" style="color:var(--text-primary)">${p.name}</span>
                    </div>
                    <div class="queue-card-wait">
                        <div class="queue-card-time" style="color:${waitColor}" data-wait="${p.id}">${q.wait}</div>
                        <div class="queue-card-unit">min wait</div>
                    </div>
                </div>
                <div class="queue-card-bar">
                    <div class="queue-card-fill" style="width:${fillPercent}%;background:${waitColor}"></div>
                </div>
                <div class="queue-card-footer">
                    <div class="queue-card-info">
                        <i data-lucide="users"></i> ${q.people} people
                    </div>
                    <div class="queue-card-info">
                        <i data-lucide="footprints"></i> ${eta} min walk
                    </div>
                    <div>${NavSense.Badge.trend(q.trend)}</div>
                </div>
                ${p.queueType === 'food' ? `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:var(--space-3)" onclick="NavSense.Views.Queues.preOrder('${p.id}','${p.name}')">
                    <i data-lucide="shopping-bag"></i> Pre-Order & Skip Line
                </button>` : ''}
            </div>`;
        }).join('');
    }

    function bindFilters() {
        document.querySelectorAll('#queue-filters .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                activeFilter = chip.dataset.filter;
                document.querySelectorAll('#queue-filters .chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                document.getElementById('queue-list').innerHTML = renderQueues();
                if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
            });
        });
    }

    function preOrder(stallId, stallName) {
        const menuItems = [
            { name: 'Chicken Biryani', price: '₹350', time: '8 min' },
            { name: 'Veg Pizza', price: '₹250', time: '6 min' },
            { name: 'Cold Coffee', price: '₹150', time: '3 min' },
            { name: 'Samosa (2pc)', price: '₹100', time: '2 min' },
            { name: 'Pepsi 500ml', price: '₹80', time: '1 min' },
        ];

        NavSense.Modal.open({
            title: `Pre-Order — ${stallName}`,
            content: `
                <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">
                    Select items and skip the queue! Pick up when notified.
                </p>
                ${menuItems.map((item, i) => `
                    <div class="list-item" style="border:1px solid var(--border-primary);border-radius:var(--radius-lg);margin-bottom:var(--space-2);">
                        <div class="list-item-content">
                            <div class="list-item-title">${item.name}</div>
                            <div class="list-item-subtitle">${item.price} • Ready in ${item.time}</div>
                        </div>
                        <label class="toggle">
                            <input type="checkbox" data-item="${i}">
                            <span class="toggle-track"></span>
                            <span class="toggle-thumb"></span>
                        </label>
                    </div>
                `).join('')}
                <button class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-4)" id="confirm-preorder-btn">
                    <i data-lucide="check-circle"></i> Confirm Order
                </button>
            `
        });

        setTimeout(() => {
            document.getElementById('confirm-preorder-btn')?.addEventListener('click', () => {
                const selected = [];
                document.querySelectorAll('[data-item]:checked').forEach(cb => {
                    selected.push(menuItems[parseInt(cb.dataset.item)].name);
                });

                if (selected.length === 0) {
                    NavSense.Toast.show({ title: 'Select Items', message: 'Please select at least one item.', type: 'warning' });
                    return;
                }

                const order = NavSense.QueueSimulator.placePreOrder(stallId, selected, Date.now() + 600000);
                NavSense.Modal.close();
                NavSense.Toast.show({
                    title: 'Order Placed! 🎉',
                    message: `Order #${order.id} confirmed. You'll be notified when ready.`,
                    type: 'success',
                    icon: 'package-check'
                });
            });
            if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
        }, 100);
    }

    function startUpdates() {
        stopUpdates();
        updateInterval = setInterval(() => {
            const list = document.getElementById('queue-list');
            if (list) {
                list.innerHTML = renderQueues();
                if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
            }
        }, 4000);
    }

    function stopUpdates() {
        if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
    }

    function unmount() {
        stopUpdates();
    }

    return { render, unmount, preOrder };
})();
