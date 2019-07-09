var _ = require('lodash');
var async = require('async');

module.exports = {
  label: 'Events Calendar',
  extend: 'apostrophe-widgets',
  skipInitialModal: true,
  defaultProjection: {
    startDate: 1,
    title: 1,
    _url: 1,
    endDate: 1,
    startTime: 1,
    endTime: 1
  },
  addFields: [{
    name: 'withTags',
    label: 'Show events only with these tags',
    type: 'tags'
  }],

  beforeConstruct: function (self, options) {
    // best guess at our piecesModuleName if none is provided
    if (!options.piecesModuleName) {
      options.piecesModuleName = self.__meta.name.replace('-calendar-widgets', '');
    }
  },

  construct: function (self, options) {
    require('./lib/routes.js')(self, options);
    require('./lib/assets.js')(self, options);
    require('./lib/api.js')(self, options);

    // lets us render _something_ for crawlers and bots
    var superLoad = self.load;
    self.load = function (req, widgets, callback) {
      async.each(widgets, function (widget, callback) {
        var query = {};
        if (widget.withTags && widget.withTags.length > 0) {
          query.tags = {
            $in: widget.withTags
          };
        }
        var projection = _.merge((self.options.projection || {}), self.options.defaultProjection);
        self.apos.modules[self.options.piecesModuleName].find(req, query, projection).toArray(function (err, events) {
          if (err) {
            self.apos.utils.error(err);
          }
          widget._events = events;
          return callback();
        });
      }, function (err) {
        if (err) {
          self.apos.utils.error(err);
          return superLoad(req, widgets, callback);
        } else {
          return superLoad(req, widgets, callback);
        }
      });
    };
  },

  afterConstruct: function (self) {
    self.pushAssets();
    self.addRoutes();
    // check to see the event module exists
    if (!self.apos.modules[self.options.piecesModuleName]) {
      throw new Error('module "' + self.options.piecesModuleName + '" does not exist and cannot be infered from the name ' + self.__meta.name);
    }
  }
};
