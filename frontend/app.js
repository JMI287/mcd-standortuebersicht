// --- KONFIGURATION ---
const BACKEND_URL = "https://curly-enigma-g4jqjq4g6vwhp99v-8080.app.github.dev/api/locations"; // <-- BITTE URL PRÜFEN!

// Startpunkt (Ravensburg) für die Entfernungsmessung
const HOME_LAT = 47.7819; 
const HOME_LNG = 9.6133;

const mcdIcon = L.icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
});

// --- STATE ---
let allLocations = [];
let showOnlyFavorites = false;
let favorites = JSON.parse(localStorage.getItem('mcdFavorites')) || [];

// --- KARTE ---
// Zoom etwas weiter raus (Level 7), damit man mehr von DE sieht, Zentrum bleibt Ravensburg
const map = L.map('map').setView([50.0000, 10.0000], 6); 

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CartoDB'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);

// --- MAIN ---

async function initApp() {
    try {
        const response = await fetch(BACKEND_URL);
        if (!response.ok) throw new Error("Netzwerk Fehler");
        allLocations = await response.json();
        
        // Entfernungen berechnen (nur für die Anzeige & Sortierung)
        allLocations.forEach(loc => {
            loc.distance = getDistanceFromLatLonInKm(HOME_LAT, HOME_LNG, loc.latitude, loc.longitude);
        });

        renderApp();
    } catch (error) {
        console.error(error);
        alert("Fehler beim Laden! URL prüfen.");
    }
}

function renderApp() {
    const listContainer = document.getElementById('restaurant-list');
    listContainer.innerHTML = ''; 
    markersLayer.clearLayers();

    // FILTERN
    let displayedLocations;

    if (showOnlyFavorites) {
        displayedLocations = allLocations.filter(loc => favorites.includes(loc.id));
    } else {
        // Zeige ALLE, aber sortiere sie nach Nähe zu Ravensburg
        displayedLocations = [...allLocations].sort((a, b) => a.distance - b.distance);
    }

    // UPDATE UI TEXT
    const titleEl = document.getElementById('list-title');
    if(titleEl) titleEl.innerText = showOnlyFavorites ? `Meine Favoriten (${displayedLocations.length})` : `Alle Standorte (${displayedLocations.length})`;

    // LISTE BAUEN
    if (displayedLocations.length === 0) {
        listContainer.innerHTML = '<div class="text-center text-gray-400 mt-10 p-5">Keine Restaurants gefunden.</div>';
        return;
    }

    displayedLocations.forEach(loc => {
        const isFav = favorites.includes(loc.id);

        // MARKER
        const popupContent = `
            <div style="text-align:center; min-width: 150px;">
                <h3 style="margin:0 0 5px 0; font-weight:bold; font-size: 16px;">${loc.name}</h3>
                <p style="margin:0 0 10px 0; color:#666; font-size: 12px;">Entfernung: ${loc.distance.toFixed(1)} km</p>
                <button onclick="toggleFavorite('${loc.id}')" 
                    style="background-color: ${isFav ? '#db0007' : '#ffbc0d'}; 
                           color: ${isFav ? 'white' : 'black'}; 
                           border:none; padding:6px 12px; border-radius:20px; cursor:pointer; font-weight:bold; font-size:12px; width:100%;">
                    ${isFav ? '❤️ Favorit' : '🤍 Merken'}
                </button>
            </div>
        `;

        L.marker([loc.latitude, loc.longitude], {icon: mcdIcon})
            .bindPopup(popupContent)
            .addTo(markersLayer);

        // LIST ITEM (KARTE)
        const card = document.createElement('div');
        // Design angepasst für Sidebar-Look
        card.className = `p-4 rounded-lg border transition cursor-pointer bg-white relative group
            ${isFav ? 'border-mcdYellow shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`;
        
        card.innerHTML = `
            <div onclick="flyToLocation(${loc.latitude}, ${loc.longitude})" class="pr-8">
                <h3 class="font-bold text-gray-800 text-sm mb-1">${loc.name}</h3>
                <div class="flex items-center text-xs text-gray-500 mb-2">
                    <i class="fa-solid fa-location-arrow mr-1 text-gray-300"></i> ${loc.distance.toFixed(1)} km von Ravensburg
                </div>
                <div class="flex gap-2">
                    <span class="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">Geöffnet</span>
                    <span class="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">McDrive</span>
                </div>
            </div>
            <button onclick="toggleFavorite('${loc.id}')" class="absolute top-4 right-4 text-xl focus:outline-none transition hover:scale-110">
                ${isFav ? '<i class="fa-solid fa-heart text-mcdRed"></i>' : '<i class="fa-regular fa-heart text-gray-300 group-hover:text-red-300"></i>'}
            </button>
        `;
        listContainer.appendChild(card);
    });
}

// --- HELPER ---

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; 
  var dLat = deg2rad(lat2-lat1);  
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}
function deg2rad(deg) { return deg * (Math.PI/180) }

window.flyToLocation = (lat, lng) => {
    map.flyTo([lat, lng], 14, { duration: 1.2 });
};

window.toggleFavorite = (id) => {
    if (favorites.includes(id)) {
        favorites = favorites.filter(favId => favId !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('mcdFavorites', JSON.stringify(favorites));
    renderApp();
    map.closePopup();
};

document.getElementById('btn-toggle-favs').addEventListener('click', () => {
    showOnlyFavorites = !showOnlyFavorites;
    const btn = document.getElementById('btn-toggle-favs');
    
    if (showOnlyFavorites) {
        btn.classList.add('bg-mcdYellow', 'text-black', 'border-mcdYellow');
        btn.classList.remove('bg-gray-50', 'text-gray-600');
        btn.innerHTML = '<i class="fa-solid fa-heart mr-2"></i> Alle anzeigen';
        map.setView([51.1657, 10.4515], 6); // Rauszoomen für Überblick
    } else {
        btn.classList.remove('bg-mcdYellow', 'text-black', 'border-mcdYellow');
        btn.classList.add('bg-gray-50', 'text-gray-600');
        btn.innerHTML = '<i class="fa-regular fa-heart mr-2"></i> Favoriten';
        // Wir bleiben einfach beim aktuellen Zoom oder gehen auf DE zurück
        map.setView([50.0000, 10.0000], 6);
    }
    renderApp();
});

initApp();