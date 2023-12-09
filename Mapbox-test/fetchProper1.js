// Skilgreinir request details
const url = 'https://api.vedur.is/skjalftalisa/v1/quake/array';
const headers = {
    'Content-Type': 'application/json'
};
const method = 'POST';

// Setur query parameters
let depth_max = 25;
let depth_min = 5;
let end_time = "2022-08-03 15:00:00";
let event_type = ["qu"];
let fields = ["event_id", "lat", "long"];
let magnitude_preference = ["Mlw"];
let originating_system = ["SIL picks"];
let size_max = 6;
let size_min = 2;
let sort = [];
let start_time = "2022-08-02 23:59:59";

// Skilgreinir breytur til að geyma svarið frá API
let eventId;
let latValue;
let longValue;

// Skilgreinir GeoJSON strúktúr
let mygeojson = {
    "type": "FeatureCollection",
    "features": []
};

// Skilgreinir request body-ið
const body = JSON.stringify({
    "area": [
        [64.1, -21.5],
        [63.8, -21.5],
        [63.8, -22.8],
        [64.1, -22.8]
    ],
    "depth_max": depth_max,
    "depth_min": depth_min,
    "end_time": end_time,
    "event_type": event_type,
    "fields": [
        "event_id",
        "lat",
        "long",
    ],
    "magnitude_preference": magnitude_preference,
    "originating_system": originating_system,
    "size_max": size_max,
    "size_min": size_min,
    "sort": sort,
    "start_time": start_time,
});

// Gerir HTTP beiðnina
fetch(url, {
    method: method,
    headers: headers,
    body: body,
})
    .then(response => response.json())
    .then(data => {
        console.log("API svar: ", data);

        // Fá "data" fylkið úr API svari
        const dataArray = data.data;

        // Búa til object til að geyma gögnin með "event_id" sem lykla
        const dataObject = {};

        // Fer í gegnum "data" fylkið og býr til object-ana
        for (let i = 0; i < dataArray.event_id.length; i++) {
            let eventId = dataArray.event_id[i];
            let latValue = dataArray.lat[i];
            let longValue = dataArray.long[i];

            // Búa til GeoJSON feature fyrir hvert event
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
        console.log("GeoJSON skjalið:", mygeojson);
        // Núna inniheldur dataObject "event_id" sem lykla og tilsvarandi lat/long gildi.
    })
    .catch(error => {
        // Error handling
        console.error('Error:', error);
    });