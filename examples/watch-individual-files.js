/*
  # files and directories must exist before being watched
  touch /tmp/test-exists-before-watch
  touch /tmp/test-exists-removed-readded

  node watch.js

  # does not register
  touch /tmp/test-created-after-watch

  # do register
  echo "appending..." >> /tmp/test-exists-before-watch
  rm /tmp/test-exists-removed-readded

  # does not register
  touch /tmp/test-exists-removed-readded
*/

(function () {
  var Inotify = require('inotify-plusplus'),
    inotify = Inotify.create(true),
    directive,
    options = {},
    interests;

  interests = [
    "test-exists-before-watch", // always watched
    "test-exists-removed-readded", // watched until deleted, not watched once recreated
    "test-created-after-watch", // this will not be watched. Normally it would throw an exception
  ];

  directive = {
    all_events: true,
    close_write: function (ev) {
      // The name never shows up for watched files
      console.log(ev);
    }
  };

  options.all_events_is_catchall = true; // listen to all events, period.
  options.allow_bad_paths = true; // don't throw when a path doesn't exist

  // creating one watch per interesting file
  interests.forEach(function (name) {
    inotify.watch(directive, '/tmp/' + name, options);
  });

  if ('undefined' === typeof provide) { provide = function () {}; }
  provide("watch-individual-files");
}());
