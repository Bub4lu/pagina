// src/signup.js
import { auth } from './firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

import { db } from './firebaseConfig'; // si usás Firestore
import { doc, setDoc } from 'firebase/firestore';

// Inputs y botón
const emailInput = document.getElementById('signupEmail');
const passwordInput = document.getElementById('signupPassword');
const registerBtn = document.getElementById('registerBtn');
const userInfo = document.getElementById('userInfo');

// Función para validar email básico
function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

// Registro
registerBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!email || !pass) {
    alert('Por favor completa todos los campos.');
    return;
  }

  if (!isValidEmail(email)) {
    alert('El correo ingresado no es válido.');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // Guardar perfil en Firestore (opcional)
    await setDoc(doc(db, 'usuarios', user.uid), {
      email: user.email,
      creado: new Date().toISOString()
    });

    userInfo.textContent = `Registro exitoso: ${user.email}`;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      alert('Este correo ya está registrado.');
    } else if (error.code === 'auth/weak-password') {
      alert('La contraseña debe tener al menos 6 caracteres.');
    } else {
      alert('Error al registrarse: ' + error.message);
    }
  }
});
