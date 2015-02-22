var _ = require('lodash');
var fnv = require('fnv-plus');
var EventEmitter = require('events').EventEmitter;

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
function curryArguments (template, object, emitter, method) {
  if (!_.isPlainObject(template)) {
    throw new TypeError('template must be a valid js object');
  }
  if (!_.isPlainObject(object)) {
    return _.curry(Congruence[method])(template, _, emitter);
  }

  return false;
}

/**
 * Visit a node in the object graph, and return true if the predicate
 * is valid.
 *
 * @private
 */
function visitNode (templateNode, objectNode, key) {
  var valid = _.any([
    _.isFunction(templateNode) && templateNode(objectNode),
    _.isRegExp(templateNode) && templateNode.test(objectNode),
    templateNode === objectNode
  ]);
  if (!valid && this.emitter instanceof EventEmitter) this.emitter.emit('invalid:value', {
    key: key,
    templateNode: templateNode,
    objectNode: objectNode
  });

  return valid;
}

/**
 * Returns true if an object is congruent to the specified template.
 *
 * @static
 * @param template {Object} - the congruence template to test the object against
 * @param object   {Object} - the object to test
 * @param emitter  {EventEmitter} - an event emitter
 * @returns true if congruent, false otherwise
 */
Congruence.congruent = function congruent (template, object, emitter) {
  var curried = curryArguments(template, object, emitter, 'congruent');
  if (curried) return curried;

  var templateKeys = _.keys(template),
    objectKeys = _.keys(object);

  if (_.intersection(objectKeys, templateKeys).length !== objectKeys.length) {
    if (emitter) emitter.emit('invalid:keys', {
      objectKeys: objectKeys,
      templateKeys: templateKeys
    });
    return false;
  }

  return _.all(templateKeys, function (key) {
    return _.bind(visitNode, { emitter: emitter })(template[key], object[key], key);
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
Congruence.similar = function (template, object, emitter) {
  var curried = curryArguments(template, object, emitter, 'similar');
  if (curried) return curried;

  return _.all(_.keys(template), function (key) {
    return _.bind(visitNode, { emitter: emitter })(template[key], object[key], key);
  });
};

/** Compute a hash of an object's keys. */
Congruence.essentialize = function (val) {
  return _.isObject(val) ? fnv.hash(JSON.stringify(_.keys(val))).str() : val;
};

Congruence.not = function (val) {
  return !val;
};

module.exports = Congruence;
