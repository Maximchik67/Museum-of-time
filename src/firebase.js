import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ДОДАЛИ ІМПОРТ БАЗИ ДАНИХ

const firebaseConfig = {
  apiKey: "AIzaSyAm5z2CGiVoZgWVVv5mfspmvQaE6JGamls",
  authDomain: "museum-of-time.firebaseapp.com",
  projectId: "museum-of-time",
  storageBucket: "museum-of-time.firebasestorage.app",
  messagingSenderId: "316763606942",
  appId: "1:316763606942:web:819c4a80fdf7bc64d4108f",
  measurementId: "G-2FMLRSN0Z1"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // ЕКСПОРТУЄМО БАЗУ ДАНИХ