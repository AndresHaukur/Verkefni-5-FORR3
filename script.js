// Skilgreinir request details
const url = "https://api.vedur.is/skjalftalisa/v1/quake/array";
const headers = {
    "Content-Type": "application/json"
};
// býr til tómt array sem heitir quakeData
quakeData = [];

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
    zoom: 10, // byrjunar zoom-in ✕. "zoom: 9.5," = Zoom in 9.5✕ sinnum, etc.
});

// Dagsetninga breytur
const default_end_time = new Date();
const default_start_time = new Date(default_end_time);
default_start_time.setDate(default_end_time.getDate() - 30);

// ||=====================================Functions=====================================||
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
    const symbols = ["", "³", "⁶", "⁹", "¹²", "¹⁵", "¹⁸", "²¹", "²⁴", "²⁷", "³⁰"]; // Skilgreinir tákn fyrir veldisvísirinn
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

function initializeForm() {
    document.getElementById('minMagnitude').value = 1;
    document.getElementById('maxMagnitude').value = 10;
    document.getElementById('minDepth').value = 5;
    document.getElementById('maxDepth').value = 25;
    let startDate = default_start_time.toISOString();
    let endDate = default_end_time.toISOString();
    document.getElementById('startDate').value = startDate.substring(0, startDate.indexOf("T") + 6);
    document.getElementById('endDate').value = endDate.substring(0, endDate.indexOf("T") + 6);
}

async function inputFilter() { 
    // Breytir dagsetningar sem koma frá forminu yfir í API format-ið
    let startDateValue = document.getElementById('startDate').value;
    let endDateValue = document.getElementById('endDate').value;
    let formattedStartDate = formatToApiDate(startDateValue ? new Date(startDateValue) : default_end_time);
    let formattedEndDate = formatToApiDate(endDateValue ? new Date(endDateValue) : default_start_time);

    // Nær í gildi frá form inputs
    let options = {
        start_time: formattedStartDate,
        end_time: formattedEndDate,
        // Nær í gildin frá forminu, parse-ar þau sem float
        depth_min: Number.parseFloat(document.getElementById('minDepth').value || 5),  // Notar default gildi ef að það ekkert er skilgreint
        depth_max: Number.parseFloat(document.getElementById('maxDepth').value || 25), // Notar default gildi ef að það ekkert er skilgreint
        size_min: Number.parseFloat(document.getElementById('minMagnitude').value || 1),  // Notar default gildi ef að það ekkert er skilgreint
        size_max: Number.parseFloat(document.getElementById('maxMagnitude').value || 10)  // Notar default gildi ef að það ekkert er skilgreint
    };

    // Fetchar nýju quake gögn með uppfærðu parameters
    let quakeData = await getVedurQuakeData(options);
    setMapQuakeMarkers(quakeData);

    // Uppfærir chart með nýjum gögnum
    console.log("Updating chart with new data...");
    const processedData = processEarthquakeData(quakeData);
    console.log("processed");
    createEarthquakeChart(processedData);

    // Uppfærir count chart með nýjum gögnum
    console.log("Updating count chart with new data...");
    const counts = countEarthquakesByPeriod(quakeData, new Date(options.start_time), new Date(options.end_time));
    console.log("counts:", counts);
    createEarthquakeCountChart(counts);
}


// ---------------API Fetch-ið---------------
async function getVedurQuakeData(options) {
    const requestBody = {
        area: [
            [63.393163, -23.386596],
            [63.418550, -13.297411],
            [67.000262, -12.978233],
            [66.625838, -24.460814]
        ],
        start_time: options.start_time,
        end_time: options.end_time,
        depth_min: options.depth_min,
        depth_max: options.depth_max,
        size_min: options.size_min,
        size_max: options.size_max,
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
        console.log("API request body:", requestBody)
        console.log("API svar:", responseData);

        // Skila "data" fylkið úr API svarinu
        return responseData.data;
    }
    catch (error) {
        // Error handling
        console.error("Error:", error);
    }
}

