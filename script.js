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
const geojson = {
    "type": "FeatureCollection",
    "features": []
};

// Breytur til að geyma svarið frá API
let latitude;
let longitude;
let earthquakeId;
let time;
let magnitude;
let magnitudeType;
let depth;
let eventType;
let originatingSystem;
let seismicMoment;

// Fall til að formattar dagsetningar í format-ið sem API-ið notar
const formatToApiDate = (date) => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
function unix_to_timestamp(unixTimestamp) {
    return new Date(unixTimestamp * 1000).toLocaleString('en-GB', {
        hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'numeric', year: 'numeric',
    });
}
function formatSeismicMoment(seismicMoment) {
    // Skilgreinir tákn fyrir veldisvísirinn
    const symbols = ["", "³", "⁶", "⁹", "¹²", "¹⁵", "¹⁸", "²¹", "²⁴", "²⁷", "³⁰"];
    let veldisvisir = 0; // Frumstillir veldisvísirinn sem 0

    // While (seismicMoment >= 1e3) & (veldisvísirinn er innan við symbols sviðið)
    while (seismicMoment >= 1e3 && veldisvisir < symbols.length - 1) {
        // Þá (seismicMoment ÷ 1000) & (veldisvísirinn + 1)
        seismicMoment /= 1e3;
        veldisvisir++;
    }

    // Býr til og returnar format-aða seismicMoment
    return seismicMoment.toFixed(2) + ` ×10${veldisvisir === 0 ? '' : ' ' + symbols[veldisvisir]}`;
}

// Dagsetninga breytur
const currentDate = new Date();
const daysAgo = new Date(currentDate);
daysAgo.setDate(currentDate.getDate() - 30);

// ====================Query færibreytur====================
const q_area = [
    [63.393163, -23.386596],
    [63.418550, -13.297411],
    [67.000262, -12.978233],
    [66.625838, -24.460814]
];
const q_start_time = formatToApiDate(daysAgo);
const q_end_time = formatToApiDate(currentDate);
const q_depth_min = 5;
const q_depth_max = 25;
const q_size_min = 1;
const q_size_max = 10;
const q_event_type = ["qu"];
const q_originating_system = ["SIL picks"];
const q_magnitude_preference = ["Mlw"];
const q_fields = ["lat", "long", "event_id", "time", "magnitude", "magnitude_type", "depth", "event_type", "originating_system", "seismic_moment"];
const q_sort = [];

