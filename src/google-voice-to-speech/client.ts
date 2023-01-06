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

    async createStream() {
        const streamData = this.client
            .streamingRecognize(this.request)
            .on('error', console.error)
            .on('data', (data: { results: { alternatives: { transcript: any; }[]; }[]; }) =>
                process.stdout.write(
                    data.results[0] && data.results[0].alternatives[0]
                        ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
                        : '\n\nReached transcription time limit, press Ctrl+C\n'
                )
            );

        return streamData
    }

    async transcribe(streamData: any) {
        try {
            recorder
                .record({
                    sampleRateHertz: this.rateHertz,
                    threshold: 0,
                    // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
                    verbose: false,
                    recordProgram: 'rec', // Try also "arecord" or "sox"
                    silence: '10.0',
                })
                .stream()
                .on('error', console.error)
                .pipe(streamData);

            console.log('Listening, press Ctrl+C to stop.');
        } catch (error) {
            console.error("Error transcribing ...");

        }
    }
}

export const speechWrapper = new SpeechWrapper()