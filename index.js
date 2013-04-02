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
    webAssetDir: __dirname + '/public',
    menuName: 'aposEventsMenu'
  });

  options.dirs = (options.dirs || []).concat([ __dirname ]);

  snippets.Snippets.call(this, options, null);
  
  function appendExtraFields(req, snippet, callback) {
    // shove the raw address into the snippet object on its way to mongo
    snippet.address = req.body.address;
    snippet.descr = req.body.descr;
    snippet.clickthrough = req.body.clickthrough;

    snippet.startDate = req.body.startDate;
    var startDateMoment = moment(req.body.startDate);
    snippet.startMonth = startDateMoment.format('MMM');
    snippet.numberMonth = startDateMoment.format('M');
    snippet.startDay = startDateMoment.format('DD')

    snippet.startTime = req.body.startTime;
    snippet.endDate = req.body.endDate;
    snippet.endTime = req.body.endTime;

    snippet.isFeatured = false;

    for(var t in snippet.tags) {
      if(snippet.tags[t] == "featured") {
        console.log(t);
        snippet.isFeatured = true;
        break;
      }
    }

    callback();
  }

  self.beforeInsert = function(req, snippet, callback) {
    appendExtraFields(req, snippet, callback);
  };

  self.beforeUpdate = function(req, snippet, callback) {
    appendExtraFields(req, snippet, callback);
  }

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


    //sort them by date.
    criteria.sort = {"startDate": 1};
    //add in the normal criteria
    self.addCriteria(req, criteria);

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

  self.getDefaultTitle = function() {
    return 'My Event';
  };

  process.nextTick(function() { return callback(null); });
}
