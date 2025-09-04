require("dotenv").config();
const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const Boom = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
const P = require("pino");
const express = require("express");
const qrcode = require("qrcode-terminal"); // 👈 Ongeza hii

// -------- ENV SETTINGS --------
const ownerNumber = (process.env.OWNER_NUMBER || "2557xxxxxxx") + "@s.whatsapp.net";
const ownerNumber = (process.env.OWNER_NUMBER || "255624236654") + "@s.whatsapp.net";
const sessionFolder = "./auth_info";
const PORT = process.env.PORT || 3000;
const AUTO_REACT = process.env.AUTO_REACT || "👋";

let sock;

// -------- COMMAND LOADER --------
function loadCommands() {
  let commands = {};
  const cmdPath = path.join(__dirname, "commands");
  if (!fs.existsSync(cmdPath)) return commands;

  const files = fs.readdirSync(cmdPath).filter((f) => f.endsWith(".js"));
  for (let file of files) {
    try {
      const cmd = require(path.join(cmdPath, file));
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
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        P().child({ level: "fatal", stream: "store" })
      ),
    },
  });

  // -------- Connection updates & QR --------
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      // Print QR in terminal
      qrcode.generate(qr, { small: true });
      console.log("📷 Scan QR code hapa terminal!");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error;
      if (Boom.isBoom(reason)) console.log("❌ Boom error:", reason.output.payload);

      const shouldReconnect = reason?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("❌ Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ Bot imeunganishwa!");
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

      // Only owner can use bot
      if (sender !== ownerNumber) {
        if (body.startsWith("*")) {
          await sock.sendMessage(sender, {
            text: "🚫 Samahani, bot hii ni private. Huwezi kuitumia.",
          });
        }
        return;
      }

      // Auto react
      try {
        await sock.sendMessage(sender, { react: { text: AUTO_REACT, key: msg.key } });
      } catch {}

      // Commands (prefix "*")
      if (body.startsWith("*")) {
      if (body.startsWith("#")) {
        const args = body.slice(1).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        if (commands[cmdName]) {
          await commands[cmdName].execute(sock, msg, args);
        } else {
          await sock.sendMessage(sender, {
            text: `❓ Command *${cmdName}* haipo.`,
          });
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

app.get("/", (req, res) =>
  res.send("✅ WhatsApp Bot is running (QR Login, prefix '*')")
  res.send("✅ WhatsApp Bot is running (QR Login, prefix '#')")
);

app.listen(PORT, () => console.log(`🌐 Web server listening on :${PORT}`));
