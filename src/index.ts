import { speechWrapper } from "./speech-processor/client"

const main = async () => {
    try {
        await speechWrapper.transcribe()
    } catch (error) {
        console.log("Error in main ", error)
    }
}

main()