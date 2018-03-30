#!/usr/bin/env python
# snowtrain.py -- A Snowboy personal wake-word voice model training script
#----------------------------------------------------------------------------------
# Author:       E:V:A
# FileName:     snowtrain.py
# LastChange:   2018-03-28
# License:      "Give me props!"
# Description:  ...
# Note:         This script is based on the Snowboy repo: training_service.py
# Run With:     ./snowtrain rec1.wav rec2.wav rec3.wav <the-new-word>.pmdl
#----------------------------------------------------------------------------------

import sys
import base64
import requests

def get_wave(fname):
    with open(fname) as infile:
        return base64.b64encode(infile.read())

endpoint = "https://snowboy.kitt.ai/api/v1/train/"

#================  EDIT THE FOLLOWING  ====================
token = ""              # Your Snowbouy API token
hotword_name = "???"    # <the-new-word>
language = "en"         # English!
age_group = "20_29"     # WTF!
gender = "M"            # [M/F] What about trans gender?
microphone = "dick"     # MIC name
#================  END OF EDIT  ===========================

if __name__ == "__main__":
    try:
        [_, wav1, wav2, wav3, out] = sys.argv
    except ValueError:
        print "Usage: %s rec1.wav rec2.wav rec3.wav <the-new-word>.pmdl" % sys.argv[0]
        sys.exit()

    data = {
        "name": hotword_name,
        "language": language,
        "age_group": age_group,
        "gender": gender,
        "microphone": microphone,
        "token": token,
        "voice_samples": [
            {"wave": get_wave(wav1)},
            {"wave": get_wave(wav2)},
            {"wave": get_wave(wav3)}
        ]
    }

    response = requests.post(endpoint, json=data)
    if response.ok:
        with open(out, "w") as outfile:
            outfile.write(response.content)
        print "Saved model to '%s'." % out
    else:
        print "Request failed."
        print response.text

