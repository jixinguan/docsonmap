'use strict';

// prepare base layers
var baseLayerGroup = {
    "Topographic": L.esri.basemapLayer("Topographic"),
    "Streets": L.esri.basemapLayer("Streets"),
    "NationalGeographic": L.esri.basemapLayer("NationalGeographic"),
    "Oceans": L.esri.basemapLayer("Oceans"),
    "Gray": L.esri.basemapLayer("Gray"),
    "ShadedRelief": L.esri.basemapLayer("ShadedRelief"),
    "DarkGray": L.esri.basemapLayer("DarkGray"),
    "Imagery": L.esri.basemapLayer("Imagery"),
    "GrayLabels": L.esri.basemapLayer("GrayLabels"),
    "ImageryLabels": L.esri.basemapLayer("ImageryLabels"),
};

const geoserverUrl = 'http://192.168.1.69:8080/geoserver';
const docWFSName = 'ogp:BF_CULTURE_POINT';
const regionTableName = 'ogp:BF_PROV_ELECTORAL_DIVISION';
const nameField = 'edname'; //'fishmgmt_n'; // 
var map;
var paras;
var docLayer;
var regionLayer;
var regionLayerPolygon;

var customLayer;
var selectRegion;
var regionArr = [];
var polygonArray = [];
var polygonLayer;
var markerArr = [];
var bounds = L.latLngBounds([]);

function replaceAll(str, find, replace) {
    var $r = "";
    while ($r != str) {
        $r = str;
        str = str.replace(find, replace);
    }
    return str;
}

function encodePara(para) {
    var strRet = para
    strRet = replaceAll(strRet, ' ', '%20');
    strRet = replaceAll(strRet, ',', '%2C');
    strRet = replaceAll(strRet, '/', '%2F');
    strRet = replaceAll(strRet, ':', '%3A');
    strRet = replaceAll(strRet, '(', '%28');
    strRet = replaceAll(strRet, ')', '%29');
    strRet = replaceAll(strRet, "'", '%27');
    return strRet;
}

function composeUrlString() {
    var requestUrl;
    // check workspace
    if (paras.workspace) {
        requestUrl = geoserverUrl;
        requestUrl += '/' + encodePara(paras.workspace) + '/wfs?service=WFS';
    } else {
        alert("Workspace in GeoServer must be specified.")
        return
    }

    // check version
    if (paras.version) {
        requestUrl += '&version=' + encodePara(paras.version);
    } else {
        alert("Version of WFS service must be specified.")
        return
    }

    // check request
    if (paras.request) {
        requestUrl += '&request=' + encodePara(paras.request);
    } else {
        alert("Request (getFeature, getMap... )must be specified.")
        return
    }

    // check feature layer
    if (paras.typename) {
        requestUrl += '&typeName=' + encodePara(paras.typename);
    } else {
        alert("typeName must be specified.")
        return
    }

    // check maxFeatures
    if (paras.maxfeatures) {
        requestUrl += '&maxFeatures=' + encodePara(paras.maxfeatures);
    }

    // check outputFormat
    if (paras.outputformat) {
        requestUrl += '&outputFormat=' + encodePara(paras.outputformat);
    }

    // check srsName
    if (paras.srsname) {
        requestUrl += '&srsName=' + encodePara(paras.srsname);
    }

    // check bbox
    if (paras.bbox) {
        requestUrl += '&bbox=' + encodePara(BoundingBox());
    }

    // check cql_filter
    if (paras.cqlfilter) {
        requestUrl += '&cql_filter=' + encodePara(paras.cqlfilter);
        //console.log(encodePara(paras.cqlfilter));                                                
    }

    // check cql_filter
    if (paras.sortBy) {
        requestUrl += '&sortBy=' + encodePara(paras.sortBy);
        //console.log(encodePara(paras.cqlfilter));                                                
    }
    console.log("requestUrl: " + requestUrl);
    return requestUrl;
}

// Compose the paras object before call
function load_wfs() {
    $.ajax({
        url: composeUrlString(),
        dataType: 'jsonp'
    });
}

// Call back function: will use the default 'parseResponse' instead of : formatOptions = '&format_options=callback:testme'
function parseResponse(data) {
    console.log("parseResponse():");
    // for document layers
    if (paras.layertype == '0') {
        if (docLayer && map.hasLayer(docLayer)){
            map.removeLayer(docLayer);
        }

        docLayer = L.geoJson(data, {
            onEachFeature: onEachDocFeature,
            //pointToLayer: function (feature, latlng) {
            //    return L.circleMarker(latlng, geojsonMarkerOptions);
            //}
        });
        docLayer.addTo(map);
        docLayer.bringToFront();
    } else if (paras.layertype == '1') {
        // for region layers
        regionArr = [];
        regionLayer = L.geoJson(data, {
            onEachFeature: onEachRegionFeature
        });//.addTo(map);
        //map.fitBounds(regionLayer.getBounds());

        //update innerHtml of divRegions
        var divRegions = document.getElementById("regions");
        var str = ''
        for (var i = 0; i < regionArr.length; i++) {
            str += '<option>' + regionArr[i] + '</option>';
        }
        divRegions.innerHTML = '<select id="regions">' + str + '</select>';
        $("#regions").on('change', function () {
            changeRegion();
        });
        
        
    } else {
        console.log("Unhandled layer.");
    }
    layerCount(false);
}

function removeLayer(layer){
    if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
        console.log("Layer Removed from map: ");
        console.log(layer);
    }
}

