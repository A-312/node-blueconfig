const cloneDeep = require('lodash.clonedeep')

const utils = require('../performer/utils/utils.js')
const unroot = utils.unroot

const cvtError = require('../error.js')

const LISTOFERRORS = cvtError.LISTOFERRORS
const FORMAT_INVALID = cvtError.FORMAT_INVALID


/**
 * Class for configNode, created with blueprint class.
 *
 * @private
 * @class
 */
function SchemaNode(rawSchema) {
  const schema = cloneDeep(rawSchema)

  this._private = {
    origin: undefined,
    validate: () => {},
    coerce: (v) => v
  }

  /**
   * Actualy schema is the public object given in the API
   *
   * @name schema
   * @memberOf SchemaNode
   *
   * @class
   *
   * @deprecated `schema.default` will become `schemaNode.getAttributes('default')`
   */

  this.attributes = schema

  /**
   * Attributes are: schema.default, schema.format, schema.doc, schema.env, schema.arg...
   *
   * @name {attributes}
   * @memberOf SchemaNode.schema
   *
   * @instance
   * @deprecated `schema.default` will become `schemaNode.getAttributes('default')`
   */
  // this.attributes.schema

  /**
   * Get origin
   *
   * @name _cvtGetOrigin
   * @memberOf SchemaNode.schema
   *
   * @instance
   * @deprecated `schema._cvtGetOrigin` will become `schemaNode.getOrigin()` and `schema.default` will become `schemaNode.getAttributes('default')`
   */
  Object.defineProperty(this.attributes, '_cvtGetOrigin', {
    enumerable: false,
    configurable: false,
    writable: true,
    value: () => {
      return this._private.origin
    }
  })


  /**
   * Validate config property
   *
   * @name _cvtValidateFormat
   * @memberOf SchemaNode.schema
   *
   * @instance
   * @deprecated `schema._cvtValidateFormat` will become `schemaNode.validate()` and `schema.default` will become `schemaNode.getAttributes('default')`
   */
  Object.defineProperty(this.attributes, '_cvtValidateFormat', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: (value) => {
      this._private.validate(value)
    }
  })


  /**
   * Coerce config property
   *
   * @name _cvtCoerce
   * @memberOf SchemaNode.schema
   *
   * @instance
   * @deprecated `schema._cvtCoerce` will become `schemaNode.coerce()` and `schema.default` will become `schemaNode.getAttributes('default')`
   */
  Object.defineProperty(this.attributes, '_cvtCoerce', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: (value) => {
      return this._private.coerce(value)
    }
  })
}


module.exports = SchemaNode


SchemaNode.prototype.validate = function(value) {
  const schema = this.attributes
  const fullpath = this._private.fullpath
  try {
    this._private.validate(value, schema, fullpath)
  } catch (err) {
    if (err instanceof LISTOFERRORS) {
      err.message = `${fullpath}: Custom format "${schema.format}" tried to validate something and failed:`

      err.errors.forEach((error, i) => {
        err.message += `\n    ${i + 1}) ${unroot(error.parent)}:` + ('\n' + error.why).replace(/(\n)/g, '$1    ')
      })

      throw err
    } else {
      // Origin of the value, is getter {name}.
      const name = this._private.origin
      const keyname = (schema[this._private.origin]) ? schema[name] : ''
      const getter = { name, keyname }

      throw new FORMAT_INVALID(fullpath, err.message, getter, value)
    }
  }
}


SchemaNode.prototype.coerce = function(value) {
  return this._private.coerce(value)
}


SchemaNode.prototype.getOrigin = function() {
  return this._private.origin
}
