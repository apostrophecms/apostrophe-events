// JavaScript which enables editing of this module's content belongs here.

function AposEvents(optionsArg) {
  var self = this;
  var options = {
    instance: 'event',
    name: 'events'
  };
  $.extend(options, optionsArg);
  AposSnippets.call(self, options);
  function findExtraFields($el, data, callback) {
    //grab the value of the extra fields and toss them into the data object before carrying on
    data.address = $el.find('[name="address"]').val();

    //date/times
    data.startDate = $el.find('[name="start-date"]').val();
    data.startTime = $el.find('[name="start-time"]').val();
    data.endDate = $el.find('[name="end-date"]').val();
    data.endTime = $el.find('[name="end-time"]').val();
    
    callback();
  }

  self.afterPopulatingEditor = function($el, snippet, callback) {
    $el.find('[name="address"]').val(snippet.address);
    $el.find('[name="start-date"]').val(snippet.startDate);
    $el.find('[name="start-time"]').val(apos.formatTime(snippet.startTime));
    $el.find('[name="end-date"]').val(snippet.endDate);
    $el.find('[name="end-time"]').val(apos.formatTime(snippet.endTime));

    apos.enhanceDate($el.findByName('start-date'), { $minFor: $el.findByName('end-date') });
    apos.enhanceDate($el.findByName('end-date'), { $maxFor: $el.findByName('start-date') });

    callback();
 };

  self.addingToManager = function($el, $snippet, snippet) {
    $snippet.find('[data-date]').text(snippet.startDate);
    var status;
    if (snippet.trash) {
      status = 'Trash';
    } else if (snippet.published) {
      status = 'Published';
    } else {
      status = 'Draft';
    }
    $snippet.find('[data-status]').text(status);
  };

  self.beforeInsert = function($el, data, callback) {
    findExtraFields($el, data, callback);
  };

  self.beforeUpdate = function($el, data, callback) {
    findExtraFields($el, data, callback);
  };
}

AposEvents.addWidgetType = function(options) {
  if (!options) {
    options = {};
  }
  _.defaults(options, {
    name: 'events',
    label: 'Events',
    action: '/apos-events',
    defaultLimit: 5
  });
  AposSnippets.addWidgetType(options);
};
