const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const defaultCategory = "Auto";
const categories = [defaultCategory, "Step", "Vuilbak", "Afval", "Bord", "Terras"];
const screenTitles = {
  details: "Gegevens<br>registreren.",
  location: "Duid de<br>locatie aan.",
  category: "Kies een<br>categorie",
  proof: "Dien een<br>foto in",
  thanks: 'Bedankt <span id="thanksName">Victor</span>,<br>jouw melding<br>maakt verschil!'
};

renderScreenChrome();
renderCategories();

const screens = $$(".screen");
const [
  detailsForm, detailsError, nameInput, emailInput, phoneInput, updatesInput,
  anonymousInput, photoInput, photoPreview, thanksName, summaryName, summaryType,
  summaryLocation, summaryPhoto, addressInput, gpsButton
] = [
  "detailsForm", "detailsError", "nameInput", "emailInput", "phoneInput",
  "updatesInput", "anonymousInput", "photoInput", "photoPreview", "thanksName",
  "summaryName", "summaryType", "summaryLocation", "summaryPhoto", "addressInput",
  "gpsButton"
].map((id) => $(`#${id}`));
const [uploadBox, photoCard] = [".upload-box", ".photo-card"].map($);
const contactInputs = [nameInput, emailInput, phoneInput, updatesInput];
const detailInputs = [nameInput, emailInput, phoneInput];
const brusselsCenter = [50.8467, 4.3525];
const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const disabledMapOptions = Object.fromEntries(
  ["dragging", "scrollWheelZoom", "doubleClickZoom", "boxZoom", "keyboard", "tap", "touchZoom"]
    .map((option) => [option, false])
);

let brusselsMap, impactMap, reportMarker, userLocationMarker, impactMarker;
let photoUrl = "";
let selectedCategory = defaultCategory;
let selectedLocation = [...brusselsCenter];

function renderScreenChrome() {
  $$(".screen").forEach((screen) => {
    const name = screen.dataset.screen;

    screen.insertAdjacentHTML("afterbegin", `
      <header class="topbar">
        <img class="logo" src="afbeeldingen/Copy of logo_corail.png" alt="Walk logo">
      </header>
      <div class="hero${name === "thanks" ? " compact" : ""}">
        <h1>${screenTitles[name]}</h1>
        <img class="walker" src="afbeeldingen/meisjewandeld.png" alt="">
        <img class="scribble" src="afbeeldingen/pijl.avif" alt="">
      </div>
    `);
  });
}

function renderCategories() {
  $("#categoryPanel").innerHTML = categories.map((category) => `
    <button
      class="category${category === defaultCategory ? " is-selected" : ""}"
      type="button"
      data-category="${category}"
      aria-label="${category}"
    ></button>
  `).join("");
}

function showScreen(name) {
  const targetScreen = screens.find((screen) => screen.dataset.screen === name);

  if (!targetScreen) {
    return;
  }

  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen === targetScreen);
  });

  if (name === "location") {
    initBrusselsMap();
    invalidateMap(brusselsMap);
  }

  if (name === "thanks") {
    initImpactMap();
    invalidateMap(impactMap);
  }
}

function invalidateMap(map) {
  window.setTimeout(() => map?.invalidateSize(), 80);
}

function initBrusselsMap() {
  if (brusselsMap) {
    return syncReportMarker();
  }

  if (!window.L) {
    return;
  }

  brusselsMap = L.map("brusselsMap", {
    center: brusselsCenter,
    zoom: 13,
    minZoom: 11,
    maxZoom: 19,
    zoomControl: true,
    attributionControl: true
  });

  addTileLayer(brusselsMap, {
    attribution: "&copy; OpenStreetMap"
  });

  reportMarker = L.marker(selectedLocation, {
    icon: createMarkerIcon("walk-marker", [44, 44]),
    draggable: true
  })
    .addTo(brusselsMap)
    .bindPopup("Locatie van je melding");

  reportMarker.on("dragend", () => {
    const markerLocation = reportMarker.getLatLng();
    setSelectedLocation([markerLocation.lat, markerLocation.lng]);
  });

  brusselsMap.on("click", (event) => {
    setSelectedLocation([event.latlng.lat, event.latlng.lng]);
  });
}

function initImpactMap() {
  if (impactMap) {
    return syncImpactMap();
  }

  if (!window.L) {
    return;
  }

  impactMap = L.map("impactMap", {
    center: selectedLocation,
    zoom: 12,
    zoomControl: false,
    attributionControl: false,
    ...disabledMapOptions
  });

  addTileLayer(impactMap);

  impactMarker = L.marker(selectedLocation, {
    icon: createMarkerIcon("walk-marker", [44, 44]),
    interactive: false
  }).addTo(impactMap);
}

function setSelectedLocation(location) {
  selectedLocation = [location[0], location[1]];
  syncReportMarker();
  syncImpactMap();
}

