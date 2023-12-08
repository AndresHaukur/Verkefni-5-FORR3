// Define the request details
const url = 'https://api.vedur.is/skjalftalisa/v1/quake/array';
const headers = {
    'Content-Type': 'application/json'
};
const method = 'POST';

let depth_max = 25;
let depth_min = 5;
let end_time = "2022-08-03 15:00:00";
let event_type = ["qu"];
let fields = ["event_id", "lat", "long", "magnitude"];
let magnitude_preference = ["Mlw"];
let originating_system = ["SIL picks"];
let size_max = 6;
let size_min = 2;
let sort = [];
let start_time = "2022-08-02 23:59:59";

const pluto_url = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';
getData();

document.addEventListener("DOMContentLoaded", function() {
    var range1 = document.getElementById("range1");
    var rangeValue1 = document.getElementById("rangeValue1");

    range1.addEventListener("input", function() {
        rangeValue1.value = range1.value;
    });

    var range2 = document.getElementById("range2");
    var rangeValue2 = document.getElementById("rangeValue2");

    range2.addEventListener("input", function() {
        rangeValue2.value = range2.value;
    });
});


// Define the request body
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
    "fields": fields,
    "magnitude_preference": magnitude_preference,
    "originating_system": originating_system,
    "size_max": size_max,
    "size_min": size_min,
    "sort": sort,
    "start_time": start_time
});

// Make the HTTP request
fetch(url, {
    method: method,
    headers: headers,
    body: body
})
    .then(response => response.json())
    .then(data => {
        // Handle the response data here
        console.log(data);
    })
    .catch(error => {
        // Handle errors here
        console.error('Error:', error);
    });