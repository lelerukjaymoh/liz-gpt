
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
            keyFilename: process.env.SPEECH_TO_TEXT_KEY
        });

        this.ttsClient = new textToSpeech.TextToSpeechClient({
            keyFilename: "key/liz-gpt-key.json"
        });

        this.request = {
            config: {
                encoding: "LINEAR16",
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

                    this._recorder.pause()

                    console.log("\n\nMe : ", transcription)

                    const response = await chatGPT.askGPT(transcription)

                    if (response) {
                        await this.respond(response!)
                    } else {
                        await this.respond("Chat GPT delayed the response")
                    }

                    this._recorder.resume()

                    console.log("ChatGpt : ", response)

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

            // console.log('\n\n\n Listening, press Ctrl+C to stop.');

        } catch (error) {
            console.log("Error recording ", error)
        }
    }

    async respond(text: any) {
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

            await utils.wait(50)

            if (fs.existsSync(this.filepath)) {
                // Spawn a child process to play the mp3 file
                const play = spawn('play', [this.filepath]);

                // Log any errors
                play.stderr.on('error', (data: any) => {
                    console.log(`Error: ${data}`);
                });
            } else {
                console.log(`Error: The file "${this.filepath}" does not exist.`);
            }

            // console.log("Playing sound ")

        } catch (error) {
            console.log("Error converting text to speech ", error)
        }
    }

}

export const speechWrapper = new SpeechWrapper()