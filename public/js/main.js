function AposEvents(optionsArg) {
  var self = this;
  var options = {
    instance: 'event'
  };
  $.extend(options, optionsArg);
  AposSnippets.call(self, options);

  function findExtraFields($el, data, callback) {
    //grab the value of the extra fields and toss them into the data object before carrying on
    // data.address = $el.find('[name="address"]').val();
    // data.locType = $el.find('[name="locType"]').val();
    // data.hours = $el.find('[name="hours"]').val();
    // data.descr = $el.find('[name="descr"]').val();
    callback();
  }

  self.afterPopulatingEditor = function($el, snippet, callback) {
    // $el.find('[name=address]').val(snippet.address);
    // $el.find('[name="locType"]').val(snippet.locType);
    // $el.find('[name="hours"]').val(snippet.hours);
    // $el.find('[name="descr"]').val(snippet.descr);
    callback();
  };

  self.beforeInsert = function($el, data, callback) {
    // findExtraFields($el, data, callback);
    callback();
  };

  self.beforeUpdate = function($el, data, callback) {
    // findExtraFields($el, data, callback);
    callback();
  };
}

AposEvents.addWidgetType = function(options) {
  if (!options) {
    options = {};
  }
  _.defaults(options, {
    name: 'event',
    label: 'Events',
    action: '/apos-event',
    defaultLimit: 5
  });
  AposSnippets.addWidgetType(options);
};