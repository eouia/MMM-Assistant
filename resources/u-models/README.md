These are the publicly available universal models from Snowboy repo at:  
https://github.com/Kitt-AI/snowboy#pretrained-universal-models

They should have the following settings, when used:

* **resources/u-models/alexa.umdl**:  
  Universal model for the hotword "`Alexa`" optimized for the Alexa AVS sample app.  
  Set `SetSensitivity: 0.6` and `ApplyFrontend: true`.
* **resources/u-models/snowboy.umdl**:  
  Universal model for the hotword "`Snowboy`".  
  Set `SetSensitivity: 0.5` and `ApplyFrontend: false`. 
* **resources/u-models/jarvis.umdl**: 
  Universal model for the hotword "`Jarvis`".  
  It has two different models for the hotword Jarvis, so you have to use two sensitivites.  
  Set sensitivities to **`0.8,0.80`** and `ApplyFrontend: true`.
* **resources/u-models/smart_mirror.umdl**:  
  Universal model for the hotword "`Smart Mirror`".  
  Set `SetSensitivity: 0.5`, and `ApplyFrontend: false`.

