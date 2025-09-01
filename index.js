require("dotenv").config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const P = require("pino");
const express = require("express");

// -------- ENV SETTINGS --------
const ownerNumber = process.env.OWNER_NUMBER || "2557xxxxxxx";
const pairingCodeFlag = process.env.PAIRING_CODE || "on";
const sessionFolder = "./auth_info";
const sessionID = process.env.SESSION_ID || "";
const PORT = process.env.PORT || 3000;
const AUTO_REACT = process.env.AUTO_REACT || "👋";

let sock; // tunaiweka global ili routes ziitumie

// -------- RESTORE SESSION --------
if (sessionID) {
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder);
  try {
    const creds = Buffer.from(sessionID, "base64").toString("utf8");
    fs.writeFileSync(path.join(sessionFolder, "creds.json"), creds);
    console.log("✅ SESSION ID imerejeshwa (creds.json)!");
  } catch (e) {
    console.error("❌ SESSION ID si sahihi:", e.message);
  }
}

// -------- COMMAND LOADER --------
function loadCommands() {
  let commands = {};
  const files = fs.readdirSync(path.join(__dirname, "commands")).filter((f) => f.endsWith(".js"));
  for (let file of files) {
    try {
      const cmd = require(path.join(__dirname, "commands", file));
      commands[cmd.name] = cmd;
    } catch (e) {
      console.error(`⚠️ Kushindwa kupakia command ${file}:`, e.message);
    }
  }
  return commands;
}

// -------- START BOT --------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        P().child({ level: "fatal", stream: "store" })
      ),
    },
  });

  // Pairing code auto kwa owner
  if (!sock.authState.creds.registered && pairingCodeFlag === "on" && !sessionID) {
    const phoneNumber = ownerNumber.replace(/[^0-9]/g, "");
    const code = await sock.requestPairingCode(phoneNumber);
    console.log(`👉 Pairing code (OWNER): ${code}`);
  }

  // Connection updates
  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect } = u || {};
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot imeunganishwa!");
      try {
        const data = fs.readFileSync(path.join(sessionFolder, "creds.json"), "utf8");
        const newSessionID = Buffer.from(data).toString("base64");
        await sock.sendMessage(jidNormalizedUser(ownerNumber + "@s.whatsapp.net"), {
          text: `✅ SESSION ID yako:\n\n${newSessionID}\n\nHifadhi hii kwa deployments zijazo.`,
        });
      } catch (e) {
        console.error("⚠️ Kushindwa kutuma SESSION ID:", e.message);
      }
    }
  });

  // -------- Handle Messages --------
  const commands = loadCommands();

  sock.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages?.[0];
      if (!msg?.message) return;

      const sender = msg.key.remoteJid;
      const body =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      // Auto react kwa kila message
      try {
        await sock.sendMessage(sender, { react: { text: AUTO_REACT, key: msg.key } });
      } catch {}

      // Owner only: !session
      if (body.trim().toLowerCase() === "!session" && sender.includes(ownerNumber)) {
        const data = fs.readFileSync(path.join(sessionFolder, "creds.json"), "utf8");
        const newSessionID = Buffer.from(data).toString("base64");
        await sock.sendMessage(sender, { text: `📂 SESSION ID yako:\n\n${newSessionID}` });
      }

      // Commands (prefix "!")
      if (body.startsWith("!")) {
        const args = body.slice(1).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();
        if (commands[cmdName]) {
          await commands[cmdName].execute(sock, msg, args);
        }
      }
    } catch (e) {
      console.error("❌ messages.upsert error:", e);
    }
  });

  // -------- Auto View Status --------
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      for (let msg of messages) {
        if (msg.key.remoteJid.endsWith("@status")) {
          try {
            await sock.readMessages([msg.key]);
            console.log("✅ Status viewed automatically");
          } catch (e) {
            console.log("⚠️ View status error:", e.message);
          }
        }
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();

// -------- Web server --------
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.send("✅ WhatsApp Bot is running"));

app.post("/api/pair-code", async (req, res) => {
  try {
    const phone = String(req.body?.phone || "").replace(/[^0-9]/g, "");
    if (!phone) return res.status(400).json({ ok: false, error: "Weka namba sahihi (mfano: 2557...)" });

    if (!sock) return res.status(503).json({ ok: false, error: "Socket haiko tayari. Jaribu tena." });

    if (sock.authState?.creds?.registered) {
      return res.status(409).json({
        ok: false,
        error: "Akaunti tayari imeunganishwa. Futa folder 'auth_info' au weka SESSION_ID mpya kisha anza upya.",
      });
    }

    const code = await sock.requestPairingCode(phone);
    return res.json({ ok: true, code });
  } catch (e) {
    console.error("❌ /api/pair-code error:", e);
    return res.status(500).json({ ok: false, error: "Hitilafu ya ndani. Jaribu tena." });
  }
});

app.get("/pair", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pair.html"));
});

app.listen(PORT, () => console.log(`🌐 Web server listening on :${PORT}`));
