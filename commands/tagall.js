// commands/tagall.js
module.exports = {
  name: "tagall",
  description: "Tag all group members with optional message and emoji react",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;

      // Check if message is in a group
      if (!from.endsWith("@g.us")) {
        return await sock.sendMessage(from, { text: "❌ This command works only in groups!" });
      }

      // Fetch group metadata
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants || [];

      if (participants.length === 0) return;

      // Optional custom message
      const customMsg = args.join(" ") || "📣 Hello everyone!";

      // Prepare mentions array
      const mentions = participants.map(p => p.id);

      // Send tagall message
      const sentMsg = await sock.sendMessage(from, {
        text: customMsg,
        mentions: mentions
      });

      // Emoji react to the message
      await sock.sendMessage(from, { react: { text: "📢", key: sentMsg.key } });

    } catch (e) {
      console.error("❌ TagAll command error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Failed to tag all:\n${e.message}` });
    }
  },
};
