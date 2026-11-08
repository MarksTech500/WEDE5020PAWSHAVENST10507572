/* ==========================================================================
   Paws Haven Animal Rescue - site data
   --------------------------------------------------------------------------
   One place to edit the animals, fees and contact details. Every page that
   needs this information (home, animals, enquiry, contact, donate) reads it
   from here, so a change only has to be made once.

   NOTE: the fees, statuses and map position below are sample values for this
   student project. Replace them with the organisation's real figures.
   ========================================================================== */
(function () {
    "use strict";

    window.PawsHaven = window.PawsHaven || {};

    window.PawsHaven.site = {
        name: "Paws Haven Animal Rescue",
        email: "infopawshaven@hotmail.com",
        phone: "011 000 0000",
        // Approximate position of the Springs location (adjust to the exact shop if needed).
        geo: { lat: -26.25, lng: 28.4333, zoom: 14 },
        addressLine: "Springs Mall, Jan Smuts Road, Springs, 1559, Gauteng"
    };

    // Sample adoption fees (rand). The first eligible vaccination is free (see vaccination.html).
    window.PawsHaven.fees = {
        Dog: 850,
        Cat: 650,
        annualVaccination: 150
    };

    // Sponsorship / donation tiers (match the Donate page).
    window.PawsHaven.tiers = [
        { amount: 50,  label: "R50 - food and basic supplies",            covers: "food and basic supplies for the animals in our care" },
        { amount: 100, label: "R100 - everyday care and supplies",         covers: "everyday animal care and essential supplies" },
        { amount: 250, label: "R250 - veterinary care and medical needs",  covers: "veterinary care and medical needs" },
        { amount: 500, label: "R500 - shelter and rehabilitation",         covers: "shelter, rehabilitation and animal welfare" }
    ];

    window.PawsHaven.volunteerAreas = [
        { value: "dog-walking",   label: "Dog walking and exercise" },
        { value: "cat-care",      label: "Cat socialising and care" },
        { value: "kennel-clean",  label: "Kennel and cattery cleaning" },
        { value: "events",        label: "Events and fundraising" },
        { value: "admin",         label: "Admin and social media" }
    ];

    // status: "Available" | "Adoption pending"
    window.PawsHaven.animals = [
        {
            id: "max", name: "Max", species: "Dog", breed: "Husky", age: "3 years", ageMonths: 36,
            status: "Available", image: "images/husky-max.jpg", width: 533, height: 800,
            alt: "Max, a friendly Husky looking for a home",
            description: "Friendly and energetic. Max is looking for a caring family with time to give him attention and exercise."
        },
        {
            id: "luna", name: "Luna", species: "Cat", breed: "Domestic Cat", age: "11 months", ageMonths: 11,
            status: "Available", image: "images/domestic-cat-luna.jpg", width: 533, height: 800,
            alt: "Luna, a gentle black and white cat looking for a home",
            description: "Gentle and affectionate. Luna would suit a calm home where she can feel safe and comfortable."
        },
        {
            id: "rocky", name: "Rocky", species: "Dog", breed: "Jack Russell Terrier mix", age: "2 years", ageMonths: 24,
            status: "Available", image: "images/jack-russell-mix-rocky.jpg", width: 533, height: 800,
            alt: "Rocky, a playful Jack Russell Terrier mix looking for a home",
            description: "Playful and loving. Rocky needs a responsible adopter who can provide care and companionship."
        },
        {
            id: "buddy", name: "Buddy", species: "Dog", breed: "Golden Retriever", age: "2 years", ageMonths: 24,
            status: "Available", image: "images/golden-retriever-buddy.jpg", width: 800, height: 800,
            alt: "Buddy the Golden Retriever sitting on the grass",
            description: "Buddy is a friendly and energetic dog who loves playing outdoors and meeting new people."
        },
        {
            id: "milo", name: "Milo", species: "Cat", breed: "Domestic Shorthair", age: "8 months", ageMonths: 8,
            status: "Available", image: "images/grey-white-kitten-milo.jpg", width: 800, height: 755,
            alt: "Milo the grey and white kitten",
            description: "Milo is a curious and affectionate kitten who enjoys exploring and receiving attention."
        },
        {
            id: "daisy", name: "Daisy", species: "Dog", breed: "Beagle", age: "3 years", ageMonths: 36,
            status: "Available", image: "images/beagle-daisy.jpg", width: 546, height: 800,
            alt: "Daisy the Beagle sitting on a paved path",
            description: "Daisy is a cheerful and loving companion who enjoys walks and spending time with people."
        },
        {
            id: "oliver", name: "Oliver", species: "Cat", breed: "Ginger Cat", age: "1 year", ageMonths: 12,
            status: "Available", image: "images/ginger-kitten-oliver.jpg", width: 800, height: 779,
            alt: "Oliver the ginger cat",
            description: "Oliver is a gentle and cuddly cat who loves relaxing in sunny spots and playing with toys."
        },
        {
            id: "charlie", name: "Charlie", species: "Dog", breed: "Jack Russell Terrier", age: "4 years", ageMonths: 48,
            status: "Adoption pending", image: "images/jack-russell-terrier-charlie.jpg", width: 533, height: 800,
            alt: "Charlie the Jack Russell Terrier sitting on paving",
            description: "Charlie is an adventurous and intelligent dog who loves outdoor activities and exploring."
        }
    ];
})();
