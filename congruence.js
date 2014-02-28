(function () {
  'use strict';

  var _ = require('underscore'),
    moment = require('moment');

  var congruence = exports;
  
  /**
   * The congruence API.
   * @module congruence
   */
  _.extend(exports, /** @exports congruence */ {

    /**
     * Returns true if an object matches a template.
     *
     * @static
     * @param template {Object} - the congruence template to test the object against
     * @param object   {Object} - the object to test
     * @param errors   {Array=} - an optional array that will be populated if any errors occur
     * @returns true if congruent, false otherwise
     */
    test: function(template, object, _errors) {
      var errors = _errors || [ ];

      if (!congruence.isObjectStrict(object)) {
        logError(errors, '\'object\' must be a valid js object');
      }
      if (!congruence.isObjectStrict(template)) {
        logError(errors, '\'template\' must be a valid js object');
      }
      return !errors.length && _testSubtree(_.clone(template), object, errors);
    },

    /**
     * Returns true if val is defined; false otherwise.
     *
     * @static
     * @param {*} - the value to test
     */
    isDefined: function (val) {
      return !_.isUndefined(val);
    },

    /**
     * Returns true if val is a valid date according to the given formats.
     *
     * @static
     * @param {*} - the value to test
     */
    isValidDate: function (formats) {
      return function (val) {
        return moment(val, formats).isValid();
      };
    },

    /**
     * Return true iff val is both an object and not a function nor an array.
     *
     * @static
     * @param {*} - the value to test
     */
    isObjectStrict: function (val) {
      return _.isObject(val) && !_.isFunction(val) && !_.isArray(val) && !_.isRegExp(val);
    },

    /**
    * Negates the return value of the given function, or the given value itself
    * if not a function.
    *
    * @static
    * @param {Function} - the NOT condition operand
    */
    not: function(predicate) {
      return function (value, errors) {
        return !_testSubtree(predicate, value, errors);
      };
    },

    /**
     * Returns true if the value is validated by any one of the provided
     * predicate functions.
     *
     * @static
     * @param {...Function} - the OR condition operands
     */
    or: function () {
      var predicates = _.toArray(arguments);
      return function or (value, errors) {
        return _.any(predicates, function (predicate) {
          return _testSubtree(predicate, value, errors);
        });
      };
    }
  });

  /**
   * Recurse into a subtree and test each node against the template.
   * @private
   */
  function _testSubtree (templateNode, objectNode, errors) {

    // a leaf is reached
    if (!congruence.isObjectStrict(templateNode) || !congruence.isObjectStrict(objectNode)) {
      return _testNode(templateNode, objectNode, errors);
    }

    var templateKeys = _.keys(templateNode);

    return _.all(_.map(
      _.reject(_.union(templateKeys, _.keys(objectNode)), function (key) {
        return (!optional(key) && _.contains(templateKeys, '(?)' + key)) || key === '(+)';
      }),
      function (_key) {
        var subtree, key, oldlen = errors.length;

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
        subtree = _testSubtree(templateNode[_key], objectNode[key], errors);
        if (!subtree) {
          if (_.has(templateNode, '(+)')) {
            subtree = _testSubtree(templateNode['(+)'], objectNode[key], errors);
            errors.splice(-1, (errors.length - oldlen));
          }
          else {
            return false;
          }
        }
        return subtree;
      }
    ));
  }

  /**
   * Test a node against a particular predicate function or value.
   * @private
   */
  function _testNode (predicate, value, errors) {
    return _testPredicate(predicate, value, errors);
  }

  /**
   * Test a value/predicate combo, and report any errors.
   */
  function _testPredicate(predicate, value, errors) {
    var result = congruence.isDefined(predicate) && _.any([
      _.isRegExp(predicate) && predicate.test(value),
      _.isFunction(predicate) && predicate(value, [ ]),
      predicate === value
    ]);

    if (result) return true;

    if (_.isUndefined(predicate)) {
      logError(errors, 'no match for ' + JSON.stringify(value));
    }
    else if (congruence.isObjectStrict(predicate) && !congruence.isObjectStrict(value)) {
      logError(errors, 'expected (' + value + ') to be an object');
    }
    else if (_.isRegExp(predicate) && !predicate.test(value)) {
      logError(errors, 'expected ' + predicate + ' to match ' + value);
    }
    else if (_.isFunction(predicate) && !predicate(value, errors)) {
      var f = predicate.name || _.find(_.functions(_), function (name) {
        return _[name] == predicate;
      });
      if (value && !_.contains([ 'or', 'not' ], f)) {
        logError(errors, (f || 'anonymous') + '(' + value + ') returned false');
      }
    }
    else if (predicate !== value) {
      logError(errors, 'expected (' + predicate + ') to equal ' + value);
    }

    return false;
  }

  function optional (key) {
    return (/^\(\?\)/).test(key);
  }
  function normalizeOptional (key) {
    return key.slice().replace('(?)', '');
  }
  function logError (list, err) {
    if (!_.contains(list, err)) list.push(err);
  }

})();
