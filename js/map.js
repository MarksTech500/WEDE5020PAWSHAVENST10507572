/* ==========================================================================
   Paws Haven Animal Rescue - interactive map (contact.html)
   --------------------------------------------------------------------------
   Uses the Leaflet library (self-hosted in vendor/leaflet/) with
   OpenStreetMap map tiles. The position comes from js/data.js.
   ========================================================================== */
(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        var container = document.getElementById("map");
        var PH = window.PawsHaven;
        if (!container || !window.L || !PH) { return; }

        var geo = PH.site.geo;
        var home = [geo.lat, geo.lng];

        var map = L.map(container, {
            center: home,
            zoom: geo.zoom,
            scrollWheelZoom: false      // stops the map "trapping" the page scroll; enabled once the map is clicked
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Popup content is built with DOM methods (no HTML strings).
        var popup = document.createElement("div");
        var title = document.createElement("strong");
        title.textContent = PH.site.name;
        var address = document.createElement("p");
        address.textContent = PH.site.addressLine;
        var directions = document.createElement("a");
        directions.href = "https://www.google.com/maps/dir/?api=1&destination=" + geo.lat + "," + geo.lng;
        directions.target = "_blank";
        directions.rel = "noopener noreferrer";
        directions.textContent = "Get directions";
        popup.appendChild(title);
        popup.appendChild(address);
        popup.appendChild(directions);

        var marker = L.marker(home, { title: PH.site.name, alt: "Paws Haven location marker" }).addTo(map);
        marker.bindPopup(popup).openPopup();

        map.once("focus", function () { map.scrollWheelZoom.enable(); });
        map.on("click", function () { map.scrollWheelZoom.enable(); });

        // "Reset map" button
        var reset = document.getElementById("map-reset");
        if (reset) {
            reset.addEventListener("click", function () {
                map.setView(home, geo.zoom);
                marker.openPopup();
            });
        }

        // "Show my location" button (asks the visitor for permission first)
        var locate = document.getElementById("map-locate");
        var note = document.getElementById("map-note");
        if (locate) {
            locate.addEventListener("click", function () {
                if (!navigator.geolocation) {
                    note.textContent = "Your browser does not support location finding.";
                    return;
                }
                note.textContent = "Finding your location...";
                navigator.geolocation.getCurrentPosition(function (position) {
                    var here = [position.coords.latitude, position.coords.longitude];
                    L.circleMarker(here, { radius: 8, color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.9 })
                        .addTo(map).bindPopup("You are here");
                    map.fitBounds([home, here], { padding: [40, 40] });
                    note.textContent = "Showing you and Paws Haven on the map.";
                }, function () {
                    note.textContent = "We could not find your location. You can still use the Get directions link.";
                }, { timeout: 8000 });
            });
        }
    });
})();
