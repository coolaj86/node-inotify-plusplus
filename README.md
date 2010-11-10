node-inotify++
====

A wrapper around [`node-inotify`](http://github.com/c4milo/node-inotify) which is more like `JavaScript` and less like `C`.

  * strings instead of bitmasks
  * self-documenting: `console.dir(inotify)` tells you just about all you need to know.
  * each event has a default handler
  * by default only the events which have callbacks are listened to
    * `all_events` listens to all events with registered callbacks
    * the option `all_events_is_catchall` causes `all_events` to listen on all events, period.

Usage
====

instantiation
----

    var Inotify = require('inotify-plusplus'), // should be 'inotify++', but npm has issues with the ++
        inotify,
        directive,
        options;

    inotify = Inotify.create(true); // stand-alone, persistent mode, runs until you hit ctrl+c
    //inotify = Inotify.create(); // quits when event queue is empty

with Default Handlers
----

The default handler simply outputs the `docstring` such as "File was opened"

    directive = {
        access: true,
        close_write: true,
        open: true
    };
    options = {
        allow_bad_paths: true, // (default false) don't throw an error if the path to watch doesn't exist
    };
    inotify.watch(directive, './path/to/watch', {});

with Custom Handlers
----

    directive = {
        all_events: function (ev) {
          console.log("some things happened: " + ev.masks.toString())
        },
        moved_from: true
    }
    options = {
        all_events_is_catchall: true // by default (false) "all_events" only catches events already listened for.
                                     // this option tells "all_events" to catch all events, period.
    }
    inotify.watch(directive, './path/to/watch');

note that "ev.masks" is an array of strings, not a bitmask and "ev.watch" is the path rather than the watch descriptor.

Example `ev`:

    { watch: '/path/to/watch', masks: '["access", "move_to"]', cookie: 1, name: 'name_of_file' }

with Modules
----

    directive = (function() {
        // private variables
        var count = 0,
          validate_watch,
          move,
          cookies = {};

        // shared method
        move = function (ev) {
            var pre = cookies[ev.cookie];
            if (pre) {
              console.log("finished move from " + pre.name + " to " + ev.name);
              cookies[ev.cookie] = undefined;
              delete cookies[ev.cookie];
            } else {
              // expires the cookie if the move doesn't complete in this watch
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
        return {
          all_events: function(ev) {
            // example ev: { watch: '/path/to/watch', masks: '["access", "move_to"]', cookie: 1, name: 'name_of_file' }
            validate_watch();
            count += 1;
            console.log("These masks were just activated: '" + ev.masks.toString() + "' for '" + ev.name + "'.");
          },
          access: function (ev) {
            console.log(ev.name + " was accessed.");
          },
          moved_to: move,
          moved_from: move,
          delete: true
        };
    }());
    inotify.watch(directive, './path/to/watch');

stopping / restarting watch
----

    var unwatch, rewatch;
    unwatch = inotify.watch(dirctive, path);
    rewatch = unwatch(); // stops watching
    unwach = rewatch();

Installation
====

Install node-inotify:

    cd ~/
    git clone git://github.com/c4milo/node-inotify.git
    cd node-inotify
    node-waf configure build

    # or

    npm install inotify

Install node-inotify++:

    mkdir ~/.node_libraries/
    wget http://github.com/coolaj86/node-inotify-plusplus/blob/master/lib/inotify%2B%2B.js -O \
      ~/.node_libraries/inotify++.js

    # or

    npm install inotify-plusplus # installing inotify from npm currently fails and hence this may fail

Documentation
====

`console.dir(Inotify.watch_for_doc);`
    {
        access: "File was accessed (read)",
        attrib: "Metadata changed, e.g., permissions, timestamps, extended attributes, link count (since Linux 2.6.25), UID, GID, etc.",
        close_write: "File opened for writing was closed",
        close_nowrite: "File not opened for writing was closed",
        create: "File/directory created Inotify the watched directory",
        "delete": "File/directory deleted from the watched directory",
        delete_self: "Watched file/directory was deleted",
        modify: "File was modified",
        move_self: "Watched file/directory was moved",
        moved_from: "File moved out of the watched directory",
        moved_to: "File moved into watched directory",
        open: "File was opened",
        all_events: "Watch for all kind of events",
        close: "(IN_CLOSE_WRITE | IN_CLOSE_NOWRITE) Close",
        move: "(IN_MOVED_FROM | IN_MOVED_TO) Moves"
    }

`console.dir(Inotify.info_doc);`
    {
        in_ignored: "Watch was removed explicitly with inotify.removeWatch(watch_descriptor) or automatically (the file was deleted, or the file system was unmounted)",
        in_isdir: "Subject of this event is a directory",
        in_q_overflow: "Event queue overflowed (wd is -1 for this event)",
        in_unmount: "File system containing the watched object was unmounted"
    }

`console.dir(Inotify.flags_doc);`
    {
      onlydir: "only watch the path if it is a directory.",
      dont_follow: "do not follow symbolics links",
      oneshot: "only send events once",
      mask_add: "add (or) events to watch mask for this pathname if it already exists (instead of replacing the mask)."
    }
