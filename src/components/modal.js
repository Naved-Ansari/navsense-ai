/* ============================================
   NavSense AI — Modal Component
   ============================================ */
NavSense.Modal = (() => {
    function open({ title, content, onClose }) {
        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = `
            <div class="modal-sheet">
                <div class="modal-handle"></div>
                <div class="modal-header">
                    <h3 class="modal-title">${title || ''}</h3>
                    <button class="btn btn-ghost btn-icon btn-sm" id="modal-close-btn">
                        <i data-lucide="x" style="width:16px;height:16px"></i>
                    </button>
                </div>
                <div class="modal-body" id="modal-body">${content || ''}</div>
            </div>
        `;
        overlay.classList.add('active');

        overlay.querySelector('#modal-close-btn').addEventListener('click', () => close(onClose));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(onClose);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function close(callback) {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('active');
        if (callback) callback();
    }

    function getBody() {
        return document.getElementById('modal-body');
    }

    return { open, close, getBody };
})();