// ====================API Request body-ið====================
const body = JSON.stringify({
    "area": q_area,
    "start_time": q_start_time,
    "end_time": q_end_time,
    "depth_min": q_depth_min,
    "depth_max": q_depth_max,
    "size_min": q_size_min,
    "size_max": q_size_max,
    "event_type": q_event_type,
    "originating_system": q_originating_system,
    "magnitude_preference": q_magnitude_preference,
    "fields": q_fields,
    "sort": q_sort
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

        // Fer í gegnum "data" fylkið og býr til object-ana
        for (let i = 0; i < dataArray.event_id.length; i++) {
            earthquakeId = dataArray.event_id[i];
            latitude = dataArray.lat[i];
            longitude = dataArray.long[i];
            time = dataArray.time[i];
            magnitude = dataArray.magnitude[i];
            magnitudeType = dataArray.magnitude_type[i];
            depth = dataArray.depth[i];
            eventType = dataArray.event_type[i];
            originatingSystem = dataArray.originating_system[i];
            seismicMoment = dataArray.seismic_moment[i];

            const feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "properties": {
                    "event_id": earthquakeId,
                    "time": time,
                    "magnitude": magnitude,
                    "magnitude_type": magnitudeType,
                    "depth": depth,
                    "event_type": eventType,
                    "originating_system": originatingSystem,
                    "seismic_moment": seismicMoment
                }
            };

            // Bætir við features í GeoJSON "feature" fylkið
            geojson.features.push(feature);
            console.log("Númer:", i,
                "\n", feature,
                "DATE:",
                "\n", "UNIX:", time,
                "\n", "Date:", new Date(time).toString(), "\n");
        }
        console.log("GeoJSON skjalið:", geojson);

        // =========================Kortið=========================
        map.on("load", () => {
            map.loadImage( // Bætir við mynd til að nota sem custom marker
                "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
                (error, image) => {
                    if (error) throw error;
                    map.addImage("custom-marker", image);
                    // ================GeoJSON staðsetningar (gögn)================
                    map.addSource("points", {
                        type: "geojson", // Tegund gagnanna er "geojson"
                        data: geojson // Tekur inn gögnin frá GeoJSON objectinu
                    });

                    for (const feature of geojson.features) {
                        // býr til HTML element fyrir hvert feature
                        const el = document.createElement('div');
                        el.className = 'marker';
                        el.style.backgroundColor = getMagnitudeColor(feature.properties.magnitude); // Setur background litinn byggt á magnitude skjálftanns

                        const formattedTime = new Date(feature.properties.time * 1000).toLocaleString('en-GB', { // Format-ar UNIX tíma yfir í venjulegan tíma.
                            hour: 'numeric', minute: 'numeric', day: 'numeric', month: 'numeric', year: 'numeric',
                        });

                        new mapboxgl.Marker(el) // býr til marker fyrir hvert feature og bætir því við í kortið
                            .setLngLat(feature.geometry.coordinates)
                            .setPopup(
                                new mapboxgl.Popup({ offset: 25 }) // bætir við popups
                                    .setHTML(
                                        `<h2>event id: ${feature.properties.event_id}</b></h3>
                                        <p>Tími: <b>${formattedTime}</b></p>
                                        <p>Stærð: <b>${feature.properties.magnitude}</b> Mᴸ</p>
                                        <p>Stærðatýpa: <b>${feature.properties.magnitude_type}</b></p>
                                        <p>Dýpt: <b>${(feature.properties.depth).toFixed(1)}</b>Km</p>
                                        <p>Tegund atburðar: <b>${feature.properties.event_type}</b></p>
                                        <p>Upprunakerfi: <b>${feature.properties.originating_system}</b> kerfi</p>
                                        <p>Seismic moment: <b>${formatSeismicMoment(feature.properties.seismic_moment)}</b> N⋅m</p>`
                                    )
                            )
                            .addTo(map);
                    }
                    // Function til að fá lit byggt á magnitude
                    function getMagnitudeColor(magnitude) {
                        // Skilgreinir svið, og lit þeirra
                        const colorRanges = [
                            { range: [0.5, 1], color: '#2376FF' },
                            { range: [1, 1.5], color: '#00ac02' },
                            { range: [1.5, 2], color: '#def921' },
                            { range: [2, 2.5], color: '#FF9600' },
                            { range: [2.5, 3], color: '#ff0000' },
                            { range: [3, 3.5], color: '#9a0013' },
                            { range: [3.5, 4], color: '#6706eb' },
                            { range: [4, 4.5], color: '#490396' },
                            { range: [4.5, 5], color: '#2D0044' },
                            { range: [5, 5.5], color: '#180020' },
                            { range: [5.5, 6], color: '#17001f' },
                            { range: [6, 6.5], color: '#16001e' },
                            { range: [6.5, 7], color: '#15001d' },
                            { range: [7, 7.5], color: '#14001c' },
                            { range: [7.5, 8], color: '#14001c' },
                            { range: [8, 8.5], color: '#14001c' },
                            { range: [8.5, 9], color: '#14001c' },
                            { range: [9, 9.5], color: '#14001c' },
                            { range: [9.5, 10], color: '#000000' },
                            { range: [10, Infinity], color: '#000000' },
                        ];

                        // Finnur samsvarandi lit fyrir tiltekið magnitude
                        const colorObj = colorRanges.find(colorRange => magnitude >= colorRange.range[0] && magnitude < colorRange.range[1]);

                        // Return-ar litinn EÐA default hvítur
                        return colorObj ? colorObj.color : '#ffffff';
                    }

                }
            );
        });
    })
    .catch(error => {
        // Error handling
        console.error("Error:", error);
    });


document.getElementById('filterForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const minMagnitude = document.getElementById('minMagnitude').value;
    const maxMagnitude = document.getElementById('maxMagnitude').value;
    const minDepth = document.getElementById('minDepth').value;
    const maxDepth = document.getElementById('maxDepth').value;
    const startDate = new Date(document.getElementById('startDate').value).getTime();
    const endDate = new Date(document.getElementById('endDate').value).getTime();
    fetchData(minMagnitude, maxMagnitude, minDepth, maxDepth, startDate, endDate);
});