const cloneDeep = require('lodash.clonedeep')

const utils = require('./utils/utils.js')
const unroot = utils.unroot
const isObjNotNull = utils.isObjNotNull

/**
 * Apply values/getters on COM
 *
 * @private
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
      const currentOrigin = mySchema._cvtGetOrigin && mySchema._cvtGetOrigin()
      const currentLevel = (currentOrigin) ? this._getters.order.indexOf(currentOrigin) : 0

      for (let i = this._getters.order.length - 1; i >= 0; i--) {
        if (i < currentLevel) {
          break // stop if the current getter is higher
        }

        const getterName = this._getters.order[i] // getterName
        const getterObj = this._getters.list[getterName]
        let propagationAsked = false // #224 accept undefined

        if (!getterObj || !(getterName in mySchema)) {
          continue
        }
        const getter = getterObj.getter
        const value = cloneDeep(mySchema[getterName])
        const stopPropagation = () => { propagationAsked = true }

        /**
         * Will get an external value depending of custom getter/code
         *
         * @callback ConfigObjectModel.getterCallback
         *
         * @example
         * blueconfig.addGetter({
         *   property: 'accept-undefined',
         *   getter: (value, schema, stopPropagation) => fs.readFileSync(value, 'utf-8').toString(),
         *   usedOnlyOnce: true // use file only once
         * });
         *
         * @param    {*}           value       Value to coerce
         * @param    {string}      mySchema    Value to coerce
         * @param    {function}    value       Stop propagation (accept undefined value). By default,
         *                                     undefined don't stop the getter queue, this mean Blueconfig
         *                                     will continue to call other getter to find a value not undefined.
         *
         * @returns  {*}    value    Returns coerced value
         */
        // call getter
        node[name] = getter.call(this, value, mySchema, stopPropagation)

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
       * @param    {*}    value    Value to coerce
       *
       * @returns  {*}    value    Returns coerced value
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
