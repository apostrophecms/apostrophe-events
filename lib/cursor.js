module.exports = function(self, cursor) {
  // If set to true, the upcoming flag ensures we 
  // only get events that haven't already happened.
  cursor.addFilter('upcoming', {
    def: false,
    finalize: function() {
      var upcoming = cursor.get('upcoming');
      if (!upcoming) {
        return;
      }

      cursor.and({
        start: { $gte: new Date() }
      });
    }
  });
};