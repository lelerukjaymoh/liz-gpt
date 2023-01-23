import { speechWrapper } from "../speech-processor"

const testSpeak = () => {
    try {
        speechWrapper.respond("hello there, how can i help you")
    } catch (error) {
        console.log("Error speaking ", error)
    }
}

testSpeak()