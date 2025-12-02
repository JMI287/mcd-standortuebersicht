/**
 * McDonald's Standort Finder
 * Logik für Karte, Standortbestimmung und Favoriten.
 */

// --- KONFIGURATION ---
// URL zum Spring Boot Backend
const BACKEND_URL = "https://curly-enigma-g4jqjq4g6vwhp99v-8080.app.github.dev/api/locations"; // <-- TODO: URL hier einfügen!

// Fallback Koordinaten (Ravensburg), falls GPS abgelehnt wird
const STANDARD_LAT = 47.7819;
const STANDARD_LNG = 9.6133;

// --- ICONS DEFINITIONEN ---

// Das goldene M für die Restaurants
const mcdIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg',
    iconSize: [32, 32],     // Größe
    iconAnchor: [16, 32],   // Ankerpunkt (Mitte unten)
    popupAnchor: [0, -32]   // Wo das Popup aufgeht
});

// Roter Pin für den eigenen Standort
const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- STATUS VARIABLEN ---
let alleStandorte = []; // Hier speichern wir die Daten vom Server
let favoritenIds = JSON.parse(localStorage.getItem('mcdFavoriten')) || []; // Favoriten aus dem Browser-Speicher laden
let nurFavoritenAnzeigen = false;

// Aktueller User-Standort
let userLat = STANDARD_LAT;
let userLng = STANDARD_LNG;
let userOrtName = "Ravensburg (Standard)";

// --- KARTE INITIALISIEREN ---
// Zoom Control deaktivieren und oben rechts neu hinzufügen (sieht besser aus)
const map = L.map('map', {zoomControl: false}).setView([userLat, userLng], 10);
L.control.zoom({position: 'topright'}).addTo(map);

// OpenStreetMap Kartenmaterial laden
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { 
    attribution: '&copy; OpenStreetMap Contributors' 
}).addTo(map);

// Layer-Gruppen für sauberes Management der Marker
let markerGruppe = L.layerGroup().addTo(map);
let userMarker = null;

// --- PROGRAMM START ---

// Diese Funktion wird beim Laden der Seite aufgerufen
async function startApp() {
    console.log("App wird gestartet...");
    
    // 1. Versuchen, den echten Standort zu bekommen
    await ermittleStandort(true); 

    // 2. Daten vom Server holen
    try {
        console.log("Rufe Daten ab von:", BACKEND_URL);
        const response = await fetch(BACKEND_URL);
        
        if (!response.ok) {
            throw new Error("HTTP Fehler: " + response.status);
        }

        alleStandorte = await response.json();
        console.log(alleStandorte.length + " Standorte geladen.");

        // Einmalig Entfernungen berechnen und anzeigen
        aktualisiereAnsicht();

    } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
        alert("Fehler: Konnte Backend nicht erreichen. Läuft der Server auf Port 8080?");
    }
}

// --- LOGIK FUNKTIONEN ---

/**
 * Versucht den GPS Standort des Browsers abzufragen.
 * Falls das fehlschlägt, bleibt es beim Standardwert.
 */
async function ermittleStandort(beimStart = false) {
    const label = document.getElementById('current-location-label');
    if(label) label.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Orte dich...';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Erfolg: Koordinaten aktualisieren
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                userOrtName = "Mein Standort";
                
                aktualisiereUserMarker();
                
                // Beim Start oder Klick auf "Orten" zoomen wir hin
                if(!beimStart) map.setView([userLat, userLng], 13);
                
                aktualisiereAnsicht();
            },
            (error) => {
                console.warn("GPS Zugriff verweigert oder Fehler:", error.message);
                fallbackStandort(beimStart);
            }
        );
    } else {
        console.warn("Browser unterstützt kein Geolocation.");
        fallbackStandort(beimStart);
    }
}

function fallbackStandort(beimStart) {
    userOrtName = "Ravensburg (Standard)";
    aktualisiereUserMarker();
    if (!beimStart) alert("Standortzugriff nicht möglich. Bitte nutze die Suche.");
    aktualisiereAnsicht();
}

/**
 * Führt die Suche über die OpenStreetMap API aus
 */
