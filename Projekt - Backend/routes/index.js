var express = require('express');
var router = express.Router();
var db = require('../services/pg.service');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Welcome to API' });
});

router.get('/near-restaurants', db.getNearRestaurants);
router.get('/district-restaurants', db.getDistrictRestaurants);
router.get('/near-parking-spots', db.getNearParkingSpots);
router.get('/districts', db.getDistricts);
router.get('/district', db.getDistrictGeoJson);
router.get('/zomato', db.getZomato);
router.get('/districts-average', db.getDistrictAverage);


module.exports = router;
