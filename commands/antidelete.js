// commands/antidelete-toggle.js
const OWNER = (process.env.OWNER_NUMBER || "255624236654") + "@s.whatsapp.net";

module.exports = {
  name: "antidelete",
  description: "Toggle anti-delete feature (owner only) with beautiful restore messages",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;

      // Owner-only check
      if (sender !== OWNER) {
        return await sock.sendMessage(from, { text: "❌ Only the bot owner can use this command." });
      }

      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off"].includes(action)) {
        return await sock.sendMessage(from, { text: "⚠️ Usage: *antidelete on/off*" });
      }

      // Toggle feature globally
      global.botFeatures = global.botFeatures || {};
      global.botFeatures.antidelete = action === "on";

      await sock.sendMessage(from, {
        text: action === "on"
          ? "✅ *Anti-Delete feature has been ENABLED 🛡️*\nNow, deleted messages will be restored automatically!"
          : "❌ *Anti-Delete feature has been DISABLED ❌"
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
      if (!from.endsWith("@g.us")) return; // Only in groups

      const protocolMsg = msg.message?.protocolMessage;
      if (!protocolMsg || protocolMsg.type !== 0) return;

      const deletedKey = protocolMsg.key;
      const sender = deletedKey.participant || from;

      const cachedMsg = global.msgCache?.[deletedKey.id];
      if (!cachedMsg) return;

      const restoredText = cachedMsg.message.conversation || cachedMsg.message.extendedTextMessage?.text;
      if (!restoredText) return;

      // Send restored message with art & branding
      const restoredMsg = await sock.sendMessage(from, {
        text: `🛡️ *Tommy-Corps Anti-Delete*\n────────────────────────────\n👤 Sender: @${sender.split("@")[0]}\n📩 Message deleted:\n\n"${restoredText}"\n────────────────────────────\n✨ Powered by Tommy-Corps Tech`,
        mentions: [sender]
      });

      await sock.sendMessage(from, { react: { text: "🛡️", key: restoredMsg.key } });

    } catch (e) {
      console.error("⚠️ Anti-delete handler error:", e);
    }
  }
};
