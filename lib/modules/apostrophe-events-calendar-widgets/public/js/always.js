apos.define('apostrophe-events-calendar-widgets', {
  extend: 'apostrophe-pieces-widgets',
  construct: function (self, options) {
    self.play = function ($widget, data, options) {

      var cal;
      var query = {};
      if (data.withTags) {
        query.withTags = data.withTags;
      }

      function getCalendar(query, callback) {
        self.api('calendar', query, function (response) {
          callback(response);
        });
      }

      // Make a new events query and re-render clndr instance
      // This is fired when clicking Next or Previous Month arrows
      var getEvents = function (query) {
        getCalendar(query, function (response) {
          cal.setEvents(response.clndrOptions.events);
        });
      };

      // Get the current month on run
      getCalendar(query, function (response) {
        // Add additional click events to ajax in each requested month
        response.clndrOptions.clickEvents = {
          nextMonth: function (month) {
            query.month = month.format('YYYY-MM');
            getEvents(query);
          },
          previousMonth: function (month) {
            query.month = month.format('YYYY-MM');
            getEvents(query);
          }
        };
        // Initialize CLDNR instance
        cal = $widget.find('[data-calendar]').clndr(response.clndrOptions);
      });
    };
  }
});
