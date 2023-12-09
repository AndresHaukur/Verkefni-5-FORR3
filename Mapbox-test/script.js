// Skilgreinir request details
const url = "https://api.vedur.is/skjalftalisa/v1/quake/array";
const headers = {
    "Content-Type": "application/json"
};
const method = "POST";

// Initializar kortið með stillingum
mapboxgl.accessToken = "pk.eyJ1IjoiYW5kcm9tZWR5eXkiLCJhIjoiY2xwcXl1cGFoMDU0MjJpcWNxZzh5MWxucyJ9.9_9fbAHchEsiJ1WBTE14Eg";
const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v12", // style URL
    projection: "mercator", // Stillir projection sem "Mercator" projection-ið (Frægasta og mest-notaða projectionið. A.k.a. venjulegt 2D kort)
    center: [-22.261827, 63.907787], // byrjunar staðsetning [lng(⇆), lat(⇅)]
    zoom: 9.5, // byrjunar zoom-in ✕. "zoom: 9.5," = Zoom in 9.5✕ sinnum, etc.
});

// Skilgreinir GeoJSON strúktúr
const mygeojson = {
    "type": "FeatureCollection",
    "features": []
};

// Function til að formattar dagsetningar í format-ið sem API-ið notar
const formatDate = (date) => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const currentDate = new Date();
const fiveDaysAgo = new Date(currentDate);
fiveDaysAgo.setDate(currentDate.getDate() - 5);

console.log("Current Date:", formatDate(currentDate));
console.log("Five Days Ago:", formatDate(fiveDaysAgo));

// Stillir query parameters
const q_start_time = formatDate(fiveDaysAgo);
const q_end_time = formatDate(currentDate);
const q_depth_min = 5;
const q_depth_max = 25;
const q_size_min = 2;
const q_size_max = 6;
const q_event_type = ["qu"];
const q_originating_system = ["SIL picks"];
const q_magnitude_preference = ["Mlw"];
const q_fields = ["event_id", "lat", "long"];
const q_sort = [];

// Skilgreinir breytur til að geyma svarið frá API
let eventId;
let latValue;
let longValue;


// ====================API Request body-ið====================
const body = JSON.stringify({
    "area": [
        [64.1, -21.5],
        [63.8, -21.5],
        [63.8, -22.8],
        [64.1, -22.8]
    ],
    "depth_max": q_depth_max,
    "depth_min": q_depth_min,
    "end_time": q_end_time,
    "event_type": q_event_type,
    "fields": ["event_id", "lat", "long"],
    "magnitude_preference": q_magnitude_preference,
    "originating_system": q_originating_system,
    "size_max": q_size_max,
    "size_min": q_size_min,
    "sort": q_sort,
    "start_time": q_start_time,
});

// ====================API Fetch-ið====================
fetch(url, {
    method: method,
    headers: headers,
    body: body,
})
    .then(response => response.json())
    .then(data => {
        console.log("API svar: ", data);

        // Fá "data" fylkið úr API svarinu
        const dataArray = data.data;

        // Búa til object til að geyma gögnin, með "event_id" sem lykla
        const dataObject = {};

        // Fer í gegnum "data" fylkið og býr til object-ana
        for (let i = 0; i < dataArray.event_id.length; i++) {
            eventId = dataArray.event_id[i];
            latValue = dataArray.lat[i];
            longValue = dataArray.long[i];

            const feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [longValue, latValue]
                },
                "properties": {
                    "event_id": eventId
                }
            };

            // Bætir við features í GeoJSON "feature" fylkið
            mygeojson.features.push(feature);

            console.log("Númer:", i, "\n",
            "eventId:", eventId, "\n",
            "latValue:", latValue, "\n",
            "longValue:", longValue, "\n",
            "dataObject:", dataObject, "\n");
        }
        // Núna inniheldur dataObject "event_id" sem lykla og tilsvarandi lat/long gildi.
        console.log("GeoJSON skjalið:", mygeojson);
    })
    .catch(error => {
        // Error handling
        console.error("Error:", error);
    });

// =========================Kortið=========================
map.on("load", () => {
    // Bætir við mynd til að nota sem custom marker
    map.loadImage(
        "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
        (error, image) => {
            if (error) throw error;
            map.addImage("custom-marker", image);
            // ================GeoJSON staðsetningar (gögn)================
            map.addSource("points", {
                type: "geojson", // Tegund gagnanna er "geojson"
                data: mygeojson // Tekur inn gögnin frá GeoJSON objectinu
            });

            // ================Bætir við Symbol layer================
            map.addLayer({
                "id": "points",
                "type": "symbol",
                "source": "points",
                "layout": {
                    "icon-image": "custom-marker",
                    // sækir titilinn úr GeoJSON "event_id" property, teiknar það á kortið
                    "text-field": ["get", "event_id"],
                    "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                    "text-offset": [0, 1.25],
                    "text-anchor": "top"
                }
            });
        }
    );
});
