var _ = require('lodash');
var fnv = require('fnv-plus');

/**
 * The congruence API.
 * @module congruence
 */
var Congruence = function () { };

/**
 * Validate the required arguments for the congruence API
 *
 * @private
 */
function validateArguments (template, object, method) {
  if (!_.isPlainObject(template)) {
    throw new TypeError('template must be a valid js object');
  }
  else if (!_.isPlainObject(object)) {
    return _.curry(Congruence.similar)(template);
  }
}

/**
 * Visit a node in the object graph, and return true if the predicate
 * is valid.
 *
 * @private
 */
function visitNode (templateNode, objectNode) {
  return _.any([
    _.isFunction(templateNode) && templateNode(objectNode),
    _.isRegExp(templateNode) && templateNode.test(objectNode),
    templateNode === objectNode
  ]);
}

/**
 * Returns true if an object is congruent to the specified template.
 *
 * @static
 * @param template {Object} - the congruence template to test the object against
 * @param object   {Object} - the object to test
 * @returns true if congruent, false otherwise
 */
Congruence.congruent = function congruent (template, object) {
  var valid = validateArguments(template, object);
  if (valid) return valid;

  var templateKeys = _.keys(template),
    objectKeys = _.keys(object);

  if (_.intersection(objectKeys, templateKeys).length !== objectKeys.length) {
    
    return false;
  }

  return _.all(templateKeys, function (key) {
    return visitNode(template[key], object[key]);
  });
};

/**
 * Returns true if an object is similar to the specified template.
 *
 * @static
 * @param template {Object} - the congruence template to test the object against
 * @param object   {Object} - the object to test
 * @returns true if similar, false otherwise
 */
Congruence.similar = function (template, object) {
  var valid = validateArguments(template, object);
  if (valid) return valid;

  return _.all(_.keys(template), function (key) {
    return visitNode(template[key], object[key]);
  });
};

/** Compute a hash of an object's keys. */
Congruence.essentialize = function (val) {
  return _.isObject(val) ? fnv.hash(JSON.stringify(_.keys(val))).str() : val;
};

Congruence.not = function (val) {
  return !val;
};

Congruence.Emitter = Object.create(require('events').EventEmitter.prototype);
module.exports = Congruence;
