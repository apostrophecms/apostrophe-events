var _ = require('lodash');
var moment = require('moment');

module.exports = {
  label: 'Events Calendar Widget',
  extend: 'apostrophe-pieces-widgets',
  contextual: true,
  piecesModuleName: 'apostrophe-events',

  construct: function(self, options) {

  	self.route('get', 'get-calendar', function(req, res) {

  		var month;
  		if (req.query && !req.query.month) {
  			month = moment().format('YYYY-MM');
  		} else {
  			month = req.query.month
  		}

	    return self.apos.modules[self.piecesModuleName].find(req, {startDate: { $lte: month + '-31', $gte: month + '-01'}}).toArray(function(err, events) {
	      var records = _.map(events, function event(event) {
	        return {
	          date: event.startDate,
	          title: event.title,
	          url: event._url
	        };
	      });

	      var clndrOptions = {
	        template: self.render(req, '_clndr', {}),
	        daysOfTheWeek: ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'],
	        events: records,
	        moment: moment,
	        extras: { queryDate: req.query.day }
	      };

	      var now = moment().format('YYYY-MM-DD');
	      var month = moment().format('YYYY-MM');

	      if(req.query.day == now) {
	        clndrOptions.startWithMonth = req.query.day;
	      } else if (req.query.month) {
	        clndrOptions.startWithMonth = req.query.month;
	      }  else {
	        clndrOptions.startWithMonth = req.query.day;
	      }

	      return res.json({ clndrOptions: clndrOptions })
	    });
  		
  	})
  },
  afterConstruct: function(self) {
  	self.pushAsset('script', 'vendor/clndr.min', { when: 'always' });
  	self.pushAsset('stylesheet', 'calendar', { when: 'always' });
  }
}
