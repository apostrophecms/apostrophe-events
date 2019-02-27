var _ = require('@sailshq/lodash')
  , async = require('async')
  , moment = require('moment');

module.exports = {
  name: 'apostrophe-event',
  alias: 'events',
  label: 'Event',
  extend: 'apostrophe-pieces',

  moogBundle: {
    modules: ['apostrophe-events-pages', 'apostrophe-events-widgets'],
    directory: 'lib/modules'
  },

  beforeConstruct: function(self, options) {
    options.sort = { startDate: 1, startTime: 1 };

    options.addFields = [
      {
        name: 'startDate',
        label: 'Date',
        type: 'date',
        required: true
      },
      {
        name: 'allDay',
        label: 'Is this an all day event?',
        type: 'boolean',
        choices: [
          { label: 'Yes', value: true },
          { label: 'No', value: false , showFields: ['startTime', 'endTime'] }
        ],
        def: false
      },
      {
        name: 'startTime',
        label: 'Start Time',
        type: 'time',
        def: '09:00:00',
        required: true
      },
      {
        name: 'endTime',
        label: 'End Time',
        type: 'time',
        def: '17:30:00',
        required: true
      },
      {
        name: 'dateType',
        label: 'What type of event is this?',
        type: 'select',
        choices: [
          { label: 'Single Day', value: 'single' },
          { label: 'Consecutive Days', value: 'consecutive', showFields: ['endDate'] },
          { label: 'Recurring', value: 'repeat', showFields: ['repeatInterval', 'repeatCount'] },
        ],
        def: 'single'
      },
      {
        name: 'endDate',
        label: 'End Date',
        type: 'date'
      },
      {
        name: 'repeatInterval',
        label: 'Repeats every',
        type: 'select',
        choices: [
          { label: 'Week', value: 'weeks' },
          { label: 'Month', value: 'months' }
        ]
      },
      {
        name: 'repeatCount',
        label: 'Repeats how many times?',
        type: 'integer',
        def: 1
      }
    ].concat(options.addFields || []);

    options.arrangeFields = options.arrangeFields || [
      { name: 'basic', label: 'Basics', fields: ['title', 'slug', 'startDate', 'allDay', 'startTime', 'endTime'] },
      { name: 'advanced', label: 'Advanced', fields: ['dateType', 'endDate', 'repeatInterval', 'repeatCount'] },
      { name: 'meta', label: 'Meta', fields: ['tags','published'] }
    ];

    options.addColumns = [
      {
        name: 'startDate',
        label: 'Start Date',
      }
    ].concat(options.addColumns || []);

    options.addSorts = [
      {
        name: 'startDate',
        label: 'By Start Date',
        sort: { startDate: -1 }
      }
    ].concat(options.addSorts || []);

    options.addFilters = [
      {
        name: 'upcoming',
        choices: [
          {
            value: true,
            label: 'Upcoming'
          },
          {
            value: false,
            label: 'Past'
          },
          {
            value: null,
            label: 'Both'
          }
        ],
        def: true
      }
    ].concat(options.addFilters || []);
  },

  construct: function(self, options) {

    // limit the results of autocomplete for joins
    // so they only include upcoming events
    self.extendAutocompleteCursor = function(cursor) {
      return cursor.upcoming(true);
    };

    self.beforeSave = function(req, piece, options, callback) {
      self.denormalizeDatesAndTimes(piece);
      return callback(null);
    };

    self.afterInsert = function(req, piece, options, callback) {
      if (piece._workflowPropagating) {
        // Workflow is replicating this but also its existing
        // scheduled repetitions, don't re-replicate them and cause problems
        return callback(null);
      }
      if(piece.dateType == 'repeat') {
        return self.repeatEvent(req, piece, callback);
      } else {
        return callback(null);
      }
    };

    self.denormalizeDatesAndTimes = function(piece) {
      // Parse our dates and times
      var startTime = piece.startTime
        , startDate = piece.startDate
        , endTime = piece.endTime
        , endDate;

      if(piece.dateType == 'consecutive') {
        endDate = piece.endDate;
      } else {
        piece.endDate = piece.startDate;
        endDate = piece.startDate;
      }

      if(piece.allDay) {
        startTime = '00:00:00';
        endTime = '23:59:59';
      }

      if(piece.dateType == 'repeat') {
        piece.hasClones = true;
      }

      piece.start = new Date(startDate +' '+ startTime);
      piece.end = new Date(endDate +' '+ endTime);
    };

    self.repeatEvent = function(req, piece, finalCallback) {
      var i
        , repeat = parseInt(piece.repeatCount) + 1
        , multiplier = piece.repeatInterval
        , addDates = [];

      for(i = 1; i < repeat; i++) {
        addDates.push(moment(piece.startDate).add(i, multiplier).format('YYYY-MM-DD'));
      }

      return async.eachLimit(addDates, 5, function(date, callback) {
        var eventCopy = _.cloneDeep(piece);
        eventCopy._id = self.apos.utils.generateId();
        eventCopy.parentId = piece._id;
        eventCopy.isClone = true;
        eventCopy.startDate = date;
        eventCopy.endDate = date;
        eventCopy.slug = eventCopy.slug + '-' + date;
        eventCopy.dateType = 'single';
        self.denormalizeDatesAndTimes(eventCopy);
        return self.insert(req, eventCopy, callback);
      }, finalCallback);
    };
  },
};