function changeRegion(){
    console.log("parseResponse():");
    if (regionLayer){        
        regionLayer.eachLayer(function(layer){
            if ($("#regions").val() == layer.feature.properties.edname){
                var objId = layer.feature.properties.objectid;
                var latlngs=[];
                $.each(layer.feature.geometry.coordinates, function(index, value){
                    var coord = value[index]
                    $.each(coord, function(i2,v2){
                        latlngs.push(L.GeoJSON.coordsToLatLng(v2));
                    });    
                });
                console.log(latlngs);
                if (regionLayerPolygon && map.hasLayer(regionLayerPolygon)){
                    map.removeLayer(regionLayerPolygon);
                }
            
                regionLayerPolygon = L.polygon(latlngs, {color: 'red'});
                //console.log(regionLayerPolygon);
                map.addLayer(regionLayerPolygon);
                map.fitBounds(regionLayerPolygon.getBounds());

                // compose the cql string
                paras = {
                    workspace: "ogp",
                    version: "2.0.0",
                    request: "getFeature",
                    typename: docWFSName,
                    layertype: '0',  //Region layer 
                    maxfeatures: '300',
                    outputformat: 'text/javascript',
                    cqlfilter: "intersects(geom, querySingle('ogp:BF_PROV_ELECTORAL_DIVISION', 'geom','objectid = " + objId + "'))",
                }
                load_wfs();
            }

            //latlngs = L.GeoJSON.coordsToLatLngs(layer.feature.geometry.coordinates[0]); this failed all the time?
        });   
    }
    else{
        console.log(regionLayer);         
    }
}

function layerFilter(feature){
    for (var layer in feature.getLayers()) {
        console.log(layer.feature.properties.edname);
    }
    if (feature.getLayers().properties.edname === $("#regions").val()){ return true
    }
}

// return format: cqlfilter: 'intersects(point_geom,POLYGON((53.211133 -113.807376,53.211133 -113.388068,53.818406 -113.388068,53.818406 -113.807376,53.211133 -113.807376)))',            
function getCqlFilter(coords) {
    var strRet = '';

    $.each(coords, function (index, value) {
        strRet += value.join(' ') + ",";
    });
    strRet = "intersects(geom,POLYGON((" + strRet.slice(0, -1) + ")))";
    console.log("cql_str:"+strRet);
    return strRet;
}

function onEachDocFeature(feature, layer) {
    // for document, you can retrieve document info like 'dataset id'
    if (feature.properties && feature.properties.culpt_name) {
        layer.bindPopup(feature.properties.culpt_name);
    }
}

function onEachRegionFeature(feature, layer) {
    // Add all feature name to dropdown control
    if (feature.properties && feature.properties.edname) {
        regionArr.push(feature.properties.edname);
    };
}

function BoundingBox() {
    var bounds = map.getBounds().getSouthWest().lat + "," + map.getBounds().getSouthWest().lng + "," + map.getBounds().getNorthEast().lat + "," + map.getBounds().getNorthEast().lng;
    return bounds;
}

function layerCount(numOnly) {
    var iCount = 0;
    console.log("--------------------------------------");
    map.eachLayer(function (layer) {
        iCount++;
        if (!numOnly) {
            console.log("#" + iCount);
            console.log(layer);
        }
    });
    if (numOnly) {
        console.log("Num of Layer on Map:" + iCount);
    }
    console.log("======================================");
    return iCount;
}

function drawpolygon(button, map) {
    console.log("drawpolygon:");
}

function drawrectangle(button, map) {
    console.log("drawpolygon:");
}

function showHide(obj) {
    var div = document.getElementById(obj);
    if (div.style.display == 'none') {
        div.style.display = '';
    }
    else {
        div.style.display = 'none';
    }
}

function Test(){
    layerCount(true);
}

$(document).ready(function () {

    // load map object
    map = L.map('map', {
        center: [53.554121, -113.491433],
        zoom: 10
    });

    var baselayer = baseLayerGroup.Topographic;
    map.addLayer(baselayer);

    L.control.layers(baseLayerGroup).addTo(map);

    L.easyButton({
        id: 'id-drawpolygon',
        position: 'topleft',
        type: 'replace',
        leafletClasses: true,
        states: [{
            stateName: 'draw-polygon',
            onClick: function (button, map) {
                drawpolygon(button, map);
            },
            title: 'Search Doc inside polygon',
            icon: '<img alt="draw polygon" src="./libs/images/drawpolygon.png"/>'
        }]
    }).addTo(map);

    L.easyButton({
        id: 'id-drawrectangle',
        position: 'topleft',
        type: 'replace',
        leafletClasses: true,
        states: [{
            stateName: 'draw-rectangle',
            onClick: function (button, map) {
                drawrectangle(button, map);
            },
            title: 'Search Doc inside rectangle',
            icon: '<img alt="draw rectangle" src="./libs/images/drawrectangle.png"/>'
        }]
    }).addTo(map);

    /* Create dropdown in control
    var regionsElm = L.control({ position: 'topleft' });
    regionsElm.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'regions');
        div.innerHTML = '<select id="regions"></select>';
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    regionsElm.addTo(map);
    */

    // load  regions
    paras = {
        workspace: "ogp",
        version: "2.0.0",
        request: "getFeature",
        typename: regionTableName,
        layertype: '1',  //Region layer 
        maxfeatures: '300',
        outputformat: 'text/javascript',
        sortBy: 'edname'
    }
    load_wfs();


});


// test