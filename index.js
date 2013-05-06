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
    menuName: 'aposEventsMenu'
  });

  options.modules = (options.modules || []).concat([ { dir: __dirname, name: 'events' } ]);

  // "They set options.widget to true, so they are hoping for a standard
  // events widget constructor."
  if (options.widget && (typeof(options.widget) !== 'function')) {
    options.widget = events.widget;
  }

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

    // Make sure we call addCriteria to get things like tag filtering
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
          snippets[0].url = self.permalink(snippets[0], req.bestPage);
          // Generic noun so we can more easily inherit templates
          req.extras.item = snippets[0];
        }
      } else {
        req.template = self.renderer('index');
        // Generic noun so we can more easily inherit templates
        req.extras.items = snippets;
        _.each(snippets, function(snippet) {
          snippet.url = self.permalink(snippet, req.bestPage);
        });
      }


      //THIS IS WHERE I AM GRABBING THE LIST OF ALL TAGS ASSOCIATED WITH EVENTS.
      var criteria = { type: 'event' };
      // Limit the query for distinct tags to tags that this page is interested in
      if (req.page.typeSettings.tags.length) {
        criteria.tags = { $in: req.page.typeSettings.tags };
      }
      self._apos.pages.distinct("tags", criteria, function(err, tags){
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
    extend(true, options, optionsArg || {});
    if (!options.sort) {
      // start is always a Date object, suitable for sorting
      options.sort = { start: 1 };
    }
    if (options.upcoming) {
      options.start = { $gte: new Date() };
      delete options.upcoming;
    }
    return superGet.call(self, req, options, function(err, results) {
      if (err) {
        return callback(err);
      }
      // Make it easy for templates and other code to identify events that
      // are entirely in the future, entirely in the past, and happening right now
      var now = new Date();
      _.each(results, function(result) {
        var end = result.end || result.start;
        if (end === result.start) {
          // If the start and end times are the same assume the event lasts a day
          end.setDate(end.getDate() + 1);
        }
        if (result.start > now) {
          result._future = true;
        }
        if (end < now) {
          result._past = true;
        }
        if ((result.start < now) && (end >= now)) {
          result._present = true;
        }
      });
      return callback(null, results);
    });
  };

  self.getDefaultTitle = function() {
    return 'My Event';
  };

  // TODO this is not very i18n friendly
  self.getAutocompleteTitle = function(snippet) {
    return snippet.title + ' (' + snippet.numberMonth + '/' + snippet.startDay + ')';
  };

  // I bet you want some extra fields available along with the title to go with
  // your custom getAutocompleteTitle. Override this to retrieve more stuff.
  // We keep it to a minimum for performance. start and end are important for
  // comparability and classification
  self.getAutocompleteFields = function() {
    return { title: 1, _id: 1, numberMonth: 1, startDay: 1, start: 1, end: 1 };
  };

  // Autocomplete should not show past events, it makes it very hard to find
  // any upcoming events
  var superAddExtraAutocompleteCriteria = self.addExtraAutocompleteCriteria;
  self.addExtraAutocompleteCriteria = function(req, criteria) {
    superAddExtraAutocompleteCriteria.call(self, req, criteria);
    criteria.upcoming = true;
  };

  if (callback) {
    process.nextTick(function() { return callback(null); });
  }
};

// Subclass the widget constructor to enhance the criteria
events.widget = function(options) {
  var self = this;
  snippets.widget.Widget.call(self, options);
  var superAddCriteria = self.addCriteria;
  self.addCriteria = function(item, criteria) {
    superAddCriteria.call(self, item, criteria);
    criteria.upcoming = true;
  };
};
