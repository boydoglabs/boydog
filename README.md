# boydog

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/boydoglabs/boydog-demo)
[![Build Status](https://travis-ci.org/boydoglabs/boydog-demo.png?branch=master)](https://travis-ci.org/boydoglabs/boydog-demo)

BoyDog is a framework for building ultra-fast, real-time collaborative web applications. Demo: [www.boy.dog](http://www.boy.dog/).

![](https://raw.githubusercontent.com/boydoglabs/boydog-demo/master/sample.gif)

*Status: Beta*

## Realtime directives

 - bd-value: Binds `<input>` value.
 - bd-html: Bind element inner HTML.
 - bd-id: Bind tag id.
 - bd-class: Bind tag classes.

Examples:
 - `<input bd-value="editor">`
 - `<p class="alert" bd-html="alertInfo"></p>`
 - `<p bd-class="alert.class" bd-html="alert.info"></p>`

## Roadmap:

 - [x] Travis tests
 - [x] Alpha release
 - [ ] Implement server middleware
 - [ ] Allow users to see where other users are
 - [ ] Implement plug-in system for extensibility
 - [ ] Create `bd-for="n"` directive to create and bind `n` elements

## Changelog

 - 2.X.X: Removed Puppeteer. Huge space improvements over previous version. Module 'boydog-client' no longer needed. Client module automatically starts and now there is no need to initialize it manually.
 - 1.X.X: Initial alpha realease.

## License

[MIT] © boy.dog