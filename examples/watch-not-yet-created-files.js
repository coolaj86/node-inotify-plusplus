/*
  # These events fire
  dd if=/dev/zero bs=512 count=1 of=/tmp/test-watch
  cp /tmp/test-watch /tmp/test-watch2
  cat /tmp/test-watch2 > /tmp/test-watch3
  cat /tmp/test-watch2 > /tmp/test-watch

  # This event doesn't
  dd if=/dev/zero bs=512 count=1 of=/tmp/test-nowatch
*/

(function () {
  var Inotify = require('inotify-plusplus'),
    inotify = Inotify.create(true),
    directive,
    interests;

  interests = [
    "test-watch",
    "test-watch2",
    "test-watch3"
  ];

  directive = {
    close_write: function (ev) {
      // only watch the files we're interested in
      interests.forEach(function (name) {
        if (name === ev.name) {
          console.log(ev);
        }
      });
    }
  };

  inotify.watch(directive, '/tmp');

  if ('undefined' === typeof provide) { provide = function () {}; }
  provide("watch-not-yet-created-files");
}());
