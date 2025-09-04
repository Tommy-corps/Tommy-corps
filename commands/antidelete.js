// commands/antidelete-toggle.js
const OWNER = "255624236654";

module.exports = {
  name: "antidelete",
  description: "Toggle anti-delete feature (owner only)",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;

      // Owner-only check
      if (!sender.includes(OWNER)) {
        return await sock.sendMessage(from, { text: "❌ Only the bot owner can use this command." });
      }

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off"].includes(action)) {
        return await sock.sendMessage(from, { text: "❌ Usage: !antidelete on/off" });
      }

      // Toggle feature globally
      global.botFeatures = global.botFeatures || {};
      global.botFeatures.antidelete = action === "on";

      await sock.sendMessage(from, {
        text: action === "on"
          ? "✅ Anti-Delete feature has been *enabled* 🛡️"
          : "❌ Anti-Delete feature has been *disabled* ❌"
      });
    } catch (e) {
      console.error("❌ Anti-delete toggle error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Failed to toggle anti-delete:\n${e.message}` });
    }
  },

  // Handler for deleted messages
  async handleDeletedMessage(sock, msg) {
    try {
      if (!global.botFeatures?.antidelete) return; // Ignore if off

      const from = msg.key.remoteJid;
      if (!from.endsWith("@g.us")) return;

      const protocolMsg = msg.message?.protocolMessage;
      if (!protocolMsg || protocolMsg.type !== 0) return;

      const deletedKey = protocolMsg.key;
      const sender = deletedKey.participant || from;

      const cachedMsg = global.msgCache?.[deletedKey.id];
      if (!cachedMsg) return;

      let restoredText = cachedMsg.message.conversation || cachedMsg.message.extendedTextMessage?.text;
      if (!restoredText) return;

      const restoredMsg = await sock.sendMessage(from, {
        text: `🛡️ *Tommy-Corps Anti-Delete*\nSender: @${sender.split("@")[0]}\nMessage deleted:\n\n${restoredText}`,
        mentions: [sender]
      });

      await sock.sendMessage(from, { react: { text: "🛡️", key: restoredMsg.key } });

    } catch (e) {
      console.error("⚠️ Anti-delete error:", e);
    }
  }
};
