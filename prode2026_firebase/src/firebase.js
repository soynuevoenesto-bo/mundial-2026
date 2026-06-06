import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, onSnapshot, query
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyASIpQZHols7qlr4Dozj0QHrvfJeiABiMk",
  authDomain: "mundial-2026-ef76b.firebaseapp.com",
  projectId: "mundial-2026-ef76b",
  storageBucket: "mundial-2026-ef76b.firebasestorage.app",
  messagingSenderId: "98143202412",
  appId: "1:98143202412:web:30d4ead5072b3f5c073c49"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Helpers ──────────────────────────────────────────────────────────────────

export async function fbGet(col, docId) {
  const snap = await getDoc(doc(db, col, docId));
  return snap.exists() ? snap.data() : null;
}

export async function fbSet(col, docId, data) {
  await setDoc(doc(db, col, docId), data, { merge: true });
}

export async function fbSetFull(col, docId, data) {
  await setDoc(doc(db, col, docId), data);
}

export async function fbDelete(col, docId) {
  await deleteDoc(doc(db, col, docId));
}

export async function fbList(col) {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function fbListen(col, docId, callback) {
  return onSnapshot(doc(db, col, docId), snap => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export function fbListenCollection(col, callback) {
  return onSnapshot(collection(db, col), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
