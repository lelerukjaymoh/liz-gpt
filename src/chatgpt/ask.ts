import { Configuration, OpenAIApi } from "openai"
import { utils } from "../utils/common"

class ChatGPT {
    configuration: Configuration
    openAi: OpenAIApi

    constructor() {
        this.configuration = new Configuration({
            apiKey: process.env.OPEN_AI_API_KEY!
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
}

export const chatGPT = new ChatGPT()