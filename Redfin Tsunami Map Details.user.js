// ==UserScript==
// @name         Redfin Tsunami Map Details
// @version      1.0
// @author       cocomonk22
// @match        https://www.redfin.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const TILE_URL =
        "https://tiles.arcgis.com/tiles/C8EMgrsFcRFL6LrL/arcgis/rest/services/TsunamiEvacuationZones/MapServer/tile/{z}/{y}/{x}";
    let overlayLayer = null;
    let tsunamiButton = null;

    function isTsunamiOverlayActive() {
        const map = window.__preloaded_map__;
        if (!map || !overlayLayer) return false;

        for (let i = 0; i < map.overlayMapTypes.getLength(); i++) {
            if (map.overlayMapTypes.getAt(i) === overlayLayer) return true;
        }
        return false;
    }

    function toggleTsunamiOverlay() {
        const map = window.__preloaded_map__;
        if (!map) return console.log("Map not ready yet.");

        let overlayIndex = -1;
        for (let i = 0; i < map.overlayMapTypes.getLength(); i++) {
            if (map.overlayMapTypes.getAt(i) === overlayLayer) {
                overlayIndex = i;
                break;
            }
        }

        if (overlayIndex === -1) {
            // Add overlay
            overlayLayer = new google.maps.ImageMapType({
                getTileUrl: (coord, zoom) =>
                    TILE_URL.replace("{z}", zoom).replace("{x}", coord.x).replace("{y}", coord.y),
                tileSize: new google.maps.Size(256, 256),
                opacity: 0.55,
                name: "Tsunami Evacuation",
            });
            map.overlayMapTypes.insertAt(0, overlayLayer);
            tsunamiButton.classList.add("MapLayerButton__controlButton--selected");
            console.log("Tsunami overlay added.");
        } else {
            // Remove overlay
            map.overlayMapTypes.removeAt(overlayIndex);
            overlayLayer = null;
            tsunamiButton.classList.remove("MapLayerButton__controlButton--selected");
            console.log("Tsunami overlay removed.");
        }
    }

    function createTsunamiButton() {
        const buttonDiv = document.createElement('div');
        buttonDiv.className = "MapLayerButton";

        const button = document.createElement('button');
        button.type = "button";
        button.title = "Tsunami mode";
        button.className = "MapLayerButton__controlButton tsunami clickable flex flex-column align-center";

        const img = document.createElement('img');
        img.className = "MapLayerButton__img spacing-margin-bottom-xsmall";
        img.src = 'https://tsunami.coast.noaa.gov/tsunami-mitigation-logo.0455f0f2.png';
        img.alt = 'Tsunami';
        img.loading = 'lazy';

        const label = document.createElement('span');
        label.className = "MapLayerButton__label";
        label.textContent = "Tsunami";

        button.appendChild(img);
        button.appendChild(label);
        button.addEventListener('click', toggleTsunamiOverlay);

        buttonDiv.appendChild(button);
        tsunamiButton = button; // Keep reference for toggling selected state

        // **Set highlight if overlay is already active**
        const map = window.__preloaded_map__;
        if (map && overlayLayer && isTsunamiOverlayActive()) {
            tsunamiButton.classList.add("MapLayerButton__controlButton--selected");
        }

        return buttonDiv;
    }

    function insertTsunamiButton(grid) {
        // Only insert if it doesn't exist BEFORE Flood
        if (!grid.querySelector('.MapLayerButton .tsunami')) {
            const floodButton = Array.from(grid.querySelectorAll('.MapLayerButton'))
                .find(btn => btn.querySelector('.MapLayerButton__label')?.textContent === 'Flood');
            if (!floodButton) return;

            const tsunamiBtnDiv = createTsunamiButton();
            floodButton.before(tsunamiBtnDiv);
            console.log("Tsunami button inserted before Flood.");
        } else {
            // Update highlight if button already exists
            const existingButton = grid.querySelector('.MapLayerButton .tsunami');
            if (existingButton) {
                tsunamiButton = existingButton;
                if (isTsunamiOverlayActive()) {
                    tsunamiButton.classList.add("MapLayerButton__controlButton--selected");
                } else {
                    tsunamiButton.classList.remove("MapLayerButton__controlButton--selected");
                }
            }
        }
    }

    function watchFlyout() {
        const flyoutGrids = document.querySelectorAll('.bp-MapControlsFlyout__Flyout--options-grid');
        flyoutGrids.forEach(grid => {
            // Only observe the grid containing Hidden
            if (Array.from(grid.querySelectorAll('.MapLayerButton__label')).some(l => l.textContent === 'Hidden')) {
                insertTsunamiButton(grid);

                const observer = new MutationObserver(() => insertTsunamiButton(grid));
                observer.observe(grid, { childList: true, subtree: true });
            }
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        watchFlyout();
    } else {
        window.addEventListener("DOMContentLoaded", watchFlyout);
    }

    const docObserver = new MutationObserver(watchFlyout);
    docObserver.observe(document.body, { childList: true, subtree: true });

})();
