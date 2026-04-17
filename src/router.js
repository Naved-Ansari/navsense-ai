/* ============================================
   NavSense AI — Hash-Based Router
   ============================================ */

NavSense.Router = (() => {
    const store = NavSense.DataStore;

    const routes = {
        // Attendee routes
        'home': { view: 'Home', admin: false },
        'navigate': { view: 'Navigate', admin: false },
        'queues': { view: 'Queues', admin: false },
        'assistant': { view: 'Assistant', admin: false },
        'notifications': { view: 'Notifications', admin: false },
        'profile': { view: 'Profile', admin: false },
        // Admin routes
        'admin-overview': { view: 'AdminOverview', admin: true },
        'admin-analytics': { view: 'AdminAnalytics', admin: true },
        'admin-bottlenecks': { view: 'AdminBottlenecks', admin: true },
        'admin-resources': { view: 'AdminResources', admin: true },
        'admin-emergency': { view: 'AdminEmergency', admin: true },
    };

    let currentView = null;
    let currentViewName = null;

    function init() {
        window.addEventListener('hashchange', handleRoute);
        handleRoute();
    }

    function handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        navigate(hash, true);
    }

    function navigate(viewName, fromHash) {
        const route = routes[viewName];
        if (!route) {
            console.warn(`Route not found: ${viewName}`);
            navigate('home');
            return;
        }

        // Update hash without triggering hashchange
        if (!fromHash) {
            window.location.hash = viewName;
            return; // hashchange will call navigate again
        }

        // Unmount current view
        if (currentView && currentView.unmount) {
            try { currentView.unmount(); } catch (e) { console.error('Unmount error:', e); }
        }

        // Update state
        store.setState('activeView', viewName);
        store.setState('isAdmin', route.admin);
        currentViewName = viewName;

        // Update UI chrome
        if (route.admin) {
            NavSense.TabBar.hide();
            NavSense.Sidebar.show();
            NavSense.Sidebar.setActive(viewName);
        } else {
            NavSense.Sidebar.hide();
            NavSense.TabBar.show();
            NavSense.TabBar.setActive(viewName);
        }

        NavSense.Navbar.updateModeSwitchUI();

        // Render view
        const view = NavSense.Views[route.view];
        if (view && view.render) {
            currentView = view;
            try {
                view.render();
            } catch (e) {
                console.error(`Error rendering view ${viewName}:`, e);
                document.getElementById('main-content').innerHTML = `
                    <div class="view-container" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;">
                        <div style="font-size:var(--text-3xl);margin-bottom:var(--space-4)">⚠️</div>
                        <h2>Something went wrong</h2>
                        <p style="color:var(--text-secondary);margin-top:var(--space-2)">Error loading ${viewName} view.</p>
                        <button class="btn btn-primary" style="margin-top:var(--space-4)" onclick="NavSense.Router.navigate('home')">Go Home</button>
                    </div>
                `;
            }
        }

        // Scroll to top
        const main = document.getElementById('main-content');
        if (main) main.scrollTop = 0;
    }

    function getCurrentView() {
        return currentViewName;
    }

    return { init, navigate, getCurrentView };
})();
