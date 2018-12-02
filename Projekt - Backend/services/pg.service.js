var promise = require('bluebird');
var options = {
    promiseLib: promise
};

var pgp = require('pg-promise')(options);
var addressPg = 'postgres://test:1234@localhost:5432/gis-bratislava';
var db = pgp(addressPg);

var GeoJSON = require('geojson');
var GeoJsonUtil = require('../tools/GeoJSON.util');

function getNearRestaurants(req, res, next){
    let latitude = req.query.lat;
    let longtitude = req.query.lng;
    let radius = req.query.radius;
    let types = req.query.types;

    let filter = getTypesFilter(types, 1);

    db.any("WITH places as " +
        "(SELECT name, osm_id, amenity, st_distance(\n" +
        "ST_GeographyFromText('SRID=4326;POINT("+longtitude+" "+latitude+")'),\n" +
        "ST_Transform(way,4326)::geography), \n" +
        "ST_x(ST_Transform(way,4326)) as x,\n" +
        "ST_y(ST_Transform(way,4326)) as y\n" +
        "from spots_points\n" +
        "WHERE st_distance(\n" +
        "ST_GeographyFromText('SRID=4326;POINT("+longtitude+" "+latitude+")'),\n" +
        "ST_Transform(way,4326)::geography)<"+radius+"\n" +
        "AND ("+filter+") AND name!=''\n" +
        "UNION ALL\n" +
        "SELECT name, osm_id, amenity, st_distance(\n" +
        "ST_GeographyFromText('SRID=4326;POINT("+longtitude+" "+latitude+")'),\n" +
        "ST_Transform(way,4326)::geography),\n " +
        "ST_x(ST_Transform(ST_Centroid(way),4326)) as x,\n" +
        "ST_y(ST_Transform(ST_Centroid(way),4326)) as y \n" +
        "FROM spots_polygons\n" +
        "WHERE st_distance(\n" +
        "ST_GeographyFromText('SRID=4326;POINT("+longtitude+" "+latitude+")'),\n" +
        "ST_Transform(way,4326)::geography)<"+radius+"\n" +
        "AND ("+filter+") AND name!=''\n" +
        ")\n" +
        "SELECT * FROM places ORDER by st_distance")
        .then(function(data){
            console.log(data);
            let result = GeoJSON.parse(data, {Point: ['y', 'x']});
            res.status(200).json(result);
        })
        .catch(function(err){
            return next(err);
        });
}

/**
 * Returns n-closest parking spots polygons to restaurant with id
 * @param req - req.query.id - ID restauracie, req.query.limit - limit od displayed parking spots
 * @param res
 * @param next
 */
function getCloseParkingSpots(req, res, next){
    let id = req.query.id;
    let limit = req.query.limit;

    let query =
        "WITH restaurants AS\n" +
        "(\n" +
        "SELECT osm_id, name, way FROM spots_points WHERE osm_id IN ("+id+")\n" +
        "UNION ALL\n" +
        "SELECT osm_id, name, way FROM spots_polygons WHERE osm_id IN ("+id+")\n" +
        "),\n" +
        "parkings AS\n" +
        "(\n" +
        "SELECT osm_id,name,way FROM parkings_polygons\n" +
        "),\n" +
        "distances AS\n" +
        "(\n" +
        "SELECT p.osm_id, ST_DISTANCE(ST_Transform(r.way,26986),ST_Transform(p.way,26986)) FROM restaurants r, parkings p\n" +
        "),\n" +
        "closest AS\n" +
        "(\n" +
        "SELECT osm_id, SUM(st_distance) from distances\n" +
        "GROUP BY osm_id\n" +
        "ORDER BY SUM(st_distance) ASC\n" +
        "LIMIT "+limit+"\n" +
        ")" +
        "SELECT osm_id, name, ST_AsGeoJSON(ST_Transform(way, 4326))\t\t\t\t\t\t \n" +
        "FROM ((SELECT osm_id,way, name \n" +
        "FROM parkings\n" +
        "WHERE osm_id IN \n" +
        "(SELECT osm_id \n" +
        "from closest LIMIT 1))\n" +
        "UNION ALL\n" +
        "(SELECT osm_id,way, name \n" +
        "FROM parkings\n" +
        "WHERE osm_id IN (SELECT osm_id \n" +
        "FROM closest OFFSET 1))\n" +
        ") as querina";

    db.any(query)
        .then(function(data){
            console.log(data);
            let properties = ["name", "osm_id"];
            let result = GeoJsonUtil.createGeoJSONpolygon(data, properties);
            res.status(200).json(result);
        })
        .catch(function(err){
            return next(err);
        });
}

