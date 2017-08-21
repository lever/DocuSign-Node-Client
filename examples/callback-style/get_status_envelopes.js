// Unit Testing Imports
var assert = require('assert');
var async = require('async');

var docusign = require('../../docusign.js');

describe('get_status_envelopes', function () {
  var docusignEnv = 'demo';

  var config = require('../../test-config.json');
  var debug = config.debug;
  var integratorKey = config.integratorKey;
  var email = config.email;
  var password = config.password;

  var date = new Date();
  if (date.getMonth() !== 0) {
    date.setMonth(date.getMonth() - 1);
  } else {
    date.setMonth(12);
    date.setYear(date.getYear() - 1);
  }

  it('should return an envelope list', function (done) {
    async.waterfall([

      // **********************************************************************************
      // Step 1 - Initialize DocuSign Object with Integratory Key and Desired Environment
      // **********************************************************************************
      function init (next) {
        docusign.init(integratorKey, docusignEnv, debug, function (error, response) {
          assert.ok(!error, 'Unexpected ' + error);
          var message = response.message;
          assert.strictEqual(message, 'successfully initialized');
          next(null);
        });
      },

      // **********************************************************************************
      // Step 2 - Authenticate Youself With DocuSign to Recieve an OAuth Token and BaseUrl
      // **********************************************************************************
      function createClient (next) {
        docusign.createClient(email, password, function (error, response) {
          assert.ok(!error, 'Unexpected ' + error);
          next(null, response);
        });
      },

      // **********************************************************************************
      // Step 3 - Get Envelope List
      // **********************************************************************************
      function getEnvelopeList (client, next) {
        client.envelopes.getEnvelopeList(date, function (err, response) {
          assert.ok(!err);
          // console.log('The Envelopes from ' + date + ' to the present is: \n' + JSON.stringify(response));
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
