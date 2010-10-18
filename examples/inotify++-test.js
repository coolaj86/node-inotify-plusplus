var Inotify = require('./inotify++'),
  inotify,
  directive,
  is_watching = false,
  did_fail = false;

console.log("DESCRIPTION: Inotify");
console.dir(Inotify); // describes inotify well

inotify = Inotify.create(true); // persistent mode
console.log("DESCRIPTION: Inotify.create()");
console.dir(inotify); // describes instance well

// enclosing data in module
directive = (function() {
    var count = 0,
      validate_watch,
      move,
      cookies = {};

    validate_watch = function () {
      if (!is_watching) {
        throw new Error('should not be watching, but is');
      }
    };

    move = function (ev) {
        var pre = cookies[ev.cookie];
        if (pre) {
          console.log("finished move from " + pre.name + " to " + ev.name);
          cookies[ev.cookie] = undefined;
          delete cookies[ev.cookie];
        } else {
          console.log("began move of " + ev.name);
          cookies[ev.cookie] = ev;
          setTimeout(function () {
            cookies[ev.cookie] = undefined;
            delete cookies[ev.cookie];
          }, 500);
        }
    };
    
    // will listen to three events
    // multiple events may fire at the same time
    // ev = { watch: 'int', masks: '["access", "move_to"]', cookie: 'int', name: 'string' }
    return {
      all_events: function(ev) {
        validate_watch();
        count += 1;
        console.log("These masks were just activated: ");
        console.log(ev.masks);
      },
      access: function (ev) {
        console.log(ev.name + " was accessed.");
      },
      moved_to: move,
      moved_from: move,
      delete: true // uses default listener 
    };
}());


did_fail = false;
try {
  inotify.watch();
  inotify.watch(directive);
} catch(e) {
  did_fail = true;
}
if (!did_fail) {
  throw new Error("should not have allowed bad entry");
}

var unwatch = inotify.watch(directive, '/home/coolaj86/test');


// TODO test that it should not watch for events
var rewatch = unwatch();
unwatch(); // should be silently ignored

rewatch()
is_watching = true;
