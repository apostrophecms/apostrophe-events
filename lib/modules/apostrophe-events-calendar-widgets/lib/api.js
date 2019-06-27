var moment = require('moment');
var _ = require('lodash');

module.exports = function(self, options) {
  self.getEvents = async function(req) {
    var month;
    if (req.query && !req.body.month) {
      month = moment().format('YYYY-MM');
    } else {
      month = req.body.month
    }

    var max = moment(month).add({ days: 15, months: 1 }).format('YYYY-MM-DD');
    var min = moment(month).subtract(15, 'd').format('YYYY-MM-DD');
    var query = { startDate: { $lte: max, $gte: min } }
    var projection = _.merge((self.options.projection || {}), { startDate:1, title: 1, url: 1, type:1, slug:1 });
    var events = await self.apos.modules[self.piecesModuleName].find(req, query, projection).toArray();

    events.forEach(event => {
      event.date = event.startDate      
    });

    var clndrOptions = {
      template: self.render(req, '_clndr', {}),
      daysOfTheWeek: ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'],
      events: events,
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

    return clndrOptions;
  }
}