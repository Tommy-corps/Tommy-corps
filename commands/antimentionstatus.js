// commands/antimentionstatus.js
module.exports = {
  name: "antimentionstatus",
  description: "Delete messages in group that mention someone in status",

  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const status = args[0]?.toLowerCase() === "on";

    if (!global.botFeatures) global.botFeatures = {};
    global.botFeatures.antimentionstatus = status;

    await sock.sendMessage(from, {
      text: `🔕 *Anti-Mention Status ${status ? "enabled ✅" : "disabled ❌"}*`
    });
  },

  async handleMessage(sock, msg) {
    try {
      if (!global.botFeatures?.antimentionstatus) return;

      const from = msg.key.remoteJid;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!text) return;

      // Check if the message mentions anyone
      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentions.length > 0) {
        // Delete the message
        await sock.sendMessage(from, { delete: { remoteJid: from, id: msg.key.id } });
        // React with emoji
        await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
        console.log(`⚠️ Deleted message mentioning someone from ${msg.key.participant}`);
      }

    } catch (e) {
      console.error("⚠️ AntiMentionStatus error:", e);
    }
  }
};
