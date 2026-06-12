const screens = Array.from(document.querySelectorAll(".screen"));
const detailsForm = document.querySelector("#detailsForm");
const detailsError = document.querySelector("#detailsError");
const nameInput = document.querySelector("#nameInput");
const emailInput = document.querySelector("#emailInput");
const phoneInput = document.querySelector("#phoneInput");
const updatesInput = document.querySelector("#updatesInput");
const photoInput = document.querySelector("#photoInput");
const photoPreview = document.querySelector("#photoPreview");
const uploadBox = document.querySelector(".upload-box");
const thanksName = document.querySelector("#thanksName");
const summaryName = document.querySelector("#summaryName");
const summaryType = document.querySelector("#summaryType");
const summaryPhoto = document.querySelector("#summaryPhoto");
const photoCard = document.querySelector(".photo-card");
const brusselsCenter = [50.8467, 4.3525];

let brusselsMap;
let impactMap;
let photoUrl = "";
let selectedCategory = "Auto";

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
    window.setTimeout(() => brusselsMap?.invalidateSize(), 80);
  }

  if (name === "thanks") {
    initImpactMap();
    window.setTimeout(() => impactMap?.invalidateSize(), 80);
  }
}

function initBrusselsMap() {
  const mapElement = document.querySelector("#brusselsMap");

  if (brusselsMap || !mapElement || !window.L) {
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

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(brusselsMap);

  L.marker(brusselsCenter, {
    icon: createWalkIcon(),
    draggable: true
  })
    .addTo(brusselsMap)
    .bindPopup("Brussel");
}

function initImpactMap() {
  if (impactMap || !window.L) {
    return;
  }

  impactMap = L.map("impactMap", {
    center: brusselsCenter,
    zoom: 12,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    touchZoom: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(impactMap);

  L.marker(brusselsCenter, {
    icon: createWalkIcon(),
    interactive: false
  }).addTo(impactMap);
}

function createWalkIcon() {
  return L.divIcon({
    className: "",
    html: '<span class="walk-marker"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

function validateDetails() {
  const valid = detailsForm.checkValidity();

  detailsError.classList.toggle("is-visible", !valid);

  [nameInput, emailInput, phoneInput].forEach((input) => {
    input.toggleAttribute("aria-invalid", !input.checkValidity());
  });

  updatesInput.toggleAttribute("aria-invalid", !updatesInput.checkValidity());

  return valid;
}

function updateSummary() {
  const firstName = nameInput.value.trim().split(/\s+/)[0] || "Victor";

  thanksName.textContent = firstName;
  summaryName.textContent = firstName;
  summaryType.textContent = selectedCategory;

  if (photoUrl) {
    summaryPhoto.src = photoUrl;
    photoCard.classList.add("has-photo");
  }
}

document.addEventListener("click", (event) => {
  const next = event.target.closest("[data-next]");
  const prev = event.target.closest("[data-prev]");
  const category = event.target.closest(".category");
  const reset = event.target.closest("[data-reset]");

  if (category) {
    document.querySelectorAll(".category").forEach((button) => {
      button.classList.remove("is-selected");
    });

    category.classList.add("is-selected");
    selectedCategory = category.dataset.category;
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
    detailsForm.reset();
    detailsError.classList.remove("is-visible");
    photoInput.value = "";
    photoPreview.removeAttribute("src");
    summaryPhoto.removeAttribute("src");
    uploadBox.classList.remove("has-photo");
    photoCard.classList.remove("has-photo");

    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
      photoUrl = "";
    }

    selectedCategory = "Auto";
    document.querySelectorAll(".category").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.category === "Auto");
    });

    showScreen("details");
  }
});

[nameInput, emailInput, phoneInput, updatesInput].forEach((input) => {
  input.addEventListener("input", () => {
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
