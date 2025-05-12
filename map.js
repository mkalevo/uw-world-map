   // Create the Leaflet map
  const map = L.map('map', {
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
    attributionControl: false,
    zoomSnap: 0 // zoomSnap: 0 allows fractional zoom
  });
  

// Used for adjusting country borders smaller if map width < 550px
 let smallSizeMap = false;

// Fit to bounds with responsive zoom level
function fitMapToDivWidth() {
  const mapContainer = document.getElementById("map");
  const width = mapContainer.offsetWidth;
  let zoom;

  if (width < 450) {
    zoom = 0.25;
    smallSizeMap = true;
  } else if (width < 500) {
    zoom = 0.35;
    smallSizeMap = true;
  } else {
    smallSizeMap = false;

    if (width < 550) zoom = 0.45;
    else if (width < 600) zoom = 0.55;
    else if (width < 650) zoom = 0.65;
    else if (width < 700) zoom = 0.75;
    else if (width < 750) zoom = 0.9;
    else if (width < 800) zoom = 1.0;
    else if (width < 850) zoom = 1.1;
    else if (width < 900) zoom = 1.2;
    else if (width < 950) zoom = 1.3;
    else if (width < 1000) zoom = 1.4;
    else if (width < 1050) zoom = 1.45;
    else if (width < 1100) zoom = 1.5;
    else if (width < 1150) zoom = 1.55;
    else if (width < 1200) zoom = 1.6;
    else if (width < 1250) zoom = 1.65;
    else if (width < 1300) zoom = 1.7;
    else if (width < 1350) zoom = 1.75;
    else if (width < 1400) zoom = 1.8;
    else if (width < 1450) zoom = 1.85;
    else if (width < 1500) zoom = 1.9;
    else if (width < 1550) zoom = 1.95;
    else if (width < 1600) zoom = 2.0;
    else zoom = 2.1;
  }

  console.log(`Map width: ${width}px, Zoom level: ${zoom}, Small map: ${smallSizeMap}`);
  
    map.invalidateSize();
    map.setView([45, 0], zoom);
  }
  
  // Initial fit
  fitMapToDivWidth();
  
  // Resize listener with debounce
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(fitMapToDivWidth, 150);
  });
  

// ---------- Colours for different values ----------
function getColor(status) {
  switch (status) {
    case "NO": return "#DD3232"; // Red
    case "UNKNOWN": return "#888888"; // Gray
    case "DISCUSSION - RECIPROCAL RECEIVED":
    case "DISCUSSION - RECIPROCAL SENT": return "#FFB946"; // Orange 
    case "PROMISED VOTE - UNILATERAL":
    case "PROMISED VOTE - RECIPROCAL":
    case "PROMISED VOTE - ORAL": return "#2ED47A"; // Green
    default: return "#888888"; // Gray as unknown (other color can used for testing empties)
  }
}

// ---------- Map Drawing Function ----------
function drawGeoJson(countryValues = {}) {
  fetch('countries.geojson')
    .then(res => res.json())
    .then(geojsonData => {
      function style(feature) {
        const iso3 = feature.properties["ISO3166-1-Alpha-3"];
        const value = countryValues[iso3] || 0;
        return {
          fillColor: getColor(value),
          weight: smallSizeMap ? 0.1 : 0.5,
          opacity: smallSizeMap ? 1 : 1,
          color: 'white',
          fillOpacity: 1
        };
      }

      L.geoJson(geojsonData, {
        style,
        filter: feature => feature.properties["ISO3166-1-Alpha-3"] !== 'ATA' // Filter Antarctica
      }).addTo(map);
    });
}

// 
let campaignId = 19

// ---------- Fetch API Data & Then Draw Map ----------
fetch("https://xauy-vmur-zbnk.f2.xano.io/api:OaMJaaNt/map_data", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({ campaigns_id: campaignId })
})
  .then(res => res.json())
  .then(apiData => {
    console.log("Xano data:", apiData);
    const countryValues = {};
    apiData?.countries?.forEach(entry => {
      const iso3 = entry._country?.ctr_iso_code;
      const status = entry.position;
      if (iso3 && status) {
        countryValues[iso3] = status;
      }
    });
    drawGeoJson(countryValues); // Draw with data
  })
  .catch(err => {
    console.warn("Error fetching Xano data:", err);
    drawGeoJson(); // Draw empty map
  });