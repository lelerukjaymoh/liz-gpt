import { speechWrapper } from "../google-tts/client"

const testSpeak = () => {
    try {
        speechWrapper.speak("hello there")
    } catch (error) {
        console.log("Error speaking ", error)
    }
}

testSpeak()