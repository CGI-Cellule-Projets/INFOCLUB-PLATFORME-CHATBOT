/**
 * InfoClub AI Chatbot Logic
 */

/**
 * InfoClub AI Chatbot Logic
 */

window.initChatbot = () => {
    const trigger = document.getElementById('chat-toggle');
    const popup = document.getElementById('chatbot-popup');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messagesContainer = document.getElementById('chat-messages');
    const closeBtn = document.getElementById('chat-close');

    if (!trigger || !popup) return;

    const API_URL = 'http://127.0.0.1:8000/chatbot/ask';

    // Toggle Chat visibility
    const toggleChat = () => {
        popup.classList.toggle('active');
        trigger.classList.toggle('active');
        if (popup.classList.contains('active')) {
            input.focus();
        }
    };

    trigger.addEventListener('click', toggleChat);
    if (closeBtn) closeBtn.addEventListener('click', toggleChat);

    // Also handle the existing "Chatbot" nav link if present
    const navChatbot = document.getElementById('open-chatbot');
    if (navChatbot) {
        navChatbot.addEventListener('click', (e) => {
            e.preventDefault();
            if (!popup.classList.contains('active')) {
                toggleChat();
            }
        });
    }

    // Add a message to the UI
    const addMessage = (text, sender) => {
        if (!messagesContainer) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        
        if (sender === 'bot') {
            // Check if marked is available (to avoid crashing if script loading fails)
            if (typeof marked !== 'undefined') {
                // Parse markdown and sanitize HTML to prevent XSS
                const rawHtml = marked.parse(text);
                const cleanHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
                msgDiv.innerHTML = cleanHtml;
            } else {
                msgDiv.textContent = text;
            }
        } else {
            msgDiv.textContent = text;
        }

        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    // Show/Hide typing indicator
    let typingIndicator = null;
    const showTyping = () => {
        typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const hideTyping = () => {
        if (typingIndicator) {
            typingIndicator.remove();
            typingIndicator = null;
        }
    };

    // Send question to backend
    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        // UI Updates
        addMessage(text, 'user');
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;

        showTyping();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: text }),
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            hideTyping();
            addMessage(data.answer, 'bot');
        } catch (error) {
            console.error('Chatbot error:', error);
            hideTyping();
            addMessage("Désolé, je rencontre des difficultés techniques. Réessayez plus tard.", 'bot');
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    };

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Initial welcome message
    if (messagesContainer && messagesContainer.children.length === 0) {
        addMessage("Bonjour ! 👋 Je suis l'assistant IA du Club Génie Informatique (CGI). Je suis là pour répondre à vos questions sur nos événements, les adhésions ou le bureau. N'hésitez pas à poser votre question !", 'bot');
    }

    // Initial message message
    console.log("Chatbot initialized");
};
