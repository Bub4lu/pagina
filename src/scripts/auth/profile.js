import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profilePhoto = document.getElementById('profilePhoto');
const logoutBtn = document.getElementById('logoutBtn');

const defaultAvatar = '/user.png';

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = '/index.html';

  try {
    const userRef = doc(db, 'usuarios', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      profileName.textContent = data.nombre || 'Nombre no disponible';
      profileEmail.textContent = data.email || 'Email no disponible';

      // Si hay foto válida, la usamos, si no usamos la por defecto
      const fotoURL = data.foto && data.foto.startsWith('http') ? data.foto : defaultAvatar;
      profilePhoto.src = fotoURL;
      profilePhoto.alt = data.nombre || 'Foto de usuario';
      profilePhoto.style.display = 'block';

      // Si la imagen no carga, reemplazamos por la imagen por defecto
      profilePhoto.onerror = () => {
        profilePhoto.src = defaultAvatar;
      };

    } else {
      profileName.textContent = 'Perfil no encontrado.';
      profileEmail.textContent = '';
      profilePhoto.src = defaultAvatar;
      profilePhoto.alt = 'Foto por defecto';
      profilePhoto.style.display = 'block';
    }
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    profileName.textContent = 'Error cargando perfil.';
    profileEmail.textContent = '';
    profilePhoto.src = defaultAvatar;
    profilePhoto.alt = 'Error';
    profilePhoto.style.display = 'block';
  }
});

logoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '/index.html';
});


