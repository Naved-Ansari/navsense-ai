/* ============================================
   NavSense AI — AI Assistant Chat View
   ============================================ */

NavSense.Views = NavSense.Views || {};

NavSense.Views.Assistant = (() => {
    const store = NavSense.DataStore;
    let messages = [];

    function render() {
        const container = document.getElementById('main-content');

        if (messages.length === 0) {
            // Initial greeting
            const ctx = NavSense.ContextEngine.getFullContext();
            messages.push({
                role: 'assistant',
                text: `Hey ${ctx.user.name.split(' ')[0]}! 👋 I'm your NavSense AI assistant for today's match.\n\nI can help you with:\n🗺️ Navigation & directions\n🍕 Food & drink recommendations\n🚻 Queue times & restrooms\n🏏 Match updates\n🚪 Exit routes\n\nJust ask me anything!`,
                type: 'text',
                time: new Date()
            });
        }

        container.innerHTML = `
            <div class="chat-container view-enter">
                <div class="chat-messages" id="chat-messages">
                    ${renderMessages()}
                </div>
                <div class="chat-suggestions" id="chat-suggestions">
                    ${renderSuggestions()}
                </div>
                <div class="chat-input-bar">
                    <input type="text" class="chat-input" id="chat-input" placeholder="Ask me anything..." autocomplete="off">
                    <button class="chat-send-btn" id="chat-send-btn">
                        <i data-lucide="send"></i>
                    </button>
                </div>
            </div>
        `;

        bindEvents();
        scrollToBottom();
        if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
    }

    function renderMessages() {
        return messages.map(msg => {
            if (msg.role === 'typing') {
                return `<div class="chat-typing">
                    <div class="chat-typing-dot"></div>
                    <div class="chat-typing-dot"></div>
                    <div class="chat-typing-dot"></div>
                </div>`;
            }

            const isUser = msg.role === 'user';
            const formatted = formatText(msg.text);

            if (msg.type === 'rich' && !isUser) {
                return `<div class="chat-bubble-rich">
                    <div class="card" style="padding:var(--space-4);">
                        <div style="font-size:var(--text-sm);line-height:var(--leading-relaxed);color:var(--text-primary)">${formatted}</div>
                        ${msg.action ? `<button class="btn btn-primary btn-sm" style="margin-top:var(--space-3);width:100%" data-action='${JSON.stringify(msg.action)}'>
                            <i data-lucide="navigation"></i> Navigate There
                        </button>` : ''}
                    </div>
                </div>`;
            }

            return `<div class="chat-bubble ${isUser ? 'user' : 'assistant'}">${formatted}</div>`;
        }).join('');
    }

    function formatText(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    function renderSuggestions() {
        const suggestions = NavSense.ContextEngine.getSuggestions();
        return suggestions.map(s =>
            `<button class="chat-suggestion" data-suggestion="${s}">${s}</button>`
        ).join('');
    }

    function bindEvents() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send-btn');

        sendBtn.addEventListener('click', () => sendMessage());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Suggestion clicks
        document.querySelectorAll('.chat-suggestion').forEach(el => {
            el.addEventListener('click', () => {
                const text = el.dataset.suggestion;
                document.getElementById('chat-input').value = text;
                sendMessage();
            });
        });

        // Navigate action buttons
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', () => {
                NavSense.Router.navigate('navigate');
            });
        });
    }

    function sendMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;

        // Add user message
        messages.push({ role: 'user', text, type: 'text', time: new Date() });
        input.value = '';

        // Show typing
        messages.push({ role: 'typing' });
        updateChat();

        // Generate AI response after delay
        const delay = 600 + Math.random() * 800;
        setTimeout(() => {
            // Remove typing
            messages = messages.filter(m => m.role !== 'typing');

            // Get AI response
            const response = NavSense.Recommender.generateResponse(text);
            messages.push({
                role: 'assistant',
                text: response.text,
                type: response.type,
                action: response.action,
                time: new Date()
            });

            updateChat();
            updateSuggestions();
        }, delay);
    }

    function updateChat() {
        const chatEl = document.getElementById('chat-messages');
        if (chatEl) {
            chatEl.innerHTML = renderMessages();
            if (typeof lucide !== 'undefined') lucide.createIcons({ attrs: { class: '' } });
            scrollToBottom();
            bindNavigateButtons();
        }
    }

    function updateSuggestions() {
        const sugEl = document.getElementById('chat-suggestions');
        if (sugEl) {
            sugEl.innerHTML = renderSuggestions();
            document.querySelectorAll('.chat-suggestion').forEach(el => {
                el.addEventListener('click', () => {
                    document.getElementById('chat-input').value = el.dataset.suggestion;
                    sendMessage();
                });
            });
        }
    }

    function bindNavigateButtons() {
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', () => {
                NavSense.Router.navigate('navigate');
            });
        });
    }

    function scrollToBottom() {
        const chatEl = document.getElementById('chat-messages');
        if (chatEl) {
            chatEl.scrollTop = chatEl.scrollHeight;
        }
    }

    function unmount() {}

    return { render, unmount };
})();
