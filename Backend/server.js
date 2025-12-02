// jarvis-backend/server.js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Temporary in-memory "memory"
let fakeState = {
  lightsOn: false,
};

app.post("/chat", (req, res) => {
  const { history, message } = req.body;
  console.log("Incoming from application:", { message });

  let reply = `You said: "${message}". Backend is alive.`;
  const actions = [];

  const lower = String(message).toLowerCase();

  // Simulated device control
  if (lower.includes("turn on") && lower.includes("living room")) {
    fakeState.lightsOn = true;
    reply = "Turning ON the living room lights (simulated).";
    actions.push("Tapo: living_room_lights ON");
  }

  if (lower.includes("turn off") && lower.includes("living room")) {
    fakeState.lightsOn = false;
    reply = "Turning OFF the living room lights (simulated).";
    actions.push("Tapo: living_room_lights OFF");
  }

  res.json({ reply, actions });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running at http://0.0.0.0:${PORT}`);
});
