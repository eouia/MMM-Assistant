//#!/usr/bin/env node
// Uncomment the above line to run node in bash as a script
//===========================================================================
//  Author:         E:V:A
//  File:           google-auth.js
//  Date:           2018-04-12
//  Description:    A node script to obtain the Google Voice API accesstokens
//---------------------------------------------------------------------------
//  This script use:
//      input:  ../assets/google-client-secret.json  -- your downloaded cert
//      output: ../assets/google-access-tokens.js    -- your new API token
//===========================================================================
'use strict'

const GoogleAssistant = require('google-assistant')
const path = require('path')

const config = {
    auth: {
        keyFilePath: path.resolve(__dirname,     '../assets/google-client-secret.json'), // secret.json
        savedTokensPath: path.resolve(__dirname, '../assets/google-access-tokens.json'), // resources/tokens.js
    },
}

const assistant = new GoogleAssistant(config.auth)
// Not sure if this additional parameter is needed... but it was suggested somewhere.
//const assistant = new GoogleAssistant(config.auth, "MagicMirror")
assistant
  .on('ready', () => {
    assistant.start();
  })
  .on('started', function() {
    console.log("Google Authentication OK! Press CTRL+C to Quit.")
    //process.exit(1) //return //throw new Error("GA Authenticatin OK.")
  })
  .on('error', (error) => {
    console.log('Google Authentication Error:', error)
  })
