// Define the request details
const url = 'https://api.vedur.is/skjalftalisa/v1/quake/array';
const headers = {
    'Content-Type': 'application/json'
};
const method = 'POST';

let depth_max = 25;
let depth_min = 5;
let end_time = "2022-08-03 15:00:00";
event_type = ["qu"];
fields = ["event_id", "lat", "long", "magnitude"];
magnitude_preference = ["Mlw"];
originating_system = ["SIL picks"];
size_max = 6;
size_min = 2;
sort = [];
start_time = "2022-08-02 23:59:59";






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