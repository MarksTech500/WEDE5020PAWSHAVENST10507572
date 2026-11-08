/* ==========================================================================
   Paws Haven Animal Rescue - main script (runs on every page)
   --------------------------------------------------------------------------
   - Mobile navigation menu
   - Footer year
   - Scroll-reveal animation (IntersectionObserver)
   - Animated number counters
   - Back-to-top button
   - Social share links (off-page SEO)
   - Small shared helpers used by the other scripts (PawsHaven.el, openModal)
   ========================================================================== */
(function () {
    "use strict";

    var PH = (window.PawsHaven = window.PawsHaven || {});
    var doc = document;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Lets the stylesheet know JavaScript is running (used by the reveal animation).
    doc.documentElement.classList.add("js");

    /* ----- Helper: build a DOM element safely (text is never parsed as HTML) ----- */
    PH.el = function (tag, attrs, children) {
        var node = doc.createElement(tag);
        Object.keys(attrs || {}).forEach(function (key) {
            var value = attrs[key];
            if (value === null || value === undefined || value === false) { return; }
            if (key === "text") { node.textContent = value; }
            else if (key === "class") { node.className = value; }
            else { node.setAttribute(key, value === true ? "" : value); }
        });
        (children || []).forEach(function (child) {
            if (child === null || child === undefined) { return; }
            node.appendChild(typeof child === "string" ? doc.createTextNode(child) : child);
        });
        return node;
    };

    /* ----- Animated counter ----- */
    PH.countUp = function (element, target) {
        if (reduceMotion || target < 2) { element.textContent = target; return; }
        var duration = 1200;
        var start = null;
        function step(timestamp) {
            if (start === null) { start = timestamp; }
            var progress = Math.min((timestamp - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = Math.round(target * eased);
            if (progress < 1) { window.requestAnimationFrame(step); }
        }
        window.requestAnimationFrame(step);
    };

    /* ----- Modal dialog (uses the native <dialog> element) ----- */
    PH.openModal = function (options) {
        var dialog = doc.getElementById("info-modal");
        if (!dialog || typeof dialog.showModal !== "function") {
            // Very old browsers: fall back to a plain message.
            window.alert(options.title + "\n\n" + (options.text || ""));
            return;
        }
        doc.getElementById("modal-title").textContent = options.title;

        var body = doc.getElementById("modal-body");
        body.textContent = "";
        (options.body || []).forEach(function (node) { body.appendChild(node); });

        var actions = doc.getElementById("modal-actions");
        actions.textContent = "";
        (options.actions || []).forEach(function (action) {
            actions.appendChild(PH.el("a", {
                class: "btn " + (action.style || "btn-green"),
                href: action.href,
                text: action.label
            }));
        });
        var close = PH.el("button", { class: "btn btn-outline", type: "button", text: "Close" });
        close.addEventListener("click", function () { dialog.close(); });
        actions.appendChild(close);

        dialog.showModal();
    };

    function setupModalDismiss() {
        var dialog = doc.getElementById("info-modal");
        if (!dialog) { return; }
        var closeButton = dialog.querySelector(".modal-close");
        if (closeButton) { closeButton.addEventListener("click", function () { dialog.close(); }); }
        // Clicking the dark backdrop (outside the card) closes the dialog.
        dialog.addEventListener("click", function (event) {
            if (event.target === dialog) { dialog.close(); }
        });
    }

    doc.addEventListener("DOMContentLoaded", function () {

        /* ----- Mobile navigation ----- */
        var menuButton = doc.querySelector(".menu-toggle");
        var navLinks = doc.querySelector(".nav-links");

        function setMenu(open) {
            navLinks.classList.toggle("open", open);
            menuButton.setAttribute("aria-expanded", String(open));
            menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
        }

        if (menuButton && navLinks) {
            menuButton.addEventListener("click", function () {
                setMenu(!navLinks.classList.contains("open"));
            });
            navLinks.querySelectorAll("a").forEach(function (link) {
                link.addEventListener("click", function () { setMenu(false); });
            });
            doc.addEventListener("keydown", function (event) {
                if (event.key === "Escape" && navLinks.classList.contains("open")) {
                    setMenu(false);
                    menuButton.focus();
                }
            });
            doc.addEventListener("click", function (event) {
                if (navLinks.classList.contains("open") &&
                    !navLinks.contains(event.target) && !menuButton.contains(event.target)) {
                    setMenu(false);
                }
            });
        }

        /* ----- Footer year ----- */
        doc.querySelectorAll(".current-year").forEach(function (node) {
            node.textContent = new Date().getFullYear();
        });

        /* ----- Scroll-reveal animation ----- */
        var revealSelector = ".card, .info-box, .section-heading, .location-card, .donation-card, " +
            ".impact-item, .price-card, .step, .importance-content, .form-container, .tabs, .accordion";
        var revealTargets = doc.querySelectorAll(revealSelector);

        if ("IntersectionObserver" in window && !reduceMotion) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12 });

            revealTargets.forEach(function (node) {
                node.classList.add("reveal");
                observer.observe(node);
            });
        }

        /* ----- Back-to-top button ----- */
        var topButton = PH.el("button", {
            class: "back-to-top", type: "button", "aria-label": "Back to top", text: "↑"
        });
        doc.body.appendChild(topButton);
        topButton.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
        window.addEventListener("scroll", function () {
            topButton.classList.toggle("show", window.scrollY > 500);
        }, { passive: true });

        /* ----- Social share links (off-page SEO) ----- */
        var shareBox = doc.querySelector("[data-share]");
        if (shareBox) {
            var url = encodeURIComponent(window.location.href.split("#")[0]);
            var text = encodeURIComponent("Paws Haven Animal Rescue - help an animal find a forever home");
            [
                { label: "Facebook", href: "https://www.facebook.com/sharer/sharer.php?u=" + url },
                { label: "X", href: "https://twitter.com/intent/tweet?url=" + url + "&text=" + text },
                { label: "WhatsApp", href: "https://wa.me/?text=" + text + "%20" + url }
            ].forEach(function (network) {
                shareBox.appendChild(PH.el("a", {
                    href: network.href, target: "_blank", rel: "noopener noreferrer",
                    "aria-label": "Share Paws Haven on " + network.label, text: network.label
                }));
            });
        }

        /* ----- Counters that do not depend on data (data-count-to="12") ----- */
        doc.querySelectorAll("[data-count-to]").forEach(function (node) {
            PH.countUp(node, parseInt(node.getAttribute("data-count-to"), 10) || 0);
        });

        setupModalDismiss();
    });
})();
