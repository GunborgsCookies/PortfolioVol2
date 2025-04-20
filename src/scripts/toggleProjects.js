document.addEventListener("DOMContentLoaded", () => {
    const rows = document.querySelectorAll(".process-row");
  
    rows.forEach(row => {
      const toggle = row.querySelector(".toggle-btn");
      const extra = row.querySelector(".process-extra");
  
      toggle?.addEventListener("click", () => {
        const isOpen = extra.classList.contains("max-h-96");
  
        // Stäng alla andra
        document.querySelectorAll(".process-extra").forEach(el => {
          el.classList.remove("max-h-96");
          el.classList.add("max-h-0");
        });
  
        // Återställ alla knappar
        document.querySelectorAll(".toggle-btn").forEach(btn => btn.textContent = "+");
  
        if (!isOpen) {
          extra.classList.remove("max-h-0");
          extra.classList.add("max-h-96");
          toggle.textContent = "–";
        }
      });
    });
  });
  