function getDistricts(req, res, next){
    db.any("SELECT DISTINCT name FROM planet_osm_polygon \n" +
        "WHERE boundary like 'administrative' AND name IS NOT null\n" +
        "ORDER by name")
        .then(function(data){
            res.status(200).json(data);
        })
        .catch(function(err){
            return next(err);
        });
}

function getDistrictGeoJson(req, res, next){
    let district = req.query.district;

    db.any("SELECT name, ST_AsGeoJSON(ST_Transform(way, 4326)) FROM planet_osm_polygon \n" +
        "WHERE boundary like 'administrative' AND name LIKE '"+district+"'\n" +
        "ORDER by name")
        .then(function(data){
            let properties = ["name"];
            let result = GeoJsonUtil.createGeoJSONpolygon(data, properties);

            res.status(200).json(result);
        })
        .catch(function(err){
            return next(err);
        });
}

function getDistrictRestaurants(req, res, next){
    let district = req.query.district;

    db.any("SELECT name, x, y, rating_avg, rating_count, amenity\n" +
        "FROM\n" +
        "(\n" +
        "SELECT ST_CONTAINS(ST_Transform(poly.way,4326), restaurants.path) AS intersects, restaurants.name, ST_x(ST_Transform(restaurants.path,4326)) as x, ST_y(ST_Transform(restaurants.path,4326)) as y, rating_avg, rating_count,restaurants.amenity\n" +
        "FROM planet_osm_polygon as poly\n" +
        "CROSS JOIN restaurants\n" +
        "WHERE poly.name LIKE '"+district+"'\n" +
        ") as districts\n" +
        "WHERE intersects=true and districts.name is not null")
        .then(function(data){
            console.log(data);
            let result = GeoJSON.parse(data, {Point: ['y', 'x']});
            res.status(200).json(result);
        })
        .catch(function(err){
            return next(err);
        });
}

function getZomato(req, res, next){

    let query = "SELECT name, rating_avg, rating_count, amenity, ST_x(ST_Transform(path, 4326)) AS x, ST_y(ST_Transform(path, 4326)) AS y FROM restaurants\n";
    db.any(query)
        .then(function(data){
            let result = GeoJSON.parse(data, {Point: ['y', 'x']});
            res.status(200).json(result);
            // res.status(200).json(data);
        })
        .catch(function(err){
            return next(err);
        });
}

function getTypesFilter(types, api){
    let filter = "";
    let amenity;
    if(api == 1){
        amenity = "amenity";
    }
    else{
        amenity = "restaurants.amenity";
    }

    if(types.includes("restaurant")){
        filter = amenity+" = 'restaurant'";
    }
    if(types.includes("bar")){
        if(filter.length > 0)
            filter = filter + "OR "+amenity+" = 'bar'";
        else
            filter = amenity+" = 'bar'";
    }
    if(types.includes("cafe")){
        if(filter.length > 0)
            filter = filter + "OR "+amenity+" = 'cafe'";
        else
            filter = amenity+" = 'cafe'";
    }
    if(types.includes("fast_food")){
        if(filter.length > 0)
            filter = filter + "OR "+amenity+" = 'fast_food'";
        else
            filter = amenity+" = 'fast_food'";
    }
    return filter;
}

function getDistrictsAverage(req, res, next){
    var query = "SELECT district, st_asgeojson, sum(rating_avg * rating_count) / (sum(rating_count)+1) as rating_average\n" +
        "FROM\n" +
        "(\n" +
        "SELECT st_intersects(ST_Transform(poly.way,4326), restaurants.path) AS intersects, poly.name as district, restaurants.name, rating_avg, rating_count, ST_AsGeoJSON(ST_Transform(way, 4326)) AS st_asgeojson\n" +
        "FROM administrative_polygons as poly\n" +
        "CROSS JOIN restaurants\n" +
        "WHERE poly.admin_level LIKE '10'\n" +
        ") as districts\n" +
        "WHERE intersects=true and districts.name is not null\n" +
        "GROUP BY district, st_asgeojson";

    db.any(query)
        .then(function(data){
            console.log(data);
            let properties = ["district", "rating_average"];
            let result = GeoJsonUtil.createGeoJSONpolygon(data, properties);
            res.status(200).json(result);
        })
        .catch(function(err){
            return next(err);
        });

}


module.exports = {
    getNearRestaurants: getNearRestaurants,
    getDistrictRestaurants: getDistrictRestaurants,
    getNearParkingSpots: getCloseParkingSpots,
    getDistricts: getDistricts,
    getDistrictGeoJson: getDistrictGeoJson,
    getZomato: getZomato,
    getDistrictAverage: getDistrictsAverage

};
