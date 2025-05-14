// ==UserScript==
// @name         YouTube Live Chat Channel Link Icon
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add clickable icon next to usernames in YouTube live chat to open their channel in a new tab.
// @author       cocomonk22
// @match        https://www.youtube.com/live_chat*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function enhanceMessage(messageElement) {
        try {
            const channelId =
                messageElement.data?.authorExternalChannelId ||
                messageElement.__data?.authorExternalChannelId ||
                messageElement.__dataHost?.data?.authorExternalChannelId ||
                messageElement.__internalRoot?.host?.data?.authorExternalChannelId;

            if (!channelId) return;

            const authorSpan = messageElement.querySelector('#author-name');
            if (!authorSpan || authorSpan.dataset.iconAdded) return;

            const icon = document.createElement('span');
            icon.textContent = ' 🔗';
            icon.title = 'Open channel';
            icon.style.cursor = 'pointer';
            icon.style.userSelect = 'none';

            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(`https://youtube.com/channel/${channelId}`, '_blank');
            });

            authorSpan.appendChild(icon);
            authorSpan.dataset.iconAdded = 'true';
        } catch (err) {
            console.error('Error enhancing live chat message:', err);
        }
    }

    // Process existing chat messages
    function enhanceExistingMessages() {
        const messages = document.querySelectorAll('yt-live-chat-text-message-renderer');
        messages.forEach(enhanceMessage);
    }

    // Observe new chat messages
    function setupObserver() {
        const chatItems = document.querySelector('yt-live-chat-item-list-renderer #items');
        if (!chatItems) return false;

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.tagName === 'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER') {
                        enhanceMessage(node);
                    }
                }
            }
        });

        observer.observe(chatItems, { childList: true });
        return true;
    }

    // Wait until the live chat DOM is ready
    const interval = setInterval(() => {
        if (document.querySelector('yt-live-chat-text-message-renderer')) {
            enhanceExistingMessages();
        }

        if (setupObserver()) {
            clearInterval(interval);
        }
    }, 1000);
})();
