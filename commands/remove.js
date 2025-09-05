// commands/remove.js
module.exports = {
  name: "remove",
  description: "Remove a user by reply or tag",
  
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    // Only owner can use this command
    const owner = (process.env.OWNER_NUMBER || "255624236654") + "@s.whatsapp.net";
    if (msg.key.participant !== owner && from !== owner) {
      return await sock.sendMessage(from, { text: "🚫 Only owner can use this command." });
    }

    // Determine target
    let target;
    if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
      target = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
      return await sock.sendMessage(from, { text: "⚠️ Reply to a message or tag a user to remove!" });
    }

    try {
      // Remove user
      await sock.groupParticipantsUpdate(from, [target], "remove");
      // React with emoji
      await sock.sendMessage(from, { react: { text: "👢", key: msg.key } });
      // Confirmation message
      await sock.sendMessage(from, { text: `✅ *@${target.split("@")[0]}* removed from group!\n✨ Tommy-Corps Bot` , mentions:[target]});
    } catch (e) {
      console.error("⚠️ Remove command error:", e);
      await sock.sendMessage(from, { text: "❌ Cannot remove user. Make sure bot is admin." });
    }
  }
};
