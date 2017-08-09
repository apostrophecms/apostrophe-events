module.exports = {
  name: 'apostrophe-events-page',
  label: 'Events Page',
  extend: 'apostrophe-pieces-pages',
  piecesFilters: [
    { name: 'year' },
    { name: 'month' },
    { name: 'day' }
  ],
  perPage: 1,

  construct: function(self, options) {
    // Append upcoming flag by extending pieces.indexCursor.
    var superIndexCursor = self.indexCursor;
    self.indexCursor = function(req) {
      return superIndexCursor(req).upcoming(true);
    };
  }
};
