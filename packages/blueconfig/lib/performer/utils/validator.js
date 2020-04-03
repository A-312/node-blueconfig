const stringifyPath = require('objectpath').stringify

const cvtError = require('./../../error.js')
const VALUE_INVALID = cvtError.VALUE_INVALID

const walk = require('./walk.js')
const utils = require('./utils.js')
const isObjNotNull = utils.isObjNotNull
const unroot = utils.unroot

function flatten(obj, useProperties) {
  const stack = Object.keys(obj).map((path) => [path])
  const entries = []

  while (stack.length) {
    const path = stack.shift()
    let node = walk(obj, path)
    // Is an object not null and not an array
    if (isObjNotNull(node) && !Array.isArray(node)) {
      if (useProperties) {
        if ('_cvtProperties' in node) {
          node = node._cvtProperties
          path.push('_cvtProperties')
        } else {
          entries.push([path, node])
          continue
        }
      }
      const children = Object.keys(node)

      // Don't filter out empty objects
      if (children.length > 0) {
        children.forEach(function(child) {
          stack.push(path.concat(child))
        })
        continue
      }
    }
    entries.push([path, node])
  }

  const flattened = {}
  entries.forEach(function(entry) {
    let path = entry[0]
    const val = entry[1]

    if (Array.isArray(path) === false) throw new Error('errror : ' + path)

    if (useProperties) {
      path = path.filter((property) => property !== '_cvtProperties')
    }

    flattened[stringifyPath(path)] = val
  })

  return flattened
}

function validator(instance, schema, strictValidation) {
  const errors = {
    undeclared: [],
    invalid_type: [],
    missing: []
  }

  const flatInstance = flatten(instance)
  const flatSchema = flatten(schema._cvtProperties, true)

  Object.keys(flatSchema).forEach(function(name) {
    const schemaItem = flatSchema[name]
    let instanceItem = flatInstance[name]
    if (!(name in flatInstance)) {
      try {
        instanceItem = walk(instance, name)
      } catch (err) {
        let message = 'config parameter "' + unroot(name) + '" missing from config, did you override its parent?'
        if (err.lastPosition && err.type === 'PATH_INVALID') {
          message += ` Because ${err.why}.`
        }
        errors.missing.push(new VALUE_INVALID(message))
        return
      }
    }
    delete flatInstance[name]

    // ignore nested keys of schema 'object' properties
    if (schemaItem.format === 'object' || typeof schemaItem.default === 'object') {
      Object.keys(flatInstance)
        .filter(function(key) {
          return key.lastIndexOf(name + '.', 0) === 0
        }).forEach(function(key) {
          delete flatInstance[key]
        })
    }

    if (schemaItem.required || !(typeof schemaItem.default === 'undefined' &&
          instanceItem === schemaItem.default)) {
      try {
        schemaItem._cvtValidateFormat(instanceItem)
      } catch (err) {
        errors.invalid_type.push(err)
      }
    }
  })

  if (strictValidation) {
    Object.keys(flatInstance).forEach(function(name) {
      const err = new VALUE_INVALID("configuration param '" + unroot(name) + "' not declared in the schema")
      errors.undeclared.push(err)
    })
  }

  return errors
}

module.exports = validator
