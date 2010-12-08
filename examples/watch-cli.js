#!/usr/bin/env node
(function () {
  var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    dirs = {};

  //require('remedial');

  function usage() {
    util.puts("Usage: watch [node1] [node2] [...]");
  }

  function watch(dir, file) {
    var func = dirs[dir] = dirs[dir] || function (ev) {
      var files = dirs[dir].files = dirs[dir].files || [];

      files.forEach(function (file) {
        if (ev.name === file) {
          ev.date = (new Date()).toUTCString();
          util.puts("[" + (new Date()).toUTCString() + "] " +
            ev.watch + '/' + ev.name + ' ' +
            ev.masks.toString());
        }
      });
    };
    
    func.files = func.files || [];
    func.files.push(file);
    return func;
  }

  function main() {
    var inotify = require('inotify-plusplus').create(true),
      files = process.argv;

    files.shift();
    files.shift();

    if (files.length < 1) {
      usage();
      process.exit(1);
    }

    files.forEach(function (file) {
      if ('/' != file[0]) {
        file = './' + file;
      }
      file = path.normalize(file);

      fs.stat(file, function (err, stat) {
        var dir = path.dirname(file);
        if (err) {
          //util.debug(err.message);
          stat = {};
          stat.isDirectory = function () {
            return false;
          };
        }
        if (stat.isDirectory()) {
          inotify.watch({ all_events: function (ev) { util.puts(ev); } }, file, {all_events_is_catchall: true});
        } else {
          file = file.substr(file.lastIndexOf('/')+1);
          inotify.watch({ all_events: watch(dir, file) }, dir, {all_events_is_catchall:true});
        }
      });
    });
    util.puts(files);
  }
  main();
}());
