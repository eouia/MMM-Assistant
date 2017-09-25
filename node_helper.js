'use strict'

const Sound = require('node-aplay')
const path = require('path')
const fs = require('fs')
const record = require('node-record-lpcm16')
const Detector = require('snowboy').Detector
const Models = require('snowboy').Models
const Speaker = require('speaker')
const GoogleAssistant = require('google-assistant')
const Speech = require('@google-cloud/speech')
const exec = require('child_process').exec
//const tts = require('picotts')

var NodeHelper = require("node_helper")

module.exports = NodeHelper.create({
  start: function () {
    this.config = {}
    this.status = 'NOTACTIVATED'
    this.commandAuthIndex = 0
    this.commandAuthMax = 0
    this.pause = new Set()
  },

  initialize: function (config) {
    this.config = config

    this.config.assistant.auth.keyFilePath
      = path.resolve(__dirname, this.config.assistant.auth.keyFilePath)
    this.config.assistant.auth.savedTokensPath
      = path.resolve(__dirname, this.config.assistant.auth.savedTokensPath)

    this.commandAuthMax = this.config.stt.auth.length
    for(var i=0; i<this.commandAuthMax; i++) {
      this.config.stt.auth[i].keyFilename
        = path.resolve(__dirname, this.config.stt.auth[i].keyFilename)
    }


    this.sendSocketNotification('MODE', {mode:"INITILIZED"})
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
      case 'REBOOT':
        execute('sudo reboot now', function(callback){
          console.log(callback)
        })
        break
      case 'SHUTDOWN':
        execute('sudo shutdown -t 1', function(callback){
          console.log(callback)
        })
        break
      case 'TEST':
        this.test(payload)
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
      }
    })
  },

  /*
  activateSpeak_espeak: function(text) {
    //@DEPRECATED
    this.sendSocketNotification('MODE', {mode:'SPEAK_STARTED'})
    var script = "espeak"
    script += (
      (this.config.espeak.language)
        ? (" -v " + this.config.espeak.language)
        : ""
    )
    script += (
      (this.config.espeak.speed)
        ? (" -s " + this.config.espeak.speed)
        : ""
    )
    script += ((this.config.espeak.ssml) ? (" -m") : "")
    script += " \'" + text + "\'"
    exec (script, (err, stdout, stderr)=>{
      if (err == null) {
        console.log("[ASSTNT] Speak: ", text)
        this.sendSocketNotification('MODE', {mode:'SPEAK_ENDED'})
      }
    })
    if (this.pause.size > 0) this.sendSocketNotification('PAUSED')
  },
  */
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
      new Sound(path.resolve(__dirname, 'resources/dong.wav')).play()
      this.sendSocketNotification('HOTWORD_DETECTED', hotword)
      this.sendSocketNotification('MODE', {mode:'HOTWORD_DETECTED'})
      if (this.pause.size > 0) this.sendSocketNotification('PAUSED')
      return
    })

    mic.pipe(detector);
  },

  activateAssistant: function(mode = 'ASSISTANT') {
    var transcription = ""
    console.log('[ASSTNT] Assistant Activated')
    this.sendSocketNotification('MODE', {mode:'ASSISTANT_STARTED'})
    const assistant = new GoogleAssistant(this.config.assistant)

    const startConversation = (conversation) => {
      //console.log('Say something!');

      let spokenResponseLength = 0;
      let speakerOpenTime;
      let speakerTimer;

      conversation
        .on('audio-data', (data) => {
          //record.stop()
          const now = new Date().getTime()
          if (mode == 'ASSISTANT') {
            this.sendSocketNotification('MODE', {mode:'ASSISTANT_SPEAKING'})
            speaker.write(data);
            spokenResponseLength += data.length;
            const audioTime
              = spokenResponseLength / (this.config.assistant.audio.sampleRateOut * 16 / 8) * 1000;
            clearTimeout(speakerTimer);
            speakerTimer = setTimeout(() => {
              speaker.end();
            }, audioTime - Math.max(0, now - speakerOpenTime));
          } else {
            //record.stop()
            speaker.end()
          }

        })
        .on('end-of-utterance', () => {
          record.stop()
        })
        .on('transcription', (text) => {
            this.sendSocketNotification('ASSISTANT_TRANSCRIPTION', text)
            transcription = text
            console.log("[ASSTNT] GA Transcription: ", transcription)
            //record.stop()
            if (mode == 'COMMAND') {
              console.log("[ASSTNT] Command recognized:",transcription)
              this.sendSocketNotification('COMMAND',transcription)
            }
        })
        .on('ended', (error, continueConversation) => {
          if (this.pause.size > 0) {
            record.stop()
            speaker.end()
            this.sendSocketNotification('PAUSED')
            return
          }
          if (error) {
            console.log('[ASSTNT] Conversation Ended Error:', error)
            this.sendSocketNotification('ERROR', 'CONVERSATION ENDED')
          } else if (continueConversation) {
            if (mode == 'ASSISTANT') {
              assistant.start()
            } else {
              //@.@ What? There is no stop-conversation in gRpc ?????
            }
          }
          else {
            record.stop()
            this.sendSocketNotification('ASSISTANT_FINISHED', mode)
          }
        })
        .on('error', (error) => {
          console.log('[ASSTNT] Conversation Error:', error);
          record.stop()
          this.sendSocketNotification('ERROR', 'CONVERSATION')
        })


      // pass the mic audio to the assistant
      var mic = record.start(this.config.record)
      mic.on('data', data => conversation.write(data));

      // setup the speaker
      var speaker = new Speaker({
        channels: 1,
        sampleRate: this.config.assistant.audio.sampleRateOut,
      });
      speaker
        .on('open', () => {
          speakerOpenTime = new Date().getTime();
        })
        .on('close', () => {
          conversation.end();
        });
    };

    // setup the assistant
    assistant
      .on('ready', () => {
        assistant.start()
      })
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
    const speech = Speech(this.config.stt.auth[this.commandAuthIndex++])
    if (this.commandAuthIndex >= this.commandAuthMax) this.commandAuthIndex = 0

    const request = {
      config: this.config.stt.request,
      interimResults: false // If you want interim results, set this to true
    }
    const recognizeStream = speech.streamingRecognize(request)
      .on('error', (err)=>{
        console.log('[ASSTNT] RecognizeStream Error: ', err)
        record.stop()
        this.sendSocketNotification('ERROR', 'RECOGNIZESTREAM')
      })
      .on('data', (data) => {
        this.sendSocketNotification('MODE', {mode:'COMMAND_LISTENED'})
        if ((data.results[0] && data.results[0].alternatives[0])) {
          console.log(
            "[ASSTNT] Command recognized:",
            data.results[0].alternatives[0].transcript
          )
          this.sendSocketNotification(
            'COMMAND',
            data.results[0].alternatives[0].transcript
          )
          record.stop()
        }
        if (this.pause.size > 0) {
          record.stop()
          this.sendSocketNotification('PAUSED')
        }
      })

  // Start recording and send the microphone input to the Speech API
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

function execute(command, callback){
  exec(command, function(error, stdout, stderr){ callback(stdout); });
}
