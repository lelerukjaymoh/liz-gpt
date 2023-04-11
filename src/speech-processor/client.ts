
import textToSpeech from "@google-cloud/text-to-speech"
const speech = require('@google-cloud/speech');

import * as protos from "@google-cloud/text-to-speech/build/protos/protos"
const recorder = require('node-record-lpcm16');

const { spawn } = require('child_process');
const util = require('util');
import fs from "fs"

import { utils } from "../utils/common";

class SpeechWrapper {
    speechClient;
    ttsClient
    request;
    encoding: any = "LINEAR"
    rateHertz = 16000
    filepath = "transcription.mp3"
    _recorder: any;

    constructor() {
        this.speechClient = new speech.SpeechClient({
            keyFilename: process.env.GOOGLE_API_KEY
        });

        this.ttsClient = new textToSpeech.TextToSpeechClient({
            keyFilename: process.env.GOOGLE_API_KEY
        });

        this.request = {
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: this.rateHertz,
                languageCode: "en-US",
            },
            interimResults: false,
        };

    }

    async transcribe() {
        try {

        } catch (error) {
            console.log("Error transcribing ", error)
        }
    }

    record() {
        try {

            const file = fs.createWriteStream('test.mp3', { encoding: 'binary' })

            const recording = recorder.record({
                sampleRate: 44100,
                silence: '3.0',
            })
            recording.stream().pipe(file)

            // Stop recording after three seconds
            // setTimeout(() => {
            //     console.log("Stopping ")
            //     recording.stop()
            // }, 1000)

        } catch (error) {
            console.log("Error recording ", error)
        }
    }

    async respond(text: any) {
        try {
            const request = {
                input: { text: text },
                voice: { languageCode: 'en-US', ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender.MALE },
                audioConfig: { audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3 },
            };

            const [response] = await this.ttsClient.synthesizeSpeech(request);

            const writeFile = util.promisify(fs.writeFile);
            writeFile(this.filepath, response.audioContent, 'binary');

            await utils.wait(50)

            if (fs.existsSync(this.filepath)) {
                const play = spawn('play', [this.filepath]);

                play.stderr.on('error', (data: any) => {
                    console.log(`Error: ${data}`);
                });
            } else {
                console.log(`Error: The file "${this.filepath}" does not exist.`);
            }

        } catch (error) {
            console.log("Error converting text to speech ", error)
        }
    }

}

export const speechWrapper = new SpeechWrapper()