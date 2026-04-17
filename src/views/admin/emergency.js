/* ============================================
   NavSense AI — Admin Emergency View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.AdminEmergency = (() => {
    const store = NavSense.DataStore;
    const commLog = [];

    function render() {
        const container = document.getElementById('main-content');

        container.innerHTML = `
            <div class="admin-container view-enter">
                <div class="admin-header">
                    <div>
                        <h1 class="admin-title">Emergency Controls</h1>
                        <div class="admin-subtitle">Safety management and alert broadcast</div>
                    </div>
                    <div>
                        <span class="badge badge-success badge-dot badge-pulse">System Normal</span>
                    </div>
                </div>

                <!-- Emergency Actions -->
                <div class="emergency-panel">
                    <div class="emergency-title">
                        <i data-lucide="shield-alert"></i>
                        Critical Actions
                    </div>
                    <div class="emergency-btn-grid">
                        <div class="emergency-btn" id="btn-evacuate">
                            <div class="emergency-btn-icon"><i data-lucide="siren"></i></div>
                            <div class="emergency-btn-label">Evacuation Alert</div>
                            <div class="emergency-btn-sub">Broadcast to all attendees</div>
                        </div>
                        <div class="emergency-btn" id="btn-lockdown">
                            <div class="emergency-btn-icon"><i data-lucide="lock"></i></div>
                            <div class="emergency-btn-label">Zone Lockdown</div>
                            <div class="emergency-btn-sub">Restrict access to zones</div>
                        </div>
                        <div class="emergency-btn" id="btn-medical">
                            <div class="emergency-btn-icon"><i data-lucide="heart-pulse"></i></div>
                            <div class="emergency-btn-label">Medical Emergency</div>
                            <div class="emergency-btn-sub">Dispatch medical team</div>
                        </div>
                        <div class="emergency-btn" id="btn-announce">
                            <div class="emergency-btn-icon"><i data-lucide="megaphone"></i></div>
                            <div class="emergency-btn-label">PA Announcement</div>
                            <div class="emergency-btn-sub">Stadium-wide broadcast</div>
                        </div>
                    </div>
                </div>

                <!-- Quick Alert Broadcast -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Send Alert to Attendees</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                        <div style="display:flex;gap:var(--space-2)">
                            <select class="input" id="alert-type" style="flex:0 0 140px;">
                                <option value="info">ℹ️ Info</option>
                                <option value="warning">⚠️ Warning</option>
                                <option value="safety">🚨 Safety</option>
                            </select>
                            <input type="text" class="input" id="alert-message" placeholder="Type alert message...">
                        </div>
                        <button class="btn btn-danger" id="send-alert-btn">
                            <i data-lucide="send"></i> Broadcast Alert
                        </button>
                    </div>
                </div>

                <!-- Evacuation Routes -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Evacuation Routes</div>
                        <button class="btn btn-secondary btn-sm" id="activate-routes-btn">
                            <i data-lucide="route"></i> Activate All Routes
                        </button>
                    </div>
                    <div id="evac-map-container"></div>
                    <div style="margin-top:var(--space-4)">
                        <table class="zone-table">
                            <thead><tr><th>Gate</th><th>Status</th><th>Capacity</th><th>Current Flow</th><th>Action</th></tr></thead>
                            <tbody>
                                ${renderGateStatus()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Communication Log -->
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">Communication Log</div>
                    </div>
                    <div class="comm-log" id="comm-log">
                        ${renderCommLog()}
                    </div>
                </div>

                <div style="height: var(--space-8)"></div>
            </div>
        `;

        // Render evac map
        NavSense.StadiumMap.render(document.getElementById('evac-map-container'), {
            id: 'evac-map',
            showAmenities: false,
            showUser: false
        });

        bindEvents();
        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function renderGateStatus() {
        const stadium = store.getStadium();
        const state = store.getState();
        return stadium.gates.map(gate => {
            const q = state.queues[gate.id] || { people: 0, wait: 0 };
            return `<tr>
                <td style="font-weight:var(--font-semibold)">${gate.name}</td>
                <td><span class="badge badge-success badge-dot">Open</span></td>
                <td>500/min</td>
                <td>${q.people} people</td>
                <td><button class="btn btn-ghost btn-sm" onclick="NavSense.Toast.show({title:'Gate Updated', message:'${gate.name} set to maximum flow.', type:'success'})">Max Flow</button></td>
            </tr>`;
        }).join('');
    }

    function renderCommLog() {
        if (!commLog.length) {
            return `<div style="text-align:center;padding:var(--space-6);color:var(--text-tertiary);font-size:var(--text-sm)">No communications logged yet.</div>`;
        }

        return commLog.map(entry => `
            <div class="comm-log-entry">
                <span class="comm-log-time">${entry.time}</span>
                <span class="comm-log-type">${NavSense.Badge.create(entry.type, entry.type === 'safety' ? 'danger' : entry.type === 'warning' ? 'warning' : 'info')}</span>
                <span class="comm-log-message">${entry.message}</span>
            </div>
        `).join('');
    }

    function addToLog(type, message) {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        commLog.unshift({ time, type, message });
        const logEl = document.getElementById('comm-log');
        if (logEl) logEl.innerHTML = renderCommLog();
    }

    function bindEvents() {
        document.getElementById('btn-evacuate')?.addEventListener('click', () => {
            NavSense.Modal.open({
                title: '⚠️ Confirm Evacuation Alert',
                content: `
                    <p style="color:var(--color-danger);font-weight:var(--font-semibold);margin-bottom:var(--space-3)">This will send an evacuation alert to ALL attendees.</p>
                    <p style="font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">All gates will switch to maximum outflow and evacuation routes will be highlighted on all user devices.</p>
                    <div style="display:flex;gap:var(--space-2)">
                        <button class="btn btn-danger btn-lg" style="flex:1" onclick="NavSense.Views.AdminEmergency.triggerEvacuation()">Confirm Evacuation</button>
                        <button class="btn btn-secondary btn-lg" onclick="NavSense.Modal.close()">Cancel</button>
                    </div>
                `
            });
        });

        document.getElementById('btn-lockdown')?.addEventListener('click', () => {
            NavSense.Toast.show({ title: 'Zone Lockdown', message: 'Select zones on the map to restrict access.', type: 'warning', icon: 'lock' });
            addToLog('warning', 'Zone lockdown mode activated by admin.');
        });

        document.getElementById('btn-medical')?.addEventListener('click', () => {
            NavSense.Toast.show({ title: 'Medical Team Dispatched', message: 'First response team alerted and en route.', type: 'danger', icon: 'heart-pulse' });
            addToLog('safety', 'Medical emergency — first response team dispatched.');
        });

        document.getElementById('btn-announce')?.addEventListener('click', () => {
            NavSense.Toast.show({ title: 'PA System Ready', message: 'Type your message in the alert broadcast section.', type: 'info', icon: 'megaphone' });
        });

        document.getElementById('send-alert-btn')?.addEventListener('click', () => {
            const type = document.getElementById('alert-type').value;
            const message = document.getElementById('alert-message').value.trim();
            if (!message) {
                NavSense.Toast.show({ title: 'Empty Message', message: 'Please type an alert message.', type: 'warning' });
                return;
            }

            store.addNotification({
                type: type === 'safety' ? 'safety' : type === 'warning' ? 'event' : 'info',
                title: type === 'safety' ? '🚨 Safety Alert' : type === 'warning' ? '⚠️ Warning' : 'ℹ️ Notice',
                message: message,
                icon: type === 'safety' ? 'shield-alert' : type === 'warning' ? 'alert-triangle' : 'info',
                priority: type === 'safety' ? 'high' : 'medium'
            });

            addToLog(type, `Alert broadcast: "${message}"`);
            document.getElementById('alert-message').value = '';
            NavSense.Toast.show({ title: 'Alert Sent', message: 'Broadcast to all attendees.', type: 'success', icon: 'check-circle' });
        });

        document.getElementById('activate-routes-btn')?.addEventListener('click', () => {
            NavSense.Toast.show({ title: 'Evacuation Routes Activated', message: 'All 4 exit routes are now highlighted on attendee devices.', type: 'warning', icon: 'route' });
            addToLog('warning', 'All evacuation routes activated.');
        });
    }

    function triggerEvacuation() {
        NavSense.Modal.close();
        store.addNotification({
            type: 'safety',
            title: '🚨 EVACUATION ALERT',
            message: 'Please proceed to the nearest exit immediately. Follow the illuminated route on your device. Stay calm and assist others.',
            icon: 'siren',
            priority: 'high'
        });
        addToLog('safety', '🚨 EVACUATION ALERT broadcast to all attendees.');
        NavSense.Toast.show({ title: '🚨 Evacuation Alert Sent', message: 'All attendees have been notified.', type: 'danger', duration: 8000 });
    }

    function unmount() {}

    return { render, unmount, triggerEvacuation };
})();
