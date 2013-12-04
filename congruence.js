var congruence = (function () {
  'use strict';

  var _ = require('underscore');

  function optional (key) {
    return (/^\(\?\)/).test(key);
  }
  function normalizeOptional (key) {
    return key.slice().replace('(?)', '');
  }
  function wildcard (key) {
    return (/^\(\+\)/i).test(key);
  }
  function normalizeWildcard (key) {
    return key.slice().replace('(+)', '');
  }

  /**
   * Recurse into a subtree and test each node against the template.
   * @private
   */
  function _testSubtree (templateNode, objectNode) {

    // a leaf is reached
    if (!isObjectStrict(templateNode) || _.isUndefined(objectNode)) {
      return _testNode(templateNode, objectNode);
    }

    var templateKeys = _.keys(templateNode),
      objectKeys = _.keys(objectNode),
      keyset = _.reject(_.union(templateKeys, objectKeys), function (key) {
        return (!optional(key) && _.contains(templateKeys, '(?)'+ key)) || key === '(+)';
      });

    return _.all(keyset, function (_key) {
      var subtree, key;

      if (optional(_key)) {
        key = normalizeOptional(_key);
        if (_.isUndefined(objectNode[key])) {
          // ignore an optional key with no value
          return true;
        }
      }
      else {
        key = _key;
      }

      subtree = _testSubtree(templateNode[_key], objectNode[key]);
      if (!subtree && _.has(templateNode, '(+)')) {
        return _testSubtree(templateNode['(+)'], objectNode[key]);
      }
      else {
        return subtree;
      }
    });
  }

  /**
   * Test a node against a particular predicate function or value.
   * @private
   */
  function _testNode (predicate, value) {
    return isDefined(predicate) && _.any([
      _.isFunction(predicate) && predicate(value),
      predicate === value
    ]);
  }

  /**
   * Wrap a regular expression as a congruence predicate.
   */
  function regexAsPredicate (regex) {
    return function (value) {
      return regex.test(value);
    };
  }

  /**
   * Returns true if an object matches a template.
   * @public
   * @param {Object}
   * @param {Object}
   * @param {Array}
   * @example see README
   */
  function test (template, object) {
    if (!_.isObject(object) || !_.isObject(template)) {
      return false;
    }
    return _testSubtree(_.clone(template), object);
  }

  /**
   * Returns true if val is defined; false otherwise.
   * @public
   */
  function isDefined (val) {
    return !_.isUndefined(val);
  }

  /**
   * Returns true if val is a valid date according to the given formats.
   * @public
   */
  function isValidDate (formats) {
    return function (val) {
      return moment(val, formats).isValid();
    };
  }

  /**
   * Return true iff val is at once an object and not a function nor
   * an array.
   * @public
   */
  function isObjectStrict (val) {
    return _.isObject(val) && !_.isFunction(val) && !_.isArray(val);
  }

  /**
   * Negates the return value of the given function, or the given value itself
   * if not a function.
   * @public
   */
  function not (predicate) {
    return function (value) {
      if (_.isFunction(predicate)) {
        return !predicate(value);
      }
      else if (_.isRegExp(predicate)) {
        return !regexAsPredicate(predicate)(value);
      }
      else if (isObjectStrict(predicate) || isObjectStrict(value)) {
        return !_.test(predicate, value);
      }
      return predicate !== value;
    };
  }

  /**
   * Returns true if the value is validated by any one of the provided
   * predicate functions.
   * @public
   */
  function or () {
    var predicates = _.toArray(arguments);

    return function (value) {
      return _.any(predicates, function (predicate) {
        if (_.isFunction(predicate)) {
          return predicate(value);
        }
        else if (_.isRegExp(predicate)) {
          return predicate.test(value);
        }
        else if (isObjectStrict(predicate) || isObjectStrict(value)) {
          return _.test(predicate, value);
        }
        return predicate !== value;
      });
    };
  }

  return {
    isDefined: isDefined,
    isValidDate: isValidDate,
    isObjectStrict: isObjectStrict,
    or: or,
    not: not,
    test: test
  };
})();
module.exports = congruence;
