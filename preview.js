(function () {
  document.addEventListener("click", async (e) => {
    const button = e.target.closest(".copy-code-btn");
    if (!button) return;

    const wrapper = button.closest(".code-block-wrapper");
    const codeElement = wrapper?.querySelector("code");
    if (!codeElement) return;

    try {
      await navigator.clipboard.writeText(codeElement.textContent || "");

      button.classList.add("copied");
      setTimeout(() => button.classList.remove("copied"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  });
})();
