// commands/hidetag.js
module.exports = {
  name: "hidetag",
  description: "Send a message to all group members with hidden mentions or visible mentions with emoji react",
  
  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;

      // Only for groups
      if (!from.endsWith("@g.us")) {
        return await sock.sendMessage(from, { text: "❌ This command works only in groups!" });
      }

      // Fetch group metadata
      const group = await sock.groupMetadata(from);
      const participants = group.participants.map(p => p.id);

      if (participants.length === 0) return;

      // Check if user wants mentions hidden or visible
      // Syntax: !hidetag [hide|show] optional message
      const mode = args[0]?.toLowerCase();
      const message = args.slice(1).join(" ") || `📣 Hello everyone!`;

      let mentions = [];
      let textToSend = message;

      if (mode === "show") {
        // Tag all visible
        mentions = participants;
      } else {
        // Hidetag: mentions exist but not displayed
        mentions = participants;
        textToSend = message; // text stays normal, mentions hidden by default
      }

      // Send the message
      const sentMsg = await sock.sendMessage(from, {
        text: `${textToSend}\n\n✨ Powered by Tommy-Corps Tech`,
        mentions: mentions
      });

      // Emoji react
      await sock.sendMessage(from, { react: { text: "👻", key: sentMsg.key } });

    } catch (e) {
      console.error("❌ Hidetag command error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Failed to hidetag:\n${e.message}` });
    }
  },
};
