// JavaScript which enables editing of this module's content belongs here.

function AposEvents(optionsArg) {
  var self = this;
  var options = {
    instance: 'event',
    name: 'events'
  };
  $.extend(options, optionsArg);
  AposSnippets.call(self, options);

  if (self.manager) {
    // Add a filter for dates
    self.filters['date'] = 'all';
    self.filters.date = 'all';
  }

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

}

