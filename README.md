## MagicMirror Module: MMM-Assistant

[![MagicMirror2](https://img.shields.io/badge/MagicMirror-2.2.2-lightgray.svg)](https://github.com/MichMich/MagicMirror)
[![DocStatus](https://inch-ci.org/github/eouia/MMM-Assistant.svg?branch=master)](https://inch-ci.org/github/eouia/MMM-Assistant)
[![GitHub last commit](https://img.shields.io/github/last-commit/eouia/MMM-Assistant.svg)](https://github.com/eouia/MMM-Assistant)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/eouia/MMM-Assistant/graphs/commit-activity)


A Voice Commander and Google-Assistant for MagicMirror

| STATUS: | Version | Date | Maintained? |
|:------- |:------- |:---- |:----------- |
| Working | `1.0.1` | 2018-03-25 | YES |


#### What is this module doing?

*MMM-Assistant* is a [MagicMirror](https://github.com/MichMich/MagicMirror) module for using your voice to:  
1. Control your MM modules
2. provide *Google Assistant* functionality
3. provide *Alexa* functionality [**WIP**]

---

### Screenshots

There is not much to see since this is a voice based module. But when the module has recognized 
one of your 2 wakewords **`smart-mirror`** (for MM control) or **`snowboy`** (for GA interaction), there will 
appear a small icon of XXXX or the google "bubbles" like this:


![Full](./docs/images/Assistant1.png)
![Full](./docs/images/Assistant2.png)


---

### Installation

There are 3 parts to the installation: 
0. Make sure your RPi OS is not too old
1. Update nodejs and npm
2. Install the dependencies
3. Install the Assistant module


**(0) Update your Raspbian OS**

The current Raspbian OS version is: `Stretch (9.4)`.

```bash
uname -a
sudo lsb_release -a

sudo apt-get update 
sudo apt-get upgrade
```


**(1) Update OS, nodejs/npm**

Before anything, make sure you are using the latest stable release of *nodejs* and *npm*.
They are currently:
```bash
# Check the nodejs and npm versions
node -v && npm -v

v9.8.0
5.8.0
```
If they are very different from this, then update using [these](https://raspberrypi.stackexchange.com/a/77483/17798) instructions.


**(2) Install the depdendencies**

```bash
sudo apt-get install libmagic-dev libatlas-base-dev libasound2-dev sox libsox-fmt-all libttspico-utils
```


**(3) Install the Assistant Module**


```bash
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-Assistant.git
cd MMM-Assistant
npm install
```


:warning: Now go to the [Wiki page](https://github.com/eouia/MMM-Assistant/wiki) and follow all the steps in 
`step 3` to create the *Google Assistant* and *Google Cloud Speech* accounts and settings. When done, 
proceed to the post installation below.


**Post installation:**

```bash
cd ~/MagicMirror/modules/MMM-Assistant/
npm install --save-dev electron-rebuild 
./node_modules/.bin/electron-rebuild --pre-gyp-fix
```
This step will take a long time, as it need to manually compile the [gRpc]() dependency. 
This take about **~25 minutes** on a RPi3. 


---

### Module Configuration

To configure the Assistant, you need to do the following:

1. Add the Module to the global MM `config.js`
2. Edit ...


Add the module to the MM modules array in the `config/config.js` file by adding the following section.
Here you also need to edit and insert the results you obtained from the Google authorization steps above,
into the fields marked: `YOUR_PROJECT_ID` and `YOUR_DOWNLOADED_PRIVATE_KEY.json` (a filename). 


```javascript
{
  module: 'MMM-Assistant',
  position: 'bottom_left',
  config: {
    assistant: {
      auth: {
        keyFilePath: "secret.json",             // REQUIRED (Google Assistant API) -- OAuth2 x509 cert
        savedTokensPath: "resources/tokens.js"  // REQUIRED (Google Assitant API) -- accesss_token & refresh_token
      },
      audio: {
        encodingIn: "LINEAR16",     // Default. No need to change.
        sampleRateOut: 16000        // Default. No need to change.
      }
    },
    snowboy: {
      models: [
        {
          file: "resources/smart_mirror.umdl",  // This file define your MM wake word. (See doc notes.)
          sensitivity: 0.5,
          hotwords : "MIRROR"                   // Default model: "MIRROR". (This is not the wake word!)
        },
        {
          file: "resources/snowboy.umdl",       // This file define your GA wake word. (See doc notes.)
          sensitivity: 0.5,
          hotwords : "ASSISTANT"                // Default model: "ASSISTANT". (This is not the wake word!)
        }
      ]
    },
    record: {
      threshold: 0,                 // Default. No need to change.
      verbose:false,                // Deafult: true  -- for checking recording status.
      recordProgram: 'rec',         // You can use 'rec', 'sox', but we recommend 'arecord'
      silence: 2.0                  // Default. No need to change.
    },
    stt: {
      auth: [{                       // You can use multiple accounts to save money
        projectId:'YOUR_PROJECT_ID',                         // REQUIRED (Google Voice API) -- project_id
        keyFilename: 'YOUR_DOWNLOADED_PRIVATE_KEY.json'      // REQUIRED (Google Voice API) -- service_account / private_key
      }],
      request: {
        encoding: 'LINEAR16',       // Default. No need to change.
        sampleRateHertz: 16000,     // Default. No need to change.
        languageCode: 'en-US'       // [en-US]  To set the default GA speech request language.
                                    // (See: https://cloud.google.com/speech/docs/languages)
      },
    },
    speak: {
      useAlert: true,               // [true]  Enable this to show the understood text of your speech
      language: 'en-US',            // [en-US] To set the default GA speech reply language.
    },
    alias: [                        // You can use aliases for difficult pronunciation or easy using.
      {
        "help :command" : ["teach me :command", "what is :command"]
      }
    ]
  }
},

```

The main difference with this **full** configuration from the [simple]() one, is that it 
uses the `rec` *vox* wrapper for recording, rather than `arecord` since it works better. 
You can change this configuration later when you see that it works.

---

### Available Voice Commands

| Command | Who? | Description |
|:------- |:---- |:----------- |
| **snowboy** | GA   | The Google Assitant wake word |
| **smart-mirror** | MM | The Smart Mirror (Snowboy)  command mode wake word |
| - | - | - |
| help `command` | MM | Explain help about a specific "`command`" | 
| list all commands | MM | List all available commands | 
| list all modules | MM | List all available modules | 
| hide all modules | MM | Hide all available modules | 
| show all modules | MM | Show all available modules | 
| say "something" | MM | Use voice to say "`something`"  | 
| reboot | MM | Reboot your RPi | 
| shut down | MM | Shut down your RPi | 

WIP - More TBA



---

### (node) Dependencies

This module depend on the following *npm* packages:

* [@google-cloud/speech() (1.3.0)
* [google-assistant]() (0.2.2)
* [node-aplay]() (1.0.3)
* [node-record-lpcm16]() (0.3.0)
* [snowboy]() (1.2.0)
* [speaker]() (0.4.0)

These are also listed in the `package.json` file and should be installed automatically when using *npm install*.
However, those may require other packages. 

For detailed information, See the [Wiki](https://github.com/eouia/MMM-Assistant/wiki)

---


#### Bugs and Warnings

:information_source: For other bugs, issues, details and updates, please refer to the 
[issue tracker](https://github.com/eouia/MMM-Assistant/issues).


#### Contribution

Feel free to post issues and PR's related to this module.
For all other or general questions, please refer to the [MagicMirror Forum](https://forum.magicmirror.builders/).

#### Credits

Most grateful thanks to:
* [---](https://github.com/---/) - for clarifying and fixing XXXX


#### License

[![GitHub
license](https://img.shields.io/github/license/eouia/MMM-Assistant.svg)](https://github.com/eouia/MMM-Assistant/blob/master/LICENSE)

(MIT)
