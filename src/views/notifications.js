/* ============================================
   NavSense AI — Notifications View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.Notifications = (() => {
    const store = NavSense.DataStore;

    function render() {
        const container = document.getElementById('main-content');
        const state = store.getState();

        // Hide notification dot
        const dot = document.getElementById('notification-dot');
        if (dot) dot.style.display = 'none';

        container.innerHTML = `
            <div class="view-container view-enter">
                <div class="section-header">
                    <div>
                        <div class="section-title">Notifications</div>
                        <div class="section-subtitle">${state.notifications.length} updates</div>
                    </div>
                    <button class="btn btn-ghost btn-sm" id="clear-all-btn">Clear All</button>
                </div>

                <div id="notification-list">
                    ${renderNotifications(state.notifications)}
                </div>

                <div style="height: var(--space-4)"></div>
            </div>
        `;

        document.getElementById('clear-all-btn')?.addEventListener('click', () => {
            store.getState().notifications = [];
            document.getElementById('notification-list').innerHTML = renderNotifications([]);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function renderNotifications(notifications) {
        if (!notifications.length) {
            return `<div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="bell-off"></i></div>
                <h3>All caught up!</h3>
                <p>No notifications yet. You'll be notified about match updates, safety alerts, and deals.</p>
            </div>`;
        }

        return notifications.map((n, i) => {
            const typeColors = {
                match: 'var(--brand-primary)',
                safety: 'var(--color-danger)',
                offer: 'var(--brand-secondary)',
                event: 'var(--color-info)',
                navigation: 'var(--brand-accent)',
                info: 'var(--text-tertiary)',
            };
            const color = typeColors[n.type] || 'var(--text-tertiary)';
            const ago = getTimeAgo(n.timestamp);

            return `<div class="notification-card ${n.read ? '' : 'unread'}" style="animation-delay:${i * 0.05}s" data-nid="${n.id}">
                <div class="notification-icon-wrap" style="background:${color}15;color:${color}">
                    <i data-lucide="${n.icon || 'bell'}"></i>
                </div>
                <div class="notification-body">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-text">${n.message}</div>
                    <div class="notification-time">${ago} ${n.priority === 'high' ? '• <span style="color:var(--color-danger)">Important</span>' : ''}</div>
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

    function unmount() {}

    return { render, unmount };
})();
