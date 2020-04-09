# Node-blueconfig

[![Dependency Status](https://david-dm.org/A-312/node-blueconfig.svg)](https://david-dm.org/A-312/node-blueconfig)
[![devDependency Status](https://david-dm.org/A-312/node-blueconfig/dev-status.svg)](https://david-dm.org/A-312/node-blueconfig#info=devDependencies)
[![Build Status](https://travis-ci.com/A-312/node-blueconfig.svg?branch=master)](https://travis-ci.com/A-312/node-blueconfig)
[![Coverage Status](https://coveralls.io/repos/github/A-312/node-blueconfig/badge.svg?branch=master)](https://coveralls.io/github/A-312/node-blueconfig?branch=master)

Blueconfig is schema validator for your config files on production or development environment. Blueconfig merges configs and validates them depending of a pattern called *schema*. Configs can be an object or a file (json, yaml...).

Introducing a configuration schema, blueconfig gives project collaborators more **context** on each setting and enables **validation and early failures** for when configuration goes wrong.

This repository is a collection of packages, [blueconfig](/packages/blueconfig/) is the main package:

[![NPM version](http://img.shields.io/npm/v/blueconfig.svg)](https://www.npmjs.org/package/blueconfig)

## Packages

 - [blueconfig](/packages/blueconfig/)

  Main package. *This is a fork of node-convict because workflow of node-convict is too slow and there is no dialog about future changes. I had so many changes that I can't wait, I already waited 6 months, I got only less 1/4 of my changes merged.*

 - [blueconfig-format-with-moment](/packages/blueconfig-format-with-moment/)

  Format 'duration' and 'timestamp'.

 - [blueconfig-format-with-validator](/packages/blueconfig-format-with-validator/)

  Format 'email', 'ipaddress' and 'url' for blueconfig.
