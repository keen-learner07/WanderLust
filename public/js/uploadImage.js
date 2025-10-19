document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("listingForm");
  const fileInput = document.getElementById("imageFile");
  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (e) => {
    const file = fileInput.files[0];

    // If no file selected, let browser handle required validation
    if (!file) return;

    e.preventDefault(); // Stop default submit until upload finishes

    // Disable submit button to prevent multiple clicks
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";

    try {
      // Upload image to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "wanderlust_unsigned");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dxczqmy7o/image/upload",
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Cloudinary upload failed");

      const data = await res.json();

      // Remove old hidden inputs if they exist
      const oldUrlInput = form.querySelector(
        'input[name="listing[image][url]"]'
      );
      const oldFilenameInput = form.querySelector(
        'input[name="listing[image][filename]"]'
      );
      if (oldUrlInput) oldUrlInput.remove();
      if (oldFilenameInput) oldFilenameInput.remove();

      // Create hidden inputs for Cloudinary URL and filename
      const urlInput = document.createElement("input");
      urlInput.type = "hidden";
      urlInput.name = "listing[image][url]";
      urlInput.value = data.secure_url;

      const filenameInput = document.createElement("input");
      filenameInput.type = "hidden";
      filenameInput.name = "listing[image][filename]";
      filenameInput.value = data.public_id;

      form.appendChild(urlInput);
      form.appendChild(filenameInput);

      // Submit form now that hidden inputs exist
      form.submit();
    } catch (err) {
      console.error(err);
      // Use flash by redirecting to /listings/new with a query param
      window.location.href = "/listings/new?uploadError=1";
    }
  });
});
