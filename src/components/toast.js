/* ============================================
   NavSense AI — Toast Notification System
   ============================================ */

NavSense.Toast = (() => {
    const store = NavSense.DataStore;

    function show({ title, message, type, duration, icon }) {
        type = type || 'info';
        duration = duration || 4000;
        const container = document.getElementById('toast-container');

        const colors = {
            info: 'var(--color-info)',
            success: 'var(--color-success)',
            warning: 'var(--color-warning)',
            danger: 'var(--color-danger)',
            match: 'var(--brand-primary)',
            offer: 'var(--brand-secondary)',
            safety: 'var(--color-danger)',
        };

        const icons = {
            info: 'info',
            success: 'check-circle',
            warning: 'alert-triangle',
            danger: 'alert-circle',
            match: 'trophy',
            offer: 'tag',
            safety: 'shield-alert',
        };

        const color = colors[type] || colors.info;
        const iconName = icon || icons[type] || 'info';

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <div class="toast-icon" style="background: ${color}20; color: ${color}">
                <i data-lucide="${iconName}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title || ''}</div>
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
        `;

        toast.addEventListener('click', () => dismiss(toast));
        container.appendChild(toast);

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });

        // Auto dismiss
        setTimeout(() => dismiss(toast), duration);
    }

    function dismiss(toast) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }

    // Auto-show toasts for important notifications
    function init() {
        store.on('notification', (n) => {
            if (n.priority === 'high' || n.priority === 'medium') {
                show({
                    title: n.title,
                    message: n.message,
                    type: n.type || 'info',
                    icon: n.icon
                });
            }
        });
    }

    return { show, init };
})();
