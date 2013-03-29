var async = require('async');
var _ = require('underscore');
var extend = require('extend');
var snippets = require('apostrophe-snippets');
var moment = require('moment');
var geocoder = require('geocoder');

module.exports = events;

function events(options, callback) {
  return new events.Events(options, callback);
}

events.Events = function(options, callback) {
  var self = this;

  _.defaults(options, {
    instance: 'event',
    name: options.name || 'event',
    label: options.name || 'Event',
    webAssetDir: __dirname + '/public',
    menuName: 'aposEventsMenu'
  });

  options.dirs = (options.dirs || []).concat([ __dirname ]);

  snippets.Snippets.call(this, options, null);
  var superDispatch = self.dispatch;

  function appendExtraFields(data, snippet, callback) {
    //shove the raw address into the snippet object on its way to mongo
    // snippet.address = data.address;
    // snippet.hours = data.hours;
    // snippet.descr = data.descr;
    // snippet.locType = data.locType;

    // use geocoder to generate a lat/long for the address and shove that in the snippet too
    // geocoder.geocode(req.body.address, function ( err, coords ) {
    //   if(!err) {
    //     snippet.coords = coords.results[0].geometry.location;
    //     return callback();
    //   } else {
    //     console.log(err);
    //     return callback(err);
    //   }
    // });

    return callback();
  }

  self.beforeInsert = function(req, data, snippet, callback) {
    appendExtraFields(data, snippet, callback);
  };

  self.beforeUpdate = function() {
    appendExtraFields(data, snippet, callback);
  };

  self.dispatch = function(req, callback) {
    superDispatch.call(this, req, callback);
  };

  self.getDefaultTitle = function() {
    return 'My Event';
  };

  process.nextTick(function() { return callback(null); });
}
