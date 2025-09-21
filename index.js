const express = require("express");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
const SECRET_KEY = "your_secret_key"; // Use env variable in production

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const users = []; // In-memory user store

// Serve HTML form with JavaScript
app.get("/", (req, res) => {
  res.send(`
    <h2>Register</h2>
    <form method="POST" action="/register">
      <input name="username" placeholder="Username" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Register</button>
    </form>

    <h2>Login</h2>
    <form id="loginForm">
      <input id="loginUsername" placeholder="Username" required />
      <input id="loginPassword" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>

    <h2>Profile</h2>
    <button onclick="getProfile()">Access Profile</button>
    <pre id="profileResult"></pre>

    <script>
      let token = "";

      document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (data.token) {
          token = data.token;
          alert("Login successful! Token stored.");
        } else {
          alert("Login failed.");
        }
      });

      async function getProfile() {
        const res = await fetch("/profile", {
          headers: { Authorization: "Bearer " + token }
        });
        const text = await res.text();
        document.getElementById("profileResult").textContent = text;
      }
    </script>
  `);
});

// Register route
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.send("User registered successfully");
});

// Login route with JWT
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (!user) return res.status(400).send("Invalid credentials");

  const isValid = await bcrypt.compare(password, user.password);
  if (isValid) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ message: "Login Successful", token });
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// Protected profile route
app.get("/profile", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.send(`
      <h3>Unauthorized</h3>
      <p>Please include your token in the Authorization header.</p>
    `);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.send(`<h3>Welcome, ${decoded.username}!</h3>`);
  } catch (err) {
    res.status(401).send("Unauthorized: Invalid token");
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
