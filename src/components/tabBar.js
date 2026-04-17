/* ============================================
   NavSense AI — Tab Bar Component
   ============================================ */

NavSense.TabBar = (() => {
    const store = NavSense.DataStore;

    const tabs = [
        { id: 'home', icon: 'home', label: 'Home' },
        { id: 'navigate', icon: 'compass', label: 'Navigate' },
        { id: 'queues', icon: 'clock', label: 'Queues' },
        { id: 'assistant', icon: 'bot', label: 'Assistant' },
        { id: 'profile', icon: 'user', label: 'Profile' },
    ];

    function render() {
        const el = document.getElementById('tab-bar');
        const state = store.getState();

        el.innerHTML = tabs.map(tab => `
            <button class="tab-item ${state.activeView === tab.id ? 'active' : ''}" data-view="${tab.id}" id="tab-${tab.id}">
                <i data-lucide="${tab.icon}"></i>
                <span>${tab.label}</span>
            </button>
        `).join('');

        el.querySelectorAll('.tab-item').forEach(item => {
            item.addEventListener('click', () => {
                NavSense.Router.navigate(item.dataset.view);
            });
        });

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function setActive(viewId) {
        document.querySelectorAll('.tab-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewId);
        });
    }

    function show() {
        document.getElementById('tab-bar').style.display = 'flex';
    }

    function hide() {
        document.getElementById('tab-bar').style.display = 'none';
    }

    return { render, setActive, show, hide };
})();
