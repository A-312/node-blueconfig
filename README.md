# Node-blueconfig

[![Dependency Status](https://david-dm.org/mozilla/node-blueconfig.svg)](https://david-dm.org/mozilla/node-blueconfig)
[![devDependency Status](https://david-dm.org/mozilla/node-blueconfig/dev-status.svg)](https://david-dm.org/mozilla/node-blueconfig#info=devDependencies)
[![Build Status](https://travis-ci.org/mozilla/node-blueconfig.svg?branch=master)](https://travis-ci.org/mozilla/node-blueconfig)
[![Coverage Status](https://coveralls.io/repos/github/mozilla/node-blueconfig/badge.svg?branch=master)](https://coveralls.io/github/mozilla/node-blueconfig?branch=master)

*This is a fork of node-convict*

Blueconfig expands on the standard pattern of configuring node.js applications in a way that is more robust and accessible to collaborators, who may have less interest in digging through imperative code in order to inspect or modify settings. By introducing a configuration schema, blueconfig gives project collaborators more **context** on each setting and enables **validation and early failures** for when configuration goes wrong.

This repository is a collection of packages.

## Packages

 - [blueconfig](/packages/blueconfig/)

  Main package.

 - [blueconfig-format-with-moment](/packages/blueconfig-format-with-moment/)

  Format 'duration' and 'timestamp'.

 - [blueconfig-format-with-validator](/packages/blueconfig-format-with-validator/)

  Format 'email', 'ipaddress' and 'url' for blueconfig.
