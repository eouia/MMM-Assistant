#!/usr/bin/env bash
ENDPOINT="https://snowboy.kitt.ai/api/v1/train/"

############# MODIFY THE FOLLOWING #############
TOKEN="??"
#NAME="??"
LANGUAGE="fr"
AGE_GROUP="20_29"
GENDER="M"
MICROPHONE="Jabra speak 410"
############### END OF MODIFY ##################

if [[ "$#" != 1 ]]; then
    printf "Usage: %s out_model_name  (need underscore between words)" $0
    exit
fi

printf "We will record now the 3 audio sample, when you see the record process, say what you want and then press ctrl+C"
printf "Press any key to start the record"
read -n 1 -s

eval "rec -r 16000 -c 1 -b 16 -e signed-integer /tmp/1.wav"
eval "rec -r 16000 -c 1 -b 16 -e signed-integer /tmp/2.wav"
eval "rec -r 16000 -c 1 -b 16 -e signed-integer /tmp/3.wav"

WAV1=`base64 /tmp/1.wav`
WAV2=`base64 /tmp/2.wav`
WAV3=`base64 /tmp/3.wav`
OUTFILE="stt_engines/snowboy/resources/$1.pmdl"
tmp=$1
NAME=$(echo "${tmp//_/ }")


cat <<EOF >data.json
{
    "name": "$NAME",
    "language": "$LANGUAGE",
    "age_group": "$AGE_GROUP",
    "token": "$TOKEN",
    "gender": "$GENDER",
    "microphone": "$MICROPHONE",
    "voice_samples": [
        {"wave": "$WAV1"},
        {"wave": "$WAV2"},
        {"wave": "$WAV3"}
    ]
}
EOF

curl -H "Content-Type: application/json" -X POST -d @data.json $ENDPOINT > $OUTFILE

