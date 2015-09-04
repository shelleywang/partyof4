// locations.js
var config = require('../config/config.js');

var https  = require('https');

/*
 * Stores venue information in the Location table
 */
var storeVenues = function(req, locations) {
  var models = req.app.get('models');
  var Location = models.Location;

  Location.sync().then(function() {
    locations.forEach(function(loc) {
      Location.findOne({where: {fourSquareId: loc.locationId}})
      .then(function(location) {
        if (!location) {
          var price = loc.price ? loc.price.tier : 0;
          Location.create({
            fourSquareId: loc.locationId,
            name: loc.name,
            address: {street: loc.location[0],
                      city: loc.location[1],
                      country: loc.location[2]},
            price: price,
            longitude: loc.coords.latitude,
            latitude: loc.coords.longitude,
            tags: loc.tags,
          });
        }
      });
    });
  });
};

/*
 * Formats the response from the Foursquare API 
 */
var formatLocationRes = function(location) {
  var tags = [];
  location.categories.forEach(function(category) {
    tags.push(category.name);
  });
  var price = location.price ? location.price.tier : 0;
  return {
    "locationId": location.id,
    "name": location.name,
    "location": location.location.formattedAddress,
    "distance": location.location.distance,
    "price": price,
    "tags": tags,
    "coords": {
      "latitude": location.location.lat,
      "longitude": location.location.lng
    }
  };
};

/*
 * Creates the http request object for the Foursquare API call
 */
var createFoursquareReq = function(type,params) {
  var lat = params.latitude;
  var long = params.longitude;
  var query = params.q;
  var radius = (params.radius) ? params.radius : ((type === 'all') ? 1000 : 2000);
  var version = 20150903;

  var url = '/v2/venues/explore?client_id='+config.foursquareId+'&client_secret='+config.foursquareSecret+
            '&ll='+lat+','+long+'&v='+version+'&radius='+radius+'&openNow=1';

  if (type === 'search') {
    url = url+'&query='+query;
  } else if (type === 'all') {
    url = url+'&section=food&limit=50';
  }

  return {
    host: 'api.foursquare.com',
    path: url,
    port: 443,
    method: 'GET'
  };
};


module.exports = {
  getLocations: function(req,res){

    // Hack Reactor coordinates for testing
    // var lat = 37.7837418;
    // var long = -122.4089911;
    var lat = req.query.latitude;
    var long = req.query.longitude;
    var searchTerm = req.query.q;
    var typeOfReq = searchTerm ? 'search' : 'all';

    if (!(lat && long)) {
      res.status(400).send('Invalid request - include latitude and longitude in URL parameters').end();
    } else if ((lat < -90 || lat > 90) || (long < -180 || long > 180)) {
      res.status(400).send('Invalid request - latitide and longitude must be valid.' +
                           '(-90 < latitude < 90 and -180 < longitude < 180)').end();
    } else if (config.foursquareId === '' || config.foursquareSecret === '') {
      res.status(500).send('Foursquare API misconfigured - please contact partyof4 administrator').end();
    } else {
      https.request(createFoursquareReq(typeOfReq,req.query), function(foursquareRes) {
        var responseBody ='';
        foursquareRes.on('data', function (chunk) {
          responseBody += chunk;
        });

        foursquareRes.on('end', function () {
          if (JSON.parse(responseBody).response) {
            var responseArr = JSON.parse(responseBody).response.groups[0].items;

            var locations = responseArr.map(function(item) {
              return formatLocationRes(item.venue);
            });

            storeVenues(req, locations);
            res.status(200).send({'locations':locations}).end();
          } else {
            res.status(500).send('Unexpected server error - please contact partyof4 administrator').end();
          }
        });
      }).end();
    }
  }
};