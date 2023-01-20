import { speechWrapper } from "./google-tts/client"

const main = async () => {
    try {
        await speechWrapper.transcribe()
    } catch (error) {
        console.log("Error in main ", error)
    }
}

main()