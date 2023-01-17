import { Configuration, OpenAIApi } from "openai"

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
            });

            return completion.data.choices[0].text
        } catch (error: any) {

            if (error.response) {
                console.error("ChatGPT Error", error.response.status, error.response.data);
            } else {
                console.error(`Error with OpenAI API request: ${error.message}`);
            }
        }
    }
}

export const chatGPT = new ChatGPT()