import { speechWrapper } from "../speech-processor/client"

const testSpeak = () => {
    try {
        speechWrapper.speak("hello there, how can i help you")
    } catch (error) {
        console.log("Error speaking ", error)
    }
}

testSpeak()