# MMM-Assistant
Voice commander and Google-Assistant integrated for MagicMirror

## Installation & Dependencies
1. You SHOULD have a mic and speaker which can be used for recording and playing.
2. You SHOULD be able to execute below commands on terminal.
```sh
arecord -d 10 test.wav && aplay test.wav
```
If fails, You should find the way to use mic and speaker on your MagicMirror. But I cannot give you a help about that kind of problem.

3. This module MIGHT NOT be executed on RPI Zero or RPI 1. Because scripts are written in ES6 styles and there are some dependencies of advanced node and Electron. I didn't test this on RPI Zero or 1. 

### pre-reqs
all required node modules are described in `package.json` but you might need some pre-reqs.
```sh
sudo apt-get update 
sudo apt-get upgrade 
sudo apt-get install libmagic-dev libatlas-base-dev espeak libasound2-dev sox libsox-fmt-all
```
I think, for RPI and ATB, this is enough. But for other platform or in some cases, you may need additional reqs.
In that case, See below links;
- https://github.com/TooTallNate/node-speaker
- https://github.com/endoplasmic/node-record-lpcm16
- https://www.npmjs.com/package/node-aplay
- https://github.com/Kitt-AI/snowboy

### Install module
```sh
cd <Your MagicMirror Direcotry>/modules
git clone https://github.com/eouia/MMM-Assistant
cd MMM-Assistant
npm install
npm install --save-dev electron-rebuild && ./node_modules/.bin/electron-rebuild --pre-gyp-fix
```
It takes somewhat long time.


### Requirements.
#### Auth for Google Assistant & Cloud Speech
You need to get a JSON file for OAuth2 permissions. 
https://developers.google.com/assistant/sdk/develop/grpc/config-dev-project-and-account
Create a project for MagicMirror. Enable `Google Assistant API` and `Google Cloud Speech API`.

After download JSON file, rename it `secret.json` and put that file into `MMM-Assistant` directory.
Then execute this on your MagicMirror terminal.(not via SSH)
```sh
cd <Your MagicMirror Direcotry>/modules/MMM-Assistant
node mic-speaker.js
```
It will try to open the browser for getting some credential keystring. copy and paste it where the `mic-speaker.js` prompts.
After that, you can test Google-Assistant on terminal.

Now, you can find `token.js` under `resources` directory. Keep it safely.


#### `.pmdl` for snowboy hotword detection.
This module needs 2 hotword models at least, one for activating Google-Assistant mode and the other for activating voice-commander mode. 
By default, `smart_mirror.umdl` and `snowboy.umdl` universal models(`.umdl`)are provided. You can add or change them with your personal models(`.pmdl`)
Go to https://snowboy.kitt.ai/ and get `.pmdl` for your voice.

## Configuration
...
