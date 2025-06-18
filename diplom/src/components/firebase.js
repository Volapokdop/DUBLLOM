// firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';

// ИМПОРТИРУЕМ Analytics
import { getAnalytics } from "firebase/analytics";

// Конфигурация вашего Firebase-проекта
const firebaseConfig = {
  apiKey: "AIzaSyCCjTCZ5-q1nrcZkjS2dbljGxam_ocx5zY",
  authDomain: "duplom-c5718.firebaseapp.com",
  projectId: "duplom-c5718",
  storageBucket: "duplom-c5718.firebasestorage.app",
  messagingSenderId: "597426352322",
  appId: "1:597426352322:web:66ed61114662ca2c128b5b",
  measurementId: "G-YQYMVNDSEC"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация сервисов
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app); // ← Добавляем Analytics

// Экспортируем всё, что нужно для работы с Firebase
export {
  app,
  auth,
  db,
  analytics, // ← не забываем экспортировать
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc
};
