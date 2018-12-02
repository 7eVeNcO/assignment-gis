function createGeoJSONpolygon(data, properties){
    let json = {};
    json.type = "FeatureCollection";
    json.features = [];

    for( let i = 0; i < data.length; i++){
        let innerJson = {};
        innerJson.type = "Feature";
        innerJson.properties = getProperties(data[i], properties);
        innerJson.geometry = JSON.parse(data[i].st_asgeojson.replace('\\',''));

        json.features.push(innerJson);
    }
    return json;
}

function getProperties(data, properties){
    let result = {};
    for( let i = 0; i < properties.length; i++){
        result[properties[i]] = data[properties[i]];
    }
    console.log(result);
    return result;
}

module.exports = {
    createGeoJSONpolygon: createGeoJSONpolygon
};