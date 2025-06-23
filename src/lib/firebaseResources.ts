// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAI, getGenerativeModel, VertexAIBackend } from "firebase/ai";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPTu80dqsJYanTbQMlbO_axS9CXAW8ggo",
  authDomain: "character-news.firebaseapp.com",
  projectId: "character-news",
  storageBucket: "character-news.firebasestorage.app",
  messagingSenderId: "382151652649",
  appId: "1:382151652649:web:95411e5baa9ad5f12a7338",
  measurementId: "G-TLQC57EK6B",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const ai = getAI(app, { backend: new VertexAIBackend() });

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LeQS2srAAAAAFFBhi8gCv5rcFy0XEwEccUIb69R"),
  isTokenAutoRefreshEnabled: true,
});
export const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });
