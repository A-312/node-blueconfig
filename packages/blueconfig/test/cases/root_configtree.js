'use strict';

const blueconfig = require('blueconfig');
const LISTOFERRORS = require('blueconfig/lib/error.js').LISTOFERRORS;

function isObjNotNull(obj) {
  return typeof obj === 'object' && obj !== null;
}

exports.formats = {
  children: {
    validate: function(children, schema, fullname) {
      const errors = [];

      if (!isObjNotNull(children)) {
        throw new Error('must be of an Object not null');
      }

      Object.keys(children).forEach((keyname) => {
        try {
          const conf = blueconfig(schema.children).merge(children[keyname]).validate();
          this.set(keyname, conf.getProperties());
        } catch (err) {
          err.parent = fullname + '.' + keyname;
          errors.push(err);
        }
      });

      if (errors.length !== 0) {
        throw new LISTOFERRORS(errors)
      }
    }
  }
};

exports.conf = {
  format: 'children',
  default: {},
  children: {
    // conf.{country-name}.xxx:
    name: {
      format: 'String',
      default: undefined,
      required: true
    },

    population: {
      format: 'int',
      default: 0
    },

    subregion: {
      format: 'String',
      default: 'Europe'
    }
  }
};

exports.data = {
  germany: {
    name: 1,
    population: '83783942 persons',
    subregion: 'Western Europe'
  },
  france: {
    name: 'France',
    population: 65273511
  },
  italy: {
    name: 'Italy',
    population: 60461826,
    subregion: 2
  }
};
