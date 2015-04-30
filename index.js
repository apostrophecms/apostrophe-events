var async = require('async');
var _ = require('lodash');
var extend = require('extend');
var snippets = require('apostrophe-snippets');
var moment = require('moment');
var qs = require('qs');
var randy = require('randy');

module.exports = events;

function events(options, callback) {
  return new events.Events(options, callback);
}

events.Events = function(options, callback) {
  var self = this;

  _.defaults(options, {
    instance: 'event',
    name: options.name || 'events',
    instanceLabel: options.instanceLabel || 'Event',
    label: options.label || 'Events',
    icon: options.icon || 'icon-events',
    menuName: 'aposEventsMenu',
    groupFields: [
      {
        name: 'eventDetails',
        label: 'Event Details',
        icon: 'content',
        fields: ['title', 'published', 'startDate', 'startTime', 'endDate', 'endTime', 'address']
      },
      {
        name: 'content',
        label: 'Content',
        icon: 'content',
        fields: ['body', 'thumbnail', 'tags']
      }
    ]
  });

  options.addFields = [
    {
      after: 'title',
      name: 'startDate',
      label: 'Start Date',
      type: 'date',
      // Old, pre-schema field name, do not use this feature in new modules
      legacy: 'start-date'
    },
    {
      name: 'startTime',
      label: 'Start Time',
      type: 'time',
      // Old, pre-schema field name, do not use this feature in new modules
      legacy: 'start-time',
      // We don't want "now" so be explicit that null is OK
      def: null
    },
    {
      name: 'endDate',
      label: 'End Date',
      type: 'date',
      // Old, pre-schema field name, do not use this feature in new modules
      legacy: 'end-date'
    },
    {
      name: 'endTime',
      label: 'End Time',
      type: 'time',
      // Old, pre-schema field name, do not use this feature in new modules
      legacy: 'end-time',
      // We don't want "now" so be explicit that null is OK
      def: null
    },
    {
      end: true,
      name: 'address',
      label: 'Address',
      type: 'string'
    }
  ].concat(options.addFields || []);

  options.removeFields = [
    'hideTitle'
  ].concat(options.removeFields || []);

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

  if (options.widget === undefined) {
    options.widget = true;
  }
  // "They set options.widget to true, so they are hoping for a standard
  // events widget constructor."
  if (options.widget && (typeof(options.widget) !== 'function')) {
    options.widget = events.widget;
  }

  snippets.Snippets.call(this, options, null);

  self._apos.addLocal('aposEventGoogle', function(e) {
    var s = 'http://www.google.com/calendar/event?' + qs.stringify({
      text: e.title,
      dates: self.getUTCDateRange(e),
      action: 'TEMPLATE',
      location: e._place ? e._place.address : e.address,
      details: self._apos.getAreaPlaintext({ area: e.body, truncate: 500 })
    });
    return s;
  });

  var superAddApiCriteria = self.addApiCriteria;
  // Add support for browsing past, future or all events
  self.addApiCriteria = function(query, criteria, options) {
    superAddApiCriteria.call(self, query, criteria, options);
    if (query.date !== undefined) {
      if (query.date === 'past') {
        criteria.startDate = { $lte: moment().format('YYYY-MM-DD') };
        if (!options.sort){
          options.sort = { startDate: -1, sortTitle: 1 };
        }

        return;
      } else if (query.date === 'future') {
        criteria.startDate = { $gte: moment().format('YYYY-MM-DD') };
        if (!options.sort){
          options.sort = { startDate: 1, sortTitle: 1 };
        }
        return;
      } else {
        // Default behavior works for 'all'
      }
    }
    if (!options.sort){
      options.sort = { startDate: -1, sortTitle: 1 };
    }
  };

  self.denormalizeDates = function(snippet) {
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

    if (snippet.startTime === null) {
      // Make sure we specify midnight, if we leave off the time entirely we get
      // midnight UTC, not midnight local time
      snippet.start = new Date(snippet.startDate + ' 00:00:00');
    } else {
      snippet.start = new Date(snippet.startDate + ' ' + snippet.startTime);
    }
    if (snippet.endTime === null) {
      // Make sure we specify midnight, if we leave off the time entirely we get
      // midnight UTC, not midnight local time
      snippet.end = new Date(snippet.endDate + ' 00:00:00');
    } else {
      snippet.end = new Date(snippet.endDate + ' ' + snippet.endTime);
    }
  };

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
    if (snippet.link) {
      lines.push('link: ' + snippet.link);
    }
  };

  self.dispatch = function(req, callback) {
    var show = false;
    var criteria = {};
    var options = { permalink: req.bestPage };
    var year, month, day;
    var byDate = false;
    if (req.remainder.length) {
      byDate = req.remainder.match(/^\/(\d+)(\/(\d+))?(\/(\d+))?$/);
      if (byDate) {
        year = byDate[1];
        month = byDate[3];
        day = byDate[5];
      } else {
        //we're trying to get a slug ("show" page)
        criteria.slug = req.remainder.substr(1);
        show = true;
      }
    }
    if (!show) {
      // When populating the AJAX calendar do not use a pager
      if (!req.query.calendar) {
        self.addPager(req, options);
      }
      var now = moment();
      // When populating the calendar supply current month if none specified
      if (req.query.calendar && (!byDate)) {
        year = now.format('YYYY');
        month = now.format('MM');
      }
      req.extras.thisYear = now.format('YYYY');
      req.extras.thisMonth = now.format('MM');
      // Create 'from' and 'to' dates in YYYY-MM-DD format for mongodb criteria
      if (!byDate) {
        // If we're not browsing by month, simply show upcoming events
        // options.upcoming = true;
        self.setOptionsForDefaultView(options);
        req.extras.defaultView = true;
      } else {
        fromDate = pad(year, 4) + '-' + pad(month, 2) + '-' + (day ? day : '01');
        toDate = pad(year, 4) + '-' + pad(month, 2) + '-' + (day ? day : '31');
        // Must start before the end of the range
        criteria.startDate = { $lte: toDate };
        // Must not end before the beginning of the range
        criteria.endDate = { $gte: fromDate };
      }
      if (!byDate) {
        // Next and previous links based on the current month and year are still
        // useful in calendars, even if we're currently displaying an upcoming
        // events view.
        year = req.extras.thisYear;
        month = req.extras.thisMonth;
      } else {
        // For displaying the active month and year
        req.extras.activeYear = pad(year, 4);
        req.extras.activeMonth = pad(month, 2);
      }
      // set up the next and previous urls for our calendar
      var nextYear = year;
      var nextMonth = parseInt(month, 10) + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = parseInt(year, 10) + 1;
      }
      nextMonth = pad(nextMonth, 2);
      req.extras.nextYear = nextYear;
      req.extras.nextMonth = nextMonth;

      var prevYear = year;
      var prevMonth = parseInt(month, 10) - 1;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear = parseInt(year, 10) - 1;
      }
      prevMonth = pad(prevMonth, 2);
      req.extras.prevYear = prevYear;
      req.extras.prevMonth = prevMonth;
    }

    function pad(s, n) {
      return self._apos.padInteger(s, n);
    }

    // Make sure we call addCriteria to get things like tag filtering
    self.addCriteria(req, criteria, options);

    if (req.query.calendar) {
      // We don't paginate the events for this month when displaying them in the calendar, so be sure we don't get too much stuff
      options.fields = { _id: 1, title: 1, slug: 1, startDate: 1, startTime: 1, endDate: 1, endTime: 1, start: 1, end: 1, tags: 1 };
    }
    if (req.query.today){
      options.today = true;
    }
    if (req.query.tomorrow){
      options.tomorrow = true;
    }
    self.get(req, criteria, options, function(err, results) {
      if (err) {
        return callback(err);
      }
      var snippets = results.snippets;
      req.extras.allTags = results.tags;
      req.extras.filters = _.omit(results, 'snippets');
      if (show) {
        if (!snippets.length) {
          req.template = 'notfound';
          return callback(null);
        } else {
          req.template = self.renderer('show', req);
          // Generic noun so we can more easily inherit templates
          req.extras.item = snippets[0];
          // An easy place to add more behavior
          return self.beforeShow(req, snippets[0], callback);
        }
      } else {
        if (!req.query.calendar) {
          self.setPagerTotal(req, results.total);
        }
        // Generic noun so we can more easily inherit templates
        req.extras.items = snippets;
        self.setIndexTemplate(req);
        if (req.xhr && (req.query.page > 1) && (!snippets.length)) {
          req.notfound = true;
          return callback(null);
        }
        // An easy place to add more behavior
        return self.beforeIndex(req, snippets, callback);
      }
    });
  };

  self.setOptionsForDefaultView = function(options) {
    options.upcoming = true;
  };


  var superSetIndexTemplate = self.setIndexTemplate;
  self.setIndexTemplate = function(req) {
    superSetIndexTemplate(req);
    if (req.query.calendar) {
      // Render JSON data instead for use in clndr
      req.template = function(data) {
        return JSON.stringify(req.extras.items);
      };
    }
  };

  // Establish the default sort order for events
  var superGet = self.get;
  self.get = function(req, userCriteria, optionsArg, callback) {
    var options = {};
    var filterCriteria = {};
    // "Why copy the object like this?" If we don't, we're modifying the
    // object that was passed to us, which could lead to side effects
    extend(true, options, optionsArg || {});

    if (!options.sort) {
      // start is always a Date object, suitable for sorting
      options.sort = { start: 1, sortTitle: 1 };
    }
    // An upcoming event is one that ENDS in the future. Otherwise a
    // 3-day event that is 1 day in will not show up, which is too harsh.
    // Summer-long events can be tedious in this sort of system but there's
    // only so much one can do about that.
    //
    // Do it by date, not timestamp, so that we don't fail to show an
    // all-day event taking place today.
    if (options.upcoming) {
      filterCriteria.endDate = { $gte: moment().format('YYYY-MM-DD') };
    }
    if (options.today) {
      console.log();
      filterCriteria.startDate = { $lte: moment().format('YYYY-MM-DD')};
      filterCriteria.endDate = { $gte: moment().format('YYYY-MM-DD')};
    }
    if (options.tomorrow){
      filterCriteria.startDate = { $lte: moment().add('d', 1).format('YYYY-MM-DD')};
      filterCriteria.endDate = { $gte: moment().add('d', 1).format('YYYY-MM-DD')};
    }
    return superGet.call(self, req, { $and: [ userCriteria, filterCriteria ] }, options, function(err, results) {
      if (err) {
        return callback(err);
      }
      // Make it easy for templates and other code to identify events that
      // are entirely in the future, entirely in the past, and happening right now
      var now = new Date();
      _.each(results.snippets, function(result) {
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

  var superBeforePutOne = self.beforePutOne;
  self.beforePutOne = function(req, slug, options, snippet, callback) {
    self.denormalizeDates(snippet);
    return superBeforePutOne(req, slug, options, snippet, callback);
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
  self.addExtraAutocompleteCriteria = function(req, criteria, options) {
    superAddExtraAutocompleteCriteria.call(self, req, criteria);
    self.setOptionsForDefaultView(options);
  };

  function addRoutes() {
    self._app.get(self._action + '/vcal', function(req, res) {
      var slug = req.query.slug;
      self.get(req, { slug: slug }, {}, function(err, results) {
        var events = results.snippets;
        if (err) {
          res.statusCode = 500;
          return res.send('error');
        }
        if (!events.length) {
          res.statusCode = 404;
          return res.send('not found');
        }
        var event = events[0];
        res.setHeader('Content-type', 'text/x-vcalendar');
        res.setHeader('Content-disposition', slug + '.vcs');
        var start = self.getVCalTimestamp(event.start);
        var end = self.getVCalTimestamp(event.end);
        var title = self.textToVcal(event.title);
        var body = self.textToVcal(self._apos.getAreaPlaintext({ area: event.body }));
        var location = self.textToVcal(self.getEventAddress(event));
        var uid = event._id;
        // A hack because we don't have publication dates for events (so far)
        var publishedAt = self.getVCalTimestamp(new Date());
        // Outlook insists on \r\n https://dev.plone.org/ticket/4512
        return res.send('BEGIN:VCALENDAR\r\n' +
          'PRODID:-//punkave//apostrophe 2.x//EN\r\n' +
          'VERSION:1.0\r\n' +
          'TZ:0\r\n' +
          'BEGIN:VEVENT\r\n' +
          'CATEGORIES:MEETING\r\n' +
          'DTSTART:' + start + '\r\n' +
          'DTEND:' + end + '\r\n' +
          'DTSTAMP:' + publishedAt + '\r\n' +
          'SUMMARY:' + title + '\r\n' +
          'DESCRIPTION:' + body + '\r\n' +
          'LOCATION:' + location + '\r\n' +
          'UID:' + uid + '\r\n' +
          'END:VEVENT\r\n' +
          'END:VCALENDAR\r\n');
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

  self._apos.on('tasks:register', function(taskGroups) {
    taskGroups.apostrophe.generateEvents = function(apos, argv, callback) {
      var randomWords = require('random-words');
      var i;
      var events = [];
      // The various events get 0-5 tags drawn from this pool
      // so there is a decent amount of overlap
      var tags = randomWords(50);
      // A good spread of events over the next year, with a small percentage
      // in the previous 60 days
      for (i = 0; (i < 100); i++) {
        // Use an inner function and pass 'i' to it, so that we
        // get a new closure and 'startTime' and 'endTime' are
        // undefined at the start of each pass. Otherwise all the
        // events have times. This is really subtle: a 'var' with
        // an assignment applies its assignment on every pass through
        // a for loop but a 'var' without one doesn't implicitly
        // assign 'undefined'. Basically: 'var' anywhere but the
        // start of a function is really evil and confusing.
        (function(i) {
          var title = randomWords({ min: 5, max: 10, join: ' ' });
          var start = new Date();
          // TODO: why do we wind up with random minutes still?
          start.setHours(0, 0, 0, 0);
          start.setDate(start.getDate() + Math.floor(Math.random() * (365 + 60)) - 60);
          var startDate = moment(start).format('YYYY-MM-DD');
          var startTime;
          var endTime;
          // Make sure we get a new object for the end so we're not just
          // changing the same object
          var end = new Date(start);
          // One-fifth of events are multiday
          if (Math.random() < 0.2) {
            end.setDate(end.getDate() + Math.floor(Math.random() * 5) + 1);
          }
          endDate = moment(end).format('YYYY-MM-DD');
          // One-half of events are not full-day
          if (Math.random() < 0.5) {
            start.setHours(Math.floor(Math.random() * 23));
            startTime = moment(start).format('hh:mm');
            end.setHours(start.getHours() + 1);
            endTime = moment(end).format('hh:mm');
          }
          var at = new Date();
          var eventTags = randy.shuffle(tags).slice(0, Math.floor(Math.random() * 5));
          events.push({
            _id: self._apos.generateId(),
            type: 'event',
            title: title,
            sortTitle: self._apos.sortify(title),
            tags: eventTags,
            slug: self._apos.slugify(title),
            testData: true,
            start: start,
            startDate: startDate,
            startTime: startTime,
            end: end,
            endDate: endDate,
            endTime: endTime,
            address: '1168 E. Passyunk Ave. Philadelphia, PA 19147',
            body: {
              type: 'area',
              items: [
                {
                  type: 'richText',
                  content: randomWords({ min: 50, max: 200, join: ' ' })
                }
              ]
            },
            published: true
          });
        })(i);
      }
      self._apos.pages.insert(events, callback);
    };
  });

  if (callback) {
    process.nextTick(function() { return callback(null); });
  }
};

// Subclass the widget constructor to enhance the criteria.
// Specifically, always pull only upcoming events in a widget
events.widget = function(options) {
  var self = this;
  snippets.widget.Widget.call(self, options);
  var superAddCriteria = self.addCriteria;
  self.addCriteria = function(item, criteria, options) {
    superAddCriteria.call(self, item, criteria, options);
    self.snippets.setOptionsForDefaultView(options);
  };
};
