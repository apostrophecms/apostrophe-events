apos.define('apostrophe-events-calendar-widgets', {
  extend: 'apostrophe-widgets',
  construct: function(self, options) {
    self.play = function($widget, data, options) {

    	var cal;

    	// Hit backend route that serves a month's events as well as the default cldnr options
    	var getCalendar = function(month, callback) {
				$.ajax({
				    method: 'GET',
				    url: self.action + '/get-calendar',
			    	data: month
				  })
				.fail(function(error){
					console.log(error);
				})
				.done(function(response) {
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