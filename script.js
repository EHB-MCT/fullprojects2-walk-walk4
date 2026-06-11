const screens = Array.from(document.querySelectorAll(".screen"));
const detailsForm = document.querySelector("#detailsForm");
const detailsError = document.querySelector("#detailsError");
const nameInput = document.querySelector("#nameInput");
const emailInput = document.querySelector("#emailInput");
const phoneInput = document.querySelector("#phoneInput");
const updatesInput = document.querySelector("#updatesInput");
const brusselsCenter = [50.8467, 4.3525];

let brusselsMap;

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

document.addEventListener("click", (event) => {
  const next = event.target.closest("[data-next]");
  const prev = event.target.closest("[data-prev]");
  const category = event.target.closest(".category");

  if (category) {
    document.querySelectorAll(".category").forEach((button) => {
      button.classList.remove("is-selected");
    });

    category.classList.add("is-selected");
  }

  if (next) {
    if (next.dataset.next === "location" && !validateDetails()) {
      return;
    }

    showScreen(next.dataset.next);
  }

  if (prev) {
    showScreen(prev.dataset.prev);
  }
});

[nameInput, emailInput, phoneInput, updatesInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (detailsError.classList.contains("is-visible")) {
      validateDetails();
    }
  });
});
