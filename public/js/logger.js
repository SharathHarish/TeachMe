import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function logEvent(action, meta={}, uid=null, page=null) {
  try {
    await addDoc(collection(db,"logs"), { 
      ts: serverTimestamp(), action, meta, uid, page 
    });
  } catch(e){ console.error("log fail", e); }
}
