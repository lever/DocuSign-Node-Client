// Wrapper for authentication needs including user login info and token handling.
// NOTE: Does not provide protection of token.  Tokens need to be stored carefully by the consumer
// of these methods.  We do not offer encryption or key handling here.

var querystring = require('querystring'); // core
var assign = require('lodash.assign');
var Bluebird = require('bluebird');
var dsUtils = require('./../dsUtils');
var DocuSignError = dsUtils.DocuSignError;

/**
 * Gets login information for the default account/organization.
 *
 * @memberOf Auth
 * @private
 * @function
 * @param {string} email - Email address of the DocuSign user.
 * @param {string} password - Password of the DocuSign user.
 * @returns {Promise} - A thenable bluebird Promise fulfilled with login info.
 */
exports.getLoginInfo = function (email, password) {
  var options = {
    method: 'GET',
    url: dsUtils.getApiUrl() + '/login_information?include_account_id_guid=true',
    headers: {
      'X-DocuSign-Authentication': JSON.stringify({
        Username: email,
        Password: password,
        IntegratorKey: dsUtils.internalState.integratorKey
      })
    }
  };

  return dsUtils.makeRequest('Get DS User Account Info', options).then(function (response) {
    var loginInfo = response.loginAccounts.filter(function (account) {
      return account.isDefault === 'true';
    })[0];
    return loginInfo;
  });
};

/**
 * Gets an oAuth Token for given username & password that can be used to access
 * the DocuSign API on subsequent calls instead of using the password repeatedly.
 *
 * @memberOf Auth
 * @private
 * @function
 * @param {string} email - Email address of the DocuSign user.
 * @param {string} password - Password of the DocuSign user.
 * @param {string} baseUrl - DocuSign API base URL.
 * @returns {Promise} - A thenable bluebird Promise fulfilled with an access token
 */
exports.getOauthToken = function (email, password, baseUrl) {
  var options = {
    method: 'POST',
    url: _getTokenEndpoint(baseUrl, 'token'),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: querystring.stringify({
      grant_type: 'password',
      client_id: dsUtils.internalState.integratorKey,
      username: email,
      password: password,
      scope: 'api'
    })
  };

  return dsUtils.makeRequest('Get DS OAuth2 Token', options).then(function (response) {
    return response.access_token;
  });
};

/**
 * getAccountInfoAndToken wraps both getLoginInformation and getOauthToken to return a single object
 * containing the oAuth Token and baseUrl for future calls.  This is mostly a
 * convenience function.
 *
 * @memberOf Auth
 * @public
 * @alias getAuthInfo
 * @function
 * @param {string} email - Email address of the DocuSign user.
 * @param {string} password - Password of the DocuSign user.
 * @param {function} [callback] - Returned in the form of function(error, response).
 * @returns {Promise} - A thenable bluebird Promise; if callback is given it is called before the promise is resolved
 */
exports.getAccountInfoAndToken = function (email, password, callback) {
  return exports.getLoginInfo(email, password).asCallback(callback)
  .then(function (accountInfo) {
    return exports.getOauthToken(email, password, accountInfo.baseUrl)
    .then(function (accessToken) {
      var accountAndAuthInfo = assign({
        accessToken: accessToken
      }, accountInfo);
      return accountAndAuthInfo;
    });
  })
  .catch(function (err) {
    var errMsg = 'Error getting API token: ' + JSON.stringify(err);
    var error = new DocuSignError(errMsg, err);
    throw error;
  });
};

/**
 * Revoke the given DocuSign OAuth2 `token` to log out the user
 *
 * @memberOf Auth
 * @public
 * @alias logOut
 * @function
 * @param {function} [callback] - Returned in the form of function(error, response).
 * @returns {Promise} - A thenable bluebird Promise; if callback is given it is called before the promise is resolved
 */
exports.revokeOauthToken = function (accessToken, baseUrl, callback) {
  return function logOut (callback) {
    return revokeOauthToken(accessToken, baseUrl).asCallback(callback);
  };
};

/**
 * Revoke the given DocuSign OAuth2 `token`.
 *
 * @memberOf Auth
 * @private
 * @function
 * @param {string} token - The DocuSign OAuth2 token to revoke.
 * @param {string} baseUrl - DocuSign API base URL.
 * @returns {Promise} - A thenable bluebird Promise
 */
function revokeOauthToken (token, baseUrl) {
  return Bluebird.try(function () {
    var headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    var options = {
      method: 'POST',
      url: _getTokenEndpoint(baseUrl, 'revoke'),
      headers: headers,
      body: 'token=' + token
    };

    return dsUtils.makeRequest('Revoke DS OAuth2 Token', options).then(function (response) {
      return response;
    })
    .catch(function (error) {
    /* istanbul ignore next */
      error.message = error.message + '\nCannot revoke DS OAuth2 access token.';
    /* istanbul ignore next */
      throw error;
    });
  });
}

/**
 * Constructs the URL necessary for token management. Internal function that should not be called.
 *
 * @memberOf Auth
 * @private
 * @function
 * @param {string} baseUrl - DocuSign API base URL.
 * @param {string} action - Action for API calls.
 * @returns {*}
 */
function _getTokenEndpoint (baseUrl, action) {
  var environ = /^https:\/\/(.*?)\.docusign\.net/.exec(baseUrl);

  if (environ && environ.length) {
    return 'https://' + environ[1] + '.docusign.net/restapi/v2/oauth2/' + action;
  } else {
    /* istanbul ignore next */
    throw new DocuSignError('Unable to parse baseUrl', { baseUrl: baseUrl });
  }
}
