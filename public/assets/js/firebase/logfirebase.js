
// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDUccRv76kAUcBSH-l-LfFefRQhEpFLofg",
    authDomain: "teachme-951ab.firebaseapp.com",
    projectId: "teachme-951ab",
    storageBucket: "teachme-951ab.firebasestorage.app",
    messagingSenderId: "971380330544",
    appId: "1:971380330544:web:a50f59c2009765987eddf5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
