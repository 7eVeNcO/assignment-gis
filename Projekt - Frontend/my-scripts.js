$(document).ready(function() {
    var mymap;
    var selectedOsmId;
    initMap();

    var restaurantsLayer = null;
    var parkingsLayer = null;
    var districtLayer = null;
    var layerControl;
    var info;

    getAreas();
    var defaultIcon0 = L.icon({
        iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
        iconSize:     [15, 15] // size of the icon
        });

    var defaultIcon1 = L.icon({
        iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
        iconSize:     [25, 25] // size of the icon
    });

    var defaultIcon2 = L.icon({
        iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
        iconSize:     [35, 35] // size of the icon
    });

    var defaultIcon3 = L.icon({
        iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
        iconSize:     [45, 45] // size of the icon
    });

    var defaultIcon4 = L.icon({
        iconUrl: 'https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678111-map-marker-512.png',
        iconSize:     [55, 55] // size of the icon
    });

    var restaurantIcon = L.icon({
        iconUrl: 'images/restaurant.png',
        iconSize:     [35, 35] // size of the icon
    });

    var pubIcon = L.icon({
        iconUrl: 'images/pub.png',
        iconSize:     [35, 35] // size of the icon
    });

    var fastFoodIcon = L.icon({
        iconUrl: 'images/fast-food.png',
        iconSize:     [35, 35] // size of the icon
    });

    var cafeIcon = L.icon({
        iconUrl: 'images/cafe.png',
        iconSize:     [35, 35] // size of the icon
    });

    $("#radius").val("1000");

    $( "#button-r" ).click(function() {
        getRestaurants();
    });

    $( "#button-p" ).click(function() {
        getParkingsPolygons();
    });
    $( "#button-rd" ).click(function() {
        getAreaRestaurants();
    });
    $( "#button-zomato" ).click(function() {
        showBestDistricts();
    });
    $( "#button-clear" ).click(function() {
        clearMap();
    });

    $( "#districts" ).change(function() {
        getDistrictPolygon();
    });


    function initMap(){
        mymap = L.map('mapid').setView([48.157805, 17.064294], 14);

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox.streets'
        }).addTo(mymap);

        var popup = L.popup();

        layerControl = L.control.layers().addTo(mymap);

        info = L.control();

        info.onAdd = function (mymap) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function (props) {
            this._div.innerHTML = '<h4>District rating</h4>' +  (props ?
                '<b>' + props.district + '</b><br /> Average rating: ' + props.rating_average + ''
                : 'Hover over a district');
        };

        info.addTo(mymap);

        function onMapClick(e) {
            $("#lat").val(e.latlng.lat.toString());
            $("#long").val(e.latlng.lng.toString());

            popup
                .setLatLng(e.latlng)
                .setContent("Position " + e.latlng.toString() +" selected.")
                .openOn(mymap);
        }

        mymap.on('click', onMapClick);

    }

    function getRestaurants(){
        let lat = $("#lat").val();
        let long = $("#long").val();
        let radius = $("#radius").val();

        if(lat=="" || long=="" || radius==""){
            alert("Please select a point and radius");
            return;
        }

        let restaurants = $("#restaurants").is(':checked');
        let bars = $("#bars").is(':checked');
        let fast_foods = $("#fast-foods").is(':checked');
        let cafes = $("#cafes").is(':checked');

        let types = "";

        if(restaurants){
            types = types + "restaurant,";
        }
        if(bars){
            types = types + "bar,";
        }
        if(fast_foods){
            types = types + "fast_foods,";
        }
        if(cafes){
            types = types + "cafe,";
        }
        if(types.length>1)
            types = types.substring(0, types.length - 1);
        else
            types = "restaurant,bar,cafe,fast_food";

        console.log(restaurants);

        $.get('http://localhost:3000/api/near-restaurants', { lat:lat, lng: long, radius:radius, types: types }, function(data) {
            console.log(data);

            if(restaurantsLayer!=null){
                mymap.removeLayer(restaurantsLayer);
                layerControl.removeLayer(restaurantsLayer)
            }

            restaurantsLayer = L.geoJSON(data, { pointToLayer: function (feature, latlng) {
                    let name = feature.properties.name;
                    let distance = feature.properties.st_distance;
                    let amenity = feature.properties.amenity;
                    let icon;

                    if(amenity == "restaurant")
                        icon = restaurantIcon;
                    else if(amenity == "bar")
                        icon = pubIcon;
                    else if(amenity == "fast_food")
                        icon = fastFoodIcon;
                    else if(amenity == "cafe")
                        icon = cafeIcon;

                    let marker = L.marker(latlng, {icon}).bindPopup('<div>Name: '+name+'\n</div> Distance: '+distance+' m');

                    marker.on('click',markerOnClick);
                    function markerOnClick(e) {
                        console.log(e.sourceTarget.feature.properties.osm_id);
                        selectedOsmId = e.sourceTarget.feature.properties.osm_id;
                    }

                    return marker;
                }}).addTo(mymap);

            layerControl.addOverlay(restaurantsLayer,"restaurants");
        });
    }

    function getAreaRestaurants() {
        let restaurants = $("#restaurants").is(':checked');
        let bars = $("#bars").is(':checked');
        let fast_foods = $("#fast-foods").is(':checked');
        let cafes = $("#cafes").is(':checked');

        let district = $("#districts").val();
        let types = "";

        if(restaurants){
            types = types + "restaurant,";
        }
        if(bars){
            types = types + "bar,";
        }
        if(fast_foods){
            types = types + "fast_foods,";
        }
        if(cafes){
            types = types + "cafe,";
        }
        if(types.length>1)
            types = types.substring(0, types.length - 1);
        else
            types = "restaurant,bar,cafe,fast_food";

        $.get('http://localhost:3000/api/district-restaurants', { district:district, types: types }, function(data) {
            console.log(data);

            if(restaurantsLayer!=null){
                mymap.removeLayer(restaurantsLayer);
                layerControl.removeLayer(restaurantsLayer)
            }

            restaurantsLayer = L.geoJSON(data, { pointToLayer: function (feature, latlng) {
                    let name = feature.properties.name;
                    let amenity = feature.properties.amenity;
                    let rating = feature.properties.rating_avg;
                    let rating_count = feature.properties.rating_count;
                    // let icon;
                    //
                    // if(amenity == "restaurant")
                    //     icon = restaurantIcon;
                    // else if(amenity == "bar")
                    //     icon = pubIcon;
                    // else if(amenity == "fast_food")
                    //     icon = fastFoodIcon;
                    // else if(amenity == "cafe")
                    //     icon = cafeIcon;

                    // let marker = L.marker(latlng, {icon}).bindPopup('<div>Name: '+name+'\n</div>');

                    let icon = defaultIcon0;
                    if(rating > 4)
                        icon = defaultIcon4;
                    else if (rating>3)
                        icon = defaultIcon3;
                    else if (rating>2)
                        icon=defaultIcon2;
                    else if(rating>1)
                        icon=defaultIcon1;

                    var marker = L.marker(latlng, {icon, riseOnHover:true}).bindPopup('<div>Name: '+name+'\n</div><div>Rating: '+rating+'\n</div><div>Amenity: '+amenity+'\n</div><div>Rating count: '+rating_count+'\n</div>');
                    // var icon = marker.options.icon;
                    // // icon.options.iconSize = [20*((rating+1)/3),30*((rating+1)/3)];
                    // icon.options.iconSize = [rating*10, rating*12];
                    // marker.setIcon(icon);

                    marker.on('click',markerOnClick);
                    function markerOnClick(e) {
                        console.log(e.sourceTarget.feature.properties.osm_id);
                        selectedOsmId = e.sourceTarget.feature.properties.osm_id;
                    }

                    return marker;
                }}).addTo(mymap);

            layerControl.addOverlay(restaurantsLayer,"restaurants");
        });
    }

    function showBestDistricts(){
        $.get('http://localhost:3000/api/districts-average', {}, function(data) {

            districtLayer = L.geoJSON(data,
                {
                    style: style,
                    onEachFeature: onEachFeature
                },
                { pointToLayer: function (feature, latlng) {
                    let name = feature.properties.district;
                    let marker = L.marker(latlng).bindPopup('<div>Name: '+name+'\n</div>');
                    return marker;
                }}).addTo(mymap);

            console.log(data);
        });
        layerControl.addOverlay(districtLayer,"districts");
    }


    function getParkingsPolygons() {
        let limit = $("#limit").val();

        console.log(lat);
        if (limit == "" || selectedOsmId == null) {
            alert("Please select a restaurant and a limit");
            return;
        }

        if(parkingsLayer!=null){
            mymap.removeLayer(parkingsLayer);
            layerControl.removeLayer(parkingsLayer)
        }

        $.get('http://localhost:3000/api/near-parking-spots', {id: selectedOsmId, limit: limit}, function (data) {
            parkingsLayer = L.geoJSON(data,
                { pointToLayer: function (feature, latlng) {
                    let name = feature.properties.name;
                    let marker = L.marker(latlng).bindPopup('<div>Name: '+name+'\n</div>');
                    return marker;
                }}).addTo(mymap);

            console.log(data);
        });
        layerControl.addOverlay(parkingsLayer,"parkings");

    }

    //FROM TUTORIAL view-source:https://leafletjs.com/examples/choropleth/example.html:
    function getColor(d) {
        return d > 4 ? '#800026' :
            d > 3.5  ? '#BD0026' :
                d > 3  ? '#E31A1C' :
                    d > 2.5  ? '#FC4E2A' :
                        d > 2   ? '#FD8D3C' :
                            d > 1.5   ? '#FEB24C' :
                                d > 1   ? '#FED976' :
                                    '#FFEDA0';
    }

    function style(feature) {
        return {
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7,
            fillColor: getColor(feature.properties.rating_average)
        };
    }

    function highlightFeature(e) {
        var layer = e.target;

        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        info.update(layer.feature.properties);
    }

    function resetHighlight(e) {
        districtLayer.resetStyle(e.target);
        info.update();
    }

    function zoomToFeature(e) {
        mymap.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }

    function clearMap(){
        mymap.removeLayer(restaurantsLayer);
        layerControl.removeLayer(restaurantsLayer);

        mymap.removeLayer(parkingsLayer);
        layerControl.removeLayer(parkingsLayer);

        mymap.removeLayer(districtLayer);
        layerControl.removeLayer(districtLayer);
    }


    function getAreas() {
        $.get('http://localhost:3000/api/districts', {}, function (data) {
            console.log(data);
            for (let i = 0; i<data.length; i++){
                $("#districts").append(new Option(data[i].name, data[i].name));
            }
        });
    }

    function getDistrictPolygon(){
        let district = $("#districts").val();

        if(districtLayer!=null){
            mymap.removeLayer(districtLayer);
            layerControl.removeLayer(districtLayer);
        }

        $.get('http://localhost:3000/api/district', {district: district}, function (data) {
            console.log(data);
            districtLayer = L.geoJSON(data, {color: "#ff7800", weight: 1}, { pointToLayer: function (feature, latlng) {
                    let name = feature.properties.name;
                    let marker = L.marker(latlng).bindPopup('<div>Name: '+name+'\n</div>');
                    return marker;
                }}).addTo(mymap);

        });
        layerControl.addOverlay(districtLayer,"districts");
    }

    //Unused
    function getZomato(){
        $.get('http://localhost:3000/api/zomato', {}, function(data) {
            var points = [];
            for (let i = 0; i<data.features.length; i++) {

                helpArray = [];
                helpArray.push(data.features[i].geometry.coordinates[0]);
                helpArray.push(data.features[i].geometry.coordinates[1]);
                // helpArray.push(data.features[i].properties.rating_avg);
                helpArray.push(1);
                points.push(helpArray);
            }
            console.log(data);
            console.log(points);
            var heat = L.heatLayer(points, {radius: 25}).addTo(mymap);

        });
    }
});

