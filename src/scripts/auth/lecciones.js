// 📦 IMPORTS FIREBASE
import { db, auth } from "./firebaseConfig.js";
import { doc, getDoc, updateDoc, increment, setDoc } from "firebase/firestore";

// 📦 IMPORTS MARKED
marked.setOptions({
  breaks: true,
});

// ==========================
// 🔥 ELEMENTOS DEL DOM
// ==========================
const lessonTitle = document.getElementById("lesson-title");
const lessonSubtitle = document.getElementById("lesson-subtitle");
const lessonText = document.getElementById("lesson-text");
const lessonContainer = document.getElementById("lesson-container"); // sidebar
const output = document.getElementById("output");
const runBtn = document.getElementById("run-btn");
const checkBtn = document.getElementById("check-btn");
const nextBtn = document.getElementById("next-btn");
const prevBtn = document.getElementById("prev-btn");

// ==========================
// 🔥 VARIABLES
// ==========================
let editor;
let pyodideReady = false;
let pyodide;
let selectedLesson;
let cursoId;
let idLeccion;

// ==========================
// 🔥 INICIALIZAR EDITOR
// ==========================
function initEditor() {
  const textarea = document.getElementById("editor"); // tu <textarea>
  editor = CodeMirror.fromTextArea(textarea, {
    mode: "python",
    theme: "yonce", // puedes probar "material" o "dracula"
    lineNumbers: true,
  });
  editor.setSize("100%", "200px");
}

// ==========================
// 🔥 INICIALIZACIÓN PYODIDE
// ==========================
async function initPyodide() {
  pyodide = await loadPyodide();

  pyodide.runPython(`
import sys
from js import output

class Console:
    def write(self, s):
        if s.strip() != "":
            output.textContent += s + "\\n"
    def flush(self):
        pass

sys.stdout = Console()
sys.stderr = Console()
  `);

  pyodideReady = true;
}

// ==========================
// 🔥 RENDER SIDEBAR
// ==========================
function renderSidebarFromCurso(curso, cursoId, idLeccionActual) {
  lessonContainer.innerHTML = '';

  let secciones = [];

  if (Array.isArray(curso.secciones) && curso.secciones.length) {
    secciones = curso.secciones.map(s => ({
      titulo: s.titulo || 'Sección',
      lecciones: (Array.isArray(s.lecciones) ? s.lecciones.slice() : []),
    }));
  } else {
    const lecs = Array.isArray(curso.lecciones) ? curso.lecciones.slice() : [];
    lecs.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    const anySeccionField = lecs.some(l => !!l.seccion);
    if (anySeccionField) {
      const grouped = lecs.reduce((acc, l) => {
        const key = l.seccion || 'Sin sección';
        if (!acc[key]) acc[key] = [];
        acc[key].push(l);
        return acc;
      }, {});
      secciones = Object.keys(grouped).map(title => ({ titulo: title, lecciones: grouped[title] }));
    } else {
      secciones = [{ titulo: curso.titulo || 'Lecciones', lecciones: lecs }];
    }
  }

  secciones.forEach((sec) => {
    const header = document.createElement('div');
    header.className = 'lesson-list flex items-center justify-between cursor-pointer px-3 py-2';
    header.innerHTML = `<span class="font-semibold">${sec.titulo}</span><i class="fa-solid fa-chevron-up"></i>`;

    const lessonsDiv = document.createElement('div');
    lessonsDiv.className = 'lessons flex flex-col ml-1 mb-3';
    if (!sec.lecciones.some(l => l.id === idLeccionActual)) lessonsDiv.classList.add('hidden');

    sec.lecciones.forEach(lec => {
      const p = document.createElement('p');
      p.className = 'lessons-lists btn-lesson py-2 px-2 rounded flex justify-between items-center hover:bg-[#1b263b]';
      p.dataset.leccion = lec.id;

      p.innerHTML = `
        <div class="flex flex-col">
          <span class="text-sm font-medium">${lec.titulo || ''}</span>
          <small class="text-xs text-[#a8b3c7]">${lec.subtitulo || ''}</small>
        </div>
        <div class="ml-2 text-sm">${lec.completada ? '✔️' : ''}</div>
      `;

      if (lec.id === idLeccionActual) {
        p.classList.add('active', 'bg-[#1b263b]');
        p.style.borderLeft = '4px solid #00d4ff';
      }

      p.addEventListener('click', () => {
        window.location.href = `/src/pages/cursos.html?curso=${cursoId}&id=${lec.id}`;
      });

      lessonsDiv.appendChild(p);
    });

    header.addEventListener('click', () => {
      lessonsDiv.classList.toggle('hidden');
      const icon = header.querySelector('i');
      icon.classList.toggle('fa-chevron-up');
      icon.classList.toggle('fa-chevron-down');
    });

    lessonContainer.appendChild(header);
    lessonContainer.appendChild(lessonsDiv);
  });
}

