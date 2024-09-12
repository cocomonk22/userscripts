// ==UserScript==
// @name         Google Home Camera
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Sync USB mic and speaker states with the web buttons, only on Google Home camera list pages. Includes Push-to-Talk (PTT) functionality.
// @author       cocomonk22
// @match        https://home.google.com/*
// @grant        none
// @updateURL    https://github.com/cocomonk22/userscripts/raw/main/Google%20Home%20Camera.user.js
// @downloadURL  https://github.com/cocomonk22/userscripts/raw/main/Google%20Home%20Camera.user.js
// ==/UserScript==

(function() {
    'use strict';

    let intervalId = null; // To store the interval ID for mic and speaker sync
    let onCameraListPage = false; // Track if we are on the camera list page
    let apiCallInProgress = false; // Prevent multiple API calls from being made simultaneously
    let mouseDown = false; // Track if the left mouse button is held down for PTT

    // Parameters to enable or disable mic and speaker sync
    const micSyncEnabled = false; // Set to true to enable mic syncing and disable PTT functionality
    const speakerSyncEnabled = true; // Set to false to disable speaker syncing

    // Function that runs when the URL matches the camera list page
    function startSync() {
        console.log("On camera list page! Starting sync...");

        const stateCheckInterval = 1000; // Check mic and speaker state every 1 second

        // Function to simulate a click on a button
        function clickButton(button, buttonType) {
            if (button) {
                button.click();
                console.log(`${buttonType} button clicked to sync state.`);
            } else {
                console.log(`${buttonType} button not found!`);
            }
        }

        // Function to unmute or mute mic based on mouse button state (PTT)
        function pushToTalk(micButton) {
            if (mouseDown && micButton) {
                const micIcon = micButton.querySelector('mat-icon');
                const micButtonState = micIcon ? micIcon.textContent.trim() : null;

                // If PTT is active and mic is muted, unmute it
                if (micButtonState === 'mic_off') {
                    clickButton(micButton, "Mic");
                }
            } else if (!mouseDown && micButton) {
                const micIcon = micButton.querySelector('mat-icon');
                const micButtonState = micIcon ? micIcon.textContent.trim() : null;

                // If PTT is not active and mic is unmuted, mute it
                if (micButtonState === 'mic_none') {
                    clickButton(micButton, "Mic");
                }
            }
        }

        // Function to sync mic state with server if micSyncEnabled is true
        async function syncMicWithServer(micButton) {
            apiCallInProgress = true; // Prevent overlapping API calls

            try {
                const response = await fetch('http://localhost:5000/mic_state');
                const data = await response.json();
                const micStateFromServer = data.state;

                // Get the current mic button state
                const micIcon = micButton.querySelector('mat-icon');
                const micButtonState = micIcon ? micIcon.textContent.trim() : null;

                // Compare and sync mic states if necessary
                if (micStateFromServer === 'muted' && micButtonState !== 'mic_off') {
                    clickButton(micButton, "Mic");
                } else if (micStateFromServer === 'unmuted' && micButtonState !== 'mic_none') {
                    clickButton(micButton, "Mic");
                }
            } catch (error) {
                console.error('Error fetching mic state:', error);
            } finally {
                apiCallInProgress = false; // Reset flag when API call is finished
            }
        }

        // Function to detect and sync mic and speaker states
        async function syncStates() {
            if (!onCameraListPage || apiCallInProgress) return; // Stop execution if we're not on the camera list page or API call is in progress

            // Sync mic state if micSyncEnabled is true
            if (micSyncEnabled) {
                const micButton = document.querySelector('.talkback.mat-mdc-fab');
                if (micButton) {
                    // Sync mic state using the server's API
                    await syncMicWithServer(micButton);
                } else {
                    console.log("Mic button not found, skipping sync.");
                }
            }

            // Handle Push-to-Talk (PTT) functionality if micSyncEnabled is false
            if (!micSyncEnabled) {
                const micButton = document.querySelector('.talkback.mat-mdc-fab');
                if (micButton) {
                    pushToTalk(micButton);
                }
            }

            // Sync speaker state if speakerSyncEnabled is true
            if (speakerSyncEnabled) {
                const speakerButton = document.querySelector('button[aria-label*="Unmute"] mat-icon, button[aria-label*="mute"] mat-icon');
                if (speakerButton) {
                    const speakerIcon = speakerButton.textContent.trim();
                    if (speakerIcon === 'volume_off') {
                        // If the speaker is muted, click the button to unmute
                        clickButton(speakerButton.closest('button'), "Speaker");
                    }
                } else {
                    console.log("Speaker button not found, skipping sync.");
                }
            }
        }

        // Set an interval to check mic and speaker sync every second (only when on the camera list page)
        intervalId = setInterval(syncStates, stateCheckInterval);
    }

    // Function to stop the sync when we leave the camera list page
    function stopSync() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            onCameraListPage = false; // Reset the state to indicate we are no longer on the page
            apiCallInProgress = false; // Stop any ongoing API call
            console.log("Left the camera list page. Stopping sync...");
        }
    }

    // Function to detect if the current URL matches the camera list page
    function checkURLChange() {
        const currentURL = window.location.href;
        if (currentURL.match(/\/cameras\/list\//)) {
            if (!intervalId) { // Only start sync if it's not already running
                startSync();
            }
        } else {
            stopSync(); // Stop sync if we're not on the camera list page
        }
    }

    // Monitor for URL changes using History API
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override pushState and replaceState to detect URL changes
    history.pushState = function(...args) {
        originalPushState.apply(history, args);
        checkURLChange(); // Check when URL changes
    };

    history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        checkURLChange(); // Check when URL changes
    };

    // Run the check immediately when the userscript is first loaded
    checkURLChange();

    // Optionally, use MutationObserver to detect changes in the DOM (if needed)
    const observer = new MutationObserver(() => {
        checkURLChange(); // Check if the URL still matches after DOM changes
    });

    // Observe changes in the body element, you can adjust this to specific parts of the DOM if needed
    observer.observe(document.body, { childList: true, subtree: true });

    // Handle Push-to-Talk (PTT) with left mouse button
    window.addEventListener('mousedown', function(event) {
        if (event.button === 0) { // Left mouse button is pressed
            mouseDown = true;
        }
    });

    window.addEventListener('mouseup', function(event) {
        if (event.button === 0) { // Left mouse button is released
            mouseDown = false;
        }
    });

})();
