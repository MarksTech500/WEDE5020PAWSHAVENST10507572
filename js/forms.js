/* ==========================================================================
   Paws Haven Animal Rescue - form validation and processing
   --------------------------------------------------------------------------
   enquiry.html  - validates the form, works out a cost / availability answer
                   for the visitor and submits the data with AJAX (fetch).
   contact.html  - validates the form and compiles the message into an email
                   that the visitor can send to the address stored in the form.

   Validation is done with JavaScript on top of the HTML5 attributes
   (required, minlength, maxlength, type, min, max). All visitor input is
   written to the page with textContent, never innerHTML, so it cannot inject
   markup into the page.
   ========================================================================== */
(function () {
    "use strict";

    var PH = window.PawsHaven;
    if (!PH) { return; }
    var el = PH.el;
    var doc = document;

    /* ----------------------------------------------------------------------
       1. Validation rules
       ---------------------------------------------------------------------- */
    var NAME_PATTERN = /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ '.\-]+$/;
    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    // South African numbers: 0821234567, 082 123 4567, +27 82 123 4567, 011 000 0000
    var PHONE_PATTERN = /^(?:\+27|0027|0)[1-9]\d{8}$/;

    function label(field) {
        return field.getAttribute("data-label") || "this field";
    }

    function lengthMessage(field, value) {
        var min = parseInt(field.getAttribute("minlength"), 10);
        var max = parseInt(field.getAttribute("maxlength"), 10);
        if (min && value.length < min) {
            return label(field) + " must be at least " + min + " characters (you have " + value.length + ").";
        }
        if (max && value.length > max) {
            return label(field) + " must be " + max + " characters or fewer.";
        }
        return "";
    }

    function todayString(offsetDays) {
        var date = new Date();
        date.setDate(date.getDate() + (offsetDays || 0));
        var month = String(date.getMonth() + 1).padStart(2, "0");
        var day = String(date.getDate()).padStart(2, "0");
        return date.getFullYear() + "-" + month + "-" + day;
    }

    function isRealDate(text) {
        var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
        if (!match) { return false; }
        var date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return date.getFullYear() === Number(match[1]) &&
               date.getMonth() === Number(match[2]) - 1 &&
               date.getDate() === Number(match[3]);
    }

    /* Each validator returns an error message, or "" when the value is fine. */
    var validators = {
        name: function (field, value) {
            if (!value) { return "Please enter your full name."; }
            if (value.length < 2 || value.length > 60) { return "Your name must be between 2 and 60 characters."; }
            if (!NAME_PATTERN.test(value)) { return "Your name may only contain letters, spaces, hyphens and apostrophes."; }
            return "";
        },
        email: function (field, value) {
            if (!value) { return "Please enter your email address."; }
            if (value.length > 254 || !EMAIL_PATTERN.test(value)) { return "Please enter a valid email address, for example name@example.com."; }
            return "";
        },
        phone: function (field, value) {
            if (!value) { return field.required ? "Please enter your phone number." : ""; }
            var cleaned = value.replace(/[\s\-().]/g, "");
            if (!PHONE_PATTERN.test(cleaned)) {
                return "Please enter a valid South African number, for example 082 123 4567 or +27 82 123 4567.";
            }
            return "";
        },
        text: function (field, value) {
            if (!value) { return field.required ? "Please enter " + label(field) + "." : ""; }
            return lengthMessage(field, value);
        },
        message: function (field, value) {
            if (!value) { return "Please type your message."; }
            return lengthMessage(field, value);
        },
        select: function (field, value) {
            return value ? "" : "Please choose " + label(field) + ".";
        },
        number: function (field, value) {
            if (value === "") { return "Please enter " + label(field) + "."; }
            var number = Number(value);
            var min = Number(field.min);
            var max = Number(field.max);
            if (!/^\d+$/.test(value) || isNaN(number)) { return label(field) + " must be a whole number."; }
            if (number < min || number > max) { return label(field) + " must be between " + min + " and " + max + "."; }
            return "";
        },
        date: function (field, value) {
            if (!value) { return "Please choose " + label(field) + "."; }
            if (!isRealDate(value)) { return "Please enter a valid date."; }
            if (field.min && value < field.min) { return "The date cannot be in the past."; }
            if (field.max && value > field.max) { return "Please choose a date within the next 12 months."; }
            return "";
        },
        checkbox: function (field) {
            return field.checked ? "" : field.getAttribute("data-error") || "Please tick this box to continue.";
        },
        group: function (fieldset) {
            var chosen = fieldset.querySelectorAll("input:checked").length;
            return chosen ? "" : fieldset.getAttribute("data-error") || "Please choose at least one option.";
        }
    };

    function isActive(field) {
        // Fields inside a hidden / disabled section are skipped.
        return !field.matches(":disabled") && !field.closest("[hidden]");
    }

    function getErrorBox(field) {
        return doc.getElementById(field.id + "-error");
    }

    function showError(field, message) {
        var box = getErrorBox(field);
        var wrapper = field.closest(".form-group");
        if (box) { box.textContent = message; }
        if (wrapper) { wrapper.classList.toggle("has-error", !!message); }
        if (field.tagName === "FIELDSET") { return; }
        if (message) {
            field.setAttribute("aria-invalid", "true");
            if (box) { field.setAttribute("aria-describedby", box.id); }
        } else {
            field.removeAttribute("aria-invalid");
        }
    }

    function validateField(field) {
        if (!isActive(field)) { showError(field, ""); return ""; }
        var kind = field.getAttribute("data-validate");
        var fn = validators[kind];
        if (!fn) { return ""; }
        var value = field.tagName === "FIELDSET" ? "" : String(field.value).trim();
        var message = fn(field, value);
        showError(field, message);
        return message;
    }

    function validateForm(form) {
        var problems = [];
        form.querySelectorAll("[data-validate]").forEach(function (field) {
            var message = validateField(field);
            if (message) { problems.push({ field: field, message: message }); }
        });
        return problems;
    }

    /* Show a list of problems at the top of the form and move focus to the first one. */
    function showSummary(form, problems) {
        var summary = form.querySelector(".form-summary");
        if (!summary) { return; }
        summary.textContent = "";
        if (!problems.length) { summary.hidden = true; return; }

        summary.appendChild(el("p", { text: "Please fix " + problems.length + (problems.length === 1 ? " problem" : " problems") + " before sending:" }));
        var list = el("ul");
        problems.forEach(function (problem) {
            var link = el("a", { href: "#" + problem.field.id, text: problem.message });
            link.addEventListener("click", function (event) {
                event.preventDefault();
                focusField(problem.field);
            });
            list.appendChild(el("li", {}, [link]));
        });
        summary.appendChild(list);
        summary.hidden = false;
        summary.focus();
    }

    function focusField(field) {
        var target = field.tagName === "FIELDSET" ? field.querySelector("input") : field;
        if (target) { target.focus(); }
    }

    /* Live feedback: check a field when the visitor leaves it, then keep checking as they fix it. */
    function wireLiveValidation(form) {
        form.querySelectorAll("[data-validate]").forEach(function (field) {
            if (field.tagName === "FIELDSET") {
                field.addEventListener("change", function () { validateField(field); });
                return;
            }
            field.addEventListener("blur", function () { field.setAttribute("data-touched", "true"); validateField(field); });
            var eventName = (field.tagName === "SELECT" || field.type === "checkbox" || field.type === "date") ? "change" : "input";
            field.addEventListener(eventName, function () {
                if (field.getAttribute("data-touched") === "true" || field.getAttribute("aria-invalid") === "true") {
                    validateField(field);
                }
            });
        });

        form.querySelectorAll("[data-counter-for]").forEach(function (counter) {
            var field = doc.getElementById(counter.getAttribute("data-counter-for"));
            var max = field.getAttribute("maxlength");
            function update() { counter.textContent = field.value.length + " / " + max; }
            field.addEventListener("input", update);
            update();
        });
    }

    function clearAllErrors(form) {
        form.querySelectorAll("[data-validate]").forEach(function (field) {
            showError(field, "");
            field.removeAttribute("data-touched");
        });
        var summary = form.querySelector(".form-summary");
        if (summary) { summary.hidden = true; summary.textContent = ""; }
    }

    function setSelect(select, value) {
        if (!select || !value) { return false; }
        var found = Array.prototype.some.call(select.options, function (option) { return option.value === value; });
        if (found) { select.value = value; }
        return found;
    }

    function option(value, text, extra) {
        return el("option", Object.assign({ value: value, text: text }, extra || {}));
    }

    function money(amount) { return "R" + amount.toLocaleString("en-ZA").replace(/ /g, " "); }

    function formatDate(date) {
        return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }

    /* ----------------------------------------------------------------------
       2. ENQUIRY FORM  (enquiry.html)
       ---------------------------------------------------------------------- */
    function initEnquiry() {
        var form = doc.getElementById("enquiry-form");
        if (!form) { return; }
        form.noValidate = true;     // JavaScript shows the messages (the HTML5 attributes remain as a fallback)

        var typeSelect = doc.getElementById("enq-type");
        var animalSelect = doc.getElementById("enq-animal");
        var tierSelect = doc.getElementById("enq-tier");
        var areaBox = doc.getElementById("enq-areas");
        var dateInput = doc.getElementById("enq-start");
        var response = doc.getElementById("enquiry-response");
        var status = doc.getElementById("ajax-status");
        var sections = form.querySelectorAll("[data-for]");

        /* --- Build the dynamic parts of the form from js/data.js --- */
        animalSelect.appendChild(option("any", "Not sure yet - tell me what is available"));
        PH.animals.forEach(function (animal) {
            var suffix = animal.status === "Available" ? "" : " (" + animal.status.toLowerCase() + ")";
            animalSelect.appendChild(option(animal.id, animal.name + " - " + animal.breed + suffix));
        });

        PH.tiers.forEach(function (tier) { tierSelect.appendChild(option(String(tier.amount), tier.label)); });

        PH.volunteerAreas.forEach(function (area, index) {
            var id = "enq-area-" + index;
            areaBox.appendChild(el("label", { class: "check", for: id }, [
                el("input", { type: "checkbox", id: id, name: "volunteer_areas", value: area.value }),
                " " + area.label
            ]));
        });

        dateInput.min = todayString(0);
        dateInput.max = todayString(365);

        /* --- Show only the questions that belong to the chosen enquiry type --- */
        function updateSections() {
            var type = typeSelect.value;
            sections.forEach(function (section) {
                var show = section.getAttribute("data-for").split(" ").indexOf(type) !== -1;
                section.hidden = !show;
                section.disabled = !show;
                if (!show) {
                    section.querySelectorAll("[data-validate]").forEach(function (field) { showError(field, ""); });
                }
            });
        }
        typeSelect.addEventListener("change", updateSections);

        /* --- Pre-fill from links such as enquiry.html?type=adoption&animal=max --- */
        var params = new URLSearchParams(window.location.search);
        setSelect(typeSelect, params.get("type"));
        updateSections();
        setSelect(animalSelect, params.get("animal"));
        setSelect(tierSelect, params.get("tier"));

        wireLiveValidation(form);

        /* --- Work out the answer shown to the visitor --- */
        function buildAnswer(values) {
            var firstName = values.name.split(/\s+/)[0];
            var answer = { title: "Thank you, " + firstName + "!", rows: [], notes: [] };

            if (values.type === "adoption") {
                var animal = PH.animals.filter(function (a) { return a.id === values.animal; })[0];
                answer.heading = "Adoption enquiry";
                if (animal) {
                    var fee = PH.fees[animal.species];
                    var available = animal.status === "Available";
                    answer.rows.push(["Animal", animal.name + " (" + animal.breed + ", " + animal.age + ")"]);
                    answer.rows.push(["Availability", available
                        ? animal.name + " is available. You can meet " + animal.name + " by appointment."
                        : animal.name + " currently has an adoption pending. We will add you to the waiting list and contact you if the adoption does not go ahead."]);
                    answer.rows.push(["Adoption fee", money(fee)]);
                    if (animal.species === "Dog" && values.home === "flat") {
                        answer.notes.push(animal.name + " will need regular daily exercise. We will chat with you about how to manage this in a flat or apartment.");
                    }
                } else {
                    var availableAnimals = PH.animals.filter(function (a) { return a.status === "Available"; });
                    var dogs = availableAnimals.filter(function (a) { return a.species === "Dog"; }).length;
                    var cats = availableAnimals.filter(function (a) { return a.species === "Cat"; }).length;
                    answer.rows.push(["Availability", "We currently have " + dogs + (dogs === 1 ? " dog" : " dogs") + " and " + cats + (cats === 1 ? " cat" : " cats") + " available for adoption."]);
                    answer.rows.push(["Adoption fees", "Dogs " + money(PH.fees.Dog) + ", cats " + money(PH.fees.Cat)]);
                }
                answer.rows.push(["Included", "An eligible first vaccination at no extra charge. Annual vaccinations afterwards are a subsidised " + money(PH.fees.annualVaccination) + "."]);
                if (values.pets === "yes") {
                    answer.notes.push("Because you have other pets, we will arrange a meet-and-greet to make sure the match is a good one.");
                }
                answer.rows.push(["Household", values.household + (Number(values.household) === 1 ? " person" : " people") + ", " + homeLabel(values.home)]);
            }

            if (values.type === "volunteer") {
                answer.heading = "Volunteer enquiry";
                answer.rows.push(["Cost", "Free - volunteering costs you nothing."]);
                answer.rows.push(["Areas of interest", values.areas.join(", ")]);
                answer.rows.push(["Availability", availabilityLabel(values.availability)]);
                answer.rows.push(["Your start date", formatDate(parseDate(values.start))]);
                answer.rows.push(["Next orientation", formatDate(nextFirstSaturday(parseDate(values.start))) + " at 09:00 (orientation is held on the first Saturday of each month)"]);
            }

            if (values.type === "sponsor") {
                answer.heading = "Sponsorship enquiry";
                var amount = Number(values.tier);
                var tier = PH.tiers.filter(function (t) { return t.amount === amount; })[0];
                var monthly = values.frequency === "monthly";
                answer.rows.push(["Your sponsorship", money(amount) + (monthly ? " per month" : " once-off")]);
                if (monthly) { answer.rows.push(["Yearly total", money(amount * 12)]); }
                answer.rows.push(["What it covers", tier ? tier.covers.charAt(0).toUpperCase() + tier.covers.slice(1) : "Animal care"]);
                answer.rows.push(["Availability", "Sponsorship places are open - there is no waiting list."]);
                answer.notes.push("For your safety we only share banking details directly. Our team will email them to you - please do not pay to any other account.");
            }

            if (values.type === "general") {
                answer.heading = "General enquiry";
                answer.rows.push(["Cost", "There is no charge for general enquiries."]);
                answer.rows.push(["Availability", "Our team will reply within 2 working days."]);
            }

            answer.rows.push(["Next steps", "We will reply to " + values.email + (values.phone ? " or phone you on " + values.phone : "") + " within 2 working days."]);
            return answer;
        }

        function homeLabel(value) {
            return { house_garden: "house with a garden", house_no_garden: "house without a garden", flat: "flat / apartment", smallholding: "farm or smallholding" }[value] || value;
        }
        function availabilityLabel(value) {
            return { weekdays: "Weekdays", weekends: "Weekends", both: "Weekdays and weekends" }[value] || value;
        }
        function parseDate(text) {
            var p = text.split("-");
            return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        }
        function nextFirstSaturday(from) {
            var year = from.getFullYear();
            var month = from.getMonth();
            for (var i = 0; i < 14; i++) {
                var first = new Date(year, month + i, 1);
                var offset = (6 - first.getDay() + 7) % 7;      // days until Saturday
                var saturday = new Date(first.getFullYear(), first.getMonth(), 1 + offset);
                if (saturday >= from) { return saturday; }
            }
            return from;
        }

        function readValues() {
            var data = new FormData(form);
            return {
                type: data.get("type"),
                name: String(data.get("name")).trim(),
                email: String(data.get("email")).trim(),
                phone: String(data.get("phone") || "").trim(),
                animal: data.get("animal"),
                home: data.get("home"),
                pets: data.get("pets"),
                household: data.get("household"),
                areas: data.getAll("volunteer_areas").map(function (value) {
                    var match = PH.volunteerAreas.filter(function (a) { return a.value === value; })[0];
                    return match ? match.label : value;
                }),
                start: data.get("start_date"),
                availability: data.get("availability"),
                tier: data.get("tier"),
                frequency: data.get("frequency")
            };
        }

        function showAnswer(answer, values) {
            response.textContent = "";
            response.appendChild(el("h3", { id: "response-title", tabindex: "-1", text: answer.title }));
            response.appendChild(el("p", { class: "response-lead", text: "Here is the information for your " + answer.heading.toLowerCase() + "." }));
            var list = el("dl", { class: "answer-list" });
            answer.rows.forEach(function (row) {
                list.appendChild(el("dt", { text: row[0] }));
                list.appendChild(el("dd", { text: row[1] }));
            });
            response.appendChild(list);
            answer.notes.forEach(function (note) {
                response.appendChild(el("p", { class: "answer-note", text: note }));
            });
            var again = el("button", { class: "btn btn-outline", type: "button", text: "Make another enquiry" });
            again.addEventListener("click", function () {
                form.reset();
                clearAllErrors(form);
                updateSections();
                response.hidden = true;
                status.textContent = "";
                typeSelect.focus();
            });
            response.appendChild(el("div", { class: "response-actions" }, [again]));
            response.hidden = false;
            response.classList.remove("fade-in");
            void response.offsetWidth;
            response.classList.add("fade-in");
            doc.getElementById("response-title").focus();
            response.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        /* --- AJAX submission (fetch). Works on Netlify Forms; other hosts will refuse the POST. --- */
        function sendWithAjax() {
            var button = form.querySelector("button[type='submit']");
            var controller = "AbortController" in window ? new AbortController() : null;
            var timer = window.setTimeout(function () { if (controller) { controller.abort(); } }, 8000);

            button.disabled = true;
            button.textContent = "Sending...";
            status.className = "ajax-status";
            status.textContent = "Sending your enquiry to our team...";

            var body = new URLSearchParams(new FormData(form)).toString();

            return fetch(form.getAttribute("action") || "/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: body,
                signal: controller ? controller.signal : undefined
            }).then(function (reply) {
                if (!reply.ok) { throw new Error("HTTP " + reply.status); }
                status.className = "ajax-status ok";
                status.textContent = "Your enquiry was also sent to the Paws Haven team.";
            }).catch(function () {
                status.className = "ajax-status warn";
                status.textContent = "We could not send your enquiry online right now. The answer above is still correct - " +
                    "please email " + PH.site.email + " so our team receives your details.";
            }).then(function () {
                window.clearTimeout(timer);
                button.disabled = false;
                button.textContent = "Submit Enquiry";
            });
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var problems = validateForm(form);
            showSummary(form, problems);
            if (problems.length) { response.hidden = true; return; }

            // The hidden "bot-field" is invisible to people. If it has a value, a bot filled it in.
            if (form.elements["bot-field"] && form.elements["bot-field"].value) { return; }

            var values = readValues();
            showAnswer(buildAnswer(values), values);
            sendWithAjax();
        });
    }

    /* ----------------------------------------------------------------------
       3. CONTACT FORM  (contact.html)
       ---------------------------------------------------------------------- */
    function initContact() {
        var form = doc.getElementById("contact-form");
        if (!form) { return; }
        form.noValidate = true;

        var recipient = form.getAttribute("data-recipient") || PH.site.email;
        var typeSelect = doc.getElementById("contact-type");
        var subjectInput = doc.getElementById("contact-subject");
        var preview = doc.getElementById("email-preview");

        /* --- Pre-fill from links such as contact.html?type=donation&amount=250 --- */
        var params = new URLSearchParams(window.location.search);
        var type = params.get("type");
        if (setSelect(typeSelect, type) && !subjectInput.value) {
            var amount = parseInt(params.get("amount"), 10);
            if (type === "donation") { subjectInput.value = amount > 0 ? "Donation of R" + amount : "Making a donation"; }
            if (type === "vaccination") { subjectInput.value = "Vaccination programme question"; }
        }

        wireLiveValidation(form);

        function typeLabel() {
            return typeSelect.options[typeSelect.selectedIndex].text;
        }

        function compose(values) {
            var lines = [
                "Hello Paws Haven team,",
                "",
                values.message,
                "",
                "-----",
                "Name: " + values.name,
                "Email: " + values.email,
                "Phone: " + (values.phone || "not provided"),
                "Type of message: " + typeLabel(),
                "",
                "Sent from the Paws Haven website contact form."
            ];
            return {
                to: recipient,
                subject: "[Paws Haven Website] " + typeLabel() + ": " + values.subject,
                body: lines.join("\n")
            };
        }

        function showPreview(email) {
            // CRLF line breaks are what email programs expect inside a mailto: link.
            var href = "mailto:" + recipient +
                "?subject=" + encodeURIComponent(email.subject) +
                "&body=" + encodeURIComponent(email.body.replace(/\n/g, "\r\n"));

            preview.textContent = "";
            preview.appendChild(el("h3", { id: "preview-title", tabindex: "-1", text: "Your email is ready to send" }));
            preview.appendChild(el("p", { text: "Your details passed our checks. Review the email below, then press the button to open it in your email app." }));

            preview.appendChild(el("dl", { class: "answer-list" }, [
                el("dt", { text: "To" }), el("dd", { text: email.to }),
                el("dt", { text: "Subject" }), el("dd", { text: email.subject })
            ]));
            preview.appendChild(el("pre", { class: "email-body", text: email.body }));

            var copyButton = el("button", { class: "btn btn-outline", type: "button", text: "Copy email text" });
            copyButton.addEventListener("click", function () {
                var text = "To: " + email.to + "\nSubject: " + email.subject + "\n\n" + email.body;
                var done = function () { copyButton.textContent = "Copied!"; window.setTimeout(function () { copyButton.textContent = "Copy email text"; }, 2000); };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done, function () { copyButton.textContent = "Copy not available"; });
                } else {
                    copyButton.textContent = "Copy not available";
                }
            });
            var editButton = el("button", { class: "btn btn-outline", type: "button", text: "Edit my message" });
            editButton.addEventListener("click", function () {
                preview.hidden = true;
                doc.getElementById("contact-message").focus();
            });

            preview.appendChild(el("div", { class: "response-actions" }, [
                el("a", { class: "btn btn-primary", href: href, text: "Open in my email app" }),
                copyButton,
                editButton
            ]));
            preview.appendChild(el("p", { class: "answer-note", text: "Nothing is sent until you press send in your email app." }));

            preview.hidden = false;
            preview.classList.remove("fade-in");
            void preview.offsetWidth;
            preview.classList.add("fade-in");
            doc.getElementById("preview-title").focus();
            preview.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            var problems = validateForm(form);
            showSummary(form, problems);
            if (problems.length) { preview.hidden = true; return; }

            var data = new FormData(form);
            showPreview(compose({
                name: String(data.get("name")).trim(),
                email: String(data.get("email")).trim(),
                phone: String(data.get("phone") || "").trim(),
                subject: String(data.get("subject")).trim(),
                message: String(data.get("message")).trim()
            }));
        });

        form.addEventListener("reset", function () {
            clearAllErrors(form);
            preview.hidden = true;
            window.setTimeout(function () {
                form.querySelectorAll("[data-counter-for]").forEach(function (counter) {
                    counter.textContent = "0 / " + doc.getElementById(counter.getAttribute("data-counter-for")).getAttribute("maxlength");
                });
            }, 0);
        });
    }

    doc.addEventListener("DOMContentLoaded", function () {
        initEnquiry();
        initContact();
    });
})();
