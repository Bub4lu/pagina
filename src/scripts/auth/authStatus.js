// src/authStatus.js
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Elementos del DOM
const profilePhoto = document.getElementById('profilePhoto');
const profileFotos = document.getElementById('profileFotos');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');
const profileCountryName = document.getElementById('profileCountryName'); // nombre del país
const profileFlag = document.getElementById('profileFlag'); // imagen de bandera
const logoutBtn = document.getElementById('logoutBtn');

const defaultAvatar = '/user.png';

// 🔹 Mapa de traducción de países a español
const countryNamesES = {
  DO: "República Dominicana",
  US: "Estados Unidos",
  ES: "España",
  MX: "México",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
  VE: "Venezuela",
  // agrega más países según tus necesidades
};

// 🔹 Función para obtener país en español desde countryCode
function getCountryNameInSpanish(code) {
  return countryNamesES[code] || 'Desconocido';
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = '/Login.html';

  try {
    const userRef = doc(db, 'usuarios', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      // Nombre y email
      if (profileName) profileName.textContent = data.nombre || 'Nombre';
      if (profileEmail) profileEmail.textContent = data.email || 'Email';

      // Rol
      if (profileRole) profileRole.textContent = `Rol: ${data.rol || 'alumno'}`;

      // Foto de perfil principal
      if (profilePhoto) {
        const fotoURL = data.foto && data.foto.startsWith('http') ? data.foto : defaultAvatar;
        profilePhoto.src = fotoURL;
        profilePhoto.alt = data.nombre || 'Foto de usuario';
        profilePhoto.style.display = 'block';
        profilePhoto.onerror = () => { profilePhoto.src = defaultAvatar; };
      }

      // Foto secundaria (sidebar, etc.)
      if (profileFotos) {
        const fotoURL = data.foto && data.foto.startsWith('http') ? data.foto : defaultAvatar;
        profileFotos.src = fotoURL;
        profileFotos.alt = data.nombre || 'Foto de usuario';
        profileFotos.style.display = 'block';
        profileFotos.onerror = () => { profileFotos.src = defaultAvatar; };
      }

      // País en español
      const countryES = getCountryNameInSpanish(data.countryCode);
      if (profileCountryName) profileCountryName.textContent = countryES;

      // Bandera
      if (profileFlag) {
        if (data.countryCode) {
          const imgURL = `https://flagcdn.com/24x18/${data.countryCode.toLowerCase()}.png`;
          profileFlag.src = imgURL;
          profileFlag.alt = countryES;
          profileFlag.style.display = 'inline-block';
          profileFlag.width = 24;
          profileFlag.height = 18;
          profileFlag.style.border = '1px solid #ccc';
          profileFlag.style.borderRadius = '2px';
          profileFlag.style.verticalAlign = 'middle';
          profileFlag.onerror = () => { profileFlag.style.display = 'none'; };
        } else {
          profileFlag.style.display = 'none';
        }
      }

    } else {
      // Perfil no encontrado
      if (profileName) profileName.textContent = 'Perfil no encontrado';
      if (profileEmail) profileEmail.textContent = '';
      if (profileRole) profileRole.textContent = '';
      if (profilePhoto) { profilePhoto.src = defaultAvatar; profilePhoto.alt = 'Foto por defecto'; profilePhoto.style.display = 'block'; }
      if (profileFotos) { profileFotos.src = defaultAvatar; profileFotos.alt = 'Foto por defecto'; profileFotos.style.display = 'block'; }
      if (profileCountryName) profileCountryName.textContent = '';
      if (profileFlag) profileFlag.style.display = 'none';
    }

  } catch (err) {
    console.error('Error cargando datos del usuario:', err);
    if (profileName) profileName.textContent = 'Error cargando perfil';
    if (profileEmail) profileEmail.textContent = '';
    if (profileRole) profileRole.textContent = '';
    if (profilePhoto) { profilePhoto.src = defaultAvatar; profilePhoto.alt = 'Error'; profilePhoto.style.display = 'block'; }
    if (profileFotos) { profileFotos.src = defaultAvatar; profileFotos.alt = 'Error'; profileFotos.style.display = 'block'; }
    if (profileCountryName) profileCountryName.textContent = '';
    if (profileFlag) profileFlag.style.display = 'none';
  }
});

// Logout
logoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '/Login.html';
});
