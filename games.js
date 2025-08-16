// Log button clicks for tracking
window.addEventListener("load", () => {
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach(button => {
    button.addEventListener("click", () => {
      console.log(`Clicked: ${button.textContent} - URL: ${button.href}`);
    });
  });

  // Optional: Add a loading state or tooltip effect
  buttons.forEach(button => {
    button.addEventListener("mouseover", () => {
      button.style.opacity = "0.9";
    });
    button.addEventListener("mouseout", () => {
      button.style.opacity = "1";
    });
  });
});