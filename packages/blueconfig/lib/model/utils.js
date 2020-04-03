const parsePath = require('objectpath').parse
const stringifyPath = require('objectpath').stringify

const Parser = require('../performer/parser.js')

const cvtError = require('./../error.js')
const PATH_INVALID = cvtError.PATH_INVALID

// With 'in': Prevent error: 'Cannot use 'in' operator to search for {key} in {value}'
function isObjNotNull(obj) {
  return typeof obj === 'object' && obj !== null
}

function unroot(text) {
  return text.replace(/^root(\.|\[)/g, (_, b) => (b === '[') ? '[' : '')
}

// TRAVERSE

function walk(obj, path, initializeMissing) {
  if (path) {
    path = Array.isArray(path) ? path : parsePath(path)
    const sibling = path.slice(0)
    const historic = []
    while (sibling.length) {
      const key = sibling.shift()

      if (key !== '_cvtProperties') {
        historic.push(key)
      }

      if (initializeMissing && obj[key] == null) {
        obj[key] = {}
        obj = obj[key]
      } else if (isObjNotNull(obj) && key in obj) {
        obj = obj[key]
      } else {
        const noCvtProp = (path) => path !== '_cvtProperties'
        throw new PATH_INVALID(stringifyPath(path.filter(noCvtProp)), stringifyPath(historic), {
          path: unroot(stringifyPath(historic.slice(0, -1))),
          value: obj
        })
      }
    }
  }

  return obj
}

module.exports = {
  isObjNotNull,
  unroot,
  walk
}
