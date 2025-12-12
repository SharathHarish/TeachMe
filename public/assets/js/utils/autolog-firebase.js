import { db } from "../firebase/firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

function autoLogFirebase() {
    if (!db) {
        console.error("Firebase Firestore is not initialized!");
        return;
    }

    console.log("Firebase Logger Ready");

    // Override Logger.log to also send logs to Firebase
    const oldLog = GlobalLogger.log.bind(GlobalLogger);

    GlobalLogger.log = async function(action, details = {}) {
        oldLog(action, details); // log locally

        try {
            await addDoc(collection(db, "logs"), {
                action,
                details,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error("Firestore Log Error:", err);
        }
    };
}

autoLogFirebase();
