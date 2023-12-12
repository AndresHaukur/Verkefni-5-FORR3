// Skilgreinir request details
const url = "https://api.vedur.is/skjalftalisa/v1/quake/array";
const headers = {
    "Content-Type": "application/json"
};

// Initializar kortið með stillingum
mapboxgl.accessToken = "pk.eyJ1IjoiYW5kcm9tZWR5eXkiLCJhIjoiY2xwcXl1cGFoMDU0MjJpcWNxZzh5MWxucyJ9.9_9fbAHchEsiJ1WBTE14Eg";
const street = "streets-v12";
const satellite = "satellite-v9";
const satelliteStreet = "satellite-streets-v12";
const terrain = "terrain-v2";
const outdoors = "outdoors-v12";

let mapStyle = outdoors; // Default stílinn
const map = new mapboxgl.Map({
    container: "map", // container ID
    style: `mapbox://styles/mapbox/${mapStyle}`, // Style ID
    projection: "mercator", // Stillir projection sem "Mercator" projection-ið (Frægasta og mest-notaða projectionið. A.k.a. venjulegt 2D kort)
    center: [-22.261827, 63.907787], // byrjunar staðsetning [lng(⇆), lat(⇅)]
    zoom: 9.5, // byrjunar zoom-in ✕. "zoom: 9.5," = Zoom in 9.5✕ sinnum, etc.
});

// Dagsetninga breytur
const currentDate = new Date();
const daysAgo = new Date(currentDate);
daysAgo.setDate(currentDate.getDate() - 30);

// Fall til að formattar dagsetningar í format-ið sem API-ið notar
function formatToApiDate(date) {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

function unixToTimestamp(unixTimestamp) {
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

function myFunction() {
    console.log("Þetta keyrir");
}

// ====================API Fetch-ið====================
async function getVedurQuakeData(daysAgo, currentDate) {
    // ====================Query færibreytur====================
    const requestBody = {
        area: [
            [63.393163, -23.386596],
            [63.418550, -13.297411],
            [67.000262, -12.978233],
            [66.625838, -24.460814]
        ],
        start_time: formatToApiDate(daysAgo),
        end_time: formatToApiDate(currentDate),
        depth_min: 5,
        depth_max: 25,
        size_min: 1,
        size_max: 10,
        event_type: ["qu"],
        originating_system: ["SIL picks"],
        magnitude_preference: ["Mlw"],
        fields: ["lat", "long", "event_id", "time", "magnitude", "magnitude_type", "depth", "event_type", "originating_system", "seismic_moment"],
        sort: []
    };

    try {
        let response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody)
        })

        let responseData = await response.json();
        console.log("API svar: ", responseData);

        // Skila "data" fylkið úr API svarinu
        return responseData.data;
    }
    catch (error) {
        // Error handling
        console.error("Error:", error);
    }
}

class GeoFeature {
    constructor(quakeData, index) {
        this.type = "Feature";
        this.geometry = {
            "type": "Point",
            "coordinates": [quakeData.long[index], quakeData.lat[index]]
        },
            this.properties = {
                "event_id": quakeData.event_id[index],
                "time": quakeData.time[index],
                "magnitude": quakeData.magnitude[index],
                "magnitude_type": quakeData.magnitude_type[index],
                "depth": quakeData.depth[index],
                "event_type": quakeData.event_type[index],
                "originating_system": quakeData.originating_system[index],
                "seismic_moment": quakeData.seismic_moment[index]
            }
    }
}

class GeoJSON {
    constructor(quakeData) {
        this.type = "FeatureCollection";
        this.features = [];

        // Fer í gegnum "quakeData" fylkið og býr til object-ana
        for (let i = 0; i < quakeData.event_id.length; i++) {
            // Bætir við features í GeoJSON "feature" fylkið
            this.features.push(new GeoFeature(quakeData, i));
        }
    }
}

function setMapQuakeMarkers(quakeData) {
    // =========================Kortið=========================
    map.on("load", () => {
        map.loadImage( // Bætir við mynd til að nota sem custom marker
            "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
            (error, image) => {
                if (error) {
                    console.error("Error loading marker image:", error);  // Debug: Check for image loading errors
                    return;
                }
                // ATH: Fer aldrey hingað
                if (error) throw error;

                map.addImage("custom-marker", image);

                const geojson = new GeoJSON(quakeData);
                console.log("GeoJSON skjalið:", geojson);

                // ================GeoJSON staðsetningar (gögn)================
                map.addSource("points",
                    {
                        type: "geojson", // Tegund gagnanna er "geojson"
                        data: geojson // Tekur inn gögnin frá GeoJSON objectinu
                    });

                let sizeFactor = 6;

                for (const feature of geojson.features) {
                    // býr til HTML element fyrir hvert feature
                    const el = document.createElement('div');
                    el.className = 'marker';
                    // Setur background litinn og stærð byggt á magnitude skjálftanns
                    el.style.backgroundColor = getMagnitudeColor(feature.properties.magnitude);
                    el.style.width = `${feature.properties.magnitude * sizeFactor}px`;
                    el.style.height = `${feature.properties.magnitude * sizeFactor}px`;

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
            }
        );
    });
}


// Ræsi allt
(async () => {
    let quakeData = await getVedurQuakeData(daysAgo, currentDate);

    setMapQuakeMarkers(quakeData);
})()