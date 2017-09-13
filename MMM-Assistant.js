/* global Module */

/* Magic Mirror
 * Module: MMM-Assistant
 *
 * By
 * MIT Licensed.
 */
if (String.prototype.toRegExp !== 'undefined') {
  String.prototype.toRegExp = function() {
    var lastSlash = this.lastIndexOf("/")
    if(lastSlash > 1) {
      var restoredRegex = new RegExp(
        this.slice(1, lastSlash),
        this.slice(lastSlash + 1)
      )
      return (restoredRegex) ? restoredRegex : new RegExp(this.valueOf())
    } else {
      return new RegExp(this.valueOf())
    }
  }
}


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
      recordProgram: 'arecord',
      silence: 2.0
    },
    speech: {
      auth: {
        projectId: '', //ProjectId from Google Console
        keyFilename: ''
      },
      request: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US' //See https://cloud.google.com/speech/docs/languages
      },
    },
    espeak: {
      language: 'en+f4',
      speed: 140,
      ssml: true
    }
  },

  start: function() {
    console.log("[ASSTNT] started!")
    this.commands = []
    this.status = "START"
    this.config = this.configAssignment({}, this.defaults, this.config)
    this.getCommands(
      new AssistantCommandRegister(this, this.registerCommand.bind(this))
    )

    this.isAlreadyInitialized = 0
    this.sendSocketNotification('CONFIG', this.config)
  },

  getStyles: function () {
    return ["MMM-Assistant.css","font-awesome.css"]
  },

  getCommands : function(register) {
    if (register instanceof TelegramBotCommandRegister) {
      register.add({
        command: 'ga',
        description: 'Send text to Google Assistant.',
        callback: 'cmd_telbot_ga'
      })
    }
    if (register instanceof AssistantCommandRegister) {
      register.add({
        command: 'list all commands',
        description: 'list what commands are available.',
        callback: 'cmd_asstnt_list_commands'
      })
    }
  },

  registerCommand: function(module, commandObj) {
    var c = commandObj
    var command = c.command
    var moduleName = module.name

    var callback = ((c.callback) ? (c.callback) : 'notificationReceived')
    if (typeof module[callback] !== 'function') return false
    var isNameUsed = 0
    var idx = 0
    for (var j in this.commands) {
      var sameCommand = this.commands.filter(function(com) {
        if (com.command == command) return com
      })
      if (sameCommand.length > 0) {
        isNameUsed = 1
        command = c.command + idx
        idx++
      } else {
        isNameUsed = 0
      }
    }
    if (isNameUsed == 1) return false
    var cObj = {
      command : command,
      execute : c.command.toLowerCase(),
      moduleName : module.name,
      module : module,
      description: c.description,
      callback : callback,
      argsPattern : c.args_pattern,
      argsMapping : c.args_mapping,
    }
    this.commands.push(cObj)
    return true
  },

  getDom : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "ASSTNT"
    var statusDom = document.createElement("div")
    statusDom.className = "status " + this.status
    statusDom.innerHTML = "<i class=\"fa fa-microphone fa-spin fa-2x\">"+ this.status + "</i>"
    wrapper.appendChild(statusDom)
    return wrapper
  },

  getStyles: function () {
    return ["MMM-Assistant.css"]
  },

  notificationReceived: function (notification, payload) {
    switch(notification) {
      case 'ALL_MODULES_STARTED':
        if (this.isAlreadyInitialized) {
          return
        }
        this.isAlreadyInitialized = 1
        var commands = []
        MM.getModules().enumerate((m) => {
          console.log('getCommands', m.name)
          if (m.name !== 'MMM-Assistant') {
            if (typeof m.getCommands == 'function') {
              var tc = m.getCommands(new AssistantCommandRegister(
                m,
                this.registerCommand.bind(this)
              ))
              if (Array.isArray(tc)) {
                tc.forEach((c)=>{
                  this.registerCommand(m, c)
                })
              }
            }
          }
        })
        break;
      case 'ASSTNT_TELL_ADMIN':
        if (typeof payload == 'string') {
          //@TODO Speak payload!
        }
        break;
    }

  },

  // socketNotificationReceived from helper
  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case 'HOTWORD_DETECTED':
        this.status = "HOTWORD_DETECTED"
        console.log("[ASSTNT] Hotword detected:", payload)
        this.hotwordDetected(payload)
        break
      case 'READY':
        this.status = "HOTWORD_STANDBY"
        console.log("[ASSTNT] Hotword detection standby")
        this.sendSocketNotification("HOTWORD_STANDBY")
        break
      case 'HOTWORD_STANDBY':
        this.status = "HOTWORD_STANDBY"
        console.log("[ASSTNT] Hotword detection standby")
        this.sendSocketNotification("HOTWORD_STANDBY")
        break
      case 'ASSISTANT_FINISHED':
        this.status = "HOTWORD_STANDBY";
        console.log("[ASSTNT] Hotword detection standby")
        this.sendSocketNotification("HOTWORD_STANDBY")
        break
      case 'COMMAND':
        this.status = "COMMAND";
        console.log("[ASSTNT] Command:", payload)
        this.parseCommand(payload, this.sendSocketNotification.bind(this))
        //this.sendSocketNotification("HOTWORD_STANDBY")
        break;
      case 'ERROR':
        this.status = "ERROR"
        console.log("[ASSTNT] Error:", payload)
        this.sendSocketNotification("HOTWORD_STANDBY")
      case 'ACTIVE_ASSISTANT':
        this.status = 'ACTIVE_ASSISTANT',
        this.updateDom()
    }
    this.updateDom()
  },

  cmd_telbot_ga : function (command, handler) {
    if(handler instanceof TelegramBotMessageHandler) {
      this.sendSocketNotification("ASSITANT_TEXT", handler.args)
      handler.reply("TEXT", "I will response on Mirror.")
    }
  },

  cmd_asstnt_list_commands : function (command, handler) {
    var text = "These are available commands.<br>"

    this.commands.forEach((c) => {
      text += ("<b>[" + c.command + "]</b>, ")
    })
    this.sendNotification('SHOW_ALERT', {
      timer:30000,
      title:"[MMM-Assistant]",
      message:text
    })
    if(handler instanceof AssistantHandler) {
      handler.response(text)
    }
  },

  hotwordDetected : function (type) {
    if (type == 'ASSISTANT') {
      this.sendSocketNotification('ACTIVATE_ASSISTANT')
      this.status = 'ACTIVATE_ASSISTANT'
      this.updateDom()
    } else if (type == 'MIRROR') {
      this.sendSocketNotification('ACTIVATE_COMMAND')
      this.status = 'ACTIVATE_COMMAND'
      this.updateDom()
    }
  },

  parseCommand: function(msg, cb) {
    var args = null
    var response = null
    if (typeof msg == 'undefined') {
      cb("HOTWORD_STANDBY")
      return
    }
    var msgText = msg
    for(var i in this.commands) {
      var c = this.commands[i]
      var matched = msgText.match(new RegExp(("/^" + c.execute + "/").toRegExp()))
      if (matched) {
        if (c.argsPattern && Array.isArray(c.argsPattern)) {
          args = []
          for(var j = 0; j < c.argsPattern.length; j++) {
            var p = c.argsPattern[j]
            if (p instanceof RegExp) {
              //do nothing.
            } else {
              if (typeof p == 'string') {
                p = p.toRegExp()
              } else {
                p = /.*/
              }
            }
            console.log("match", p, msgText)
            var result = p.exec(msgText.trim())
            console.log("result", result)
            if (c.argsMapping && Array.isArray(c.argsMapping)) {
              if (typeof c.argsMapping[j] !== 'undefined') {
                if (result && result.length == 1) {
                  args[c.argsMapping[j]] = result[0]
                } else {
                  args[c.argsMapping[j]] = result
                }
              } else {
                if (result && result.length == 1) {
                  args.push(result[0])
                } else {
                  args.push(result)
                }
              }
            } else {
              if (result && result.length == 1) {
                args.push(result[0])
              } else {
                args.push(result)
              }
            }
          }
        } else {
          args = msgText
        }
        console.log("args", args)
        if (c.callback !== 'notificationReceived') {
          var callbacks = {
            response: this.response.bind(this)
          }
          var handler = new AssistantHandler(msg, args, callbacks)
          c.module[c.callback].bind(c.module)
          c.module[c.callback](c.execute, handler)
        } else {
          c.module[c.callback].bind(c.module)
          c.module[c.callback](c.execute, args)
        }
        break

      } else {
        var callbacks = {
          response: this.response.bind(this)
        }
        var handler = new AssistantHandler(msg, null, callbacks)
        handler.response(this.translate("ASSTNT_NOT_REGISTERED_COMMAND"))
      }
    }
    cb("HOTWORD_STANDBY")
  },

  response: function(text) {
    this.sendSocketNotification('SPEAK', text)
    this.status = 'SPEAK'
    this.updateDom()
  },
  reply: function(text) {
    this.response(text)
  },
  ask: function(text) {
    this.response(text)
  },
  say: function(text) {
    this.response(text)
  },

  configAssignment : function (result) {
    var stack = Array.prototype.slice.call(arguments, 1);
    var item;
    var key;
    while (stack.length) {
      item = stack.shift();
      for (key in item) {
        if (item.hasOwnProperty(key)) {
          if (
            typeof result[key] === 'object'
            && result[key]
            && Object.prototype.toString.call(result[key]) !== '[object Array]'
          ) {
            if (typeof item[key] === 'object' && item[key] !== null) {
              result[key] = this.configAssignment({}, result[key], item[key]);
            } else {
              result[key] = item[key];
            }
          } else {
            result[key] = item[key];
          }
        }
      }
    }
    return result;
  },
})




function AssistantCommandRegister (module, registerCallback) {
  this.module = module
  this.registerCallback = registerCallback
}

AssistantCommandRegister.prototype.add = function (commandObj) {
  this.registerCallback(this.module, commandObj)
}

function AssistantHandler (message, args, callbacks) {
  this.args = args
  this.message = message
  this.callbacks = callbacks
}

AssistantHandler.prototype.response = function(text) {
  this.callbacks.response(text)
}

AssistantHandler.prototype.say = function(type, text, opts) {
  //for compatibility with MMM-TelegramBot
  var msg = "Sorry, I cannot pronounce this response."
  if (type == 'TEXT') {
    msg = text
  }
  this.response(msg)
}

AssistantHandler.prototype.reply = function(type, text, opts) {
  //for compatibility with MMM-TelegramBot
  this.say(type, text, opts)
}

AssistantHandler.prototype.ask = function(type, text, opts) {
  //for compatibility with MMM-TelegramBot
  var msg = "Sorry, the question and answer based dialog is not supported in command mode. Please ask module developer."
  this.response(msg)
}

class ASTMessage {
  constructor() {
    this.class = 'Assistant'
  }
}
