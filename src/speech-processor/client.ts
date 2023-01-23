
import textToSpeech from "@google-cloud/text-to-speech"
const speech = require('@google-cloud/speech');

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
        const streamData = this.speechClient
            .streamingRecognize(this.request)
            .on('error', console.error)
            .on('data', async (data: { results: { alternatives: { transcript: any; }[]; }[]; }) => {
                if (data.results[0] && data.results[0].alternatives[0]) {
                    const transcription = data.results[0].alternatives[0].transcript

                    this._recorder.pause()

                    console.log("\n\nMe : ", transcription)

                    const response = await chatGPT.askGPT(transcription)

                    if (response) {
                        this.respond(response!)
                    } else {
                        await this.respond("Chat GPT delayed the response")
                    }

                    this._recorder.resume()

                    console.log("\nChatGpt : ", response)
                    console.log("\n==> Listening ... ")

                    this.record(streamData)

                } else {
                    console.log("\n\nError: Reached transcription time limit, press Ctrl+C")
                }
            })

        this.record(streamData)

    }

    async record(streamData: any) {
        try {

            this._recorder = recorder
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