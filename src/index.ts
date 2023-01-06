import { speechWrapper } from "./google-voice-to-speech/client"

const main = async () => {
    try {
        const streamData = await speechWrapper.createStream()

        await speechWrapper.transcribe(streamData)
    } catch (error) {
        console.log("Error in main ", error)
    }
}

main()