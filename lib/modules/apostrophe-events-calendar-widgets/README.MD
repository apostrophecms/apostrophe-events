# apostrophe-events-calendar-widgets

## Options
### `piecesModuleName`
This is the name of the pieces module that will populate the contents of the calendars. If this is not set explicitly, the module will try to infer by taking its own module name and removing the `-calendar-widgets` substring to see if the remaining string is a working module. If not, the module will throw an error.

### `projection`
If your piece type has special fields you want to push through to the calendar template, you can provide a custom `projection` object in your configuration that will get merged into the defaults.

Include a custom projection like

```js
// in app.js
var apos = require('apostrophe')({
  shortName: 'boilerplate',
  modules: {
    // ... other modules
    'apostrophe-events-calendar-widgets': {
      projection: {
        specialThing: 1,
        foobar: 1
      }
    }
  }
});
```

The default projection includes `{ startDate: 1, title: 1, _url: 1, endDate: 1, startTime: 1, endTime: 1 }`

These properties, and any other you push into `projection` will be available in both your `_clndr.html` and `_serverRenderedEvents.html` templates.

### `pushClndr` & `pushMoment`
The calendar widget relies on the `jQuery` plugin `clndr` to render. You can shut off the automatic pushing of the front-end JS by setting `pushClndr: false` in your configration. Useful if you are already levearging clndr elsewhere.

One of cldnr's dependencies is time/date utility library moment.js. Moment is pushed by default with Apostrophe's front-end but can be turned off when apostrphe-assets is set to `lean`. If `lean` is true and you haven't explicitly set `pushMoment` to false, moment.js will be pushed along with the other assets of this module. If your using Apostrophe in lean mode and are pushing moment.js another way, turn this to `false`

```js
// in app.js
var apos = require('apostrophe')({
  shortName: 'boilerplate',
  modules: {
    // ... other modules
    'apostrophe-events-calendar-widgets': {
      pushClndr: false,
      pushMoment: false
    }
  }
});
```

## Templates
### `views/_clndr.html`
This is lodash template that renders the calendar widget. Override it as you see fit. [https://kylestetz.github.io/CLNDR/](Documentation on `clndr` at GitHub)

### `views/_serverRenderedEvents.html`
This is the initial template that gets sent to the browser _before_ `clndr` takes over. This is meant to be useful for displaying event information in scenarios where JS is not going to fire, like for bots and crawlers that aggregage SEO information. Override as you customize the projection.