'use strict'

const Sound = require('node-aplay')
const path = require('path')
const record = require('node-record-lpcm16')
const Detector = require('snowboy').Detector
const Models = require('snowboy').Models
const Speaker = require('speaker')
const GoogleAssistant = require('google-assistant')
const Speech = require('@google-cloud/speech')
const exec = require('child_process').exec

var NodeHelper = require("node_helper")

module.exports = NodeHelper.create({
  start: function () {
    this.config = {}
    this.status = 'NOTACTIVATED'
  },

  initialize: function (config) {
    this.config = config

    this.config.assistant.auth.keyFilePath
      = path.resolve(__dirname, this.config.assistant.auth.keyFilePath)
    this.config.assistant.auth.savedTokensPath
      = path.resolve(__dirname, this.config.assistant.auth.savedTokensPath)
    this.config.speech.auth.keyFilename
      = path.resolve(__dirname, this.config.speech.auth.keyFilename)
    this.sendSocketNotification('READY')
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case 'CONFIG':
        this.initialize(payload)
        this.status = 'READY'
        break;
      case 'HOTWORD_STANDBY':
        if(this.status !== 'HOTWORD_STANDBY') {
          this.status = 'HOTWORD_STANDBY'
          this.activateHotword()
        }
        break;
      case 'ACTIVATE_ASSISTANT':
        if (this.status !== 'ACTIVATE_ASSISTANT') {
          this.status = 'ACTIVATE_ASSISTANT'
          this.activateAssistant('ASSISTANT')
        }
        break;
      case 'ACTIVATE_COMMAND':
        if (this.status !== 'ACTIVATE_ASSISTANT') {
          this.status = 'ACTIVATE_ASSISTANT'
          this.activateCommand()
        }
        break
      case 'SPEAK':
        if (this.status !== 'ACTIVATE_SPEAK') {
          this.status = 'ACTIVATE_SPEAK'
          this.activateSpeak(payload)
        }
        break;
    }
  },

  activateSpeak: function(text) {
    //@TODO espeak!
    console.log("SPEAKING:", text)
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
      }
    })
  },

  activateHotword: function() {
    console.log('[ASSTNT] Snowboy Activated')
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
    detector.on('error', function (err) {
      console.log('[ASSTNT] Detector Error', err)
      record.stop()
      this.sendSocketNotification('ERROR', 'DETECTOR')
      return
    })

    detector.on('hotword', (index, hotword, buffer)=>{
      record.stop()
      new Sound(path.resolve(__dirname, 'resources/dong.wav')).play();
      this.sendSocketNotification('HOTWORD_DETECTED', hotword)
      return
    })

    mic.pipe(detector);
  },

  activateAssistant: function(mode = 'ASSISTANT') {
    console.log('[ASSTNT] Assistant Activated')
    const assistant = new GoogleAssistant(this.config.assistant)

    const startConversation = (conversation) => {
      //console.log('Say something!');

      let spokenResponseLength = 0;
      let speakerOpenTime;
      let speakerTimer;

      conversation
        .on('audio-data', (data) => {
          record.stop()
          const now = new Date().getTime()
          if (mode == 'ASSISTANT') {
            speaker.write(data);
            spokenResponseLength += data.length;
            const audioTime
              = spokenResponseLength / (this.config.assistant.audio.sampleRateOut * 16 / 8) * 1000;
            clearTimeout(speakerTimer);
            speakerTimer = setTimeout(() => {
              speaker.end();
            }, audioTime - Math.max(0, now - speakerOpenTime));
          } else {
            speaker.end();
          }

        })
        .on('end-of-utterance', () => {
          record.stop()

        })
        .on('transcription', (text) => {
          //if (mode == 'COMMAND') {
            this.sendSocketNotification('ASSISTANT_TRANSCRIPTION', text)
          //}
          record.stop()
          //speaker.end()
        })
        .on('ended', (error, continueConversation) => {
          if (error) {
            console.log('[ASSTNT] Conversation Ended Error:', error)
            record.stop()
            this.sendSocketNotification('ERROR', 'CONVERSATION ENDED')
          } else if (continueConversation) assistant.start()
          else {
            record.stop()
            this.sendSocketNotification('ASSISTANT_FINISHED')
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
    const speech = Speech(this.config.speech.auth)
    const request = {
      config: this.config.speech.request,
      interimResults: false // If you want interim results, set this to true
    }
    const recognizeStream = speech.streamingRecognize(request)
      .on('error', (err)=>{
        console.log('[ASSTNT] RecognizeStream Error: ', err)
        record.stop()
        this.sendSocketNotification('ERROR', 'RECOGNIZESTREAM')
      })
      .on('data', (data) => {
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
