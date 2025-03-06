import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
    apiKey: "AIzaSyATGGcQ6phQi3FT66XwS_ADGcgmUh8cbgA",
    authDomain: "userauth-47b3b.firebaseapp.com",
    projectId: "userauth-47b3b",
    storageBucket: "userauth-47b3b.firebasestorage.app",
    messagingSenderId: "1066279463530",
    appId: "1:1066279463530:web:520a02a9fa2e4448c8b813",
    measurementId: "G-5085F2CBVR"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

export { auth, db, storage,onAuthStateChanged  }; 