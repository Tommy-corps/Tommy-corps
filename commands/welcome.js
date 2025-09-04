// commands/welcome.js
module.exports = {
  name: "welcome",
  description: "Send welcome message with group stats",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    try {
      const groupMeta = await sock.groupMetadata(from);
      const members = groupMeta.participants.map(p => p.id);
      const totalMembers = members.length;

      // Customize welcome message
      const welcomeText = `🎉 *Welcome to ${groupMeta.subject}*\n👥 *Total members:* *${totalMembers}*\n*Enjoy your stay!*`;

      await sock.sendMessage(from, { text: welcomeText });
    } catch (e) {
      console.error("⚠️ Welcome command error:", e);
      await sock.sendMessage(from, { text: "❌ *Failed to send welcome message*" });
    }
  }
};
