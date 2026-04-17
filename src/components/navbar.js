/* ============================================
   NavSense AI — Navbar Component
   ============================================ */

NavSense.Navbar = (() => {
    const store = NavSense.DataStore;

    function render() {
        const state = store.getState();
        const stadium = store.getStadium();
        const el = document.getElementById('navbar');

        el.innerHTML = `
            <div class="navbar-brand">
                <div class="navbar-logo">
                    <i data-lucide="radar"></i>
                </div>
                <div>
                    <div class="navbar-title">NavSense <span>AI</span></div>
                    <div class="navbar-event">${stadium.event.name}</div>
                </div>
            </div>
            <div class="navbar-actions">
                <div class="mode-switch" id="mode-switch">
                    <button class="mode-switch-btn ${!state.isAdmin ? 'active' : ''}" data-mode="attendee">Fan</button>
                    <button class="mode-switch-btn ${state.isAdmin ? 'active' : ''}" data-mode="admin">Admin</button>
                </div>
                <button class="btn-icon" id="theme-toggle" title="Toggle theme">
                    <i data-lucide="moon"></i>
                </button>
                <button class="btn-icon" id="notifications-btn" title="Notifications">
                    <i data-lucide="bell"></i>
                    <span class="notification-dot" id="notification-dot" style="display:none;"></span>
                </button>
            </div>
        `;

        // Bind events
        el.querySelector('#theme-toggle').addEventListener('click', toggleTheme);
        el.querySelector('#notifications-btn').addEventListener('click', () => {
            NavSense.Router.navigate('notifications');
        });

        el.querySelectorAll('.mode-switch-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                store.setState('isAdmin', mode === 'admin');
                NavSense.App.switchMode(mode);
            });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });

        // Listen for new notifications
        store.on('notification', () => {
            const dot = document.getElementById('notification-dot');
            if (dot) dot.style.display = 'block';
        });
    }

    function toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);

        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.setAttribute('data-lucide', next === 'dark' ? 'moon' : 'sun');
            if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
        }
    }

    function updateModeSwitchUI() {
        const state = store.getState();
        document.querySelectorAll('.mode-switch-btn').forEach(btn => {
            btn.classList.toggle('active',
                (btn.dataset.mode === 'admin' && state.isAdmin) ||
                (btn.dataset.mode === 'attendee' && !state.isAdmin)
            );
        });
    }

    return { render, updateModeSwitchUI };
})();
