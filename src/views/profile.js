/* ============================================
   NavSense AI — Profile View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.Profile = (() => {
    const store = NavSense.DataStore;

    function render() {
        const container = document.getElementById('main-content');
        const user = NavSense.UserContext.getUser();
        const state = store.getState();

        container.innerHTML = `
            <div class="view-container view-enter">
                <!-- Profile Header -->
                <div class="profile-header">
                    <div class="profile-avatar">${user.name.split(' ').map(n => n[0]).join('')}</div>
                    <div class="profile-name">${user.name}</div>
                    <div class="profile-seat">${user.seat.section} • Row ${user.seat.row} • Seat ${user.seat.number}</div>
                    <div style="margin-top:var(--space-2)">
                        <span class="badge badge-primary">${user.ticket.type} Ticket</span>
                    </div>
                </div>

                <!-- Ticket Info -->
                <div class="profile-section">
                    <div class="profile-section-title">Ticket Details</div>
                    <div class="card">
                        <div class="list-item" style="padding:var(--space-2) 0; border:none;">
                            <div class="list-item-icon" style="background:rgba(var(--brand-primary-rgb),0.1);color:var(--brand-primary)">
                                <i data-lucide="ticket"></i>
                            </div>
                            <div class="list-item-content">
                                <div class="list-item-title">${store.getStadium().event.name}</div>
                                <div class="list-item-subtitle">${store.getStadium().event.date} • ${store.getStadium().event.time}</div>
                            </div>
                        </div>
                        <div class="divider"></div>
                        <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;">
                            <div><span style="font-size:var(--text-xs);color:var(--text-tertiary)">Section</span><div style="font-weight:var(--font-bold)">${user.seat.section}</div></div>
                            <div><span style="font-size:var(--text-xs);color:var(--text-tertiary)">Row</span><div style="font-weight:var(--font-bold)">${user.seat.row}</div></div>
                            <div><span style="font-size:var(--text-xs);color:var(--text-tertiary)">Seat</span><div style="font-weight:var(--font-bold)">${user.seat.number}</div></div>
                            <div><span style="font-size:var(--text-xs);color:var(--text-tertiary)">Gate</span><div style="font-weight:var(--font-bold)">${user.ticket.gate.replace('gate-', 'G')}</div></div>
                        </div>
                        <div class="divider"></div>
                        <div style="text-align:center;padding:var(--space-3) 0;">
                            <div style="font-family:var(--font-mono);font-size:var(--text-sm);color:var(--text-secondary);letter-spacing:0.1em">${user.ticket.barcode}</div>
                            <div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">Show this at entry gate</div>
                        </div>
                    </div>
                </div>

                <!-- Preferences -->
                <div class="profile-section">
                    <div class="profile-section-title">Preferences</div>
                    <div class="card">
                        <div class="list-item" style="padding:var(--space-2) 0;border:none;">
                            <div class="list-item-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
                                <i data-lucide="utensils"></i>
                            </div>
                            <div class="list-item-content">
                                <div class="list-item-title">Food Preferences</div>
                                <div class="list-item-subtitle">${user.preferences.food.join(', ')}</div>
                            </div>
                            <i data-lucide="chevron-right" style="width:16px;height:16px;color:var(--text-tertiary)"></i>
                        </div>
                        <div class="divider"></div>
                        <div class="list-item" style="padding:var(--space-2) 0;border:none;">
                            <div class="list-item-icon" style="background:rgba(var(--color-info-rgb),0.1);color:var(--color-info)">
                                <i data-lucide="bell"></i>
                            </div>
                            <div class="list-item-content">
                                <div class="list-item-title">Notifications</div>
                                <div class="list-item-subtitle">Push notifications enabled</div>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" checked>
                                <span class="toggle-track"></span>
                                <span class="toggle-thumb"></span>
                            </label>
                        </div>
                        <div class="divider"></div>
                        <div class="list-item" style="padding:var(--space-2) 0;border:none;">
                            <div class="list-item-icon" style="background:rgba(var(--brand-secondary-rgb),0.1);color:var(--brand-secondary)">
                                <i data-lucide="accessibility"></i>
                            </div>
                            <div class="list-item-content">
                                <div class="list-item-title">Accessibility</div>
                                <div class="list-item-subtitle">Wheelchair accessible routes</div>
                            </div>
                            <label class="toggle">
                                <input type="checkbox" ${user.preferences.accessibility ? 'checked' : ''}>
                                <span class="toggle-track"></span>
                                <span class="toggle-thumb"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Orders -->
                <div class="profile-section">
                    <div class="profile-section-title">Recent Orders</div>
                    <div id="profile-orders">
                        ${renderOrders()}
                    </div>
                </div>

                <!-- App Info -->
                <div class="profile-section" style="text-align:center;padding-bottom:var(--space-8)">
                    <div style="font-size:var(--text-xs);color:var(--text-tertiary)">
                        NavSense AI v1.0.0 • Built with ❤️
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function renderOrders() {
        const orders = NavSense.QueueSimulator.getPreOrders();
        if (!orders.length) {
            return `<div class="card" style="text-align:center;padding:var(--space-5);">
                <div style="font-size:var(--text-2xl);margin-bottom:var(--space-2)">📦</div>
                <p style="font-size:var(--text-sm);color:var(--text-tertiary)">No orders yet. Pre-order from the Queues tab!</p>
            </div>`;
        }

        return orders.map(order => {
            const statusColors = { confirmed: 'var(--color-warning)', ready: 'var(--color-success)', picked: 'var(--text-tertiary)' };
            return `<div class="card" style="margin-bottom:var(--space-2)">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div style="font-size:var(--text-sm);font-weight:var(--font-bold)">#${order.id}</div>
                        <div style="font-size:var(--text-xs);color:var(--text-tertiary)">${order.items.join(', ')}</div>
                    </div>
                    <span class="badge" style="background:${statusColors[order.status]}20;color:${statusColors[order.status]}">${order.status}</span>
                </div>
            </div>`;
        }).join('');
    }

    function unmount() {}

    return { render, unmount };
})();
