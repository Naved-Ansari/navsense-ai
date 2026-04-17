/* ============================================
   NavSense AI — App Shell / Entry Point
   ============================================ */

NavSense.App = (() => {

    function init() {
        console.log('%c🏟️ NavSense AI — Smart Stadium Assistant', 'font-size:16px;font-weight:bold;color:#00d4ff;');
        console.log('%cInitializing systems...', 'color:#94a3b8');

        // Show splash, then boot
        setTimeout(() => {
            boot();
        }, 2200);
    }

    function boot() {
        // Hide splash
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('hidden');

        // Show app
        const app = document.getElementById('app');
        if (app) app.style.display = 'flex';

        // Render shell components
        NavSense.Navbar.render();
        NavSense.TabBar.render();
        NavSense.Sidebar.render();

        // Init toast system
        NavSense.Toast.init();

        // Start simulation engines
        NavSense.CrowdSimulator.start();
        NavSense.QueueSimulator.start();
        NavSense.EventTimeline.start();
        NavSense.UserContext.startTracking();
        NavSense.NotificationEngine.start();

        // Render simulation controls
        NavSense.SimControls.render();

        // Init router (renders first view)
        NavSense.Router.init();

        console.log('%c✅ NavSense AI ready!', 'color:#10b981;font-weight:bold');
    }

    function switchMode(mode) {
        if (mode === 'admin') {
            NavSense.Router.navigate('admin-overview');
        } else {
            NavSense.Router.navigate('home');
        }

        // Re-render simulation controls
        setTimeout(() => NavSense.SimControls.render(), 100);
    }

    return { init, switchMode };
})();

// ── Boot on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
    NavSense.App.init();
});
