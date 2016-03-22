module.exports = function(self, cursor) {
  // If set to true, the upcoming flag ensures we 
  // only get events that haven't already happened.
  cursor.addFilter('upcoming', {
    def: null,
    safeFor: 'public',
    finalize: function() {
      var upcoming = cursor.get('upcoming');
      if (upcoming === null) {
        return;
      }

      if(upcoming) {
        cursor.and({
          start: { $gte: new Date() }
        });        
      } else {
        cursor.and({
          start: { $lt: new Date() }
        });         
      }
    },
    launder: function(s) {
      return self.apos.launder.booleanOrNull(s);
    }    
  });
};