const stringifyPath = require('objectpath').stringify

const utils = require('./utils.js')
const unroot = utils.unroot

const cvtError = require('./../../error.js')
const PATH_INVALID = cvtError.PATH_INVALID
const VALUE_INVALID = cvtError.VALUE_INVALID


function validator(strictValidation) {
  const node = this._instance
  const schema = this._schema

  const errors = {
    undeclared: [],
    invalid_type: [],
    missing: []
  }

  function applyValidation(node, schema, path) {
    const nodeKeys = Object.keys(node || {})
    const schemaKeys = Object.keys(schema)

    const keys = [...nodeKeys, ...schemaKeys]

    for (let i = 0, len = keys.length; i < len; i++) {
      const name = keys[i]

      if (keys.indexOf(name) === i) {
        const fullpath = [...path, name]

        if (schemaKeys.indexOf(name) === -1) {
          // If schema[name] doesn't exist:
          if (strictValidation) {
            const err = new VALUE_INVALID("configuration param '" + unroot(stringifyPath(fullpath)) + "' not declared in the schema")
            errors.undeclared.push(err)
          }
        } else if (nodeKeys.indexOf(name) !== -1) {
          // If node[name] and schema[name] exist:
          if (!schema[name]._cvtProperties) {
            // Is a property:
            if (schema[name].attributes.required || !(typeof schema[name].attributes.default === 'undefined' &&
                  node[name] === schema[name].attributes.default)) {
              try {
                schema[name].validate(node[name])
              } catch (err) {
                errors.invalid_type.push(err)
              }
            }
          } else {
            applyValidation(node[name], schema[name]._cvtProperties, fullpath)
          }
        } else {
          // If node[name] doesn't exist and schema[name] exists:
          const fullname = unroot(stringifyPath(fullpath))
          const notfound = new PATH_INVALID(fullname, path, name, node)
          const error = new VALUE_INVALID(`config parameter "${fullname}" missing from config, did you override its parent? Because ${notfound.why}.`)
          errors.missing.push(error)
        }
      }
    }
  }

  applyValidation(node, schema._cvtProperties, [])

  return errors
}

module.exports = validator
