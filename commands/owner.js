// commands/owner.js
const os = require("os");

module.exports = {
  name: "owner",
  description: "Owner-only command to view bot info & manage features",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const OWNER = "255624236654@s.whatsapp.net";

      if (!sender.includes(OWNER)) {
        return await sock.sendMessage(from, { text: "❌ Only the bot owner can use this command." });
      }

      const uptimeSec = process.uptime();
      const uptime = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600)/60)}m ${Math.floor(uptimeSec%60)}s`;

      const platform = os.platform();
      const cpu = os.cpus()[0].model;
      const ram = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);

      const featuresStatus = global.botFeatures ? Object.entries(global.botFeatures).map(([k,v]) => `🔹 ${k}: ${v ? "ON ✅" : "OFF ❌"}`).join("\n") : "None";

      const reply = `
👑 *Tommy-Corps Owner Panel*
────────────────────────────
🕹️ *Owner:* @${OWNER.split("@")[0]}
⏱️ *Uptime:* ${uptime}
💻 *Platform:* ${platform}
🖥️ *CPU:* ${cpu}
💾 *RAM:* ${ram} GB
────────────────────────────
🛠️ *Bot Features Status:*
${featuresStatus}
────────────────────────────
💡 Use commands to toggle features ON/OFF
`;

      await sock.sendMessage(from, { text: reply, mentions: [OWNER] });

    } catch (e) {
      console.error("⚠️ Owner command error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Failed to fetch owner info:\n${e.message}` });
    }
  }
};
