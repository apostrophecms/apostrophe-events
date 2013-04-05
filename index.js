var async = require('async');
var _ = require('underscore');
var extend = require('extend');
var snippets = require('apostrophe-snippets');
var moment = require('moment');

module.exports = events;

function events(options, callback) {
  return new events.Events(options, callback);
}

events.Events = function(options, callback) {
  var self = this;

  _.defaults(options, {
    instance: 'event',
    name: options.name || 'events',
    label: options.name || 'Events',
    webAssetDir: __dirname,
    menuName: 'aposEventsMenu'
  });

  options.dirs = (options.dirs || []).concat([ __dirname ]);

  snippets.Snippets.call(this, options, null);

  function appendExtraFields(data, snippet, callback) {
    // shove the raw address into the snippet object on its way to mongo
    snippet.address = data.address;
    snippet.descr = data.descr;
    snippet.clickthrough = data.clickthrough;

    snippet.startDate = data.startDate;
    var startDateMoment = moment(data.startDate);
    snippet.startMonth = startDateMoment.format('MMM');
    snippet.numberMonth = startDateMoment.format('M');
    snippet.startDay = startDateMoment.format('DD');

    snippet.startTime = data.startTime;
    snippet.endDate = data.endDate;
    snippet.endTime = data.endTime;

    snippet.isFeatured = false;

    for(var t in snippet.tags) {
      if(snippet.tags[t] == "featured") {
        // console.log(t);
        snippet.isFeatured = true;
        break;
      }
    }
  
    return callback();
  }

  self.beforeInsert = function(req, data, snippet, callback) {
    appendExtraFields(data, snippet, callback);
  };

  self.beforeUpdate = function(req, data, snippet, callback) {
    appendExtraFields(data, snippet, callback);
  };

  self.dispatch = function(req, callback) {
    var permalink = false;
    var criteria = {};
    
    if (req.remainder.length) {
      var byMonth = req.remainder.match(/month/);
      if(byMonth) {
        //get everything after "/month/". it will be looking for a month number
        var start = req.remainder.substr(7);
        criteria.numberMonth = start;

        //use moment to convert that number into a pretty string
        var prettyMonth = moment().month(criteria.numberMonth -1).format('MMMM');
        req.extras.activeMonth = prettyMonth;
      } else {
        //we're trying to get a slug/permalink
        criteria.slug = req.remainder.substr(1);
        permalink = true;
      }
    } else {
      //it's just a regular old index page so lets render the current month.
      var now = moment().format('M');
      criteria.numberMonth = now;
      var prettyMonth = moment().month(criteria.numberMonth -1).format('MMMM');
      req.extras.activeMonth = prettyMonth;
    }

    //set up the next and previous urls for our "pagination"
    req.extras.nextMonth = (parseInt(criteria.numberMonth) + 1 > 12 ? 1 : parseInt(criteria.numberMonth) + 1);
    req.extras.prevMonth = (parseInt(criteria.numberMonth) - 1 < 1 ? 12 : parseInt(criteria.numberMonth) - 1);

    self.get(req, criteria, function(err, snippets) {
      if (err) {
        return callback(err);
      }
      if (permalink) {
        if (!snippets.length) {
          req.template = 'notfound';
        } else {
          req.template = self.renderer('show');
          // Generic noun so we can more easily inherit templates
          req.extras.item = snippets[0];
        }
      } else {
        req.template = self.renderer('index');
        // Generic noun so we can more easily inherit templates
        req.extras.items = snippets;
      }


      //THIS IS WHERE I AM GRABBING THE LIST OF ALL TAGS ASSOCIATED WITH EVENTS. I NEED TO REPLICATE THIS WITH MAPS
      self._apos.pages.distinct("tags", {"type":"event"}, function(err, tags){
        req.extras.allTags = tags;

        // THIS IS THE FINAL CALLBACK THAT TRIGGERS THE RENDERING AND WHATNOT... IT IS IMPORTANT
        return callback(null);
      });
    });
  };

  // Establish the default sort order for events
  var superGet = self.get;
  self.get = function(req, optionsArg, callback) {
    var options = {};
    // "Why copy the object like this?" If we don't, we're modifying the
    // object that was passed to us, which could lead to side effects
    extend(options, optionsArg || {}, true);
    if (!options.sort) {
      options.sort = { startDate: 1, startTime: 1 };
    }
    return superGet.call(self, req, options, callback);
  };

  self.getDefaultTitle = function() {
    return 'My Event';
  };

  if (callback) {
    process.nextTick(function() { return callback(null); });
  }
};

