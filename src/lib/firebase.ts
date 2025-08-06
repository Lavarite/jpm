import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
    apiKey: "AIzaSyCdm9eG1Y2AWe3Go6DVfcrs2VUY9ZkkALs",
    authDomain: "jpm-cios.firebaseapp.com",
    projectId: "jpm-cios",
    storageBucket: "jpm-cios.firebasestorage.app",
    messagingSenderId: "420576499414",
    appId: "1:420576499414:web:ebfbce27e437f05ee35b77",
    measurementId: "G-3K321JSR6V"
};

const firebaseApp = initializeApp(firebaseConfig);
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
export const model = getGenerativeModel(ai, { model: "gemini-2.5-flash-lite" });
export const API_BASE_URL = "https://api.jpm.vasylevskyi.net";