var docusign = require('docusign-node')

var integratorKey  = '***',                   // Integrator Key associated with your DocuSign Integration
  email            = 'YOUR_EMAIL',            // Email for your DocuSign Account
  password         = 'YOUR_PASSWORD',         // Password for your DocuSign Account
  docusignEnv      = 'demo',                  // DocuSign Environment generally demo for testing purposes
  fullName         = 'Joan Jett',             // Recipient's Full Name
  recipientEmail   = 'joan.jett@example.com', // Recipient's Email
  templateId       = '***',                   // ID of the Template you want to create the Envelope with
  templateRoleName = '***',                   // Role Name of the Template
  debug            = false;                   // Enable debug logging and debug responses from API

var authCredentials = {
  email: email,
  password: password
}

docusign.getAPITokenAsync(authCredentials)
  .then(function (authToken) {
    return storeApiToken(authToken)
  })
  .then(function (authToken) {
    var accessToken, accountId, baseUrl

    accountId = authToken.accountId
    baseUrl = authToken.baseUrl
    accessToken = authToken.access_token

    var client = new docusign.Client({
      integratorKey: integratorKey,
      email: email,
      password: password,
      accountId: accountId,
      baseUrl: baseUrl,
      accessToken: accessToken,
      docusignEnv: docusignEnv,
      debug: debug // optional
    })

    return client

  })
  .then(function (client) {
    // do stuff with client
    return client.envelopes.create(envelopeOptions)
  })
  .then(function (createdEnvelopeData) {
    // how to re-use client here?
    // Seems messy to keep passing client around.
    // perhaps we can attach it back to the export ds module
    console.log('createdEnvelopeData', createdEnvelopeData)
  })
  .catch(errHandler)

function errHandler (error) {
  console.log(error.stack || error)
}
