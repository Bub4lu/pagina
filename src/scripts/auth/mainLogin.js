import { auth, db } from './firebaseConfig.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Inputs y botones
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const googleBtn = document.getElementById('googleBtn');
const facebookBtn = document.getElementById('facebookBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Contenedores de usuario
const profilePhoto = document.getElementById('profilePhoto');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileCountryName = document.getElementById('profileCountryName');
const profileFlag = document.getElementById('profileFlag');

const defaultAvatar = '/user.png';

// 🌍 Función para detectar ubicación por IP
async function getUserLocation() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return { country: data.country_name || "Desconocido", code: data.country_code || "XX" };
  } catch (error) {
    console.error("Error al obtener ubicación:", error);
    return { country: "Desconocido", code: "XX" };
  }
}

// ✅ Validar email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 🔐 Login email/contraseña
loginBtn?.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!email || !pass) return alert('Por favor completa ambos campos.');
  if (!isValidEmail(email)) return alert('Correo no válido.');

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = '/src/pages/home.html';
  } catch (err) {
    alert('Error al iniciar sesión: ' + err.message);
  }
});

// 🆕 Registro email/contraseña
signupBtn?.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();
  if (!email || !pass) return alert('Completa ambos campos.');
  if (!isValidEmail(email)) return alert('Correo no válido.');

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    const location = await getUserLocation();
    const flagUrl = `https://flagcdn.com/24x18/${location.code.toLowerCase()}.png`;

    await setDoc(doc(db, 'usuarios', cred.user.uid), {
      nombre: email.split('@')[0],
      email: cred.user.email,
      creado: new Date().toISOString(),
      progreso: {}, 
      xp: 0,
      cursos_completados: [],
      bio: '',
      foto: '',
      rol: 'alumno',
      country: location.country,
      countryCode: location.code,
      flag: flagUrl
    });

    window.location.href = '/src/pages/home.html';
  } catch (err) {
    alert('Error al registrarse: ' + err.message);
  }
});

// 🔐 Login Google
googleBtn?.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userRef = doc(db, 'usuarios', user.uid);
    const userSnap = await getDoc(userRef);
    const data = userSnap.exists() ? userSnap.data() : {};
    const photoURL = user.photoURL || (user.providerData[0]?.photoURL) || data.foto || defaultAvatar;

    const location = await getUserLocation();
    const flagUrl = `https://flagcdn.com/24x18/${location.code.toLowerCase()}.png`;

    await setDoc(userRef, {
      nombre: user.displayName || data.nombre || '',
      email: user.email || data.email || '',
      foto: photoURL,
      creado: data.creado || new Date().toISOString(),
      progreso: data.progreso || {},
      xp: data.xp || 0,
      cursos_completados: data.cursos_completados || [],
      bio: data.bio || '',
      rol: data.rol || 'alumno',
      country: location.country,
      countryCode: location.code,
      flag: flagUrl
    }, { merge: true });

    window.location.href = '/src/pages/home.html';
  } catch (err) {
    alert('Error login Google: ' + err.message);
  }
});

// 🔐 Login Facebook
facebookBtn?.addEventListener('click', async () => {
  const provider = new FacebookAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userRef = doc(db, 'usuarios', user.uid);
    const userSnap = await getDoc(userRef);
    const data = userSnap.exists() ? userSnap.data() : {};
    const photoURL = user.photoURL || (user.providerData[0]?.photoURL) || data.foto || defaultAvatar;

    const location = await getUserLocation();
    const flagUrl = `https://flagcdn.com/24x18/${location.code.toLowerCase()}.png`;

    await setDoc(userRef, {
      nombre: user.displayName || data.nombre || '',
      email: user.email || data.email || '',
      foto: photoURL,
      creado: data.creado || new Date().toISOString(),
      progreso: data.progreso || {},
      xp: data.xp || 0,
      cursos_completados: data.cursos_completados || [],
      bio: data.bio || '',
      rol: data.rol || 'alumno',
      country: location.country,
      countryCode: location.code,
      flag: flagUrl
    }, { merge: true });

    window.location.href = '/src/pages/home.html';
  } catch (err) {
    alert('Error login Facebook: ' + err.message);
  }
});

// 🔓 Logout
logoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
  profileName.textContent = 'No hay usuario activo';
  profileEmail.textContent = '';
  profileCountryName.textContent = '';
  profileFlag.style.display = 'none';
  profilePhoto.src = defaultAvatar;
});

// 👤 Mostrar usuario activo
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const userRef = doc(db, 'usuarios', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const data = userSnap.data();

  profilePhoto.src = data.foto || defaultAvatar;
  profilePhoto.alt = data.nombre || 'Usuario';
  profileName.textContent = data.nombre || user.email;
  profileEmail.textContent = data.email || '';
  profileCountryName.textContent = data.country || 'No detectado';

  if (data.flag) {
    profileFlag.src = data.flag;
    profileFlag.style.display = 'inline-block';
  } else {
    profileFlag.style.display = 'none';
  }
});
