
import textToSpeech from "@google-cloud/text-to-speech"
import speech from '@google-cloud/speech';
import * as protos from "@google-cloud/text-to-speech/build/protos/protos"
const recorder = require('node-record-lpcm16');

const { spawn } = require('child_process');
const util = require('util');
import fs from "fs"

import { chatGPT } from "../chatgpt";
import { utils } from "../utils/common";

class SpeechWrapper {
    speechClient;
    ttsClient
    request;
    encoding: any = "LINEAR"
    rateHertz = 16000
    filepath = "transcription.mp3"

    constructor() {
        this.speechClient = new speech.SpeechClient({
            keyFilename: process.env.SPEECH_TO_TEXT_KEY
        });

        this.ttsClient = new textToSpeech.TextToSpeechClient({
            keyFilename: "key/liz-gpt-key.json"
        });

        this.request = {
            config: {
                encoding: this.encoding,
                sampleRateHertz: this.rateHertz,
                languageCode: "en-US",
            },
            interimResults: false, // If you want interim results, set this to true
        };

    }

    async transcribe() {
        const streamData = this.speechClient
            .streamingRecognize(this.request)
            .on('error', console.error)
            .on('data', async (data: { results: { alternatives: { transcript: any; }[]; }[]; }) => {
                if (data.results[0] && data.results[0].alternatives[0]) {
                    const transcription = data.results[0].alternatives[0].transcript

                    console.log("\n\nMe : ", transcription)

                    const response = await chatGPT.askGPT(transcription)

                    console.log("ChatGpt : ", response)
                } else {
                    console.log("\n\nError: Reached transcription time limit, press Ctrl+C")
                }
            })

        recorder
            .record({
                sampleRateHertz: this.rateHertz,
                threshold: 0,
                verbose: false,
                recordProgram: 'rec',
                silence: '10.0',
            })
            .stream()
            .on('error', console.error)
            .pipe(streamData);

        console.log('Listening, press Ctrl+C to stop.');
    }

    async speak(text: string) {
        try {
            const request = {
                input: { text: text },
                // Select the language and SSML voice gender (optional)
                voice: { languageCode: 'en-US', ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender.MALE },
                // select the type of audio encoding
                audioConfig: { audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3 },
            };

            // Performs the text-to-speech request
            const [response] = await this.ttsClient.synthesizeSpeech(request);

            const writeFile = util.promisify(fs.writeFile);
            writeFile(this.filepath, response.audioContent, 'binary');

            await utils.wait(10)

            if (fs.existsSync(this.filepath)) {
                // Spawn a child process to play the mp3 file
                const play = spawn('play', [this.filepath]);

                // Log any errors
                play.stderr.on('data', (data: any) => {
                    console.log(`Error: ${data}`);
                });
            } else {
                console.log(`Error: The file "${this.filepath}" does not exist.`);
            }
            console.log("Playing sound ")

        } catch (error) {
            console.log("Error converting text to speech ", error)
        }
    }

}

export const speechWrapper = new SpeechWrapper()