// ==========================
// 🔥 CARGAR LECCIÓN
// ==========================
async function loadLesson() {
  const params = new URLSearchParams(window.location.search);
  cursoId = params.get("curso");
  idLeccion = params.get("id");

  if (!cursoId || !idLeccion) {
    lessonText.textContent = "❌ No se especificó una lección en la URL.";
    return;
  }

  const docRef = doc(db, "Cursos", cursoId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    lessonText.textContent = "Curso no encontrado.";
    return;
  }

  const curso = docSnap.data();

  selectedLesson = curso.lecciones.find((lec) => lec.id === idLeccion);
  if (!selectedLesson) {
    lessonText.textContent = "Lección no encontrada.";
    return;
  }

  lessonTitle.textContent = selectedLesson.titulo || "Lección sin título";
  lessonSubtitle.textContent = selectedLesson.subtitulo || "";
  document.title = selectedLesson.titulo || "Lección";

  lessonText.innerHTML = marked.parse(selectedLesson.contenido || "Sin contenido");

  // Botón copiar en bloques <pre>
  lessonText.querySelectorAll("pre").forEach(pre => {
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.title = "Copiar";
    btn.innerHTML = '<i class="fa-solid fa-copy"></i>';
    btn.style.cssText = "position:absolute; right:10px; top:10px; cursor:pointer;";
    pre.style.position = "relative";
    pre.appendChild(btn);

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        btn.innerHTML = "✅";
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i>'; }, 1500);
      } catch (err) {
        console.error("No se pudo copiar:", err);
      }
    });
  });

  // Sidebar
  renderSidebarFromCurso(curso, cursoId, idLeccion);

  // Marcar prssogreso rápido
  const userId = localStorage.getItem("userId");
  if (userId) {
    await setDoc(doc(db, "Usuarios", userId), { progreso: { [idLeccion]: true } }, { merge: true });
  }

  // Botones navegación
  setNavigationButtons(curso.lecciones, idLeccion, cursoId);
}

// ==========================
// 🔹 Navegación y botones
// ==========================
function setNavigationButtons(lecciones, currentLeccionId, cursoId) {
  const currentIndex = lecciones.findIndex(l => l.id === currentLeccionId);

  const nextLeccion = lecciones[currentIndex + 1];
  if (nextLeccion) nextBtn.onclick = () => navigateToLesson(cursoId, nextLeccion.id);
  else nextBtn.disabled = true;

  const prevLeccion = lecciones[currentIndex - 1];
  if (prevLeccion) prevBtn.onclick = () => navigateToLesson(cursoId, prevLeccion.id);
  else prevBtn.disabled = true;
}

function navigateToLesson(cursoId, leccionId) {
  window.location.href = `/src/pages/cursos.html?curso=${cursoId}&id=${leccionId}`;
}

// ==========================
// 🔹 Botón Run
// ==========================
runBtn.addEventListener("click", async () => {
  if (!pyodideReady) {
    output.textContent += "\n⏳ Cargando Pyodide...";
    return;
  }
  output.textContent = "";
  try {
    await pyodide.runPythonAsync(editor.getValue());
  } catch (err) {
    output.textContent += "\n⚠️ Error: " + err.message;
  }
});

// ==========================
// 🔹 Botón Check
// ==========================
checkBtn.addEventListener("click", async () => {
  if (!selectedLesson) {
    output.textContent += "\n⚠️ No hay lección cargada.";
    return;
  }

  const user = auth.currentUser;
  if (!user) {
    output.textContent += "\n⚠️ Debes iniciar sesión para guardar tu progreso.";
    return;
  }

  const codigoUsuario = editor.getValue().trim();
  const validacionEsperada = selectedLesson.validacionCodigo?.trim();

  if (codigoUsuario === validacionEsperada) {
    try {
      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, {
        [`progreso.${cursoId}.${idLeccion}`]: true,
        xp: increment(10),
      });

      const cursoRef = doc(db, "Cursos", cursoId);
      const cursoSnap = await getDoc(cursoRef);
      if (cursoSnap.exists()) {
        const cursoData = cursoSnap.data();
        const nuevasLecciones = cursoData.lecciones.map(lec =>
          lec.id === idLeccion ? { ...lec, completada: true } : lec
        );
        await updateDoc(cursoRef, { lecciones: nuevasLecciones });
      }

      output.textContent += `\n✅ ¡Correcto! Ganaste +10 XP.\nSalida esperada: ${selectedLesson.respuestaEsperada}\n`;
    } catch (err) {
      console.error("Error guardando progreso:", err);
      output.textContent += "\n⚠️ Error guardando progreso en Firebase.\n";
    }
  } else {
    output.textContent += "\n❌ Tu código no coincide con la validación esperada.\n";
  }
});

// ==========================
// 🔥 INICIALIZACIÓN
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  initEditor();
  initPyodide();
  loadLesson();
});
