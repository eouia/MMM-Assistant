#!/usr/bin/env bash
# snowtrain.sh -- A Snowboy personal wake-word voice model training script
#----------------------------------------------------------------------------------
# Author:       E:V:A
# FileName:     snowtrain.sh
# LastChange:   2018-03-28
# License:      "Give me props!"
# Description:  ...
# Note:         This script is based on the Snowboy repo: training_service.sh
# Run With:     ./snowtrain rec1.wav rec2.wav rec3.wav <the-new-word>.pmdl
#----------------------------------------------------------------------------------

ENDPOINT="https://snowboy.kitt.ai/api/v1/train/"

############# MODIFY THE FOLLOWING #############
TOKEN="??"          # Your Snowboy API token
NAME="??"           # <the-new-word>
LANGUAGE="en"       # keep
AGE_GROUP="20_29"   # keep
GENDER="M"          # M/F
MICROPHONE="dick"   # MIC name, e.g. "PS3 Eye"
############### END OF MODIFY ##################

if [[ "$#" != 4 ]]; then
#    printf "Usage:  %s rec1.wav rec2.wav rec3.wav <the-new-word>.pmdl" $0
    echo -e "\nUsage:  First make 3 recordings of your word in 3 files named:"
    echo -e "        rec1.wav rec2.wav rec3.wav , then run this script with:"
    echo -e "        $0 rec1.wav rec2.wav rec3.wav <the-new-word>.pmdl\n"
    exit
fi

echo "Now encoding your files and uploading to kitt.ai server..."

WAV1=`base64 $1`
WAV2=`base64 $2`
WAV3=`base64 $3`
OUTFILE="$4"

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

echo "Your personal model file was exported to: $OUTFILE"
echo "Done!"

exit 0
