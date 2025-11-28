// 1. Karte initialisieren (Mitte von Deutschland)
const map = L.map('map').setView([51.1657, 10.4515], 6);

// 2. Karten-Design laden (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ---------------------------------------------------------
// WICHTIG: Hier musst du deine URL einfügen!
// Lösche den Text in den Anführungszeichen und füge deine URL ein.
// Sie muss auf /api/locations enden.
// ---------------------------------------------------------
const BACKEND_URL = "https://curly-enigma-g4jqjq4g6vwhp99v-8080.app.github.dev/api/locations"; 
// Beispiel wie es aussehen sollte:
// const BACKEND_URL = "https://studious-space-waddle-wr7v...-8080.app.github.dev/api/locations";


// 3. Funktion zum Abrufen der Daten
async function fetchLocations() {
    try {
        console.log("Rufe Daten ab von:", BACKEND_URL);
        
        // Daten vom Server holen
        const response = await fetch(BACKEND_URL);
        
        // Prüfen ob der Server "OK" sagt
        if (!response.ok) {
            throw new Error(`HTTP Fehler! Status: ${response.status}`);
        }

        // Antwort in JSON umwandeln
        const locations = await response.json();

        // Für jeden Standort einen Marker auf die Karte setzen
        locations.forEach(loc => {
            L.marker([loc.latitude, loc.longitude])
                .addTo(map)
                .bindPopup(`<b>${loc.name}</b>`);
        });

        console.log("Erfolg! " + locations.length + " Standorte geladen.");

    } catch (error) {
        console.error("Fehler beim Laden:", error);
        alert("Fehler! Schau in die Konsole (F12). Hast du die URL richtig eingefügt?");
    }
}

// 4. Funktion starten
fetchLocations();