async function sucheOrt() {
    const suchBegriff = document.getElementById('search-input').value;
    if (!suchBegriff) return;

    const label = document.getElementById('current-location-label');
    label.innerText = "Suche läuft...";

    try {
        // Anfrage an Nominatim API
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${suchBegriff}&countrycodes=de`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.length > 0) {
            // Erstes Ergebnis nehmen
            userLat = parseFloat(data[0].lat);
            userLng = parseFloat(data[0].lon);
            // Ort name etwas kürzen (nur bis zum ersten Komma)
            userOrtName = data[0].display_name.split(',')[0];

            map.setView([userLat, userLng], 13);
            aktualisiereUserMarker();
            aktualisiereAnsicht();
        } else {
            alert("Ort nicht gefunden!");
            label.innerHTML = `<i class="fa-solid fa-location-dot mr-1"></i> ${userOrtName}`;
        }
    } catch (e) {
        console.error("Fehler bei der Suche:", e);
    }
}

/**
 * Setzt den roten Pin auf die Karte
 */
function aktualisiereUserMarker() {
    if (userMarker) map.removeLayer(userMarker);
    
    userMarker = L.marker([userLat, userLng], {icon: userIcon})
        .addTo(map)
        .bindPopup(`<b>Hier bist du</b><br>${userOrtName}`);
    
    // Label in der Sidebar updaten
    const label = document.getElementById('current-location-label');
    if(label) label.innerHTML = `<i class="fa-solid fa-location-dot mr-1.5 text-red-600"></i> ${userOrtName}`;
}

/**
 * Berechnet Entfernungen neu und rendert die Liste
 */
function aktualisiereAnsicht() {
    if(alleStandorte.length === 0) return;

    // Entfernungen für alle Standorte neu berechnen
    alleStandorte.forEach(standort => {
        standort.distanz = berechneDistanz(userLat, userLng, standort.latitude, standort.longitude);
    });

    renderListe();
}

/**
 * Baut die HTML Liste und die Marker auf der Karte
 */
function renderListe() {
    const listenContainer = document.getElementById('restaurant-list');
    listenContainer.innerHTML = ''; // Liste leeren
    markerGruppe.clearLayers();     // Alte Marker entfernen

    let anzuzeigendeStandorte;

    if (nurFavoritenAnzeigen) {
        anzuzeigendeStandorte = alleStandorte.filter(s => favoritenIds.includes(s.id));
    } else {
        // Kopie erstellen und sortieren (nächster zuerst)
        anzuzeigendeStandorte = [...alleStandorte].sort((a, b) => a.distanz - b.distanz);
    }

    // UI Updates (Zähler etc.)
    const titelEl = document.getElementById('list-title');
    const anzahlEl = document.getElementById('result-count');
    
    if(titelEl) titelEl.innerText = nurFavoritenAnzeigen ? "Meine Favoriten" : "Ergebnisse";
    if(anzahlEl) anzahlEl.innerText = anzuzeigendeStandorte.length;

    // Fallback wenn leer
    if (anzuzeigendeStandorte.length === 0) {
        listenContainer.innerHTML = `
            <div class="text-center text-gray-400 mt-10 flex flex-col items-center">
                <i class="fa-regular fa-folder-open text-4xl mb-2 opacity-50"></i>
                <span>Keine Standorte gefunden.</span>
            </div>`;
        return;
    }

    // Durch alle Standorte iterieren und anzeigen
    anzuzeigendeStandorte.forEach(standort => {
        const istFavorit = favoritenIds.includes(standort.id);

        // 1. Marker auf der Karte erstellen
        erstelleMarker(standort, istFavorit);

        // 2. Eintrag in der Seitenleiste erstellen
        const karteHtml = erstelleListenEintrag(standort, istFavorit);
        listenContainer.appendChild(karteHtml);
    });
}

function erstelleMarker(standort, istFavorit) {
    const popupInhalt = `
        <div class="text-center min-w-[160px]">
            <h3 class="font-bold text-gray-900 text-sm mb-1">${standort.name}</h3>
            <p class="text-xs text-gray-500 mb-3">${standort.distanz.toFixed(1)} km entfernt</p>
            
            <button onclick="toggleFavorit('${standort.id}')" 
                class="w-full py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm
                ${istFavorit ? 'bg-mcdRed text-white hover:bg-red-700' : 'bg-mcdYellow text-black hover:bg-yellow-400'}">
                ${istFavorit ? '<i class="fa-solid fa-heart"></i> Favorit' : '<i class="fa-regular fa-heart"></i> Merken'}
            </button>
        </div>
    `;

    L.marker([standort.latitude, standort.longitude], {icon: mcdIcon})
        .bindPopup(popupInhalt)
        .addTo(markerGruppe);
}

function erstelleListenEintrag(standort, istFavorit) {
    const div = document.createElement('div');
    
    // Styling basierend auf Favoriten-Status
    const borderClass = istFavorit 
        ? 'border-mcdYellow shadow-[0_0_10px_rgba(255,188,13,0.2)]' 
        : 'border-gray-200 hover:border-mcdYellow hover:shadow-md';

    div.className = `p-4 rounded-xl border transition cursor-pointer bg-white relative group ${borderClass}`;
    
    div.innerHTML = `
        <div onclick="zumStandortFliegen(${standort.latitude}, ${standort.longitude})" class="pr-8">
            <h3 class="font-bold text-gray-900 text-[15px] mb-1 leading-tight group-hover:text-mcdDark">${standort.name}</h3>
            
            <div class="flex items-center gap-3 text-xs mb-3">
                <span class="text-mcdGreen font-bold flex items-center bg-green-50 px-2 py-0.5 rounded">
                    <span class="w-1.5 h-1.5 bg-mcdGreen rounded-full mr-1.5 animate-pulse"></span> Geöffnet
                </span>
                <span class="text-gray-500">•</span>
                <span class="text-gray-500 font-medium">${standort.distanz.toFixed(1)} km</span>
            </div>

            <div class="flex flex-wrap gap-2">
                <span class="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center">
                    <i class="fa-solid fa-car-side mr-1.5 opacity-70"></i> McDrive
                </span>
                <span class="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center">
                    <i class="fa-solid fa-mug-hot mr-1.5 opacity-70"></i> McCafé
                </span>
            </div>
        </div>

        <button onclick="toggleFavorit('${standort.id}')" class="absolute top-4 right-4 text-xl focus:outline-none transition hover:scale-110 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50">
            ${istFavorit ? '<i class="fa-solid fa-heart text-mcdRed drop-shadow-sm"></i>' : '<i class="fa-regular fa-heart text-gray-300 group-hover:text-red-300"></i>'}
        </button>
    `;
    return div;
}

// --- HELFER / MATHEMATIK ---

/**
 * Berechnet die Distanz zwischen zwei Koordinaten in KM
 * (Haversine Formel)
 */
function berechneDistanz(lat1, lon1, lat2, lon2) {
    const R = 6371; // Erdradius in km
    const dLat = gradInRad(lat2 - lat1);
    const dLon = gradInRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(gradInRad(lat1)) * Math.cos(gradInRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function gradInRad(deg) {
    return deg * (Math.PI / 180);
}

// --- GLOBAL EXPORTS (für HTML OnClick Events) ---

window.zumStandortFliegen = (lat, lng) => {
    map.flyTo([lat, lng], 15, { duration: 1.0 });
};

window.toggleFavorit = (id) => {
    if (favoritenIds.includes(id)) {
        // Entfernen
        favoritenIds = favoritenIds.filter(f => f !== id);
    } else {
        // Hinzufügen
        favoritenIds.push(id);
    }
    
    // Speichern und neu malen
    localStorage.setItem('mcdFavoriten', JSON.stringify(favoritenIds));
    renderListe();
};

// Event Listener für den Toggle-Button oben rechts
document.getElementById('btn-toggle-favs').addEventListener('click', () => {
    nurFavoritenAnzeigen = !nurFavoritenAnzeigen;
    const btn = document.getElementById('btn-toggle-favs');
    
    if (nurFavoritenAnzeigen) {
        btn.classList.add('bg-mcdYellow', 'text-black', 'border-mcdYellow');
        btn.classList.remove('bg-white', 'text-gray-600');
        btn.innerHTML = '<i class="fa-solid fa-heart text-mcdRed"></i> <span class="font-bold">Meine Favoriten</span>';
    } else {
        btn.classList.remove('bg-mcdYellow', 'text-black', 'border-mcdYellow');
        btn.classList.add('bg-white', 'text-gray-600');
        btn.innerHTML = '<i class="fa-regular fa-heart"></i> <span class="hidden sm:inline">Favoriten</span>';
    }
    renderListe();
});

// App starten
startApp();