function setMapQuakeMarkers(quakeData) {
    const geojson = new GeoJSON(quakeData);
    console.log("GeoJSON skjalið:", geojson);

    // ---------------GeoJSON staðsetningar (gögn)---------------
    let pointsSource = map.getSource("points");
    if (!pointsSource) {
        map.addSource("points",
            {
                type: "geojson", // Tegund gagnanna er "geojson"
                data: geojson // Tekur inn gögnin frá GeoJSON objectinu
            });
    }
    else {
        pointsSource.setData(geojson);
    }

    let sizeFactor = 7;
    // Eyðir markerum, með því að tæma array af þeim OG eyðir þeim samtímis
    while (markers.length) {
        let marker = markers.pop();
        marker.remove();
    }

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

        let marker = new mapboxgl.Marker(el) // býr til marker fyrir hvert feature og bætir því við í kortið
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
        markers.push(marker);
    }
}
const markers = [];
// ||=====================================Classes=====================================||
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
        for (let i = 0; i < quakeData?.event_id?.length ?? 0; i++) {
            // Bætir við features í GeoJSON "feature" fylkið
            this.features.push(new GeoFeature(quakeData, i));
        }
    }
}


function processEarthquakeData(quakeData) {
    console.log("Received earthquake data:", quakeData);

    // Gáir ef öll nauðsinleg fylki sem eru til í quakeData
    if (quakeData && Array.isArray(quakeData.depth) && Array.isArray(quakeData.event_id) &&
        Array.isArray(quakeData.magnitude) && Array.isArray(quakeData.time)) {

        console.log("Processing earthquake data for Chart.js...");
        const processedData = [];

        // Ef að öll fylki eru jafn löng
        for (let i = 0; i < quakeData.depth.length; i++) {
            processedData.push({
                depth: quakeData.depth[i],
                event_id: quakeData.event_id[i],
                magnitude: quakeData.magnitude[i],
                time: unixToTimestamp(quakeData.time[i])
            });
        }

        return processedData;
    } else {
        console.error("quakeData does not have the expected structure");
        return [];
    }
}

function createEarthquakeChart(data) {
    console.log("Creating earthquake chart...");
    const ctx = document.getElementById('earthquakeChart').getContext('2d');
    const magnitudes = data.map(d => d.magnitude);
    const times = data.map(d => d.time);

    if (window.earthquakeChart && typeof window.earthquakeChart.destroy === 'function') {
        window.earthquakeChart.destroy();
        console.log("Chart destroyed.");
    }

    window.earthquakeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [{
                label: 'Earthquake Magnitude',
                data: magnitudes,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    console.log("Chart created.");
}

function countEarthquakesByPeriod(quakeData, startDateTime, endDateTime) {
    const counts = {};
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    const period = endDateTime - startDateTime < oneDay * 5 ? 12 * 60 * 60 * 1000 : oneDay; // 12 hours or 1 day

    quakeData.time.forEach((timestamp, index) => {
        const date = new Date(timestamp * 1000);
        const periodStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                                     date.getHours() - (date.getHours() % (period / 3600000)));
        const key = periodStart.toISOString();

        counts[key] = (counts[key] || 0) + 1;
    });

    return counts;
}

function createEarthquakeCountChart(data) {
    const ctx = document.getElementById('earthquakeCountChart').getContext('2d');

    const labels = Object.keys(data);
    const values = Object.values(data);

    if (window.earthquakeCountChart && typeof window.earthquakeCountChart.destroy === 'function') {
        window.earthquakeCountChart.destroy();
    }

    window.earthquakeCountChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Earthquakes',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}



// Ræsi allt
(async () => {
    initializeForm();
    let quakeData = await getVedurQuakeData(default_start_time, default_end_time);
    console.log("quakeData:", quakeData);
    // Kort
    setMapQuakeMarkers(quakeData);
    // Chart
    console.log("Updating chart with new data...");
    const processedData = processEarthquakeData(quakeData);
    console.log("processed");
    createEarthquakeChart(processedData);
    // Count chart
    console.log("Updating count chart with new data...");
    const counts = countEarthquakesByPeriod(quakeData, default_start_time, default_end_time);
    console.log("counts:", counts);
    createEarthquakeCountChart(counts);
})()