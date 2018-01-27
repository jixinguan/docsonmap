
    var geojsonLayer = new L.GeoJSON();
    
     function loadGeoJson(data) { 
        geojson.addGeoJSON(data); 
    }

    var geoJsonUrl = "http://localhost:8080/geoserver/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=Farmers_Markets&srsName=EPSG:2274&outputFormat=json&format_options=callback:loadGeoJson"; 
    $.ajax({ 
        url: geoJsonUrl, 
        dataType: 'jsonp',
        success: function(result){
            $("testp").html(result);     
        }
    });   
    map.addLayer(geojsonLayer);
    