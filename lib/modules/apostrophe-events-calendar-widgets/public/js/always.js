apos.define('apostrophe-events-calendar-widgets', {
  extend: 'apostrophe-pieces-widgets',
  construct: function(self, options) {
    self.play = function($widget, data, options) {

    	var cal;

			function getCalendar(data, callback) {
				self.api('calendar', data, function(response) {
					// console.log(response);
					callback(response);
				});
			}

    	// Make a new events query and re-render clndr instance
    	// This is fired when clicking Next or Previous Month arrows
	    var getEvents = function(month) {
	    	getCalendar({month: month}, function(response) {
	    		cal.setEvents(response.clndrOptions.events);
	    	});
	    }

    	// Get the current month on run
    	getCalendar({}, function(response) {
    		// Add additional click events to ajax in each requested month
				response.clndrOptions.clickEvents = {
        	nextMonth: function(month) {
        		getEvents(month.format('YYYY-MM'))
        	},
         	previousMonth: function(month) {
        		getEvents(month.format('YYYY-MM'))
        	}       	
				}
				// Initialize CLDNR instance
    		cal = $widget.find('[data-calendar]').clndr(response.clndrOptions);
    	});
    };
  }
});