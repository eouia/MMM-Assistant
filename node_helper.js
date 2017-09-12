'use strict'

const Sound = require('node-aplay');
const path = require('path')
const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;
const Speaker = require('speaker')
const GoogleAssistant = require('google-assistant')


var NodeHelper = require("node_helper")

module.exports = NodeHelper.create({
  start: function () {
    this.config = {}
    this.status = 'NOTACTIVATED'
  },

  initialize: function (config) {
    this.snowboy = {}
    this.assistant = {}


    this.config = config

    this.config.assistant.auth.keyFilePath
      = path.resolve(__dirname, this.config.assistant.auth.keyFilePath)
    this.config.assistant.auth.savedTokensPath
      = path.resolve(__dirname, this.config.assistant.auth.savedTokensPath)
    this.sendSocketNotification('READY')
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case 'CONFIG':
        this.initialize(payload)
        this.status = 'READY'
        break;
      case 'SNOWBOY_STANDBY':
        if(this.status !== 'SNOWBOY_STANDBY') {
          this.status = 'SNOWBOY_STANDBY'
          this.activateSnowboy()
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
        this.activateAssistant('COMMAND')
      }
    }
  },

  activateSnowboy: function() {
    console.log('[ASSTNT] Snowboy Activated')
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
    detector.on('error', function () {
      console.log('ERROR')
      record.stop()
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

        .on('end-of-utterance', () => record.stop())
        .on('transcription', (text) => {
          if (mode == 'COMMAND') {
            this.sendSocketNotification('COMMAND', text)
          }
          record.stop()
        })
        .on('ended', (error, continueConversation) => {
          if (error) console.log('Conversation Ended Error:', error)
          else if (continueConversation) assistant.start()
          else {
            record.stop()
            this.sendSocketNotification('ASSISTANT_FINISHED')
          }
        })
        .on('error', (error) => {
          console.log('Conversation Error:', error);
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
        console.log('Assistant Error:', error)
      })
  }
})
