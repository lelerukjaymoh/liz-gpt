import { Configuration, OpenAIApi } from "openai"
import { utils } from "../utils/common"
import fs from "fs"

class ChatGPT {
    configuration: Configuration
    openAi: OpenAIApi

    constructor() {
        this.configuration = new Configuration({
            apiKey: process.env.OPEN_API_KEY!
        })

        this.openAi = new OpenAIApi(this.configuration)
    }

    async askGPT(prompt: string) {
        try {
            const completion = await this.openAi.createCompletion({
                model: "text-davinci-003",
                prompt: prompt,
                temperature: 0.6,
                max_tokens: 500,
                stream: true,
            });

            let parsedResponse = utils.parseGPTResponse(JSON.parse(JSON.stringify(completion.data)))

            return parsedResponse
        } catch (error: any) {

            if (error.response) {
                console.error("\nChatGPT Error", error.response.status, error.response.data);
            } else {
                console.error(`\nError with OpenAI API request: ${error.message}. For this prompt ${prompt}`);
            }
        }
    }

    async whisperTranscribe() {
        try {
            const resp = await this.openAi.createTranscription(
                fs.createReadStream("test.mp3") as any,
                "whisper-1"
            );

            console.log("Transcription response ", resp.data)
        } catch (error) {
            console.log("Error whisper transcribing  ", error)
        }
    }
}

export const chatGPT = new ChatGPT()