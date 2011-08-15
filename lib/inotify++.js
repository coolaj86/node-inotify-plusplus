/*jslint white: true, browser: true, devel: true, es5: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: false, regexp: true, newcap: true, immed: true, strict: true */
"use strict";
(function () {
    var Inotify = require('inotify').Inotify,
        watch_for,
        watch_for_int,
        watch_for_doc,
        info,
        info_doc,
        flags,
        flags_doc,
        unwatch,
        masks,
        masks_doc,
        default_directive,
        makeCallback,
        makeWatchFor,
        create;

    watch_for = {
        access: Inotify.IN_ACCESS,
        modify: Inotify.IN_MODIFY,
        attrib: Inotify.IN_ATTRIB,
        close_write: Inotify.IN_CLOSE_WRITE,
        close_nowrite: Inotify.IN_CLOSE_NOWRITE,
        close: Inotify.IN_CLOSE,
        open: Inotify.IN_OPEN,
        moved_from: Inotify.IN_MOVED_FROM,
        moved_to: Inotify.IN_MOVED_TO,
        move: Inotify.IN_MOVE,
        create: Inotify.IN_CREATE,
        "delete": Inotify.IN_DELETE,
        delete_self: Inotify.IN_DELETE_SELF,
        move_self: Inotify.IN_MOVE_SELF,
        all_events: Inotify.IN_ALL_EVENTS
    };

    watch_for_int = (function () {
        var obj = {};
        Object.keys(watch_for).forEach(function (key) {
            obj[watch_for[key]] = key;
        });
        return obj;
    }());

    info = {
        unmount: Inotify.IN_UNMOUNT,
        q_overflow: Inotify.IN_Q_OVERFLOW,
        ignored: Inotify.IN_IGNORED,
        isdir: Inotify.IN_ISDIR
    };

    flags = {
        onlydir: Inotify.IN_ONLYDIR,
        dont_follow: Inotify.IN_DONT_FOLLOW,
        mask_add: Inotify.IN_MASK_ADD,
        oneshot: Inotify.IN_ONESHOT
    };

    watch_for_doc = {
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
    };

    info_doc = {
        in_ignored: "Watch was removed explicitly with inotify.removeWatch(watch_descriptor) or automatically (the file was deleted, or the file system was unmounted)",
        in_isdir: "Subject of this event is a directory",
        in_q_overflow: "Event queue overflowed (wd is -1 for this event)",
        in_unmount: "File system containing the watched object was unmounted"
    };

    flags_doc = {
      onlydir: "only watch the path if it is a directory.",
      dont_follow: "do not follow symbolics links",
      oneshot: "only send events once",
      mask_add: "add (or) events to watch mask for this pathname if it already exists (instead of replacing the mask)."
    }

    masks = {};
    Object.keys(info).forEach(function (key, index, arr) {
        masks[key] = info[key];
    });
    Object.keys(watch_for).forEach(function (key, index, arr) {
        masks[key] = watch_for[key];
    });

    masks_doc = {};
    Object.keys(info_doc).forEach(function (key, index, arr) {
        masks_doc[key] = info_doc[key];
    });
    Object.keys(watch_for_doc).forEach(function (key, index, arr) {
        masks_doc[key] = watch_for_doc[key];
    });


    default_directive = {};
    Object.keys(masks).forEach(function (key, index, arr) {
        default_directive[key] = function (ev) {
            console.log(masks_doc[key] + ': ' + ev.watch || "" + ev.name || "");
        };
    });

    makeCallback = function (directive, path) {
        var callbacks = {};

        // select the callbacks that match the directive
        // and associate them with the integer
        Object.keys(watch_for_int).forEach(function (key) {
            var callback = directive[watch_for_int[key]];
            if (callback) {
                callbacks[key] = (true === callback) ? default_directive[watch_for_int[key]] : callback;
            }
        });

        // bitwise AND the functions which match, and execute them
        return function (ev) {
            var masks = [];
            Object.keys(watch_for_int).forEach(function (key) {
                var has_mask = parseInt(key, 10) & parseInt(ev.mask, 10);
                has_mask = has_mask || 0;
                if (has_mask) {
                    masks.push(watch_for_int[key]);
                }
            });

            Object.keys(callbacks).forEach(function (key) {
                var has_mask = parseInt(key, 10) & parseInt(ev.mask, 10);
                has_mask = has_mask || 0;
                if (has_mask) {
                    callbacks[key]({
                        watch: path,
                        masks: masks,
                        cookie: ev.cookie,
                        name: ev.name
                    });
                }
            });
        };
    };

    makeWatchFor = function (directive, catchall) {
        var mask;
        Object.keys(directive).forEach(function (key) {
            if (true !== catchall && 'all_events' === key) {
              return; // don't listen to all events unless requested to
            }
            mask |= watch_for[key];
        });
        return mask;
    };

    create = function (persist) {
        var inotify, watches, watch;

        inotify = new Inotify(false);
        watches = {};

        watch = function (directive, path, options) {
            var args, wd, unwatch, rewatch;
            args = Array.prototype.slice.call(arguments);
            options = options || {};

            if (!args[0] || !args[0]) {
              // TODO watch for not-yet-created-files
              // auto-unremove on delete
              // allow removeal by path name?
              // recursive
              throw new Error("Usage: inotify_pp.watch(\n" + 
                "    {'inotify_flag': function () {}},\n" +
                "    '/path/to/watch',\n" +
                "    { all_events_is_catchall: false, allow_bad_paths: false }\n" +
                "  );");
            }

            wd = inotify.addWatch({ 
                path: path,
                callback: makeCallback(directive, path),
                watch_for: makeWatchFor(directive, options.all_events_is_catchall)
            });

            if (wd < 0 && !options.allow_bad_paths) {
              throw new Error("Can't watch '" + path + ": it doesn't exist yet.\n" +
                "Note: this kind of watching may be available in the future.");
            }

            watches[wd] = path;

            unwatch = function () {
                watches[wd] = undefined;
                delete watches[wd];
                return rewatch;
            };

            rewatch = function () {
                return watch(directive, path, options);
            };

            return unwatch;
        };

        unwatch = function (path) {
          Object.keys(watches).forEach(function (wd) {
            if (path === watches[wd]) {
              // TODO refactor to removeWatch(wd)
              // TODO reverse path names if recursive
              watches[wd] = undefined;
              delete watches[wd];
            }
          });
        };

        if (true === persist) {
            setInterval(function () {}, 1000);
        }

        return { watch: watch };
    };

    module.exports = {
        create: create,
        info: info,
        masks: masks,
        watch_for: watch_for,
        flags: flags
    };
}());
