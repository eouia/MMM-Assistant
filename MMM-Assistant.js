/* --------------------------------------------------------------------------
 * Module:       MMM-Assistant
 * FileName:     MMM-Assistant.js
 * Author:       eouia
 * License:      MIT
 * Date:         2018-04-01
 * Version:      1.0.3
 * Description:  A MagicMirror module to control your modules
 * Format:       4-space TAB's (no TAB chars), mixed quotes
 *
 * URL:          https://github.com/eouia/MMM-Assistant
 * --------------------------------------------------------------------------
 */

// XXX???
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

Module.register("MMM-Assistant",
  // Default Settings
  {
  defaults: {
    system: {
      readAlert:          true,                   // Reserved: for ??
      commandRecognition: 'google-cloud-speech',  // Reserved: for 'google-assistant'
      commandSpeak:       'pico',                 // Reserved: for 'google-translate'
    },
    assistant: {
        auth: {
            keyFilePath:     "assets/google-client-secret.json",    // "assets/secret.json"
            savedTokensPath: "assets/google-access-tokens.json"     // "assets/tokens.json"
        },
        conversation: {
            lang: 'en-US',
            audio: {
                encodingIn: "LINEAR16",
                sampleRateOut: 16000
            }
        },
    },
    snowboy: {
      models: [
        {
          hotwords : "MIRROR",
          file: "resources/u-models/smart_mirror.umdl",
          sensitivity: 0.5
        },
        {
          hotwords : "ASSISTANT",
          file: "resources/u-models/snowboy.umdl",
          sensitivity: 0.5
        }
      ]
    },
    record: {
      threshold: 0,
      verbose:false,
      recordProgram: 'arecord',     // alternatively use "rec" (a vox wrapper)
      silence: 2.0
    },
    stt: {
      auth: [{
        projectId: '',              // ProjectId from Google Console
        keyFilename: ''             // YOUR_DOWNLOADED_PRIVATE_KEY.json --> ./assets/google-private-key.json
      }],
      request: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US'       // https://cloud.google.com/speech/docs/languages
      },
    },
    speak: {
      useAlert: true,
      language: 'en-US',
    },
    alias: [{  "help :command" : ["teach me :command", "what is :command"]  }]
  },

  start: function() {
    console.log("[ASSTNT] started!")
    this.modulemap = new Map(this.config.modulemap)
    this.commands = []
//    this.screentimer
    this.status = "START"
    this.config = this.configAssignment({}, this.defaults, this.config)
    this.getCommands( new AssistantCommandRegister(this, this.registerCommand.bind(this)) )
    this.isAlreadyInitialized = 0
    this.sendSocketNotification('CONFIG', this.config)
  },

  getTranslations: function() {
    return {
        en: "translations/en.json",
        nl: "translations/nl.json",
        fr: "translations/fr.json",
    }
  },

  getStyles: function () {
    return ["MMM-Assistant.css","font-awesome.css"]
  },

  getCommands : function(Register) {
    if (Register.constructor.name == 'TelegramBotCommandRegister') {
      //do nothing
    }
    if (Register.constructor.name == 'AssistantCommandRegister') {
      var commands = [
        {
          command: this.translate("CMD_HELP"),
          callback : 'cmd_asstnt_help',
          description : this.translate("CMD_HELP_DESCRIPTION"),
        },
        {
          command: this.translate("CMD_LIST_COMMANDS"),
          description: this.translate("CMD_LIST_COMMANDS_DESCRIPTION"),
          callback : 'cmd_asstnt_list_commands'
        },
        {
          command: this.translate("CMD_LIST_MODULES"),
          description: this.translate("CMD_LIST_MODULES_DESCRIPTION"),
          callback : 'cmd_asstnt_list_modules'
        },
        {
          command: this.translate("CMD_HIDE_ALL_MODULES_EXCEPT"),
          description : this.translate("CMD_HIDE_ALL_MODULES_EXCEPT_DESCRIPTION"),
          callback : 'cmd_asstnt_hideall_except',
        },
        {
          command: this.translate("CMD_HIDE_ALL_MODULES"),
          description : this.translate("CMD_HIDE_ALL_MODULES_DESCRIPTION"),
          callback : 'cmd_asstnt_hideall',
        },
        {
          command: this.translate("CMD_HIDE_MODULE"),
          description : this.translate("CMD_HIDE_MODULE_DESCRIPTION"),
          callback : 'cmd_asstnt_hide_module',
        },
        {
          command: this.translate("CMD_SHOW_ALL_MODULES"),
          description : this.translate("CMD_SHOW_ALL_MODULES_DESCRIPTION"),
          callback : 'cmd_asstnt_showall',
        },
        {
          command: this.translate("CMD_SHOW_MODULE"),
          description : this.translate("CMD_SHOW_MODULE_DESCRIPTION"),
          callback : 'cmd_asstnt_show_module',
        },
        {
          command: this.translate("CMD_SAY"),
          description : this.translate("CMD_SAY_DESCRIPTION"),
          callback : 'cmd_asstnt_say',
        },
        {
          command: this.translate("CMD_SHUTDOWN"),
          description : this.translate("CMD_SHUTDOWN_DESCRIPTION"),
          callback : 'cmd_asstnt_shutdown',
        },
        {
          command: this.translate("CMD_REBOOT"),
          description : this.translate("CMD_REBOOT_DESCRIPTION"),
          callback : 'cmd_asstnt_reboot',
        },
        {
          command: this.translate("CMD_WAKE_UP"),
          description : this.translate("CMD_WAKE_UP_DESCRIPTION"),
          callback : 'cmd_asstnt_wakeup',
        },
        {
          command: this.translate("CMD_STAY_AWAKE"),
          description : this.translate("CMD_STAY_AWAKE_DESCRIPTION"),
          callback : 'cmd_asstnt_stay_awake',
        },
        {
          command: this.translate("CMD_GOTO_SLEEP"),
          description : this.translate("CMD_GOTO_SLEEP_DESCRIPTION"),
          callback : 'cmd_asstnt_gotosleep',
        },
      ]
      commands.forEach((c) => {
        Register.add(c)
      })
    }
  },

  //=========================================================================
  //  Begin COMMAND functions
  //=========================================================================

  cmd_asstnt_reboot : function (command, handler) {
    var text = ""
    this.sendSocketNotification('REBOOT')
  },

  cmd_asstnt_shutdown : function (command, handler) {
    var text = ""
    this.sendSocketNotification('SHUTDOWN')
  },

  cmd_asstnt_wakeup : function (command, handler) {
    if (typeof this.config.screen.on !== 'undefined') {
      this.sendSocketNotification('EXECUTE', this.config.screen.on)
    } else {
      this.sendSocketNotification('EXECUTE', "vcgencmd display_power 1")
    }
    if (typeof this.config.screen.timeoff !== 'undefined') {
      if (typeof this.config.screen.timeoff !== 0) {
        clearTimeout(this.screenTimer)
        this.screenTimer = setTimeout(() => {
          if (typeof this.config.screen.off !== 'undefined') {
            this.sendSocketNotification('EXECUTE', this.config.screen.off)
          } else {
            this.sendSocketNotification('EXECUTE', "vcgencmd display_power 0")
          }
        }, this.config.screen.timeoff * 1000)
      }
    }
    if (this.status !== "COMMAND_MODE") this.sendSocketNotification("HOTWORD_STANDBY")
  },

  cmd_asstnt_stay_awake : function (command, handler) {
    clearTimeout(this.screenTimer)
    if (this.status !== "COMMAND_MODE") this.sendSocketNotification("HOTWORD_STANDBY")
  },

  cmd_asstnt_gotosleep : function (command, handler) {
    if (typeof this.config.screen.off !== 'undefined') {
      this.sendSocketNotification('EXECUTE', this.config.screen.off)
    } else {
      this.sendSocketNotification('EXECUTE', "vcgencmd display_power 0")
    }
    if (this.status !== "COMMAND_MODE") this.sendSocketNotification("HOTWORD_STANDBY")
  },

  cmd_asstnt_say : function (command, handler) {
    this.sendSocketNotification('LOG',  {title: "SAY", message: handler.args.something})
    handler.response(handler.args.something)
  },

  cmd_asstnt_hideall : function (command, handler) {
    var text = this.translate("CMD_HIDE_ALL_MODULES_RESULT")
    var lockString = this.name
    MM.getModules().enumerate( (m)=> { m.hide(0, {lockString:lockString}) })
    if (this.status !== "COMMAND_MODE") {
      this.sendSocketNotification("HOTWORD_STANDBY")
    } else {
      handler.response(text)
    }
  },

  cmd_asstnt_hide_module : function (command, handler) {
    var text = this.translate("CMD_HIDE_MODULE_RESULT")
    var lockString = this.name
    var target = handler.args['module']
    var moduleSet = this.modulemap.get(target)
    if (typeof moduleSet == 'undefined') moduleSet = target
    MM.getModules().withClass(moduleSet).forEach( (m)=> {
       m.hide(0, {lockString:lockString})
    })
    if (this.status !== "COMMAND_MODE") {
      this.sendSocketNotification("HOTWORD_STANDBY")
    } else {
      handler.response(text)
    }
  },

  cmd_asstnt_showall : function (command, handler) {
    var text = this.translate("CMD_SHOW_ALL_MODULES_RESULT")
    var lockString = this.name
    MM.getModules().enumerate( (m)=> { m.show(0, {lockString:lockString}) })
    if (this.status !== "COMMAND_MODE") {
      this.sendSocketNotification("HOTWORD_STANDBY")
    } else {
      handler.response(text)
    }
  },

  cmd_asstnt_show_module : function (command, handler) {
    var text = this.translate("CMD_SHOW_MODULE_RESULT")
    var lockString = this.name
    var target = handler.args['module']
    var moduleSet = this.modulemap.get(target)
    if (typeof moduleSet == 'undefined') moduleSet = target
    MM.getModules().withClass(moduleSet).forEach( (m)=> {
       m.show(0, {lockString:lockString})
    })
    if (this.status !== "COMMAND_MODE") {
      this.sendSocketNotification("HOTWORD_STANDBY")
    } else {
      handler.response(text)
    }
  },

  cmd_asstnt_hideall_except : function (command, handler) {
    var text = this.translate("CMD_HIDE_ALL_MODULES_EXCEPT_RESULT")
    var lockString = this.name
    var target = handler.args['module']
    var moduleSet = this.modulemap.get(target)
    if (typeof moduleSet == 'undefined') moduleSet = target
    MM.getModules().exceptWithClass(moduleSet).forEach( (m)=> {
       if (m.name != this.name) {m.hide(1000, {lockString:lockString})}
    })
    MM.getModules().withClass(moduleSet).forEach( (m)=> {
       m.show(1000, {lockString:lockString})
    })
    if (this.status !== "COMMAND_MODE") {
      this.sendSocketNotification("HOTWORD_STANDBY")
    } else {
      handler.response(text)
    }
  },

  cmd_asstnt_list_commands : function (command, handler) {
    var text = this.translate("CMD_LIST_COMMANDS_RESULT") + "<br>"
    var commands = ""
    this.commands.forEach((c) => {
      if (commands) {
        commands += ", "
      }
      var tx = c.command.replace(
        /(\:\S+)/g,
        (x) => {return "<i class='args'>" + x.replace(":", "") + "</i>"}
      )
      commands += ("<b class='command'>\"" + tx + "\"</b>")
    })
    text = text + commands + "."
    handler.response(text)
  },

  cmd_asstnt_list_modules : function (command, handler) {
    var text = ""
    MM.getModules().enumerate((m)=>{
      if (text !== "") {
        text += ', '
      }
      var hidden = ((m.hidden) ? "hidden" : "showing")
      text += ("<b class='module " + hidden + "'>" + m.name + "</b>")

    })
    text = this.translate("CMD_LIST_MODULES_RESULT") + "<br>" + text
    handler.response(text)
  },

  cmd_asstnt_help: function (command, handler) {
    var target
    var text = ""
    if (handler.args !== null) {
      target = handler.args['command']
      this.commands.forEach((c)=>{
        var tc = c.command.replace(/\:\S+/g, "").trim()
        if (tc == target) {
          text += (c.description) ? c.description : ""
          text += "<br>"
          text += (
            (c.moduleName)
              ? (this.translate("CMD_HELP_COMMAND_PROVIDER", {"module":c.moduleName}))
              : ""
          )
        }
      })
    }
    if (!text) {
      text = this.translate("CMD_HELP_COMMAND_EXAMPLE")
    }
    handler.response(text)
  },
  //-------------------------------------------------------------------------
  //  End COMMAND functions
  //-------------------------------------------------------------------------


  registerCommand: function(module, commandObj) {
    var c = commandObj
    var command = c.command.replace(/\([^\s]*\)/g, "")
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
      execute : c.command,
      moduleName : module.name,
      module : module,
      description: c.description,
      callback : callback,
    }
    this.commands.push(cObj)

    if (this.config.alias[command]) {
      var alias = this.config.alias[command]
      alias.forEach((ac)=>{
        var cObj = {
          command : ac.replace(/\([^\s]*\)/g, ""),
          execute : ac,
          moduleName : module.name,
          module : module,
          description: c.description + this.translate("ALIAS", {"command":command}),
          callback : callback,
        }
        this.commands.push(cObj)
      })
    }
    return true
  },

  getDom : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "ASSTNT"
    var iconDom = document.createElement("div")
    iconDom.className = "mdi status " + this.status + " "
    switch(this.status) {
      case 'INITIALIZED':
        iconDom.className += "mdi-microphone-outline"
        break
      case 'HOTWORD_STARTED':
        iconDom.className += "mdi-microphone"
        break
      case 'HOTWORD_DETECTED':
        iconDom.className += "mdi-microphone"
        break
      case 'ASSISTANT_STARTED':
        iconDom.className += "mdi-google-assistant"
        break
      case 'ASSISTANT_SPEAKING':
        iconDom.className += "mdi-google-assistant"
        break
      case 'COMMAND_STARTED':
        iconDom.className += "mdi-apple-keyboard-command"
        break
      case 'COMMAND_LISTENED':
        iconDom.className += "mdi-apple-keyboard-command"
        break
      case 'SPEAK_STARTED':
        iconDom.className += "mdi-message-processing"
        break
      case 'SPEAK_ENDED':
        iconDom.className += "mdi-microphone"
        break
    }

    iconDom.innerHTML = ""
    wrapper.appendChild(iconDom)
    return wrapper
  },

  notificationReceived: function (notification, payload, sender) {
    switch(notification) {
      case 'ASSISTANT_REQUEST_PAUSE':
        this.sendSocketNotification('PAUSE', sender.name)
        break
      case 'ASSISTANT_REQUEST_RESUME':
        this.sendSocketNotification('RESUME', sender.name)
        break
      case 'ALL_MODULES_STARTED':
        if (this.isAlreadyInitialized) {
          return
        }
        this.isAlreadyInitialized = 1
        this.loadCSS()
        var commands = []
        MM.getModules().enumerate((m) => {
          if (m.name !== 'MMM-Assistant') {
            if (typeof m.getCommands == 'function') {
              var tc = m.getCommands(new AssistantCommandRegister(m, this.registerCommand.bind(this) ))
              if (Array.isArray(tc)) {
                tc.forEach((c)=>{
                  this.registerCommand(m, c)
                })
              }
            }
          }
        })
        this.sendSocketNotification('HOTWORD_STANDBY')
        break;
    }
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case 'PAUSED':
        this.status == 'PAUSED'
        this.updateDom()
        this.sendNotification('ASSISTANT_PAUSED')
        break;
      case 'RESUMED':
        this.status == 'HOTWORD_STANDBY'
        this.sendSocketNotification("HOTWORD_STANDBY")
        this.sendNotification('ASSISTANT_RESUMED')
        break;
      case 'HOTWORD_DETECTED':
        this.status = "HOTWORD_DETECTED"
        console.log("[ASSTNT] Hotword detected:", payload)
        this.hotwordDetected(payload)
        break
      case 'READY':
        this.status = "HOTWORD_STANDBY"
        this.sendSocketNotification("HOTWORD_STANDBY")
        break
      case 'HOTWORD_STANDBY':
        this.status = "HOTWORD_STANDBY"
        console.log("[ASSTNT] Hotword detection standby")
        this.sendSocketNotification("HOTWORD_STANDBY")
        break
      case 'ASSISTANT_FINISHED':
        if (payload == 'ASSISTANT') {
          this.status = "HOTWORD_STANDBY";
          this.sendSocketNotification("HOTWORD_STANDBY")
        }
        break
      case 'NOTIFY':
        this.status = "COMMAND_MODE"
        if (payload.notification == "COMMAND") {
          this.parseCommand(payload.parameter, this.sendSocketNotification.bind(this))
        } else if (payload.notification == "EXECUTE") {
          this.sendSocketNotification("EXECUTE", payload.parameter)
        } else {
          this.sendNotification(payload.notification, payload.parameter)
        }
        break
      case 'COMMAND':
        console.log("[ASSTNT] Command:", payload)
        this.parseCommand(payload, this.sendSocketNotification.bind(this))
        break;
      case 'ERROR':
        this.status = "ERROR"
        console.log("[ASSTNT] Error:", payload)
        this.sendSocketNotification("HOTWORD_STANDBY")
        break
      case 'LOG': 
        // straight back to node helper
        this.sendSocketNotification(notification, payload)
        break
      case 'MODE':
        this.status = payload.mode
        if (payload.mode == 'SPEAK_ENDED') {
//          this.sendNotification("HIDE_ALERT");
          if (payload.useAlert) { this.sendNotification("HIDE_ALERT"); }
          this.sendSocketNotification("HOTWORD_STANDBY")
        }

        if (payload.mode == 'SPEAK_STARTED') {
          if (payload.useAlert) {
            var html = "<p class='yourcommand mdi mdi-voice'> \"" + payload.originalCommand + "\"</p>"
            html += "<div class='answer'>" + payload.text + "</div>"
            this.sendNotification(
              'SHOW_ALERT',
              {
                title: "[MMM-Assistant]",
                message: html,
                imageFA: "microphone",
                timer: 120000,
              }
            )
          }
        }
        this.updateDom()
        // E3V3A: No break here?
    }
  },

  hotwordDetected : function (type) {
    //  execute commands
    if (typeof this.config.snowboy.models[type.index-1].commands !== 'undefined') {
      this.config.snowboy.models[type.index-1].commands.forEach(
        (command) => {
          this.sendSocketNotification('LOG', {title: "[Command] ", message: command})
          if (command.notification == 'ASSISTANT') {
            this.sendSocketNotification('ACTIVATE_ASSISTANT')
            this.status = 'ACTIVATE_ASSISTANT'
          } else if (command.notification == 'MIRROR') {
            this.status = 'ACTIVATE_COMMAND'
            this.sendSocketNotification('ACTIVATE_COMMAND')
          } else {
            this.status = "COMMAND_MODE"
            this.sendSocketNotification('NOTIFY', command)
          }
        }
      )
    } else if (typeof this.config.snowboy.models[type.index-1].hotwords !== 'undefined') {
      if (this.config.snowboy.models[type.index-1].hotwords == 'ASSISTANT') {
        this.sendSocketNotification('ACTIVATE_ASSISTANT')
        this.status = 'ACTIVATE_ASSISTANT'
      } else if (this.config.snowboy.models[type.index-1].hotwords == 'MIRROR') {
        this.status = 'ACTIVATE_COMMAND'
        this.sendSocketNotification('ACTIVATE_COMMAND')
      }
    }
    // if last command was not a call for assistant or voice command then activate snowboy
    if (this.status == "COMMAND_MODE") {
      this.sendSocketNotification("NOTIFY", {notification: "HOTWORD_STANDBY"})
    }
  },

  parseCommand: function(msg, cb) {
    var args = null
    var response = null
    if (typeof msg == 'undefined') {
      cb("HOTWORD_STANDBY")
      return
    }
    var msgText = msg.toLowerCase()
    var commandFound = 0
    var c
    for(var i in this.commands) {
      c = this.commands[i]
      var commandPattern = c.execute
      // :args or :args(pattern)
      var argsPattern = /\:([^\(\s]+)(\(\S+\))?/g
      var hasArgs = commandPattern.match(argsPattern)
      var argsGroup = []
      var args = []
      if (hasArgs) {
        var ta = []
        hasArgs.forEach((arg)=>{
          var argPattern = /\:([^\(\s]+)(\(\S+\))?/g
          var ma = argPattern.exec(arg)
          var pattern = {}
          pattern.origin = ma[0]
          pattern.pattern = (ma[2]) ? ma[2] : "(.*)"
          ta.push(pattern)
          argsGroup.push(ma[1])
        })
        ta.forEach((arg)=>{
          commandPattern = commandPattern.replace(arg.origin, arg.pattern)
        })
      } else { // command has no args pattern
        argsGroup = []
      }
      var matched = ("^" + commandPattern).toRegExp().exec(msgText)

      if (matched) {
        commandFound = 1
        if (argsGroup) {
          for(var j=0; j<argsGroup.length ;j++) {
            args[argsGroup[j]] = matched[j+1]
          }
        }
      }
      if (commandFound == 1) {
        break
      }
    }
    if (commandFound == 1) {
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
    } else {
      var callbacks = {
        response: this.response.bind(this)
      }
      var handler = new AssistantHandler(msg, null, callbacks)
      handler.response(this.translate("INVALID_COMMAND"), msgText)
    }
    // cb("HOTWORD_STANDBY")
  },

  response: function(text, originalCommand, option) {
    if (this.status !== "COMMAND_MODE") {
      this.sendSocketNotification('SPEAK', {text:text, option:option, originalCommand:originalCommand} )
      this.status = 'SPEAK'
    }
  },

  loadCSS: function() {
    var css = [{
        id:   'materialDesignIcons',
        href: 'https://cdn.materialdesignicons.com/2.0.46/css/materialdesignicons.min.css',
    }]
    css.forEach(function(c) {
      if (!document.getElementById(c.id)) {
        var head  = document.getElementsByTagName('head')[0]
        var link  = document.createElement('link')
        link.id   = c.id
        link.rel  = 'stylesheet'
        link.type = 'text/css'
        link.href = c.href
        link.media = 'all'
        head.appendChild(link)
      }
    })
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


//-----------------------------------------------------------------
//  Helper Functions
//-----------------------------------------------------------------

function AssistantCommandRegister (module, registerCallback) {
  this.module = module
  this.registerCallback = registerCallback
}

AssistantCommandRegister.prototype.add = function(commandObj) {
  this.registerCallback(this.module, commandObj)
}

function AssistantHandler (message, args, callbacks) {
  this.args = args
  this.message = message
  this.callbacks = callbacks
}

AssistantHandler.prototype.response = function(text, opts) {
  this.callbacks.response(text, this.message, opts)
}

AssistantHandler.prototype.say = function(type, text, opts) {
  //for compatibility with MMM-TelegramBot
  var msg = "UNSPEAKABLE"
  if (type == 'TEXT') { msg = text; }
  this.response(msg, opts)
}

AssistantHandler.prototype.reply = function(type, text, opts) {
  //for compatibility with MMM-TelegramBot
  this.say(type, text, opts)
}

AssistantHandler.prototype.ask = function(type, text, opts) {
  //for compatibility with MMM-TelegramBot
  var msg = "INVALID_FORMAT"
  this.response(msg, opts)
}

class ASTMessage {
  constructor() {
    this.class = 'Assistant'
  }
}

