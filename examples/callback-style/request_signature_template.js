// Unit Testing Imports
var assert = require('assert');
var async = require('async');

var docusign = require('../../docusign.js');

describe('request_signature_template', function () {
  var fullName = 'Nikhil Mashettiwar';

  var config = require('../../test-config.json');
  var debug = config.debug;
  var integratorKey = config.integratorKey;
  var email = config.email;
  var password = config.password;
  var templateId = config.templateId;
  var templateRoleName = config.templateRole;

  var templateRoles = [{
    email: email,
    name: fullName,
    roleName: templateRoleName
  }];

  describe('sendTemplate', function () {
    it('should return envelope information of the created enevelope', function (done) {
      async.waterfall([

        // **********************************************************************************
        // Step 1 - Initialize DocuSign Object with Integratory Key and Desired Environment
        // **********************************************************************************
        function init (next) {
          docusign.init(integratorKey, 'demo', debug, function (error, response) {
            assert.ok(!error, 'Unexpected ' + error);
            var message = response.message;
            assert.strictEqual(message, 'successfully initialized');
            next(null);
          });
        },

        // **********************************************************************************
        // Step 2 - Create a DocuSign Client Object
        // **********************************************************************************
        function createClient (next) {
          docusign.createClient(email, password, function (error, response) {
            assert.ok(!error, 'Unexpected ' + error);
            next(null, response);
          });
        },

        // **********************************************************************************
        // Step 3 - Request Signature via Template
        // **********************************************************************************
        function sendTemplate (client, next) {
          client.envelopes.sendTemplate('DS API call - Request Signature', templateId, templateRoles, {}, function (error, response) {
            assert.ok(!error, 'Unexpected ' + error);
            console.log('The envelope information of the created envelope is: \n' + JSON.stringify(response));
            next(null, client);
          });
        },

        // **********************************************************************************
        // Step 4 - Revoke OAuth Token for Logout
        // **********************************************************************************
        function logOut (client, next) {
          client.logOut(function (err, response) {
            assert.strictEqual(err, null);
            next(null);
          });
        }

      ], function () {
        done();
      });
    });
  });
});
