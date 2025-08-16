window.onload = () => {
  // Check if manoveda_current exists, if not, set a default user
  if (!localStorage.getItem("manoveda_current")) {
      localStorage.setItem("manoveda_current", JSON.stringify({ name: "Guest" }));
  }

  const user = JSON.parse(localStorage.getItem("manoveda_current"));
  if (!user) {
      alert("Please login first.");
      window.location.href = "index.html";
      return;
  }

  // Capitalize the first letter of each word
  const name = user.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  document.getElementById("username").textContent = name;
};

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("manoveda_current");
  window.location.href = "index.html";
});

document.getElementById("profileBtn").addEventListener("click", () => {
  window.location.href = "profile.html";
});
