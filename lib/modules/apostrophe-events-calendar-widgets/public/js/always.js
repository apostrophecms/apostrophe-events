apos.define('apostrophe-events-calendar-widgets', {
  extend: 'apostrophe-widgets',
  construct: function(self, options) {
    self.play = function($widget, data, options) {
    	console.log('playing');
    	var cal;
    	var getCalendar = function(options) {
				$.ajax({
				    method: "GET",
				    url: self.action + "/get-calendar"
				  })
				.fail(function(){
					console.log('error');
				})
				.done(function(response) {
					console.log(response);
					response.clndrOptions.clickEvents = {
	        	nextMonth: function(month) {
	        		getEvents(month.format("YYYY-MM"))
	        		return false;
	        	}
					}
			  	cal = $("[data-calendar]").clndr(response.clndrOptions);
			  });
    	}

    	var getEvents = function(month) {
				$.ajax({
				    method: "GET",
				    url: self.action + "/get-calendar",
				    data: {month: month}
				  })
				.fail(function(){
					console.log('error');
				})
				.done(function(response) {
					cal.addEvents(response.clndrOptions.events);
			  });
    	}

    	getCalendar();
    };
  }
});