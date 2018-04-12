This directory contain 4 scripts:

1. google-auth.js  - Used to generate a Google Voice API token in ../assets/tokens.json  and has additional parameter
   google-auth2.js - Used to generate a Google Voice API token in ./resources/tokens.json (orginal file)
2. snowtrain.py    - Used to create a custom wake-word *.pmdl file from 3 recorded *.wav files
3. snowtrian.sh    - Used to create a custom wake-word *.pmdl file from 3 recorded *.wav files
4. snbowtrain2.sh  - Used to create a custom wake-word *.pmdl file from 3 recorded *.wav files and will record too

* (1) Require you to open a google-developer account at: [1-3]  
* (2-4) Require you to open a Snowboy account at:  https://snowboy.kitt.ai/ where you also need  
      to obtain an API token. 

---

According to [this issue comment](https://github.com/gauravsacc/MMM-GoogleAssistant/issues/16#issuecomment-353736607), 
Google has changed the API call *GoogleAssistant()* request to also need: `model_id` (or `device_model_id`).

* **`device_model_id`**: A globally-unique identifier for this device model; use the 
  `project_id` as a prefix to help avoid collisions over the range of all projects.  
  Used in metrics and during device registration.

* **`model_id`**: An identifier of the device model; must be the same as the `device_model_id` associated  
  with this test device. The device model must have been registered previously.

But in the GA API it is not called this, it is called `project_id`, which is the name ?? you gave your new device.

--- 

``` 

device_id   -    Required Unique identifier for the device. The id length must be 128 characters or less. Example: DBCDW098234. This MUST match the device_id returned from device registration. This device_id is 
used to match against the user's registered devices to lookup the supported traits and capabilities of this device. This information should not change across device reboots. However, it should not be 
saved across factory-default resets. 


device_model_id -   Required Unique identifier for the device model. The combination of device_model_id and device_id must have been previously associated through device registration. 

```





```

---

For example:

- *PNS*          : `MagicMirror`    (You choose this name, and it will be shown in the confirmation dialog.)
- Product Name   : `MMM-X1`         (You choose this name )
- Project Name   : `MMM-X1`         [4-30]  (auto-generated from above ??? )
- Project ID     : `mmm-x1-aa295 `          (auto-generated from above) 
- Project Number : `1076503505328`          (auto-generated)

PNS = "Product Name shown to users" 


So in `google-auth.js` we have to use:  
`const assistant = new GoogleAssistant(config, "MagicMirror")` instead of:
`const assistant = new GoogleAssistant(config)` 


---

- [1] https://developers.google.com/assistant/sdk/develop/grpc/config-dev-project-and-account
- [2] https://console.cloud.google.com/cloud-resource-manager
- [3] https://console.developers.google.com/apis/credentials/oauthclient


