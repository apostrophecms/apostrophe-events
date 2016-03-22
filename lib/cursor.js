var moment = require('moment');


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

      var now = moment().format('YYYY-MM-DD');

      if(upcoming) {
        cursor.and({
          endDate: { $gte: now },
        });
      } else {
        cursor.and({
          endDate: { $lte: now }
        });
      }
    },
    launder: function(s) {
      return self.apos.launder.booleanOrNull(s);
    }    
  });
};