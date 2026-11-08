/* ==========================================================================
   Paws Haven Animal Rescue - interactive elements (uses jQuery)
   --------------------------------------------------------------------------
   - Tabs               (about.html)
   - Accordion / FAQ    (enquiry.html, vaccination.html)
   - Modal dialogs      (donate.html, vaccination.html)
   - Gallery lightbox   (animals.html)
   jQuery is loaded from vendor/jquery/ (self-hosted, so no external request).
   ========================================================================== */
(function ($) {
    "use strict";

    if (!$) { return; }
    var PH = window.PawsHaven;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var speed = reduceMotion ? 0 : 220;

    /* ======================= TABS ======================= */
    function initTabs() {
        $(".tabs").each(function () {
            var $tabs = $(this);
            var $buttons = $tabs.find('[role="tab"]');
            var $panels = $tabs.find('[role="tabpanel"]');

            function select($button, setFocus) {
                $buttons.attr({ "aria-selected": "false", tabindex: "-1" }).removeClass("active");
                $button.attr({ "aria-selected": "true", tabindex: "0" }).addClass("active");
                $panels.prop("hidden", true);
                $("#" + $button.attr("aria-controls")).prop("hidden", false).hide().fadeIn(speed);
                if (setFocus) { $button.trigger("focus"); }
            }

            $buttons.on("click", function () { select($(this), false); });

            // Arrow keys / Home / End move between tabs (WAI-ARIA tabs pattern).
            $buttons.on("keydown", function (event) {
                var index = $buttons.index(this);
                var last = $buttons.length - 1;
                var next = null;
                if (event.key === "ArrowRight") { next = index === last ? 0 : index + 1; }
                if (event.key === "ArrowLeft") { next = index === 0 ? last : index - 1; }
                if (event.key === "Home") { next = 0; }
                if (event.key === "End") { next = last; }
                if (next !== null) {
                    event.preventDefault();
                    select($buttons.eq(next), true);
                }
            });
        });
    }

    /* ======================= ACCORDION ======================= */
    function initAccordions() {
        $(".accordion").each(function () {
            var $accordion = $(this);

            $accordion.find(".accordion-trigger").on("click", function () {
                var $trigger = $(this);
                var $panel = $("#" + $trigger.attr("aria-controls"));
                var isOpen = $trigger.attr("aria-expanded") === "true";

                // Only one answer open at a time.
                $accordion.find(".accordion-trigger[aria-expanded='true']").not($trigger).each(function () {
                    var $other = $(this);
                    $other.attr("aria-expanded", "false");
                    var $otherPanel = $("#" + $other.attr("aria-controls"));
                    $otherPanel.stop(true, true).slideUp(speed, function () { $otherPanel.prop("hidden", true); });
                });

                $trigger.attr("aria-expanded", String(!isOpen));
                if (isOpen) {
                    $panel.stop(true, true).slideUp(speed, function () { $panel.prop("hidden", true); });
                } else {
                    $panel.stop(true, true).prop("hidden", false).hide().slideDown(speed);
                }
            });
        });
    }

    /* ======================= MODALS ======================= */
    function paragraph(text) { return PH.el("p", { text: text }); }

    function initDonateModal() {
        $(document).on("click", ".donate-btn", function (event) {
            event.preventDefault();
            var amount = parseInt($(this).attr("data-amount"), 10);
            var tier = (PH.tiers || []).filter(function (t) { return t.amount === amount; })[0];
            if (!tier) { return; }

            PH.openModal({
                title: "Thank you for supporting Paws Haven!",
                body: [
                    PH.el("p", { class: "modal-amount", text: "R" + amount }),
                    paragraph("Your donation helps provide " + tier.covers + "."),
                    paragraph("To keep every donation safe, we only share our official banking details directly. " +
                        "Please contact our team, or sponsor an animal monthly through an enquiry.")
                ],
                actions: [
                    { label: "Contact the team", href: "contact.html?type=donation&amount=" + amount + "#contact-form", style: "btn-primary" },
                    { label: "Sponsor monthly", href: "enquiry.html?type=sponsor&tier=" + amount + "#enquiry-form", style: "btn-green" }
                ]
            });
        });
    }

    function initVaccinationModal() {
        $(document).on("click", ".price-info-btn", function () {
            var kind = $(this).attr("data-kind");
            if (kind === "free") {
                PH.openModal({
                    title: "First vaccination - FREE",
                    body: [
                        paragraph("Every animal adopted through Paws Haven receives an eligible first vaccination at no additional charge."),
                        paragraph("The vaccination is subject to veterinary assessment and programme availability.")
                    ],
                    actions: [{ label: "Start an adoption enquiry", href: "enquiry.html?type=adoption#enquiry-form", style: "btn-primary" }]
                });
            } else {
                PH.openModal({
                    title: "Annual vaccination - R" + PH.fees.annualVaccination,
                    body: [
                        paragraph("A subsidised yearly contribution of R" + PH.fees.annualVaccination + " towards eligible, recommended vaccinations."),
                        paragraph("Additional treatment or vaccines may carry separate costs, which are explained before treatment.")
                    ],
                    actions: [{ label: "Ask a question", href: "contact.html?type=vaccination#contact-form", style: "btn-primary" }]
                });
            }
        });
    }

    /* ======================= LIGHTBOX ======================= */
    function initLightbox() {
        var $gallery = $("#gallery");
        if (!$gallery.length) { return; }

        var dialog = PH.el("dialog", { class: "lightbox", id: "lightbox", "aria-label": "Photo viewer" });
        var image = PH.el("img", { alt: "" });
        var caption = PH.el("p", { class: "lightbox-caption" });
        var counter = PH.el("span", { class: "lightbox-counter", "aria-live": "polite" });
        var closeBtn = PH.el("button", { class: "lightbox-btn lightbox-close", type: "button", "aria-label": "Close photo viewer", text: "×" });
        var prevBtn = PH.el("button", { class: "lightbox-btn lightbox-prev", type: "button", "aria-label": "Previous photo", text: "‹" });
        var nextBtn = PH.el("button", { class: "lightbox-btn lightbox-next", type: "button", "aria-label": "Next photo", text: "›" });
        var figure = PH.el("figure", { class: "lightbox-figure" }, [image, PH.el("figcaption", {}, [caption, counter])]);
        [closeBtn, prevBtn, nextBtn, figure].forEach(function (node) { dialog.appendChild(node); });
        document.body.appendChild(dialog);

        var items = [];
        var current = 0;

        function show(index) {
            current = (index + items.length) % items.length;
            var item = items[current];
            image.classList.remove("swap");
            image.src = item.src;
            image.alt = item.alt;
            caption.textContent = item.caption;
            counter.textContent = (current + 1) + " / " + items.length;
            void image.offsetWidth;            // restart the fade animation
            image.classList.add("swap");
        }

        $gallery.on("click", "[data-lightbox]", function () {
            items = $gallery.find("[data-lightbox]").map(function () {
                return { src: $(this).attr("data-lightbox"), caption: $(this).attr("data-caption"), alt: $(this).attr("data-alt") };
            }).get();
            show($gallery.find("[data-lightbox]").index(this));
            dialog.showModal();
        });

        $(closeBtn).on("click", function () { dialog.close(); });
        $(prevBtn).on("click", function () { show(current - 1); });
        $(nextBtn).on("click", function () { show(current + 1); });
        $(dialog).on("click", function (event) { if (event.target === dialog) { dialog.close(); } });
        $(dialog).on("keydown", function (event) {
            if (event.key === "ArrowLeft") { show(current - 1); }
            if (event.key === "ArrowRight") { show(current + 1); }
        });

        // Swipe left / right on touch screens.
        var startX = null;
        dialog.addEventListener("touchstart", function (event) { startX = event.changedTouches[0].clientX; }, { passive: true });
        dialog.addEventListener("touchend", function (event) {
            if (startX === null) { return; }
            var delta = event.changedTouches[0].clientX - startX;
            if (Math.abs(delta) > 50) { show(current + (delta < 0 ? 1 : -1)); }
            startX = null;
        }, { passive: true });
    }

    $(function () {
        initTabs();
        initAccordions();
        initDonateModal();
        initVaccinationModal();
        initLightbox();
    });
})(window.jQuery);
