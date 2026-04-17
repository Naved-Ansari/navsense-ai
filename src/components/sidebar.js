/* ============================================
   NavSense AI — Admin Sidebar
   ============================================ */

NavSense.Sidebar = (() => {
    const store = NavSense.DataStore;

    const sections = [
        {
            label: 'Dashboard',
            items: [
                { id: 'admin-overview', icon: 'layout-dashboard', label: 'Overview' },
                { id: 'admin-analytics', icon: 'bar-chart-3', label: 'Analytics' },
            ]
        },
        {
            label: 'Operations',
            items: [
                { id: 'admin-bottlenecks', icon: 'alert-triangle', label: 'Bottlenecks', badge: null },
                { id: 'admin-resources', icon: 'boxes', label: 'Resources' },
                { id: 'admin-emergency', icon: 'shield-alert', label: 'Emergency' },
            ]
        }
    ];

    function render() {
        const el = document.getElementById('admin-sidebar');
        const state = store.getState();

        el.innerHTML = sections.map(section => `
            <div class="sidebar-section">
                <div class="sidebar-label">${section.label}</div>
                ${section.items.map(item => `
                    <button class="sidebar-item ${state.activeView === item.id ? 'active' : ''}" data-view="${item.id}">
                        <i data-lucide="${item.icon}"></i>
                        <span>${item.label}</span>
                        ${item.badge ? `<span class="sidebar-badge">${item.badge}</span>` : ''}
                    </button>
                `).join('')}
            </div>
        `).join('');

        el.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                NavSense.Router.navigate(item.dataset.view);
            });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function setActive(viewId) {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewId);
        });
    }

    function show() {
        document.getElementById('admin-sidebar').classList.add('active');
        document.getElementById('main-content').classList.add('admin-active');
    }

    function hide() {
        document.getElementById('admin-sidebar').classList.remove('active');
        document.getElementById('main-content').classList.remove('admin-active');
    }

    return { render, setActive, show, hide };
})();
