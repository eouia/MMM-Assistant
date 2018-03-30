'use strict'

const GoogleAssistant = require('google-assistant')
const path = require('path')

const config = {
  auth: {
    keyFilePath: path.resolve(__dirname, 'secret.json'),
    savedTokensPath: path.resolve(__dirname, 'resources/tokens.js'),
  },
}

// Not sure if this additional parameter is needed...
//const assistant = new GoogleAssistant(config, "MagicMirror")
const assistant = new GoogleAssistant(config)
assistant
  .on('ready', () => {
    assistant.start();
  })
  .on('started', function() {
    console.log("Google Authentication is finished. Press CTRL+C to Quit.")
  })
  .on('error', (error) => {
    console.log('Assistant Error:', error)
  })

