var async = require('async');
var _ = require('underscore');
var extend = require('extend');
var snippets = require('apostrophe-snippets');
var moment = require('moment');
var qs = require('qs');

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

  // TODO this is kinda ridiculous. We need to have a way to call a function that
  // adds some routes before the static route is added. Maybe the static route should
  // be moved so it can't conflict with anything.
  if (!options.addRoutes) {
    options.addRoutes = addRoutes;
  } else {
    var superAddRoutes = options.addRoutes;
    options.addRoutes = function() {
      addRoutes();
      superAddRoutes();
    };
  }

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

  self._apos.addLocal('aposEventGoogle', function(e) {
    var s = 'http://www.google.com/calendar/event?' + qs.stringify({
      text: e.title,
      dates: self.getUTCDateRange(e),
      action: 'TEMPLATE',
      location: e._place ? e._place.address : e.address,
      details: self._apos.getAreaPlaintext({ area: e.areas.body, truncate: 500 })
    });
    return s;
  });

  self.getUTCDateRange = function(e) {
    return self.getVCalTimestamp(e.start) + '/' + self.getVCalTimestamp(e.end);
  };

  self.getVCalTimestamp = function(t) {
    return moment(t).utc().format('YYYYMMDD[T]HHmmss[Z]');
  };

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
    var year, month, day;
    if (req.remainder.length) {
      var byDate = req.remainder.match(/^\/(\d+)(\/(\d+))?(\/(\d+))?$/);
      if (byDate) {
        year = byDate[1];
        month = byDate[3];
        day = byDate[5];
      } else {
        //we're trying to get a slug/permalink
        criteria.slug = req.remainder.substr(1);
        permalink = true;
      }
    }
    if (!permalink) {
      // Create 'from' and 'to' dates in YYYY-MM-DD format for mongodb criteria
      if (!year) {
        // Default to current month
        year = moment().format('YYYY');
        month = moment().format('MM');
        req.extras.defaultView = true;
      }
      if (!month) {
        // Default to January of the year specified
        month = '01';
      }
      fromDate = pad(year, 4) + '-' + pad(month, 2) + '-01';
      toDate = pad(year, 4) + '-' + pad(month, 2) + '-31';

      // Must start before the end of the range
      criteria.startDate = { $lte: toDate };
      // Must not end before the beginning of the range
      criteria.endDate = { $gte: fromDate };

      // For displaying the active month and year
      req.extras.activeYear = pad(year, 4);
      req.extras.activeMonth = pad(month, 2);

      // set up the next and previous urls for our "pagination"
      var nextYear = year;
      var nextMonth = parseInt(month, 10) + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = parseInt(nextYear, 10) + 1;
      }
      nextMonth = pad(nextMonth, 2);
      req.extras.next = nextYear + '/' + nextMonth;
      var prevYear = year;
      var prevMonth = parseInt(month, 10) - 1;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear = parseInt(nextYear, 10) - 1;
      }
      prevMonth = pad(prevMonth, 2);
      req.extras.prev = prevYear + '/' + prevMonth;

    }

    function pad(s, n) {
      return self._apos.padInteger(s, n);
    }

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

  function addRoutes() {
    self._app.get(self._action + '/vcal', function(req, res) {
      var slug = req.query.slug;
      self.get(req, { slug: slug }, function(err, pages) {
        if (err) {
          res.statusCode = 500;
          return res.send('error');
        }
        if (!pages.length) {
          res.statusCode = 404;
          return res.send('not found');
        }
        var event = pages[0];
        res.setHeader('Content-type', 'text/x-vcalendar');
        res.setHeader('Content-disposition', slug + '.vcs');
        var start = self.getVCalTimestamp(event.start);
        var end = self.getVCalTimestamp(event.end);
        var title = self.textToVcal(event.title);
        var body = self.textToVcal(self._apos.getAreaPlaintext({ area: event.areas.body }));
        var location = self.textToVcal(self.getEventAddress(event));
        var uid = event._id;
        // A hack because we don't have publication dates for events (so far)
        var publishedAt = self.getVCalTimestamp(new Date());
        return res.send('BEGIN:VCALENDAR\n' +
          'PRODID:-//punkave//apostrophe 2.x//EN\n' +
          'VERSION:1.0\n' +
          'TZ:0\n' +
          'BEGIN:VEVENT\n' +
          'CATEGORIES:MEETING\n' +
          'DTSTART:' + start + '\n' +
          'DTEND:' + end + '\n' +
          'DTSTAMP:' + publishedAt + '\n' +
          'SUMMARY:' + title + '\n' +
          'DESCRIPTION:' + body + '\n' +
          'LOCATION:' + location + '\n' +
          'UID:' + uid + '\n' +
          'END:VEVENT\n' +
          'END:VCALENDAR\n');
      });
    });
  }

  // Can be overridden if you are associating events with places differently.
  // Should return a string with the full street address
  self.getEventAddress = function(event) {
    return event.location;
  };

  self.textToVcal = function(s) {
    s += '';
    // vcal is fairly picky. Avoid a lot of problems by
    // simplifying whitespace
    s = s.replace(/ \n\r/g, ' ');
    // Expressly must be escaped in vcal
    s = s.replace(/;/g, '\\;');
    s = s.trim();
    return s;
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
