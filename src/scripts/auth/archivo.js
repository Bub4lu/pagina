// 🚀 Redirección con un botón según el curso
document.addEventListener("DOMContentLoaded", () => {
  // Obtener todos los botones con la clase "redirectButton"
  const buttons = document.querySelectorAll('.redirectButton');

  // Función para redirigir a la lección específica
  function redirectToLesson(course, lesson) {
    // Redirigir a la URL con el curso y la lección especificados
    window.location.href = `/src/pages/cursos.html?curso=${course}&id=${lesson}`;
  }

  // Asignar el evento click a cada botón
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const curso = button.getAttribute("data-curso"); // Obtener el curso (python o javascript)
      const leccion = button.getAttribute("data-leccion"); // Obtener el ID de la lección (ejemplo: leccion_1)

      // Verificar si se están obteniendo los valores correctamente
      console.log("Curso:", curso); // Ver qué valor tiene el curso
      console.log("Lección:", leccion); // Ver qué valor tiene la lección

      if (!curso || !leccion) {
        console.error("Error: No se ha definido correctamente el curso o la lección");
        return;
      }

      // Redirigir a la lección seleccionada dentro del curso
      redirectToLesson(curso, leccion);
    });
  });
});
