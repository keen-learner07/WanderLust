document.addEventListener("DOMContentLoaded", () => {
  let formToDelete = null;

  document.querySelectorAll('form[action*="DELETE"]').forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      formToDelete = form;

      const type = form.dataset.type || "item";
      const modalBody = document.getElementById("modalBody");

      modalBody.textContent = `Are you sure you want to delete this ${type}?`;

      new bootstrap.Modal(document.getElementById("deleteModal")).show();
    });
  });

  document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
    if (formToDelete) formToDelete.submit();
  });
});
