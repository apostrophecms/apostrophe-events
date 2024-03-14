## UNRELEASED

* When repeating an event, we were basing our knowledge of whether or not this event already had duplicates, on its parent's `id` but its `id` would change between versions. This resulted in infinite duplicates when committing an event with the `repeat` property. This has been changed to check that its parent's `workflowGuid` does not change across document versions.
* Although it caused no apparent issue, the pieces that were duplicated from an event of type `repeat` had its parent's `hasClones` property set to true (since it was duplicated and unchanged after that). To make more sense in the pieces, the duplicates now have the `nowClones` property set to false upon cloning.

### 2.2.0 2022-08-31

An event can now be repeated (selecting recurring type) after editing it, not only after saving it for the first time.

### 2.1.8 2022-05-23

Fixes an error that was occurring when trying to save a recurring event.

### 2.1.7 2020-06-17

Improves help text and labeling on fields.

### 2.1.6 2020-03-31

Updates the linter, removes an unused dependency, and sets up CircleCI.

### 2.1.5

The `month` pieces filter now includes all months that events span, not only the months in which they begin.

### 2.1.3

`upcoming` now takes end time into account.

### 2.1.2

Repeating events were incompatible with `apostrophe-workflow`. This issue has been fixed.

### 2.1.1

Use of `addFields` by modules extending `apostrophe-events` now works as expected.

### 2.1.0

Added `start` and `and` cursor filters.

### 2.0.2

Added `year`, `month` and `day` cursor filters, which are suitable for use with the `piecesFilters` option.

### 2.0.1

Fixed a significant performance bug. The events widget was fetching *every* widget rather than just those with the appropriate IDs. The set of results was then being winnowed by the algorithm for handling many widgets with one query, but not before considerable resources were spent fetching areas for those events, etc.
