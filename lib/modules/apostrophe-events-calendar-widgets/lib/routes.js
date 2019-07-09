
module.exports = function (self, options) {
  self.addRoutes = function () {
    self.route('post', 'calendar', async function (req, res) {
      try {
        const options = await self.getEvents(req);
        return res.json({
          clndrOptions: options
        });
      } catch (error) {
        self.apos.utils.error(error);
      }
    });
  };
};