function syncReportMarker() {
  reportMarker?.setLatLng(selectedLocation);
}

function syncImpactMap() {
  impactMarker?.setLatLng(selectedLocation);
  impactMap?.setView(selectedLocation, 12);
}

function resetLocation() {
  setSelectedLocation(brusselsCenter);
  addressInput.value = "";
  gpsButton.disabled = false;

  brusselsMap?.setView(brusselsCenter, 13);

  userLocationMarker?.remove();
  userLocationMarker = undefined;
}

function requestUserLocation() {
  if (!brusselsMap || !window.L || !navigator.geolocation) {
    return;
  }

  gpsButton.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const personLocation = [
        position.coords.latitude,
        position.coords.longitude
      ];

      setSelectedLocation(personLocation);
      syncUserLocationMarker(personLocation);

      brusselsMap.setView(personLocation, Math.max(brusselsMap.getZoom(), 16));
      gpsButton.disabled = false;
    },
    () => {
      gpsButton.disabled = false;
    },
    {
      enableHighAccuracy: true,
      maximumAge: 60000,
      timeout: 10000
    }
  );
}

function syncUserLocationMarker(location) {
  userLocationMarker ??= L.marker(location, {
    icon: createMarkerIcon("person-marker", [24, 24])
  })
    .addTo(brusselsMap)
    .bindPopup("Jouw GPS-locatie");

  userLocationMarker.setLatLng(location);
}

function addTileLayer(map, options = {}) {
  L.tileLayer(tileUrl, {
    maxZoom: 19,
    ...options
  }).addTo(map);
}

function createMarkerIcon(className, iconSize) {
  return L.divIcon({
    className: `${className}-shell`,
    html: `<span class="${className}"></span>`,
    iconSize,
    iconAnchor: iconSize.map((value) => value / 2)
  });
}

function validateDetails() {
  setAnonymousMode();

  const valid = detailsForm.checkValidity();

  detailsError.classList.toggle("is-visible", !valid);

  detailInputs.forEach((input) => {
    input.toggleAttribute("aria-invalid", !input.checkValidity());
  });

  return valid;
}

function updateSummary() {
  const firstName = anonymousInput.checked
    ? "Anoniem"
    : nameInput.value.trim().split(/\s+/)[0] || "Victor";

  thanksName.textContent = firstName;
  summaryName.textContent = firstName;
  summaryType.textContent = selectedCategory;
  summaryLocation.textContent = addressInput.value.trim() || "Brussel";

  if (photoUrl) {
    summaryPhoto.src = photoUrl;
    photoCard.classList.add("has-photo");
  }
}

function setAnonymousMode() {
  detailsForm.classList.toggle("is-anonymous", anonymousInput.checked);

  contactInputs.forEach((input) => {
    input.disabled = anonymousInput.checked;
    input.toggleAttribute("aria-invalid", false);
  });
}

function selectCategory(categoryName = defaultCategory) {
  selectedCategory = categoryName;

  $$(".category").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.category === categoryName);
  });
}

function clearPhoto() {
  photoInput.value = "";
  [photoPreview, summaryPhoto].forEach((image) => image.removeAttribute("src"));
  [uploadBox, photoCard].forEach((element) => element.classList.remove("has-photo"));

  if (photoUrl) {
    URL.revokeObjectURL(photoUrl);
    photoUrl = "";
  }
}

function resetReport() {
  detailsForm.reset();
  setAnonymousMode();
  detailsError.classList.remove("is-visible");
  clearPhoto();
  selectCategory();
  resetLocation();
  showScreen("details");
}

document.addEventListener("click", (event) => {
  const next = event.target.closest("[data-next]");
  const prev = event.target.closest("[data-prev]");
  const category = event.target.closest(".category");
  const reset = event.target.closest("[data-reset]");
  const gps = event.target.closest("#gpsButton");

  if (gps) {
    requestUserLocation();
    return;
  }

  if (category) {
    selectCategory(category.dataset.category);
  }

  if (next) {
    if (next.dataset.next === "location" && !validateDetails()) {
      return;
    }

    if (next.dataset.next === "thanks") {
      updateSummary();
    }

    showScreen(next.dataset.next);
  }

  if (prev) {
    showScreen(prev.dataset.prev);
  }

  if (reset) {
    resetReport();
  }
});

detailInputs.concat(anonymousInput).forEach((input) => {
  input.addEventListener("input", () => {
    if (input === anonymousInput) {
      setAnonymousMode();
    }

    if (detailsError.classList.contains("is-visible")) {
      validateDetails();
    }
  });
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];

  if (!file) {
    return;
  }

  if (photoUrl) {
    URL.revokeObjectURL(photoUrl);
  }

  photoUrl = URL.createObjectURL(file);
  photoPreview.src = photoUrl;
  uploadBox.classList.add("has-photo");
});
