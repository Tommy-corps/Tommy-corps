// commands/groupinfo.js
module.exports = {
  name: "groupinfo",
  description: "Show detailed info about the group",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;

      // Check if message is in a group
      if (!from.endsWith("@g.us")) {
        return await sock.sendMessage(from, { text: "❌ This command works only in groups!" });
      }

      // Fetch group metadata
      const groupMetadata = await sock.groupMetadata(from);
      const groupName = groupMetadata.subject;
      const groupId = groupMetadata.id;
      const owner = groupMetadata.owner;
      const participants = groupMetadata.participants || [];
      const memberCount = participants.length;

      // List admins
      const admins = participants
        .filter(p => p.admin !== null)
        .map(p => `@${p.id.split("@")[0]}`)
        .join("\n") || "No admins found";

      // Creation date (if available)
      const creationDate = groupMetadata.creation
        ? new Date(groupMetadata.creation * 1000).toLocaleString()
        : "Unknown";

      const reply = `
📊 *Group Info - Tommy-Corps*
────────────────────
👥 Name: ${groupName}
🆔 ID: ${groupId}
👑 Owner: @${owner.split("@")[0]}
📝 Created: ${creationDate}
👤 Members: ${memberCount}
🛡️ Admins:
${admins}
────────────────────
✨ Powered by Tommy-Corps Tech
      `;

      await sock.sendMessage(from, { text: reply, mentions: [owner, ...participants.map(p => p.id)] });

    } catch (e) {
      console.error("❌ GroupInfo command error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Failed to fetch group info:\n${e.message}` });
    }
  },
};
