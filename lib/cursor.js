var moment = require('moment');

module.exports = {
  extend: 'apostrophe-pieces-cursor',

  construct: function(self, options) {
    // If set to true, the upcoming flag ensures we 
    // only get events that haven't already happened.
    self.addFilter('upcoming', {
      def: null,
      safeFor: 'public',
      finalize: function() {
        var upcoming = self.get('upcoming');
        if (upcoming === null) {
          return;
        }

        var now = moment().format('YYYY-MM-DD');

        if(upcoming) {
          self.and({
            endDate: { $gte: now },
          });
        } else {
          self.and({
            endDate: { $lte: now }
          });
        }
      },
      launder: function(s) {
        return self.apos.launder.booleanOrNull(s);
      }    
    });

    self.addFilter('date', {
      def: null,
      safeFor: 'public',
      finalize: function() {
        var date = self.get('date');
        if(date === null) {
          return;
        }

        self.and({ startDate: date });
      },
      launder: function(s) {
        return self.apos.launder.string(s);
      }
    });
  }
};
