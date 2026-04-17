/* ============================================
   NavSense AI — Admin Resources View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.AdminResources = (() => {
    const store = NavSense.DataStore;

    function render() {
        const container = document.getElementById('main-content');

        container.innerHTML = `
            <div class="admin-container view-enter">
                <div class="admin-header">
                    <div>
                        <h1 class="admin-title">Resource Management</h1>
                        <div class="admin-subtitle">Staff, inventory, and facility status</div>
                    </div>
                </div>

                <!-- Staff Deployment -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Staff Deployment</div>
                        <button class="btn btn-primary btn-sm"><i data-lucide="user-plus"></i> Add Staff</button>
                    </div>
                    <div class="resource-grid">
                        ${renderStaffCard('Security', 45, 50, 'shield')}
                        ${renderStaffCard('Ushers', 30, 35, 'hand-helping')}
                        ${renderStaffCard('Medical', 8, 10, 'heart-pulse')}
                    </div>
                    <div style="margin-top:var(--space-4)">
                        <table class="zone-table">
                            <thead><tr><th>Zone</th><th>Security</th><th>Ushers</th><th>Status</th></tr></thead>
                            <tbody>
                                ${renderStaffTable()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Food & Beverage -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Food & Beverage Inventory</div>
                    </div>
                    ${renderInventory()}
                </div>

                <!-- Facilities -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Facility Status</div>
                    </div>
                    ${renderFacilities()}
                </div>

                <div style="height: var(--space-8)"></div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function renderStaffCard(title, deployed, total, icon) {
        const pct = Math.round((deployed / total) * 100);
        return `<div class="resource-stat" style="padding:var(--space-4);background:var(--bg-tertiary);border-radius:var(--radius-lg);">
            <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-2);margin-bottom:var(--space-2)">
                <i data-lucide="${icon}" style="width:16px;height:16px;color:var(--brand-primary)"></i>
                <span style="font-size:var(--text-xs);color:var(--text-secondary)">${title}</span>
            </div>
            <div class="resource-stat-value" style="color:var(--text-primary)">${deployed}/${total}</div>
            <div class="progress" style="margin-top:var(--space-2)"><div class="progress-bar" style="width:${pct}%"></div></div>
        </div>`;
    }

    function renderStaffTable() {
        const zones = ['North Stand', 'South Stand', 'East Stand', 'West Stand', 'VIP Box', 'Concourses'];
        return zones.map(z => {
            const sec = Math.floor(Math.random() * 8) + 3;
            const ush = Math.floor(Math.random() * 5) + 2;
            const status = sec > 5 ? 'Adequate' : 'Understaffed';
            const statusClass = sec > 5 ? 'success' : 'warning';
            return `<tr>
                <td style="font-weight:var(--font-semibold)">${z}</td>
                <td>${sec}</td>
                <td>${ush}</td>
                <td><span class="badge badge-${statusClass}">${status}</span></td>
            </tr>`;
        }).join('');
    }

    function renderInventory() {
        const items = [
            { name: 'Cold Drinks', stock: 85, icon: '🥤' },
            { name: 'Snacks', stock: 72, icon: '🍿' },
            { name: 'Hot Food', stock: 60, icon: '🍕' },
            { name: 'Water Bottles', stock: 45, icon: '💧' },
            { name: 'Merchandise', stock: 90, icon: '👕' },
        ];

        return items.map(item => {
            const color = item.stock > 70 ? 'var(--color-success)' : item.stock > 40 ? 'var(--color-warning)' : 'var(--color-danger)';
            return `<div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--border-primary);">
                <span style="font-size:var(--text-lg)">${item.icon}</span>
                <div style="flex:1">
                    <div style="font-size:var(--text-sm);font-weight:var(--font-semibold)">${item.name}</div>
                    <div class="progress" style="margin-top:4px"><div class="progress-bar" style="width:${item.stock}%;background:${color}"></div></div>
                </div>
                <div style="font-size:var(--text-sm);font-weight:var(--font-bold);color:${color}">${item.stock}%</div>
            </div>`;
        }).join('');
    }

    function renderFacilities() {
        const facilities = [
            { name: 'North Restrooms', status: 'Operational', cleaning: false, icon: 'bath' },
            { name: 'South Restrooms', status: 'Cleaning', cleaning: true, icon: 'bath' },
            { name: 'East Restrooms', status: 'Operational', cleaning: false, icon: 'bath' },
            { name: 'West Restrooms', status: 'Operational', cleaning: false, icon: 'bath' },
            { name: 'LED Display North', status: 'Operational', cleaning: false, icon: 'monitor' },
            { name: 'PA System', status: 'Operational', cleaning: false, icon: 'volume-2' },
            { name: 'CCTV Network', status: 'Operational', cleaning: false, icon: 'camera' },
        ];

        return `<table class="zone-table">
            <thead><tr><th>Facility</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
                ${facilities.map(f => `<tr>
                    <td><div style="display:flex;align-items:center;gap:var(--space-2)"><i data-lucide="${f.icon}" style="width:14px;height:14px;color:var(--text-tertiary)"></i> ${f.name}</div></td>
                    <td><span class="badge badge-${f.cleaning ? 'warning' : 'success'} badge-dot">${f.status}</span></td>
                    <td><button class="btn btn-ghost btn-sm">${f.cleaning ? 'Mark Ready' : 'Request Clean'}</button></td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    }

    function unmount() {}

    return { render, unmount };
})();
