/* ==========================================================================
   Paws Haven Animal Rescue - dynamic animal content
   --------------------------------------------------------------------------
   The animal profiles live in js/data.js. This script builds the cards with
   DOM manipulation and adds search, filtering and sorting.

   Used on:  index.html (featured animals + live statistics)
             animals.html (full list, search/filter/sort, photo gallery)
   ========================================================================== */
(function () {
    "use strict";

    var PH = window.PawsHaven;
    if (!PH || !PH.animals) { return; }
    var el = PH.el;

    function enquiryLink(animal) {
        return "enquiry.html?type=adoption&animal=" + encodeURIComponent(animal.id) + "#enquiry-form";
    }

    /* Build one animal card (all text is inserted with textContent - never innerHTML). */
    function buildCard(animal) {
        var available = animal.status === "Available";

        var photo = el("img", {
            class: "animal-photo", src: animal.image, alt: animal.alt,
            width: animal.width, height: animal.height, loading: "lazy", decoding: "async"
        });

        var info = el("div", { class: "animal-info" }, [
            el("h3", { text: animal.name }),
            el("div", { class: "tag-row" }, [
                el("span", { class: "tag", text: animal.breed }),
                el("span", { class: "status " + (available ? "status-available" : "status-pending"), text: animal.status })
            ]),
            el("p", {}, [el("strong", { text: "Age: " }), animal.age]),
            el("p", { text: animal.description }),
            el("a", {
                class: "btn btn-primary", href: enquiryLink(animal),
                "aria-label": (available ? "Ask about " : "Ask about the waiting list for ") + animal.name,
                text: available ? "Ask About " + animal.name : "Waiting list for " + animal.name
            })
        ]);

        return el("article", { class: "animal-card fade-in", "data-species": animal.species }, [photo, info]);
    }

    /* ======================= HOME PAGE ======================= */
    function initHome() {
        var featured = document.getElementById("featured-animals");
        if (featured) {
            PH.animals.filter(function (a) { return a.status === "Available"; })
                .slice(0, 3)
                .forEach(function (a) { featured.appendChild(buildCard(a)); });
        }

        var counts = {
            total: PH.animals.length,
            dogs: PH.animals.filter(function (a) { return a.species === "Dog"; }).length,
            cats: PH.animals.filter(function (a) { return a.species === "Cat"; }).length
        };
        document.querySelectorAll("[data-stat]").forEach(function (node) {
            var value = counts[node.getAttribute("data-stat")];
            if (typeof value === "number") { PH.countUp(node, value); }
        });
    }

    /* ======================= ANIMALS PAGE ======================= */
    function initAnimalsPage() {
        var grid = document.getElementById("animal-grid");
        if (!grid) { return; }

        var searchInput = document.getElementById("animal-search");
        var speciesSelect = document.getElementById("filter-species");
        var ageSelect = document.getElementById("filter-age");
        var sortSelect = document.getElementById("sort-animals");
        var availableOnly = document.getElementById("filter-available");
        var resetButtons = document.querySelectorAll("[data-reset-filters]");
        var countText = document.getElementById("results-count");
        var emptyState = document.getElementById("no-results");

        function ageGroup(animal) {
            if (animal.ageMonths < 12) { return "baby"; }
            if (animal.ageMonths <= 24) { return "young"; }
            return "adult";
        }

        function getVisibleAnimals() {
            var query = searchInput.value.trim().toLowerCase();
            var species = speciesSelect.value;
            var age = ageSelect.value;

            var list = PH.animals.filter(function (animal) {
                var haystack = [animal.name, animal.breed, animal.species, animal.description, animal.age]
                    .join(" ").toLowerCase();
                if (query && haystack.indexOf(query) === -1) { return false; }
                if (species !== "all" && animal.species !== species) { return false; }
                if (age !== "all" && ageGroup(animal) !== age) { return false; }
                if (availableOnly.checked && animal.status !== "Available") { return false; }
                return true;
            });

            var sort = sortSelect.value;
            list.sort(function (a, b) {
                if (sort === "name-desc") { return b.name.localeCompare(a.name); }
                if (sort === "age-asc") { return a.ageMonths - b.ageMonths || a.name.localeCompare(b.name); }
                if (sort === "age-desc") { return b.ageMonths - a.ageMonths || a.name.localeCompare(b.name); }
                return a.name.localeCompare(b.name);
            });
            return list;
        }

        function render() {
            var list = getVisibleAnimals();
            grid.textContent = "";
            list.forEach(function (animal) { grid.appendChild(buildCard(animal)); });

            countText.textContent = list.length === PH.animals.length
                ? "Showing all " + list.length + " animals"
                : "Showing " + list.length + " of " + PH.animals.length + " animals";
            emptyState.hidden = list.length !== 0;
            grid.hidden = list.length === 0;
        }

        var timer;
        searchInput.addEventListener("input", function () {
            window.clearTimeout(timer);
            timer = window.setTimeout(render, 150);   // small delay while the user is typing
        });
        [speciesSelect, ageSelect, sortSelect, availableOnly].forEach(function (control) {
            control.addEventListener("change", render);
        });
        resetButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                searchInput.value = "";
                speciesSelect.value = "all";
                ageSelect.value = "all";
                sortSelect.value = "name-asc";
                availableOnly.checked = false;
                render();
                searchInput.focus();
            });
        });
        // Pressing Enter in the search box must not reload the page.
        document.getElementById("animal-filters").addEventListener("submit", function (event) {
            event.preventDefault();
        });

        // Allow links such as animals.html?species=Cat
        var params = new URLSearchParams(window.location.search);
        var presetSpecies = params.get("species");
        if (presetSpecies && /^(dog|cat)$/i.test(presetSpecies)) {
            speciesSelect.value = presetSpecies.charAt(0).toUpperCase() + presetSpecies.slice(1).toLowerCase();
        }

        render();

        /* ----- Photo gallery (opens in the lightbox, see ui.js) ----- */
        var gallery = document.getElementById("gallery");
        if (gallery) {
            PH.animals.forEach(function (animal) {
                var button = el("button", {
                    class: "gallery-item", type: "button",
                    "data-lightbox": animal.image,
                    "data-caption": animal.name + " - " + animal.breed + ", " + animal.age,
                    "data-alt": animal.alt,
                    "aria-label": "Enlarge photo of " + animal.name
                }, [
                    el("img", {
                        src: animal.image, alt: animal.alt, width: animal.width, height: animal.height,
                        loading: "lazy", decoding: "async"
                    }),
                    el("span", { class: "gallery-caption", text: animal.name })
                ]);
                gallery.appendChild(el("li", {}, [button]));
            });
        }
    }

    document.addEventListener("DOMContentLoaded", function () {
        var page = document.body.getAttribute("data-page");
        if (page === "home") { initHome(); }
        if (page === "animals") { initAnimalsPage(); }
    });
})();
