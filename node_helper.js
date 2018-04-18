/* --------------------------------------------------------------------------
 * Module:       MMM-Assistant
 * FileName:     node_helper.js
 * Author:       eouia
 * License:      MIT
 * Date:         2018-03-31
 * Version:      1.0.3
 * Description:  A MagicMirror module to control your modules
 * Format:       4-space TAB's (no TAB chars), mixed quotes
 *
 * URL:          https://github.com/eouia/MMM-Assistant
 * --------------------------------------------------------------------------
 */

'use strict'

const Sound = require('node-aplay') // Deprecated
//const Sound = require('aplay')
const path = require('path')
const fs = require('fs')
const record = require('node-record-lpcm16')
const Detector = require('snowboy').Detector
const Models = require('snowboy').Models
const Speaker = require('speaker')
const GoogleAssistant = require('google-assistant')
const speech = require('@google-cloud/speech')
const exec = require('child_process').exec
//const tts = require('picotts')

var NodeHelper = require("node_helper")

module.exports = NodeHelper.create({

  start: function () {
    console.log(this.name + " started");
    this.config = {}
    this.status = 'NOTACTIVATED'
    this.commandAuthIndex = 0
    this.commandAuthMax = 0
    this.pause = new Set()
    this.googleRequestCounter = 1      // Added by E3V3A for Request Count function
  },

  initialize: function (config) {
    this.config = config
    this.config.assistant.auth.keyFilePath     = path.resolve(__dirname, this.config.assistant.auth.keyFilePath)
    this.config.assistant.auth.savedTokensPath = path.resolve(__dirname, this.config.assistant.auth.savedTokensPath)
    this.commandAuthMax = this.config.stt.auth.length
    for(var i=0; i<this.commandAuthMax; i++) {
      this.config.stt.auth[i].keyFilename = path.resolve(__dirname, this.config.stt.auth[i].keyFilename)
    }
    this.sendSocketNotification('MODE', {mode:"INITIALIZED"})
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case 'PAUSE':
        this.pause.add(payload)
        //if (this.pause.size > 0) this.sendSocketNotification('PAUSED')
        break
      case 'RESUME':
        this.pause.delete(payload)
        if (this.pause.size == 0) this.sendSocketNotification('RESUMED')
        break
      case 'CONFIG':
        this.initialize(payload)
        this.status = 'READY'
        break
      case 'HOTWORD_STANDBY':
        if(this.status !== 'HOTWORD_STANDBY') {
          this.status = 'HOTWORD_STANDBY'
          if(this.pause.size == 0) this.activateHotword()
        }
        break
      case 'ACTIVATE_ASSISTANT':
        if (this.status !== 'ACTIVATE_ASSISTANT') {
          this.status = 'ACTIVATE_ASSISTANT'
          if(this.pause.size == 0) this.activateAssistant('ASSISTANT')
        }
        break
      case 'ACTIVATE_COMMAND':
        if (this.status !== 'ACTIVATE_COMMAND') {
          this.status = 'ACTIVATE_COMMAND'
          if(this.config.system.commandRecognition == 'google-cloud-speech') {
            if(this.pause.size == 0) this.activateCommand()
          } else if (this.config.system.commandRecognition == 'google-assistant') {
            if(this.pause.size == 0) this.activateAssistant('COMMAND')
          }
        }
        break
      case 'SPEAK':
        if (this.status !== 'ACTIVATE_SPEAK') {
          this.status = 'ACTIVATE_SPEAK'
          console.log(payload)
          if(this.pause.size == 0) this.activateSpeak(payload.text, payload.option, payload.originalCommand)
        }
        break
      case 'NOTIFY':
        if (payload.notification !== "HOTWORD_STANDBY") {
          if (payload.notification == "PLAY") {
            new Sound(path.resolve(__dirname, payload.parameter)).play();
          } else {
            this.sendSocketNotification("NOTIFY", payload) 
          }
        } else {
          this.status = 'HOTWORD_DETECTED'
          this.sendSocketNotification("HOTWORD_STANDBY")
        }
        break
      case 'EXECUTE':
        execute(payload, function(callback) {
          console.log("[EXECUTE] ", callback)
        })
        break
      case 'REBOOT':
        execute('sudo reboot now', function(callback) {
          console.log(callback)
        })
        break
      case 'SHUTDOWN':
        execute('sudo shutdown -t 1', function(callback) {
          console.log(callback)
        })
        break
      case 'TEST':
        this.test(payload)
        break
      case 'LOG':
        this.consoleLog(payload)
        break
    }
  },

  test: function(test) {
    this.sendSocketNotification('COMMAND', test)
  },

  activateSpeak: function(text, commandOption={}, originalCommand = "") {
    var option = {}
    option.language = (typeof commandOption.language !== 'undefined') ? commandOption.language : this.config.speak.language
    option.useAlert = (typeof commandOption.useAlert !== 'undefined') ? commandOption.useAlert : this.config.speak.useAlert
    option.originalCommand = (originalCommand) ? originalCommand : ""
    // Use the small footprint Text-to-Speech (TTS): pico2wave
    var commandTmpl = 'pico2wave -l "{{lang}}" -w {{file}} "{{text}}" && aplay {{file}}'

    function getTmpFile() {
        var random = Math.random().toString(36).slice(2),
        path = '/tmp/' + random + '.wav'
        return (!fs.existsSync(path)) ? path : getTmpFile()
    }

    function say(text, lang, cb) {
      text = (text) ? text.trim() : ""
      text = text.replace(/<[^>]*>/g, "")
      text = text.replace(/\"/g, "'")
      text = text.trim()

      var file = getTmpFile(),
        command = commandTmpl.replace('{{lang}}', lang).replace('{{text}}', text).replace(/\{\{file\}\}/g, file)
        exec(command, function(err) {
            cb && cb(err)
            fs.unlink(file, ()=>{})
        })
    }

    this.sendSocketNotification('MODE', {mode:'SPEAK_STARTED', useAlert:option.useAlert, originalCommand:option.originalCommand, text:text})
    say(text, option.language, (err) => {
      if (!err) {
        console.log("[ASSTNT] Speak: ", text)
        this.sendSocketNotification('MODE', {mode:'SPEAK_ENDED', useAlert:option.useAlert})
        if (this.pause.size > 0) {
          this.sendSocketNotification('PAUSED')
        }
      } else {
        console.log("[ASSTNT] Speak Error", err)
        this.sendSocketNotification('MODE', {mode:'SPEAK_ENDED', useAlert:option.useAlert})
      }
    })
  },

  consoleLog: function(payload) {
    console.log(payload.title, payload.message)
  },

  activateHotword: function() {
    console.log('[ASSTNT] Snowboy Activated')
    this.sendSocketNotification('MODE', {mode:'HOTWORD_STARTED'})
    new Sound(path.resolve(__dirname, 'resources/ding.wav')).play();

    var models = new Models();
    this.config.snowboy.models.forEach((model)=>{
      model.file = path.resolve(__dirname, model.file)
      models.add(model)
    })
    var mic = record.start(this.config.record)
    var detector = new Detector({
      resource: path.resolve(__dirname, "resources/common.res"),
      models: models,
      audioGain: 2.0
    })

    detector.on('silence', ()=>{
      if (this.pause.size > 0) {
        record.stop()
        this.sendSocketNotification('PAUSED')
        return
      }
    })

    detector.on('sound', (buffer)=>{
      if (this.pause.size > 0) {
        record.stop()
        this.sendSocketNotification('PAUSED')
        return
      }
    })

    detector.on('error', (err)=>{
      console.log('[ASSTNT] Detector Error', err)
      record.stop()
      this.sendSocketNotification('ERROR', 'DETECTOR')
      return
    })

    detector.on('hotword', (index, hotword, buffer)=>{
      record.stop()
      var confirm = (typeof this.config.snowboy.models[index-1].confirm !== 'undefined') ?  this.config.snowboy.models[index-1].confirm : 'resources/dong.wav'
      new Sound(path.resolve(__dirname, confirm)).play()
      this.sendSocketNotification('HOTWORD_DETECTED', {hotword:hotword, index:index})
      this.sendSocketNotification('MODE', {mode:'HOTWORD_DETECTED'})
      if (this.pause.size > 0) this.sendSocketNotification('PAUSED')
      return
    })

    mic.pipe(detector);
  },

  activateAssistant: function(mode = 'ASSISTANT') {
    console.log('[ASSTNT] GA Activated')

    var endOfSpeech = false
    var gRQC = this.googleRequestCounter // Added by E3V3A
    var transcription = ""
    this.sendSocketNotification('MODE', {mode:'ASSISTANT_STARTED'})
    const assistant = new GoogleAssistant(this.config.assistant.auth)

    const startConversation = (conversation) => {
      //console.log('Say something!');

      let spokenResponseLength = 0;
      let speakerOpenTime = 0;
      let speakerTimer;
      let openMicAgain = false;

      // This is based on:
      //    ./node_modules/google-assistant/examples/mic-speaker.js
      //    ./node_modules/google-assistant/examples/speaker-helper.js
      conversation
        // send the audio buffer to the speaker
        .on('audio-data', (data) => {
		  const now = new Date().getTime()

                  speaker.write(data)

		  // kill the speaker after enough data has been sent to it and then let it flush out
		  spokenResponseLength += data.length
		  const audioTime = spokenResponseLength / (24000 * 16 / 8) * 1000
		  clearTimeout(speakerTimer)
		  speakerTimer = setTimeout(() => {
                    if (endOfSpeech) {  // if spech.end was already called we notify here
                      this.sendSocketNotification('ASSISTANT_FINISHED', mode)
                    }
                    endOfSpeech = true
                    speaker.end()
		  }, (audioTime - Math.max(0, now - speakerOpenTime)) + 500)
        })
        // done speaking, close the mic
        .on('end-of-utterance', () => { record.stop() })
        // show each word on console as they are understood, while we say it
        .on('transcription', (text) => {
            endOfSpeech = false
            this.sendSocketNotification('ASSISTANT_TRANSCRIPTION', text)
            transcription = text
            //console.log("[VOX] GA Transcription: ", transcription)  // show entire JS object
            //---------------------------------------------------------------
            // For account/billing purposes:
            // We check if the transcription is complete and update the request
            // counter by looking for: "done: true". This should probably be
            // moved to MMM-Assistant.
            //---------------------------------------------------------------
            if (text.done)  {
                gRQC += 1
                console.log("[VOX] GA Transcription: ", text.transcription)
                console.log("[VOX] GA RQC: ", gRQC)
            }
            //---------------------------------------------------------------
        })
        // what the assistant answered
        .on('response', text => console.log('[VOX] GA Response: ', text))
        // if we've requested a volume level change, get the percentage of the new level
        .on('volume-percent', percent => console.log('[VOX] Set Volume [%]: ', percent))
        // the device needs to complete an action
        .on('device-action', action => console.log('[VOX] Action:', action))
        // once the conversation is ended, see if we need to follow up
        .on('ended', (error, continueConversation) => {
          if (error) {
            endOfSpeech = true
            console.log('[ASSTNT] Conversation Ended Error:', error)
            this.sendSocketNotification('ERROR', 'CONVERSATION ENDED')
          } else if (continueConversation) {
            console.log("[ASSTNT - continue conversation]")
            openMicAgain = true
            endOfSpeech = false
          } else if (endOfSpeech) {
            this.sendSocketNotification('ASSISTANT_FINISHED', mode)
          } else {  // weird case where speech.end is called but the  spech is still heard
              endOfSpeech = true
          }
        })
        .on('error', (error) => {
          console.log('[ASSTNT] Conversation Error:', error);
          record.stop()
          speaker.end() // Added by E3V3A: fix attempt for issue #25 --> Need to check for: "Error: Service unavailable"
          this.sendSocketNotification('ERROR', 'CONVERSATION')
//          return // added by E3V3A: Do we also need a return?
        })

      // pass the mic audio to the assistant
      var mic = record.start(this.config.record)
      mic.on('data', data => conversation.write(data));

      // Setup Speaker
      var speaker = new Speaker({
        channels: 1,
        sampleRate: this.config.assistant.conversation.audio.sampleRateOut,
      });
      speaker
        .on('open', () => { 
		  clearTimeout(speakerTimer);
		  spokenResponseLength = 0;
		  speakerOpenTime = new Date().getTime();
		})
        .on('close', () => { if (openMicAgain) assistant.start(this.config.assistant.conversation); });
    };

    // Setup the assistant
    assistant
      .on('ready', () => { assistant.start(this.config.assistant.conversation) })
      .on('started', startConversation)
      .on('error', (error) => {
        console.log('[ASSTNT] Assistant Error:', error)
        record.stop()
        speaker.end()
        this.sendScoketNotification('ERROR', 'ASSISTANT')
      })
  },

  activateCommand: function() {
    this.sendSocketNotification('MODE', {mode:'COMMAND_STARTED'})

    const client = new speech.SpeechClient(this.config.stt.auth[this.commandAuthIndex++])
    if (this.commandAuthIndex >= this.commandAuthMax) this.commandAuthIndex = 0

    const request = {
      config: this.config.stt.request,
      interimResults: false             // If you want interim results, set this to true    // E3V3A: [WTF is this??]
    }
    const recognizeStream = client.streamingRecognize(request)
      .on('error', (err)=>{
        console.log('[ASSTNT] RecognizeStream Error: ', err)
        record.stop()
        this.sendSocketNotification('ERROR', 'RECOGNIZESTREAM')
      })
      .on('data', (data) => {
        this.sendSocketNotification('MODE', {mode:'COMMAND_LISTENED'})
        if ((data.results[0] && data.results[0].alternatives[0])) {
          console.log("[ASSTNT] Command recognized: ", data.results[0].alternatives[0].transcript)
          this.sendSocketNotification('COMMAND',       data.results[0].alternatives[0].transcript)
          record.stop()
        }
        if (this.pause.size > 0) {
          record.stop()
          this.sendSocketNotification('PAUSED')
        }
      })

  // Start Recording and send the microphone input to the Speech API
    record
      .start(this.config.record)
      .on('error', (err)=>{
        console.log("[ASSTNT] Recording Error: ",err)
        record.stop()
        this.sendSocketNotification('ERROR', 'RECORD ERROR')
      })
      .pipe(recognizeStream);
  }
})

//---------------------------------------------------------------------------
//  Helper Functions
//---------------------------------------------------------------------------
function execute(command, callback){
  exec(command, function(error, stdout, stderr){ callback(stdout); });
}

