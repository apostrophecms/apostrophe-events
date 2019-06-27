module.exports = {
  label: 'Events Calendar',
  extend: 'apostrophe-pieces-widgets',
	contextualOnly: true,
	
	beforeConstruct: function(self, options) {
		// best guess at our piecesModuleName
		options.piecesModuleName = self.__meta.name.replace('-calendar-widgets', '');
	},

  construct: function(self, options) {
		require('./lib/routes.js')(self, options);
		require('./lib/assets.js')(self, options);
		require('./lib/api.js')(self, options);
	},
	
	afterConstruct: function(self) {
		self.pushAssets();
		self.addRoutes();
	}
}

