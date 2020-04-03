const cloneDeep = require('lodash.clonedeep')

const utils = require('./utils.js')
const walk = utils.walk
const unroot = utils.unroot
const isObjNotNull = utils.isObjNotNull

/**
 * Apply values/getters on COM
 *
 * @class
 */
function Apply() {

}


module.exports = new Apply()


/**
 * Apply getters values
 */
Apply.prototype.getters = function applyGetters(schema, node) {
  Object.keys(schema._cvtProperties).forEach((name) => {
    const mySchema = schema._cvtProperties[name]
    if (mySchema._cvtProperties) {
      if (!node[name]) {
        node[name] = {}
      }
      applyGetters.call(this, mySchema, node[name])
    } else {
      const actualOrigin = mySchema._cvtGetOrigin && mySchema._cvtGetOrigin()
      const actualLevel = (actualOrigin) ? this._getters.order.indexOf(actualOrigin) : 0

      for (let i = this._getters.order.length - 1; i >= 0; i--) {
        if (i < actualLevel) {
          break // stop if the current getter is higher
        }

        const getterName = this._getters.order[i] // getterName
        const getterObj = this._getters.list[getterName]
        let propagationAsked = false // #224 accept undefined

        if (!getterObj || !(getterName in mySchema)) {
          continue
        }
        const getter = getterObj.getter
        const keyname = cloneDeep(mySchema[getterName])
        const stopPropagation = () => { propagationAsked = true }

        // call getter
        node[name] = getter.call(this, keyname, mySchema, stopPropagation)

        if (typeof node[name] !== 'undefined' || propagationAsked) {
          // We use function because function are not saved/exported in schema
          mySchema._cvtGetOrigin = () => getterName
          break
        }
      }
    }
  })
}


/**
 * Apply values from config merged
 */
Apply.prototype.values = function applyValues(from, to, schema) {
  const indexVal = this._getters.order.indexOf('value')
  Object.keys(from).forEach((name) => {
    const mySchema = (schema && schema._cvtProperties) ? schema._cvtProperties[name] : null
    // leaf
    if (Array.isArray(from[name]) || !isObjNotNull(from[name]) || !schema || schema.format === 'object') {
      const bool = mySchema && mySchema._cvtGetOrigin
      const lastG = bool && mySchema._cvtGetOrigin()

      if (lastG && indexVal < this._getters.order.indexOf(lastG)) {
        return
      }

      /**
       * Coerce function to convert a value to a specified function.
       *
       * @callback ConfigObjectModel._cvtCoerce
       * @param    {*}    value    Value to coerce
       * @returns  {*}    value    Returns coerced value
       *
       * @example
       * const int = {
       *   name: 'int',
       *   coerce: (value) => (typeof value !== 'undefined') ? parseInt(value, 10) : value,
       *   validate: function(value) {
       *     assert(Number.isInteger(value), 'must be an integer')
       *   }
       * }
       * 
       */
      const coerce = (mySchema && mySchema._cvtCoerce) ? mySchema._cvtCoerce : (v) => v
      to[name] = coerce(from[name])
      if (lastG) {
        mySchema._cvtGetOrigin = () => 'value'
      }
    } else {
      if (!isObjNotNull(to[name])) to[name] = {}
      applyValues.call(this, from[name], to[name], mySchema)
    }
  })
}
