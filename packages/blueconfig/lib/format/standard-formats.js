/**
 * blueconfig-format
 * Standard format for blueconfig
 */
'use strict'

function assert(assertion, err_msg) {
  if (!assertion) {
    throw new Error(err_msg)
  }
}

function toInt(value) {
  return (typeof value !== 'undefined') ? parseInt(value, 10) : value;
}

function isWindowsNamedPipe(x) {
  return String(x).includes('\\\\.\\pipe\\');
}

const int = {
  name: 'int',
  coerce: (value) => toInt(value),
  validate: function(value) {
    assert(Number.isInteger(value), 'must be an integer')
  }
}

// alias
const integer = {
  name: 'integer',
  coerce: int.coerce,
  validate: int.validate
}

const nat = {
  name: 'nat',
  coerce: (value) => toInt(value),
  validate: function(value) {
    assert(Number.isInteger(value) && value >= 0, 'must be a positive integer')
  }
}

const port = {
  name: 'port',
  coerce: (value) => toInt(value),
  validate: function(value) {
    assert(Number.isInteger(value) && value >= 0 && value <= 65535, 'ports must be within range 0 - 65535')
  }
}

const windows_named_pipe = {
  name: 'windows_named_pipe',
  validate: function(value) {
    assert(isWindowsNamedPipe(value), 'must be a valid pipe')
  }
}

const port_or_windows_named_pipe = {
  name: 'port_or_windows_named_pipe',
  coerce: (v) => (isWindowsNamedPipe(v)) ? v : parseInt(v, 10),
  validate: function(value) {
    if (!isWindowsNamedPipe(value)) {
      try {
        port.validate(value)
      } catch (err) { // change error message
        assert(false, 'must be a windows named pipe or a number within range 0 - 65535');
      }      
    }
  }
}

module.exports = {
  int,
  integer,
  nat,
  port,
  windows_named_pipe,
  port_or_windows_named_pipe
}
