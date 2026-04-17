/* ============================================
   NavSense AI — Reusable Card Component
   ============================================ */
NavSense.Card = (() => {
    function create({ title, subtitle, content, className, icon, badge, onClick }) {
        const div = document.createElement('div');
        div.className = `card ${className || ''} ${onClick ? 'card-interactive' : ''}`;
        if (onClick) div.addEventListener('click', onClick);

        let header = '';
        if (title || badge) {
            header = `<div class="flex-between" style="margin-bottom: var(--space-3);">
                <div>
                    ${icon ? `<i data-lucide="${icon}" style="width:16px;height:16px;margin-right:6px;vertical-align:middle;color:var(--brand-primary)"></i>` : ''}
                    ${title ? `<span style="font-weight:var(--font-bold);font-size:var(--text-sm)">${title}</span>` : ''}
                    ${subtitle ? `<div style="font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px">${subtitle}</div>` : ''}
                </div>
                ${badge || ''}
            </div>`;
        }

        div.innerHTML = header + (content || '');
        return div;
    }

    return { create };
})();
