// commands/antilink-toggle.js
module.exports = {
  name: "antilink",
  description: "Toggle all Anti-Link features On/Off (delete, warn, remove)",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const OWNER = "255624236654@s.whatsapp.net"; // Namba ya owner

      // Owner-only check
      if (!sender.includes(OWNER)) {
        return await sock.sendMessage(from, { text: "❌ *Only the bot owner can toggle Anti-Link*" });
      }

      if (!args[0] || !["on","off"].includes(args[0].toLowerCase())) {
        return await sock.sendMessage(from, { text: "⚠️ Usage: !antilink on/off" });
      }

      const status = args[0].toLowerCase() === "on";

      // Initialize features
      if (!global.botFeatures) global.botFeatures = {};
      if (!global.botFeatures.antilink) global.botFeatures.antilink = {};

      // Toggle all features
      global.botFeatures.antilink.delete = status;
      global.botFeatures.antilink.warn = status;
      global.botFeatures.antilink.remove = status;

      // Emoji react
      await sock.sendMessage(from, { react: { text: status ? "✅" : "❌", key: msg.key } });

      // Success message
      await sock.sendMessage(from, {
        text: `🔗 *Anti-Link successfully ${status ? "enabled ✅" : "disabled ❌"} with all features*\n- delete 🔥\n- warn ⚠️\n- remove 👢`
      });

    } catch (e) {
      console.error("⚠️ AntiLink toggle error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Command failed:\n${e.message}` });
    }
  }
};
