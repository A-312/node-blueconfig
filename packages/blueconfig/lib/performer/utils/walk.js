const parsePath = require('objectpath').parse
const stringifyPath = require('objectpath').stringify

const utils = require('./utils.js')
const isObjNotNull = utils.isObjNotNull

const cvtError = require('./../../error.js')
const PATH_INVALID = cvtError.PATH_INVALID


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
        throw new PATH_INVALID(stringifyPath(path.filter(noCvtProp)), historic.slice(0, -1), historic[historic.length - 1], obj)
      }
    }
  }

  return obj
}

module.exports = walk
