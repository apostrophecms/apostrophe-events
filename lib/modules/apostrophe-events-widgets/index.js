module.exports = {
  label: 'Events Widget',
  extend: 'apostrophe-pieces-widgets',

  byAllLabel: 'Upcoming Events',
  byTagLabel: 'Upcoming Events by Tag',

  construct: function(self, options) {
    // Append upcoming flag by extending widgetCursor.
    var superWidgetCursor = self.widgetCursor;
    self.widgetCursor = function(req, criteria) {
      return superWidgetCursor(req, criteria).upcoming(true);
    };
  }
};
