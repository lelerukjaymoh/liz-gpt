import { chatGPT } from "../chatgpt";

const recorder = require('node-record-lpcm16');
const speech = require('@google-cloud/speech');


class SpeechWrapper {
    client;
    request;
    rateHertz = 16000

    constructor() {
        this.client = new speech.SpeechClient({
            keyFilename: process.env.KEY
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
        const streamData = this.client
            .streamingRecognize(this.request)
            .on('error', console.error)
            .on('data', async (data: { results: { alternatives: { transcript: any; }[]; }[]; }) => {
                if (data.results[0] && data.results[0].alternatives[0]) {
                    const transcription = data.results[0].alternatives[0].transcript

                    console.log("Me : ", transcription)

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

}

export const speechWrapper = new SpeechWrapper()