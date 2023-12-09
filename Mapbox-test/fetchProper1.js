// Define the request details  
const url = 'https://api.vedur.is/skjalftalisa/v1/quake/array';  
const headers = {    
    'Content-Type': 'application/json'  
};  
const method = 'POST';  

// Set query parameters
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

// Define variables to store API response
let eventId;  
let latValue;  
let longValue;  
let mygeojson = [];  

// Define the GeoJSON structure  
// let mygeojson = { "type": "FeatureCollection", "features": [] };  

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

// Make the HTTP request
fetch(url, {
    method: method,
    headers: headers,
    body: body,
})
    .then(response => response.json())
    .then(data => {
        console.log("API response: ", data);  

        // Extract the "data" array from the API response
        const dataArray = data.data;  

        // Create an object to store the data with event_id as keys
        const dataObject = {};  

        // Iterate through the "data" array and create the object
        for (let i = 0; i < dataArray.event_id.length; i++) {
            let eventId = dataArray.event_id[i];
            let latValue = dataArray.lat[i];
            let longValue = dataArray.long[i];  

            // Create an object for each event_id with lat and long
            dataObject[eventId] = {
                lat: latValue,
                long: longValue
            };
            console.log("Item nr:", i, "eventId:", eventId);  
            console.log("Item nr:", i, "latValue:", latValue);  
            console.log("Item nr:", i, "longValue:", longValue);  
            console.log("Item nr:", i, "dataObject:", dataObject);  
        }

        /* Now, dataObject contains event_id as keys and corresponding lat/long values.
        Further processing or use of dataObject can be done here */
    })
    .catch(error => {
        // Handle errors here
        console.error('Error:', error);
    });