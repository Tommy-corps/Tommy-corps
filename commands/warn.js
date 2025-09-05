// commands/warn.js
module.exports = {
  name: "warn",
  description: "Warn a user; if warn limit reached, remove them",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const owner = (process.env.OWNER_NUMBER || "255624236654") + "@s.whatsapp.net";

      // Only owner or admins can warn
      const isOwner = msg.key.participant === owner || from === owner;
      if (!isOwner) return await sock.sendMessage(from, { text: "🚫 Only owner/admin can use this command." });

      // Determine target user
      let target;
      if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      } else if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
      } else {
        return await sock.sendMessage(from, { text: "⚠️ Reply to a message or tag a user to warn!" });
      }

      // Initialize warn storage
      if (!global.warns) global.warns = {};
      if (!global.warns[from]) global.warns[from] = {};
      if (!global.warns[from][target]) global.warns[from][target] = 0;

      // Increment warn
      global.warns[from][target] += 1;
      const limit = 3; // warn limit

      // Send warn message
      await sock.sendMessage(from, {
        text: `⚠️ *@${target.split("@")[0]}* has been warned! (${global.warns[from][target]}/${limit})`,
        mentions: [target]
      });

      // Check if limit reached
      if (global.warns[from][target] >= limit) {
        // Remove user
        try {
          await sock.groupParticipantsUpdate(from, [target], "remove");
          await sock.sendMessage(from, { react: { text: "👢", key: msg.key } });
          await sock.sendMessage(from, {
            text: `❌ *@${target.split("@")[0]}* removed after reaching warn limit!`,
            mentions: [target]
          });
          // Reset warn count
          global.warns[from][target] = 0;
        } catch (e) {
          console.log("⚠️ Cannot remove user; make sure bot is admin", e.message);
        }
      }

    } catch (e) {
      console.error("⚠️ Warn command error:", e);
      const from = msg.key.remoteJid;
      await sock.sendMessage(from, { text: `❌ Command failed. Error:\n${e.message}` });
    }
  }
};
