var _ = require('lodash');

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
    options.sort = { startDate: 1 };

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
        type: 'select',
        choices: [
          { label: 'Yes', value: '1' },
          { label: 'No', value: '0', showFields: ['startTime', 'endTime'] }
        ],
        def: 0
      },      
      {
        name: 'startTime',
        label: 'Start Time',
        type: 'time',
        def: '9am',
        required: true
      },
      {
        name: 'endTime',
        label: 'End Time',
        type: 'time',
        def: '5:30pm',
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
          { label: 'Week', value: 'week' },
          { label: 'Month', value: 'month' }
        ]
      },
      {
        name: 'repeatCount',
        label: 'Repeats how many times?',
        type: 'integer',
        def: 1
      }
    ].concat(options.addFields || []);

    options.arrangeFields = _.merge([
      { name: 'basic', label: 'Basics', fields: ['title', 'slug', 'startDate', 'allDay', 'startTime', 'endTime'] },
      { name: 'advanced', label: 'Advanced', fields: ['dateType', 'endDate', 'repeatInterval', 'repeatCount'] },
      { name: 'meta', label: 'Meta', fields: ['tags','published'] }
    ], options.arrangeFields || []);
  },

  construct: function(self, options) {
    var superFind = self.find;
    self.find = function(req, criteria, projection) {
      var cursor = superFind(req, criteria, projection);
      require('./lib/cursor')(self, cursor);
      return cursor;
    };

    // limit the results of autocomplete for joins
    // so they only include 
    self.extendAutocompleteCursor = function(cursor) {
      require('./lib/cursor')(self, cursor);
      return cursor.upcoming(true);
    };

    self.beforeSave = function(req, piece, callback) {
      // Parse our dates and times 
      piece.start = new Date(piece.startDate +'T'+ piece.startTime);
      return callback(null);
    };
  },
};