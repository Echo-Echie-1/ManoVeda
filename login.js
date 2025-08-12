document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  let name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!name || name.length < 2 || !email) {
    alert("Please enter a valid name (min 2 characters) and email.");
    return;
  }

  // Capitalize first letter of name
  name = name.charAt(0).toUpperCase() + name.slice(1);

  const users = JSON.parse(localStorage.getItem("manoveda_users")) || [];
  const existingUser = users.find(user => user.email === email);

  if (!existingUser) {
    users.push({ name, email });
    localStorage.setItem("manoveda_users", JSON.stringify(users));
    localStorage.setItem("manoveda_current", JSON.stringify({ name, email }));
    alert("Welcome, new friend! 😊");
  } else {
    localStorage.setItem("manoveda_current", JSON.stringify(existingUser));
    alert("Welcome back, " + existingUser.name + "!");
  }

  window.location.href = "index.html";
});
