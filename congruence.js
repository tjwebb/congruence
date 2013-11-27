var congruence = (function () {
  'use strict';

  var _ = require('underscore');

  /**
   * Recurse into a subtree and test each node against the template.
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

  /**
   * Test a node against a particular predicate function or value.
   * @private
   */
  function _testNode (predicate, value) {
    return _.isFunction(predicate) ? predicate(value) : value === predicate;
  }

  return {

    /**
     * Returns true if an object matches a template.
     * @public
     * @param {Object}
     * @param {Object}
     * @example see README
     */
    test: function(template, object) {
      return _testSubtree(template, object);
    },

    /**
     * Returns true if val is defined; false otherwise.
     * @public
     */
    isDefined: function (val) {
      return !_.isUndefined(val);
    },

    /**
     * Return true iff val is at once an object and not a function nor
     * an array.
     * @public
     */
    isObjectStrict: function (val) {
      return _.isObject(val) && !_.isFunction(val) && !_.isArray(val);
    },

    /**
     * Negates the return value of the given function, or the given value itself
     * if not a function.
     * @public
     */
    not: function (predicate) {
      if (!_.isFunction(predicate)) {
        return !predicate;
      }
      return function () {
        return !predicate(arguments);
      };
    }
  };
})();
module.exports = congruence;
