module.exports = {
  name: 'apostrophe-events',
  alias: 'events',
  label: 'Event',
  extend: 'apostrophe-pieces',
  
  moogBundle: {
    modules: [ 'apostrophe-events-pages', 'apostrophe-events-widgets' ],
    directory: 'lib/modules'
  },

  beforeConstruct: function(self, options) {
    options.addFields = [
      {
        name: 'startDate',
        label: 'Start Date',
        type: 'date',
        required: true
      },
      {
        name: 'startTime',
        label: 'Start Time',
        type: 'time',
        required: true
      },
      {
        name: 'multiDay',
        label: 'This is a multi-day event',
        type: 'boolean',
        def: false
      }
    ].concat(options.addFields || []);

    console.log('events:beforeConstruct');
    // return setImmediate(callback);
  },

  construct: function(self, options) {
    console.log('events:construct');
    // return setImmediate(callback);
  },

  afterConstruct: function(self) {
    console.log('events:afterConstruct');
    // return setImmediate(callback);
  }
};