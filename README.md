## MagicMirror Module: MMM-Assistant

[![MagicMirror2](https://img.shields.io/badge/MagicMirror-2.2.2-lightgray.svg)](https://github.com/MichMich/MagicMirror)
[![DocStatus](https://inch-ci.org/github/eouia/MMM-Assistant.svg?branch=master)](https://inch-ci.org/github/eouia/MMM-Assistant)
[![GitHub last commit](https://img.shields.io/github/last-commit/eouia/MMM-Assistant.svg)](https://github.com/eouia/MMM-Assistant)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://GitHub.com/eouia/MMM-Assistant/graphs/commit-activity)
[![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/eouia/MMM-Assistant.svg)](http://isitmaintained.com/project/eouia/MMM-Assistant "Average time to resolve an issue")
[![Dependency Status](https://beta.gemnasium.com/badges/github.com/eouia/MMM-Assistant.svg)](https://beta.gemnasium.com/projects/github.com/eouia/MMM-Assistant)

A Voice Commander and Google-Assistant for MagicMirror

| STATUS: | Version | Date | Maintained? |
|:------- |:------- |:---- |:----------- |
| Working | `1.0.3` | 2018-03-30 | YES |


#### What is this module doing?

*MMM-Assistant* is a [MagicMirror](https://github.com/MichMich/MagicMirror) (MM) module for using your voice to:  

- control your other *MM* modules
- provide *Google Assistant* functionality
- provide *Alexa* functionality [**WIP**]

---

### Screenshots

There is not much to see since this is a voice based module. But there is a small microphone icon in the modules position.
The icon changes depending on its status, so if you use the wake workds, it will change and also indicate this change by 
playing a "ding". The 2 available wakewords are: **`smart-mirror`** (for MM control) and **`snowboy`** (for GA interaction).
The following icons will appear, depending on the operating *mode* it's in:


| Normal `Listening` | Magic Mirror `Control` | `Google Assistant` | `Amazon Alexa` | `Error` |
|:------------------:|:----------------------:|:------------------:|:--------------:|:-------:| 
| ![Full](./images/Assistant_1.png) | ![Full](./images/Assistant_MM.png) | ![Full](./images/Assistant_GA.png) | ![Full](./images/Assistant_AA.png) | ![Full](./images/Assistant_ProcError.png) |


---

### Installation

There are 5 parts to the installation: 

0. Make sure your RPi OS is not too old...
1. Update *nodejs* and *npm*
2. Install the dependencies
3. Install the Assistant module
4. Setup your *GA* API account
5. Post Installation
6. ~~Configuration~~ 


**(0) To Update your OS**

You should always use the **full** (not `Lite`) version of the Raspbian OS, if you are running on a Raspberry Pi.
The current Raspbian OS version is: `Stretch (9.4)`. You can find your version with:

```bash
uname -a
sudo lsb_release -a
```

If you need to update, use:


```bash
sudo apt-get update 
sudo apt-get upgrade
```


**(1) To Update *nodejs* & *npm***

Before anything, make sure you are using the latest stable release of *nodejs* and *npm*.
They are currently:

```bash
# Check the nodejs and npm versions
node -v && npm -v

v9.10.1
5.8.0
```

If they are very different from this, then update using [these](https://raspberrypi.stackexchange.com/a/77483/17798) instructions.


**(2) To Install the Depdendencies**

```bash
sudo apt-get install libmagic-dev libatlas-base-dev libasound2-dev sox libsox-fmt-all libttspico-utils
```

**(3) To Install the Assistant Module**


```bash
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-Assistant.git
cd MMM-Assistant
date; time npm install         # ~8 min, ~705 packages
```

**(4) Setting up the API Accounts**

*WIP*

:red_circle: Now go to the [Wiki page](https://github.com/eouia/MMM-Assistant/wiki) and follow all the steps in 
`step 3` to create the *Google Assistant* and *Google Cloud Speech* accounts and settings. When done, 
proceed to the post installation below.


**(5) Post Installation**

```bash
cd ~/MagicMirror/modules/MMM-Assistant/
npm install --save-dev electron-rebuild             # ~65 sec
# Do not use the deprecated: --pre-gyp-fix
date; time ./node_modules/.bin/electron-rebuild     # ~25-42 min
```

The last step will take a very long time, as it need to manually compile the [gRPC](https://github.com/grpc/grpc) dependency.  
:warning: This take at least **~25 minutes** on a RPi3, with little or no output. Do not interrupt! :warning:



---

### Module Configuration

To configure the Assistant, you must do the following:

0. Obtain the credentials (as already described above) and add them in the files:
   - `./assets/google-client-secret.json`
   - `./assets/google-access-tokens.json`
   - `./assets/google-private-key.json`   (The OAuth2 certificate file you downloaded and saved.)
1. Add the Module to the global MM `config.js` by copying the content of the file: `./assets/config.txt`.
2. Edit the following fields in the config file:
   - `YOUR_PROJECT_ID`
   - ~~`YOUR_DOWNLOADED_PRIVATE_KEY.json`~~ 


---

Add the module to the MM modules array in the `~/MagicMirror/config/config.js` file by adding the following section.
Here you also need to edit and insert the results you obtained from the Google authorization steps above,
into the fields marked: `YOUR_PROJECT_ID` ~~and `YOUR_DOWNLOADED_PRIVATE_KEY.json` (a filename)~~. 


```javascript
{
    module: 'MMM-Assistant',
    position: 'bottom_left',
    config: {
        assistant: {
            auth: {
                keyFilePath:     "assets/google-client-secret.json", // REQUIRED (Google Assistant API) -- OAuth2 x509 cert
                savedTokensPath: "assets/google-access-tokens.json"  // REQUIRED (Google Assitant API) -- accesss_token & refresh_token
            },
            conversation: {
                lang: 'en-US',
                audio: {
                    encodingIn: "LINEAR16",             // Default. No need to change.
                    sampleRateOut: 16000                // Default. No need to change.
                }
            },
        },
        snowboy: {
            models: [
                {
                    hotwords : "MIRROR"                           // Default model: "MIRROR". (This is not the wake word!)
                    file: "resources/u-models/smart_mirror.umdl", // This file define your MM wake word. (See doc notes.)
                    sensitivity: 0.5,                             // 0.5
                },
                {
                    hotwords : "ASSISTANT"                        // Default model: "ASSISTANT". (This is not the wake word!)
                    file: "resources/u-models/snowboy.umdl",      // This file define your GA wake word. (See doc notes.)
                    sensitivity: 0.5,                             // 0.5
                }
            ]
        },
        record: {
            threshold: 0,                 // Default. No need to change.
            verbose: false,               // Deafult: true  -- for checking recording status.
            recordProgram: 'rec',         // You can also use 'arecord' or 'sox', but we recommend 'rec'
            silence: 2.0                  // Default. No need to change.
        },
        stt: {
            auth: [{                                             // You can use multiple accounts to save money
                projectId:   'YOUR_PROJECT_ID',                  // REQUIRED (Google Voice API) -- project_id (also shown in key file)
                keyFilename: './assets/google-private-key.json'  // REQUIRED (Google Voice API) -- service_account / private_key
            }],
            request: {
                encoding: 'LINEAR16',     // Default. No need to change.
                sampleRateHertz: 16000,   // Default. No need to change.
                languageCode: 'en-US'     // [en-US]  To set the default GA speech request language.
                                          // See: https://cloud.google.com/speech/docs/languages
            },
        },
        speak: {
            useAlert: true,               // [true]  Enable this to show the understood text of your speech
            language: 'en-US',            // [en-US] To set the default GA speech reply language.
        },
        alias: [{                         // You can use aliases for difficult pronunciation or easy using.
                "help :command" : ["teach me :command", "what is :command"]
        }]
    }
}, // END

```

The main difference with this **full** configuration from the 
[simple](https://github.com/eouia/MMM-Assistant/wiki#simple-version) one, 
is that it uses the `rec` *vox* wrapper for recording, rather than `arecord` since it works better.  
You can change this configuration later when you see that it works.

---

### Available Voice Commands

| Command | Who? | Description |
|:------- |:---- |:----------- |
| **`snowboy`** | GA   | The *Google Assistant* wake word |
| **`smart-mirror`** | MM | The Magic Mirror *command mode* wake word |
| - | - | - |
| help *`command`* | MM | Explain help about a specific *`command`* | 
| list all commands | MM | List all available commands | 
| list all modules | MM | List all available modules | 
| hide all modules | MM | Hide all available modules | 
| show all modules | MM | Show all available modules | 
| say "something" | MM | Use voice to say "`something`"  | 
| reboot | MM | Reboot your RPi | 
| shut down | MM | Shut down your RPi | 



---

### Dependencies (Google API keys)

:red_circle: Unfortunately the **Google Speech API is not free**. But it does allow you `60 minutes` for free per month. 
But every recognition request is considered to last a minimum 15 seconds. So exactly `240 requests` would be available for free. 
Additional requests will then be charged $0.006 per request, if you have a paid accout. Thereafter, the requests will be blocked. 
However, if you create an account for the first time, you will be given about $300 USD in credit, to use within 1 year, for free.

*Therefore it is very important that we get the Amazon Alexa service implementation going, as they are completely free!*


### Dependencies (node/npm)

This module depend on the following *npm* packages:

| npm Package | Version | GitHub |
|:----------- |:------- |:------ |
| [@google-cloud/speech](https://www.npmjs.com/package/@google-cloud/speech) | 1.3.0 | [github](https://github.com/googleapis/nodejs-speech) |
| [google-assistant](https://www.npmjs.com/package/google-assistant) | 0.2.2 | [github](https://github.com/endoplasmic/google-assistant) |
| [grpc](https://www.npmjs.com/package/grpc) | 1.10.0 | [here](https://github.com/grpc/grpc-node/tree/master/packages/grpc-native-core) |
| ~~[node-aplay](https://www.npmjs.com/package/node-aplay)~~ | 1.0.3 | **Deprecated!** | 
| [aplay](https://www.npmjs.com/package/aplay) | 1.2.0 |  [github](https://github.com/roccomuso/node-aplay) | 
| [node-record-lpcm16](https://www.npmjs.com/package/node-record-lpcm16) | 0.3.0 | [github](https://github.com/gillesdemey/node-record-lpcm16) | 
| [snowboy](https://www.npmjs.com/package/snowboy) | 1.2.0 | [github](https://github.com/Kitt-AI/snowboy) | 
| [speaker](https://www.npmjs.com/package/speaker) | 0.4.0 | [github](https://github.com/TooTallNate/node-speaker) |

These are also listed in the `package.json` file and should be installed automatically when using *npm install*.
However, those may require other packages. 

For detailed information, See the [Wiki](https://github.com/eouia/MMM-Assistant/wiki)

---


#### Bugs and Warnings

* Sometimes the GA hangs (issue #25) and the `Error` icon is shown froozen. If this happens,  
  just re-load the MM server page from a remote connection and it will reset.

:information_source: For other bugs, issues, details and updates, please refer to the 
[issue tracker](https://github.com/eouia/MMM-Assistant/issues).


#### Contribution

Feel free to post issues and PR's related to this module. 
For all other or general questions, please refer to the [MagicMirror Forum](https://forum.magicmirror.builders/).

#### Credits

Most grateful thanks to:
* [---](https://github.com/---/) - for clarifying and fixing XXXX

---

#### License

[![GitHub license](https://img.shields.io/github/license/eouia/MMM-Assistant.svg)](https://github.com/eouia/MMM-Assistant/blob/master/LICENSE)

A license to :sparkling_heart:!
