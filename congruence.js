var congruence = (function () {
  'use strict';

  var _ = require('underscore');

  /**
   * @private
   */
  function _testSubtree (template, node) {
    if (_.isFunction(template)) {
      return template(node);
    }

    if (_.isEmpty(node) || !_.isObject(node)) {
      return _testNode(template, node);
    }

    var nodeKeys = _.keys(node),
        templateKeys = _.keys(template),
        keyIntersection = _.intersection(nodeKeys, templateKeys),
        keyUnion = _.union(nodeKeys, templateKeys);

    return (
      keyIntersection.length === keyUnion.length &&
      _.all(_.keys(node), function (key) {
        return _testSubtree(template[key], node[key]);
      })
    );
  }

  function _testNode (predicate, value) {
    return _.isFunction(predicate) ? predicate(value) : value === predicate;
  }

  return {

    /**
     * Returns true if an object matches a template.
     * @param {Object}
     * @param {Object}
     *
     * @example _.test({
     *    a: 1,
     *    foo: 'bar',
     *    list: [1, 2, 3],
     *    obj: {
     *      b: 2
     *    },
     *    struct: {
     *      c: 3
     *    },
     *    exact: 3.141592,
     *    junk: null
     *    wildcard: "hello" + 123
     *  },
     *  {
     *    a: _.isNumber,
     *    foo: _.isString,
     *    list: _.isArray,
     *    obj: _.isObject,
     *    struct: {
     *      c: _.isNumber
     *    },
     *    exact: 3.141592,
     *    junk: _.isNull,
     *    wildcard: _.identity
     *  });
     */
    test: function(template, object) {
      return _testSubtree(template, object);
    },

    isDefined: function (val) {
      return !_.isUndefined(val);
    },

    isObjectStrict: function (val) {
      return _.isObject(val) && !_.isFunction(val) && !_.isArray(val);
    }
  };

})();
module.exports = congruence;
