const moment = require('moment');
const _ = require('lodash');

module.exports = function (self, options) {
  self.getEvents = async function (req) {
    let month;
    if (req.body && !req.body.month) {
      month = moment().format('YYYY-MM');
    } else {
      month = req.body.month;
    }

    const max = moment(month).add({
      days: 15,
      months: 1
    }).format('YYYY-MM-DD');
    const min = moment(month).subtract(15, 'd').format('YYYY-MM-DD');
    const query = {
      startDate: {
        $gte: min
      },
      endDate: {
        $lte: max
      }
    };

    if (req.body.withTags && _.isArray(req.body.withTags)) {
      query.tags = {
        $in: req.body.withTags
      };
    }
    const projection = _.merge((self.options.projection || {}), self.options.defaultProjection);
    const events = await self.apos.modules[self.options.piecesModuleName].find(req, query, projection).toArray();

    // clndr-specific format
    events.forEach(event => {
      event.date = event.startDate;
    });

    const clndrOptions = {
      template: self.render(req, '_clndr', {}),
      daysOfTheWeek: [
        req.__('Su'),
        req.__('M'),
        req.__('T'),
        req.__('W'),
        req.__('Th'),
        req.__('F'),
        req.__('S')
      ],
      events: events,
      extras: {
        queryDate: req.query.day
      },
      startWithMonth: month
    };
    return clndrOptions;
  };
};
