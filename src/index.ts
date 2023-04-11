import { chatGPT } from "./chatgpt"
import { speechWrapper } from "./speech-processor"
import { utils } from "./utils/common"

const main = async () => {
    try {
        speechWrapper.record()

        await utils.wait(5000)

        // while (true) 
        chatGPT.whisperTranscribe()
        // await speechWrapper.transcribe()
    } catch (error) {
        console.log("Error in main ", error)
    }
}

main()