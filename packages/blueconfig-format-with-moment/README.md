# Blueconfig-moment

[![NPM version](http://img.shields.io/npm/v/blueconfig-format-with-moment.svg)](https://www.npmjs.org/package/blueconfig-format-with-moment)

Format 'duration' and 'timestamp' for blueconfig with momentjs.

## Install

```shell
npm install blueconfig-format-with-moment
```

## Usage

An example `config.js` file:

```javascript
const blueconfig = require('blueconfig');

blueconfig.addFormat(require('blueconfig-format-with-moment').duration);
blueconfig.addFormat(require('blueconfig-format-with-moment').timestamp);

// Define a schema
var config = blueconfig({
  format: {
    format: 'duration'
  },
  format: {
    format: 'timestamp'
  }
});
```

### Validation

Use [moment.js](http://momentjs.com/) to validate:

* `duration` - milliseconds or a human readable string (e.g. 3000, "5 days")
* `timestamp` - Unix timestamps or date strings recognized by [moment.js](http://momentjs.com/)

### Coercion

Blueconfig will automatically coerce strings variables to their proper types when importing them. `duration` and `timestamp` are also parse and converted into numbers, though they utilize [moment.js](http://momentjs.com/) for date parsing.
