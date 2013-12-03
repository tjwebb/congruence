var congruence = (function () {
  'use strict';

  var _ = require('underscore'),
    childrenExpr = /^children: (\d+)\+$/;

  /**
   * Parse a 'children' key to get the min children number.
   */
  function minChildren (key) {
    var children = childrenExpr.exec(key);
    return children ? parseInt(children[1], 10) : null;
  }

  /**
   * Discerns whether this template node contains a 'children' key. If so,
   * return it, otherwise null.
   */
  function childrenKey (template) {
    if (!isObjectStrict(template)) return null;
    var only = _.keys(template)[0];
    return minChildren(only) !== null ? only : null;
  }

  /**
   * Recurse into a subtree and test each node against the template.
   * @private
   */
  function _testSubtree (_templateNode, objectNode, errors) {
    var templateNode = _templateNode,
      templateKeys,
      objectKeys;

    if (_.isUndefined(_templateNode) || _.isNull(_templateNode)) {
      errors.push({ type: 'node', args: [ _templateNode, objectNode ], msg: 'template is not evaluable' });
      return false;
    }

    if (_.isFunction(_templateNode)) {
      if (!_templateNode(objectNode)) {
        errors.push({ type: 'node', args: [ _templateNode, objectNode ], msg: 'predicate evaluated to false' });
        return false;
      }
      else {
        return true;
      }
    }

    if (!isObjectStrict(objectNode)) {
      return _testNode(_templateNode, objectNode, errors);
    }

    objectKeys = _.keys(objectNode);

    if (_.isArray(_templateNode)) {
      templateNode = _.find(_templateNode, function (template) {
        var tKeys = _.keys(template);
        return _.isEqual(tKeys, objectKeys);
      });

      if (!templateNode) {
        errors.push({ type: 'node', args: [ _templateNode, objectNode ], msg: 'no template match found in list of options' });
        return false;
      }
    }

    templateKeys = _.without(_.keys(templateNode), childrenKey(templateNode));
      
    var difference = _.difference(templateKeys, objectKeys);

    if (difference.length > 0) {
      var ck = childrenKey(templateNode[difference[0]]);
      var min = minChildren(ck);
      if (min > 0 || min === null) {
        errors.push({ type: 'node', args: [ _templateNode, objectNode ], msg: 'template and object keys do not match' });
        return false;
      }
    }

    // recurse into all subtrees
    return _.all(objectNode, function (value, key) {
      var template = templateNode[key] || templateNode[childrenKey(templateNode)];
      return _testSubtree(template, objectNode[key], errors);
    });
  }

  /**
   * Test a node against a particular predicate function or value.
   * @private
   */
  function _testNode (predicate, value, errors) {
    if (!_.isFunction(predicate) && value !== predicate) {
      errors.push({ type: 'leaf', args: [ predicate, value ], msg: 'predicate not a function and value !== predicate' });
      return false;
    }
    if (_.isFunction(predicate) && !predicate(value)) {
      errors.push({ type: 'leaf', args: [ predicate, value ], msg: 'predicate returned false' });
      return false;
    }

    return true;
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
  function test (template, object, errors) {
    return _testSubtree(_.clone(template), object, errors || [ ]);
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
  function not (_predicate) {
    var predicate;

    if (_.isRegExp(_predicate)) {
      predicate = regexAsPredicate(_predicate);
    }
    else if (!_.isFunction(_predicate)) {
      return !_predicate;
    }
    else {
      predicate = _predicate;
    }
    return function () {
      return !predicate(arguments);
    };
  }

  /**
   * Returns true if the value is validated by any one of the provided
   * predicate functions.
   * @public
   */
  function or (predicates) {
    return function () {
      return _.any(predicates, function (_predicate) {
        var predicate;
        if (_.isRegExp(_predicate)) {
          predicate = regexAsPredicate(_predicate);
        }
        else if (!_.isFunction(_predicate)) {
          return _predicate === arguments[0];
        }
        else {
          predicate = _predicate;
        }

        return predicate(arguments);
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
