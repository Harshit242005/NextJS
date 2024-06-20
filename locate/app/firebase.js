
// import the firestore from firebase
import { getFirestore } from 'firebase/firestore';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getStorage} from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbt6r97E2LlvVZSfzsUJDdCFJGoIE3MzY",
  authDomain: "locate-b96f5.firebaseapp.com",
  projectId: "locate-b96f5",
  storageBucket: "locate-b96f5.appspot.com",
  messagingSenderId: "223909706821",
  appId: "1:223909706821:web:6086fabddf5fdb0a94f72c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);