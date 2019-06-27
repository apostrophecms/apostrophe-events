module.exports = {
  label: 'Events Calendar',
  extend: 'apostrophe-pieces-widgets',
  contextualOnly: true,
  piecesModuleName: 'apostrophe-events',

  construct: function(self, options) {
		require('./lib/routes.js')(self, options);
		require('./lib/assets.js')(self, options);
		require('./lib/api.js')(self, options);
		self.pushAssets();
		self.addRoutes();
  }
}

