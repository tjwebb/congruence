(function () {
  'use strict';

  var _ = require('underscore');

  _.mixin(require('underscore-contrib'));
  _.mixin({

    /**
     * Return true iff val is both an object and not a function nor an array.
     *
     * @static
     * @param {*} - the value to test
     */
    isObjectStrict: function (val) {
      return _.all([
        _.isObject(val),
        _.not(_.isFunction(val)),
        _.not(_.isArray(val)),
        _.not(_.isRegExp(val)),
        _.not(_.isDate(val)),
        _.not(_.isArguments(val)),
        _.not(_.isElement(val)),
        _.not(_.isNumber(val)),
        _.not(_.isBoolean(val))
      ]);
    }
  });

  /**
   * The congruence API.
   * @module congruence
   */
  var congruence = exports;
  
  _.extend(congruence, /** @exports congruence */ {

    /**
     * Returns true if an object matches a template.
     *
     * @static
     * @param template {Object} - the congruence template to test the object against
     * @param object   {Object} - the object to test
     * @param errors   {Array=} - an optional array that will be populated if any errors occur
     * @returns true if congruent, false otherwise
     */
    congruent: function(template, object, _errors) {
      var errors = _errors || [ ];

      if (!_.isObjectStrict(object)) {
        logError(errors, '\'object\' must be a valid js object');
      }
      if (!_.isObjectStrict(template)) {
        logError(errors, '\'template\' must be a valid js object');
      }
      return !errors.length && _testSubtree(_.clone(template), object, errors);
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
   * XXX For backward-compatibility; will remove support in 1.3.0.
   * _.congruent is more API- and namespace-friendly and less vague than _.test.
   * @deprecated
   */
  congruence.test = congruence.congruent;

  /**
   * Recurse into a subtree and test each node against the template.
   * @private
   */
  function _testSubtree (templateNode, objectNode, errors) {

    // a leaf is reached
    if (!_.isObjectStrict(templateNode) || !_.isObjectStrict(objectNode)) {
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
    var result = _.not(_.isUndefined(predicate)) && _.any([
      _.isRegExp(predicate) && predicate.test(value),
      _.isFunction(predicate) && predicate(value, [ ]),
      predicate === value
    ]);

    if (result) return true;

    if (_.isUndefined(predicate)) {
      logError(errors, 'no match for ' + JSON.stringify(value));
    }
    else if (_.isObjectStrict(predicate) && !_.isObjectStrict(value)) {
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
