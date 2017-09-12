/* global Module */

/* Magic Mirror
 * Module: MMM-Assistant
 *
 * By
 * MIT Licensed.
 */

Module.register("MMM-Assistant", {
  defaults: {
    assistant: {
      auth: {
        keyFilePath: "secret.json",
        savedTokensPath: "resources/tokens.js"
      },
      audio: {
        encodingIn: "LINEAR16",
        sampleRateOut: 16000
      }
    },
    snowboy: {
      models: [
        {
          file: "resources/smart_mirror.umdl",
          sensitivity: 0.5,
          hotwords : "MIRROR"
        },
        {
          file: "resources/snowboy.umdl",
          sensitivity: 0.5,
          hotwords : "ASSISTANT"
        }
      ]
    },
    record: {
      threshold: 0,
      verbose:false,
      recordProgram: 'arecord'
    }
  },
  start: function() {
    console.log("[ASSTNT] started!")
    this.sendSocketNotification('CONFIG', this.config)
  },

  getCommands : function(register) {
    if (register instanceof TelegramBotCommandRegister) {
      register.add({
        command: 'ga',
        description: 'Send text to Google Assistant.',
        callback: 'cmd_ga'
      })
    }
  },

  getDom : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "Assistant"

    return wrapper
  },

  getStyles: function () {
    return ["MMM-Assistant.css"]
  },

  notificationReceived: function (notification, payload) {
    if(notification == "DOM_OBJECTS_CREATED") {

    }
  },

  // socketNotificationReceived from helper
  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case 'HOTWORD_DETECTED':
        this.hotwordDetected(payload)
        break
      case 'READY':
        console.log("[ASSTNT] Hotword detection standby")
        this.sendSocketNotification("SNOWBOY_STANDBY")
        break
      case 'SNOWBOY_STANDBY':
        console.log("[ASSTNT] Hotword detection standby")
        this.sendSocketNotification("SNOWBOY_STANDBY")
        break
      case 'ASSISTANT_FINISHED':
        console.log("[ASSTNT] Hotword detection standby")
        this.sendSocketNotification("SNOWBOY_STANDBY")
        break
      case 'COMMAND':
        console.log("[ASSTNT] Command:", payload)
        this.sendSocketNotification("SNOWBOY_STANDBY")
        break;
    }
  },

  cmd_ga : function (command, handler) {
    console.log("handler", handler.constructor.name, handler instanceof TelegramBotMessageHandler)
    if(handler instanceof TelegramBotMessageHandler) {
      this.sendSocketNotification("ASSITANT_TEXT", handler.args)
      handler.reply("TEXT", "I will response on Mirror.")
    }
  },

  hotwordDetected : function (type) {
    if (type == 'ASSISTANT') {
      this.sendSocketNotification('ACTIVATE_ASSISTANT')
    } else if (type == 'MIRROR') {
      this.sendSocketNotification('ACTIVATE_COMMAND')
    }
  },
})
