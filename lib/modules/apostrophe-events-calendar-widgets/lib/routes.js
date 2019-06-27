var _ = require('lodash');
var moment = require('moment');

module.exports = function (self, options) {
  self.addRoutes = function () {
    self.route('post', 'calendar', async function(req, res) {
      try {
        var options = await self.getEvents(req);
        return res.json({ clndrOptions: options })
      } catch (error) {
        self.apos.utils.error(error);
      }
  	});
  }
}