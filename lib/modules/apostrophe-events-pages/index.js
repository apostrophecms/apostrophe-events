module.exports = {
  name: 'apostrophe-events-page',
  label: 'Events Page',
  extend: 'apostrophe-pieces-pages',

  construct: function(self, options) {
    // Append upcoming flag by extending pieces.indexCursor.
    var superIndexCursor = self.indexCursor;
    self.indexCursor = function(req) {
      return superIndexCursor(req).upcoming(true);
    }
  }
}