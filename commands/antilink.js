// commands/antilink.js
module.exports = {
  name: "antilink",
  description: "Protect group by removing dangerous links automatically",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const OWNER = (process.env.OWNER_NUMBER || "255624236654") + "@s.whatsapp.net";

      // Owner-only toggle
      if (!args[0] || !["on","off"].includes(args[0].toLowerCase())) {
        return await sock.sendMessage(from, { text: "⚠️ Usage: *antilink on/off" });
      }

      const status = args[0].toLowerCase() === "on";

      // Initialize features
      if (!global.botFeatures) global.botFeatures = {};
      if (!global.botFeatures.antilink) global.botFeatures.antilink = {};

      // Enable/delete/warn/remove features
      global.botFeatures.antilink.delete = status;
      global.botFeatures.antilink.warn = status;
      global.botFeatures.antilink.remove = status;

      // Emoji react
      await sock.sendMessage(from, { react: { text: status ? "🔗" : "❌", key: msg.key } });

      // Success message
      await sock.sendMessage(from, {
        text: `✅ *Anti-Link successfully ${status ? "enabled 🔥" : "disabled ❌"}*\nFeatures:\n- delete\n- warn\n- remove`
      });

    } catch (e) {
      console.error("⚠️ AntiLink command error:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Command failed:\n${e.message}` });
    }
  },

  async handleMessage(sock, msg) {
    try {
      if (!global.botFeatures?.antilink) return;

      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!text) return;

      // Regex to match dangerous links
      const linkRegex = /(https?:\/\/(www\.)?(facebook\.com|fb\.watch|tiktok\.com|instagram\.com|chat\.whatsapp\.com|wa\.me|whatsapp\.channel)\/[^\s]*)/gi;
      const found = text.match(linkRegex);
      if (!found) return;

      // DELETE
      if (global.botFeatures.antilink.delete) {
        await sock.sendMessage(from, { delete: { remoteJid: from, id: msg.key.id } });
        await sock.sendMessage(from, { react: { text: "🔥", key: msg.key } });
      }

      // WARN
      if (global.botFeatures.antilink.warn) {
        await sock.sendMessage(from, {
          text: `⚠️ @${sender.split("@")[0]}, sending links is not allowed!`,
          mentions: [sender]
        });
        await sock.sendMessage(from, { react: { text: "⚠️", key: msg.key } });
      }

      // REMOVE (bot must be admin)
      if (global.botFeatures.antilink.remove) {
        try {
          await sock.groupParticipantsUpdate(from, [sender], "remove");
          await sock.sendMessage(from, { react: { text: "👢", key: msg.key } });
          await sock.sendMessage(from, {
            text: `🚫 @${sender.split("@")[0]} removed for sending a dangerous link!`,
            mentions: [sender]
          });
        } catch (err) {
          console.log("⚠️ Cannot remove user, maybe bot is not admin");
        }
      }

    } catch (e) {
      console.error("⚠️ AntiLink handler error:", e);
    }
  }
};
