# Verkefni-5-FORR3

## Mapbox

* [Mapbox Quickstart guide](https://docs.mapbox.com/mapbox-gl-js/guides/install/#quickstart)
* Maður þarf alltaf JS og CSS linkið í html HEAD:

  ```html
  <script src='https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js'></script>
  <link href='https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css' rel='stylesheet' />
  ```
* Og þennan kóða í html BODY :
    ```html
    <div id='map' style='width: 400px; height: 300px;'></div>
    <script>
    mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kcm9tZWR5eXkiLCJhIjoiY2xwcXl1cGFoMDU0MjJpcWNxZzh5MWxucyJ9.9_9fbAHchEsiJ1WBTE14Eg';
    const map = new mapboxgl.Map({
    	container: 'map', // container ID
    	style: 'mapbox://styles/mapbox/streets-v12', // style URL
    	center: [-74.5, 40], // starting position [lng, lat]
    	zoom: 9, // starting zoom
    });
    </script>
    ```
* [Display a map on a webpage example](https://docs.mapbox.com/mapbox-gl-js/example/simple-map/)
