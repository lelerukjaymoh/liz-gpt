import { chatGPT } from "../chatgpt";
import textToSpeech from "@google-cloud/text-to-speech"
const speech = require('@google-cloud/speech');
import * as protos from "@google-cloud/text-to-speech/build/protos/protos"
const Speaker = require('speaker');
const recorder = require('node-record-lpcm16');


class SpeechWrapper {
    speechClient;
    ttsClient
    speaker
    request;
    rateHertz = 16000

    constructor() {
        this.speechClient = new speech.SpeechClient({
            keyFilename: process.env.SPEECH_TO_TEXT_KEY
        });

        this.ttsClient = new textToSpeech.TextToSpeechClient({
            keyFilename: process.env.TEXT_TO_SPEECH_KEY
        });

        this.request = {
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: this.rateHertz,
                languageCode: "en-US",
            },
            interimResults: false, // If you want interim results, set this to true
        };


        this.speaker = new Speaker({
            channels: 2,          // 2 channels
            bitDepth: 16,         // 16-bit samples
            sampleRate: 44100     // 44,100 Hz sample rate
        });

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
                voice: { languageCode: 'en-US', ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender.NEUTRAL },
                // select the type of audio encoding
                audioConfig: { audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3 },
            };

            // Performs the text-to-speech request
            const [response] = await this.ttsClient.synthesizeSpeech(request);

            // response.audioContent!.pipe(speaker)

            this.speaker.write(response.audioContent)

        } catch (error) {
            console.log("Error converting text to speech ", error)
        }
    }

}

export const speechWrapper = new SpeechWrapper()