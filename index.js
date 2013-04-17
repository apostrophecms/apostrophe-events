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
    icon: options.icon || 'events',
    webAssetDir: __dirname,
    menuName: 'aposEventsMenu'
  });

  options.dirs = (options.dirs || []).concat([ __dirname ]);

  snippets.Snippets.call(this, options, null);

  function appendExtraFields(data, snippet, callback) {
    // Be tolerant of common field names
    snippet.address = self._apos.sanitizeString(data.address || data.location);
    snippet.descr = self._apos.sanitizeString(data.descr || data.description);
    snippet.link = self._apos.sanitizeString(data.link);

    snippet.startDate = self._apos.sanitizeDate(data.startDate || data.date);
    var startDateMoment;
    try {
      startDateMoment = moment(snippet.startDate);
      snippet.startMonth = startDateMoment.format('MMM');
      snippet.numberMonth = startDateMoment.format('M');
      snippet.startDay = startDateMoment.format('DD');
    } catch(e) {
      console.log("DATE ERROR IS:");
      console.log(e);
      console.log('startDate was:');
      console.log(snippet.startDate);
      console.log("data is:");
      console.log(data);
    }

    snippet.startTime = self._apos.sanitizeTime(data.startTime || data.time, null);
    if (snippet.startTime === null) {
      snippet.start = new Date(snippet.startDate);
    } else {
      snippet.start = new Date(snippet.startDate + ' ' + snippet.startTime);
    }

    snippet.endDate = self._apos.sanitizeDate(data.endDate, snippet.startDate);
    snippet.endTime = self._apos.sanitizeTime(data.endTime, snippet.startTime);
    if (snippet.endTime === null) {
      snippet.end = new Date(snippet.endDate);
    } else {
      snippet.end = new Date(snippet.endDate + ' ' + snippet.endTime);
    }

    return callback();
  }

  var superAddDiffLines = self.addDiffLines;

  // Make sure our custom fields are included in version diffs
  self.addDiffLines = function(snippet, lines) {
    superAddDiffLines(snippet, lines);
    if (snippet.startDate) {
      lines.push('start date: ' + snippet.startDate);
    }
    if (snippet.startTime) {
      lines.push('start time: ' + snippet.startTime);
    }
    if (snippet.endDate) {
      lines.push('start date: ' + snippet.startDate);
    }
    if (snippet.endTime) {
      lines.push('start time: ' + snippet.startTime);
    }
    if (snippet.address) {
      lines.push('address: ' + snippet.address);
    }
    if (snippet.descr) {
      lines.push('description: ' + snippet.descr);
    }
    if (snippet.link) {
      lines.push('link: ' + snippet.link);
    }
  };

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


      //THIS IS WHERE I AM GRABBING THE LIST OF ALL TAGS ASSOCIATED WITH EVENTS.
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
      // start is always a Date object, suitable for sorting
      options.sort = { start: 1 };
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

