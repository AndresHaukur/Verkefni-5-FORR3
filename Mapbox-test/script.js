mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kcm9tZWR5eXkiLCJhIjoiY2xwcXl1cGFoMDU0MjJpcWNxZzh5MWxucyJ9.9_9fbAHchEsiJ1WBTE14Eg';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    projection: 'mercator', // Stillir projection sem "Mercator" projection-ið (Frægasta og mest-notaða projectionið. A.k.a. venjulegt 2D kort)
    center: [-18.995036, 65.007451], // byrjunar staðsetning [lng(⇆), lat(⇅)]
    zoom: 6, // byrjunar zoom-in ✕. "zoom: 10," = Zoom in 10✕ sinnum, etc.
});