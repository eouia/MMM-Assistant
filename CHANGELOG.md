### MMM-Assistant Change Log

All notable changes to this project will be documented in this file.

**Q**: *Why keep a changelog?*  
**A**: [BECAUSE](http://keepachangelog.com/en/1.0.0/)

**Q**: *How?*  
**A**: By carefully describing what was: *added, fixed*, and *changed*.

---

#### [1.1.3] - 2018-04-20

- Added Google TTS. Many more languages available than pico2tts
  Command conversation can now be in languages other than en-GB,de-DE,es-ES,fr-FR,it-IT like nl-NL
- Added config switch to choose between pico and Google TTS
- Fixed one more bug in GA. Saying "nevermind" just stopped the conversation without returning to listening mode

#### [1.1.2] - 2018-04-20

- Added timeout for screen
- Added screen section in config to specify timeout and screen on/off commands

#### [1.1.1] - 2018-04-19

- Changed handling of config.js so it is now backwards compatible
- fixed some more GA bugs. It should be stable and robust now and handle conversations correctly

#### [1.1.0] - 2018-04-17

- Changed handling of commands in config
- Changed format of models in config.js so an old one will not work (see: assets/config.txt)
- Added commands for screen on and off
- Added commands for showing/hiding a single named module
- Added mapping of spoken module name to actual module name (really helps non-english speakers)
- Added command to play .wav
- Added a single hotword can fire a list of commands and stay in listening mode
  for example, a spoken "wake up" can turn on the screen (like PIR) without activating GA or voice command
- Added model specific confirmation sound added in config (parameter "confirm")
- Added translate/nl.json for dutch language


#### [1.0.3] - 2018-03-31

- Fixed #35 for new GA SDK v0.2.2
- Updated response icons in README
- Updated universal Snowboy models and moved to ./resources/u-models/
- Added response icons for amazon/alexa to ./images directory
- Added Python and Bash scripts to generate Snowboy personal voice models
- Changed google-auth.js scripts location to ./scripts and code
- Changed location of all private files into ./assets + updated relevant code
- Renamed private assets files:  (fixes #42)
    secret.json       --> google-client-secret.json  
    <downloaded>.json --> google-private-key.json  
    tokens.json       --> google-access-tokens.json


#### [1.0.2] - 2018-03-27

Have updated Assistant to use npm:
- google-assistant SDK version 0.2.2.
- @google-cloud/speech  1.3.0
etc.

- Added CHANGELOG
- Added LICENSE
- Added .gitignore
- Added ./docs directory + relevant GitHub content
- Added ./images directory for pictures
- Added ./assets directory for private config,authorization,token files
- Added ./scripts directory for Google & Alexa authrization/token scripts
- Added language support as available in the new GA SDK
- Added French translation
- Changed node_helper.js & MMM-Assistant.js to use GA SDK 22
- Updated README.md with latest instructions
- Updated package.json with updated dependencies and module tags


#### [1.0.1] - 2018-03-XX

- First new commits
- No previous changelog available 
