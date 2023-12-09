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
    center: [ -22.261827, 63.907787], // byrjunar staðsetning [lng(⇆), lat(⇅)]
    zoom: 9.5, // byrjunar zoom-in ✕. "zoom: 9.5," = Zoom in 9.5✕ sinnum, etc.
});

// Skilgreinir GeoJSON strúktúr
let mygeojson = {
    "type": "FeatureCollection",
    "features": []
};

// Stillir query parameters
let q_depth_max = 25;
let q_depth_min = 5;
let q_end_time = "2022-08-03 15:00:00";
let q_event_type = ["qu"];
let q_fields = ["event_id", "lat", "long"];
let q_magnitude_preference = ["Mlw"];
let q_originating_system = ["SIL picks"];
let q_size_max = 6;
let q_size_min = 2;
let q_sort = [];
let q_start_time = "2022-08-02 23:59:59";

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
    "fields": [
        "event_id",
        "lat",
        "long",
    ],
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
            let eventId = dataArray.event_id[i];
            let latValue = dataArray.lat[i];
            let longValue = dataArray.long[i];

            // Býr til GeoJSON feature fyrir hvert event
            let feature = {
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

            console.log("Númer:", i, "eventId:", eventId);
            console.log("Númer:", i, "latValue:", latValue);
            console.log("Númer:", i, "longValue:", longValue);
            console.log("Númer:", i, "dataObject:", dataObject);
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
                    "text-font": [
                        "Open Sans Semibold",
                        "Arial Unicode MS Bold"
                    ],
                    "text-offset": [0, 1.25],
                    "text-anchor": "top"
                }
            });
        }
    );
});
