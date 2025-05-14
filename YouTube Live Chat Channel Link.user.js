// ==UserScript==
// @name         YouTube Live Chat Channel Link
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Make usernames in YouTube live chat open the channel on click with tooltip "Open channel" on hover.
// @author       You
// @match        https://www.youtube.com/live_chat*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const MESSAGE_TAGS = [
        'YT-LIVE-CHAT-TEXT-MESSAGE-RENDERER',
        'YT-LIVE-CHAT-PAID-MESSAGE-RENDERER',
        'YT-LIVE-CHAT-PAID-STICKER-RENDERER'
    ];

    function enhanceMessage(messageElement) {
        try {
            const channelId =
                messageElement.data?.authorExternalChannelId ||
                messageElement.__data?.authorExternalChannelId ||
                messageElement.__dataHost?.data?.authorExternalChannelId ||
                messageElement.__internalRoot?.host?.data?.authorExternalChannelId;

            if (!channelId) return;

            const authorSpan = messageElement.querySelector('#author-name');
            if (!authorSpan || authorSpan.dataset.enhanced) return;

            authorSpan.title = 'Open channel';
            authorSpan.style.cursor = 'pointer';
            //authorSpan.style.textDecoration = 'underline dotted'; // optional visual cue

            authorSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(`https://youtube.com/channel/${channelId}`, '_blank');
            });

            authorSpan.dataset.enhanced = 'true';
        } catch (err) {
            console.error('Error enhancing author name:', err);
        }
    }

    function enhanceExistingMessages() {
        const allMessages = document.querySelectorAll(MESSAGE_TAGS.join(','));
        allMessages.forEach(enhanceMessage);
    }

    function setupObserver() {
        const chatItems = document.querySelector('yt-live-chat-item-list-renderer #items');
        if (!chatItems) return false;

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (
                        node.nodeType === 1 &&
                        MESSAGE_TAGS.includes(node.tagName)
                    ) {
                        enhanceMessage(node);
                    }
                }
            }
        });

        observer.observe(chatItems, { childList: true });
        return true;
    }

    const interval = setInterval(() => {
        if (document.querySelector(MESSAGE_TAGS.map(tag => tag.toLowerCase()).join(','))) {
            enhanceExistingMessages();
        }

        if (setupObserver()) {
            clearInterval(interval);
        }
    }, 1000);
})();
