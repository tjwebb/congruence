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
  function _testSubtree (templateNode, objectNode, error) {

    // a leaf is reached
    if (!isObjectStrict(templateNode) || !isObjectStrict(objectNode)) {
      return _testNode(templateNode, objectNode, error);
    }

    var templateKeys = _.keys(templateNode),
      objectKeys = _.keys(objectNode),
      keyset = _.reject(_.union(templateKeys, objectKeys), function (key) {
        return (!optional(key) && _.contains(templateKeys, '(?)'+ key)) || key === '(+)';
      }),
      result = _.map(keyset, function (_key) {
        var subtree, key, oldlen = error.length;

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
        subtree = _testSubtree(templateNode[_key], objectNode[key], error);
        if (!subtree && _.has(templateNode, '(+)')) {
          error.splice(-1, (error.length - oldlen));
          return _testSubtree(templateNode['(+)'], objectNode[key], error);
        }
        else {
          return subtree;
        }
      });

    return _.all(result);
  }

  /**
   * Test a node against a particular predicate function or value.
   * @private
   */
  function _testNode (predicate, value, error) {
    return _testPredicate(predicate, value, error);
  }

  /**
   * Test a value/predicate combo, and report any errors.
   */
  function _testPredicate(predicate, value, error) {
    var result = isDefined(predicate) && _.any([
      _.isRegExp(predicate) && predicate.test(value),
      _.isFunction(predicate) && predicate(value, [ ]),
      predicate === value
    ]);

    if (result) return true;

    if (_.isUndefined(value) || _.isUndefined(predicate)) {
      //error.push('predicate is not defined for value [ ' + value + ' ]');
    }
    else if (isObjectStrict(predicate) && !isObjectStrict(value)) {
      error.push('expected (' + value + ') to be an object');
    }
    else if (_.isRegExp(predicate) && !predicate.test(value)) {
      error.push('expected ' + predicate + ' to match ' + value);
    }
    else if (_.isFunction(predicate) && !predicate(value, error)) {
      var f = predicate.name || _.find(_.functions(_), function (name) {
        return _[name] == predicate;
      });
      if (!_.contains([ 'or', 'not' ], f)) {
        error.push((f || 'anonymous') + '(' + value + ') returned false');
      }
    }
    else if (predicate !== value) {
      error.push('expected (' + predicate + ') to equal ' + value);
    }
    else {
      error.push('unknown error');
    }

    return false;
  }

  /**
   * Returns true if an object matches a template.
   * @public
   * @param {Object}
   * @param {Object}
   * @param {Array}
   * @example see README
   */
  function test (template, object, _error) {
    var error = _error || [ ];

    if (!isObjectStrict(object)) {
      error.push('\'object\' must be a valid js object');
    }
    if (!isObjectStrict(template)) {
      error.push('\'template\' must be a valid js object');
    }

    return error.length === 0 && _testSubtree(_.clone(template), object, error);
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
    return _.isObject(val) && !_.isFunction(val) && !_.isArray(val) && !_.isRegExp(val);
  }

  /**
   * Negates the return value of the given function, or the given value itself
   * if not a function.
   * @public
   */
  function not (predicate) {
    return function (value, error) {
      var a = error.length,
        result = !_testSubtree(predicate, value, error);

      if (result) {
        error.splice(-1, (error.length - a));
      }
      return result;
    };
  }

  /**
   * Returns true if the value is validated by any one of the provided
   * predicate functions.
   * @public
   */
  function or () {
    var predicates = _.toArray(arguments);

    return function or (value, error) {
      var a = error.length,
        result = _.any(predicates, function (predicate) {
          return _testSubtree(predicate, value, error);
        });

      if (result) {
        error.splice(-1, (error.length - a));
      }
      return result;
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
