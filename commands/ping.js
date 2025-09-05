// commands/ping.js
const os = require("os");

module.exports = {
  name: "ping",
  description: "Check bot latency, uptime and branding",

  async execute(sock, msg, args) {
    try {
      const start = Date.now();
      const from = msg.key.remoteJid;

      // Temporary message to measure latency
      const tempMsg = await sock.sendMessage(from, { text: "🏓 Pinging Tommy-Corps..." });

      const latency = Date.now() - start;
      const uptimeSec = process.uptime();
      const uptime = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${Math.floor(uptimeSec % 60)}s`;

      const platform = os.platform();
      const cpu = os.cpus()?.[0]?.model || "Unknown";

      const reply = `
📡 *Tommy-Corps Bot Status*
────────────────────
🏓 Latency: *${latency} ms*
⏱️ Uptime: *${uptime}*
💻 Platform: *${platform}*
🖥️ CPU: *${cpu}*
🤖 Bot: *Tommy-Corps Online*
────────────────────
✨ Powered by *Tommy-Corps Tech*
      `;

      // Send final ping result
      await sock.sendMessage(from, { text: reply });

      // Optional: delete temporary ping message
      await sock.sendMessage(from, { delete: tempMsg.key });

    } catch (e) {
      console.error("⚠️ Ping command error:", e);
      const from = msg.key.remoteJid || msg.key.participant;
      await sock.sendMessage(from, { text: "❌ Ping failed. Try again!" });
    }
  },
};
