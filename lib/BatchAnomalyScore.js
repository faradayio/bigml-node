/**
 * Copyright 2014-2015 BigML
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

"use strict";

var BigML = require('./BigML');
var Resource = require('./Resource');
var constants = require('./constants');
var logger = require('./logger');
var utils = require('./utils');
var async = require('async');

function BatchAnomalyScore(connection) {
  Resource.call(this, connection);
}

BatchAnomalyScore.prototype = new Resource();

BatchAnomalyScore.prototype.parent = Resource.prototype;

BatchAnomalyScore.prototype.create = function (anomaly,
                                               dataset, args, retry, cb) {
  /**
   * Creates a batch anomaly score and builds customized error and resource
   * info
   *
   * Returns a BigML resource wrapped in an object that includes
   *   code: HTTP status code
   *   resource: The resource/id
   *   location: Remote location of the resource
   *   object: The resource itself
   *   error: An error code and message
   *
   * @param {string|object} anomaly Anomaly Detector id (or resource)
   * @param {string|object} dataset Dataset id (or resource)
   * @param {object} args Arguments that should be used in the call. For
   *                      example {name: "my_name"}
   * @param {boolean} retry Turns on/off the retries if a resumable
   *                        condition happens
   * @param {function} cb Callback function
   */

  var self = this, options, resources,
    origins = ['anomaly'],
    message = 'Failed to create the batch anomaly score. First parameter' +
    ' must be an anomaly detector id.',
    resourceId,
    datasetId,
    sendRequest,
    reqOptions = {
      method: 'POST',
      resourceType: 'batchanomalyscore',
      endpoint: '/'
    };

  if (arguments.length > 0) {
    options = utils.optionalCUParams([].slice.call(arguments, 1), message);
    resourceId = utils.getResource(anomaly);
    datasetId = utils.getResource(dataset);
    options.operation = 'create';
    options.args.dataset = datasetId.resource;
    if (origins.indexOf(resourceId.type) > -1) {
      options.args[resourceId.type] = resourceId.resource;
    } else {
      throw new Error(message);
    }
    options = utils.setRetries(options);
    options.type = reqOptions.resourceType;
    this.options = options;
  } else {
    options = this.options;
  }
  reqOptions.body = options.args;
  sendRequest = utils.makeSendRequest(self, reqOptions, options);
  // The origin resource must be retrieved in a finished state before 
  // create starts. This is only done when create is called by the user, not
  // internally to retry creation.

  if (arguments.length > 0) {
    resources = [datasetId.resource, resourceId.resource];
    async.each(resources, function (resource, done) {
      new Resource(self.connection).get(resource, true, done);
    },
      sendRequest);
  } else {
    sendRequest(null);
  }
};

BatchAnomalyScore.prototype.list = function (query, cb) {
  this.parent.list.call(this, 'batchanomalyscore', query, cb);
};

BatchAnomalyScore.prototype.download = function (resource, filename, cb) {
  /**
   * Downloads the batch anomaly score output file.
   *
   * @param {object|string} resource Batch anomaly score resource or id
   * @param {string} filename Name of the file to store the prediction output
   *                          in (optional)
   * @param {string} cb Callback where the response body is sent to (optional)
   *
   */
  var resourceId = utils.getResource(resource),
    reqOptions = {
      resourceType: resourceId.type,
      endpoint: '/' + resourceId.id,
    };
  if ((typeof cb) === 'undefined') {
    cb = utils.showResult;
  }
  // No retries needed
  return this.connection.download(reqOptions, filename, undefined, cb);
};

module.exports = BatchAnomalyScore;
