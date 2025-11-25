STEP 1 — Load Governorate/City Mapping

We define a JSON object:

const governoratesData = {
"Capital Governorate": ["Manama", "Adliya", ...],
"Muharraq Governorate": ["Muharraq", "Al Hidd", ...]
};

This is required for:

✔ Mapping city → governorate
✔ Showing dependent dropdowns
✔ Auto-selecting matching governorate based on the Google result

STEP 2 — Initialize Google Autocomplete

We use:

autocomplete = new google.maps.places.Autocomplete(inputElement, {
types: ["establishment"],
componentRestrictions: { country: "bh" }
});

This means:

✔ Only building names (“establishments”)
✔ Only inside Bahrain
✔ No addresses, no countries, only places like “Almoayyed Tower”, “Bahrain Financial Harbour”, etc.

STEP 3 — User selects a building

Google triggers:

autocomplete.addListener("place_changed", function () {
const place = autocomplete.getPlace();
});

Google returns a full JSON object called place.

Example keys:

formatted_address

geometry

address_components

place_id

types

name

We simply display this JSON inside:

document.getElementById("json").textContent = JSON.stringify(place, null, 4);

STEP 4 — Extract City, Road, Block Number

We loop through all address components:

place.address_components.forEach(comp => {
if (comp.types.includes("locality")) city = comp.long_name;
if (comp.types.includes("route")) road = comp.long_name;
if (comp.types.includes("neighborhood")) block = comp.long_name;
});

Meaning:

Locality/Sublocality → City

Route → Road number

Neighborhood/Block → Block number

We use regex to extract digits:

road = comp.long_name.match(/\d+/)?.[0];
block = comp.long_name.match(/\d+/)?.[0];

STEP 5 — Auto-match City → Governorate

Logic:

for (const gov in governoratesData) {
if (governoratesData[gov].includes(city)) {
matchedGovernorate = gov;
}
}

✔ If city found → We know the governorate
✔ Set governorate dropdown
✔ Load dependent cities
✔ Select city dropdown automatically

STEP 6 — Dependent Dropdown Logic

When governorate changes:

loadCities(governorate);

This function:

Clears the city dropdown

Loads all cities for that governorate
