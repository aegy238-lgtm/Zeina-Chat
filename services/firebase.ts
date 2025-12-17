
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDqMu1EOdrj_E32sogcQ8zkPOOoIHCfQtw",
    authDomain: "voice-chat-645ee.firebaseapp.com",
    projectId: "voice-chat-645ee",
    storageBucket: "voice-chat-645ee.firebasestorage.app",
    messagingSenderId: "589234209566",
    appId: "1:589234209566:web:e93101ac6465231f89bf0f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
