var mapboxUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}'
var mapboxAttribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
var myToken = 'pk.eyJ1Ijoiaml4aW4tZ3VhbiIsImEiOiJjajRzd2NidWowMXpkMnFwaDRmaXk0MzU3In0.1B6QeB7yLSjKo2e1-IsAgw'

// three base layers
var grayscale = L.tileLayer(mapboxUrl, 
    {
    id: 'mapbox.light', 
    attribution: mapboxAttribution,
    accessToken: myToken
  }),
  satellite = L.tileLayer(mapboxUrl, {
    id: 'mapbox.satellite', 
    attribution: mapboxAttribution,
    accessToken: myToken
  }),
  streets   = L.tileLayer(mapboxUrl, {
    id: 'mapbox.streets', 
    attribution: mapboxAttribution,
    accessToken: myToken
  });
        
  // initialize the map
  var map = L.map('map', {
        zoomSnap: 0.1,
        center: [53.554121, -113.491433], 
        zoom:12,
        layers: [streets]
    });      
    
  // create a objects to contain base layers 
  var baseMaps = {
    "<span style='color: blue'>Grayscale</span>": grayscale,
    "Satellite": satellite,
    "Streets": streets
  };

  // create layer Control to show/hide 
  L.control.layers(baseMaps).addTo(map);
