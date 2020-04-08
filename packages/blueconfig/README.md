# Blueconfig

[![NPM version](http://img.shields.io/npm/v/blueconfig.svg)](https://www.npmjs.org/package/blueconfig)
[![Build Status](https://travis-ci.com/A-312/node-blueconfig.svg?branch=master)](https://travis-ci.com/A-312/node-blueconfig)
[![Coverage Status](https://coveralls.io/repos/github/A-312/node-blueconfig/badge.svg?branch=master)](https://coveralls.io/github/A-312/node-blueconfig?branch=master)

Blueconfig is schema validator for your config files on production or development environment. Blueconfig merges configs and validates them depending of a pattern called *schema*. Configs can be an object or a file (json, yaml...).

Introducing a configuration schema, blueconfig gives project collaborators more **context** on each setting and enables **validation and early failures** for when configuration goes wrong.

*This is a fork of node-convict 5.x because I had lot of changes todo (more than the workflow of node-convict can process).*

# Why Blueconfig ?

 1) Merge several config in one ;
 2) Support environmental variables and Command-line arguments ;
 2) Validate your config with your schema ;
 3) Customize your schema and your validation (with custom format, type and type converter) ;
 5) Use your own file format (JSON, JSON5, YAML, TOML, XML...) ; *(JSON5 allows comment)*
 6) Only 3 dependancies (Blueconfig 7.0 will have only 2 dependancies).

**Install:** `npm install blueconfig`

# Exemple

## Schema

```yml
# Schema <blueconfig.js.org>
# database.yml
db:
  name:
    # db.name
    format: 'String'
    default: ''
  password:
    # db.password
    format: 'String'
    sensitive: true
    required: true
    env: PWD
  host:
    # db.host (require https://www.npmjs.com/package/blueconfig-format-with-validator)
    format: 'ipaddress'
    default: '127.0.0.1'
  port:
    # db.port
    format: 'port'
    default: 80
    arg: 'port'
```

See more on: https://blueconfig.js.org/
