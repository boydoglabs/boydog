# boydog

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/boydoglabs/boydog-demo)
[![Build Status](https://travis-ci.org/boydoglabs/boydog-demo.png?branch=master)](https://travis-ci.org/boydoglabs/boydog-demo)

BoyDog is a framework for building ultra-fast, real-time collaborative web applications. BoyDog uses ShareDB's OT (operational transforms) to keep data consistent even if multiple users are editing the same text at the same time.

![](https://raw.githubusercontent.com/boydoglabs/boydog-demo/master/sample.gif)
Demo: [www.boy.dog](http://www.boy.dog/).

## Getting started

See instructions at [boydog demo](http://www.boy.dog/)

## Directives

For real-time binding:
 - bd-value: Binds element's value (i.e. bind `<input>` or `<textarea>` text).
 - bd-html: Bind element inner HTML.
 - bd-id: Bind tag id.
 - bd-class: Bind tag classes.

Settings:
 - bd-verbose: Output the payload upon receiving a message.

Examples:
 - `<input bd-value="editor">`
 - `<p class="alert" bd-html="alertInfo"></p>`
 - `<p bd-class="alert.class"></p>`

## Roadmap:

 - [x] Travis tests
 - [x] Alpha release
 - [ ] Implement server middleware
 - [ ] Allow users to see where other users are
 - [ ] Implement plug-in system for extensibility
 - [ ] Create `bd-for="n"` directive to create and bind `n` elements

## Changelog

 - 2.0.19: SWAL2 update. Minor improvements.
 - 2.0.18: Several code optimizations. Improved notifications. Minor fixes.
 - 2.0.0: Removed Puppeteer. Huge space improvements over previous version. Module 'boydog-client' no longer needed. Client module automatically starts and now there is no need to initialize it manually.
 - 1.X.X: Initial alpha realease.

## License

[MIT] © boy.dog