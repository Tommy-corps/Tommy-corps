// commands/antilink.js
module.exports = {
  name: "antilink",
  description: "Enable/disable Anti-Link with auto-actions, emoji reacts + GIF on remove",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const OWNER_NUMBER = "255760317060@s.whatsapp.net"; // Badilisha na namba yako

      // Owner-only control
      if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
        return await sock.sendMessage(from, { text: "⚠️ Usage: !antilink on/off" });
      }

      const status = args[0].toLowerCase() === "on";

      // Initialize botFeatures if not exists
      if (!global.botFeatures) global.botFeatures = {};
      if (!global.botFeatures.antilink) global.botFeatures.antilink = {};

      // Enable all 3 features automatically
      global.botFeatures.antilink.delete = status;
      global.botFeatures.antilink.warn = status;
      global.botFeatures.antilink.remove = status;

      // Emoji reaction for enabling/disabling
      await sock.sendMessage(from, { react: { text: "🔗", key: msg.key } });

      // Success message
      await sock.sendMessage(from, {
        text: `✅ Anti-Link successfully ${status ? "enabled" : "disabled"} with features:\n- delete 🔥\n- warn ⚠️\n- remove 👢 + GIF`
      });

    } catch (e) {
      console.error("⚠️ AntiLink command error:", e);
      const from = msg.key.remoteJid || msg.key.participant;
      await sock.sendMessage(from, { text: `❌ Command failed. Error:\n${e.message}` });
    }
  },

  async handleMessage(sock, msg) {
    try {
      if (!global.botFeatures || !global.botFeatures.antilink) return;
      const from = msg.key.remoteJid;
      const sender = msg.key.participant || from;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!text) return;

      const linkRegex = /(https?:\/\/[^\s]+)/gi;
      const found = text.match(linkRegex);
      if (!found) return;

      // DELETE with emoji
      if (global.botFeatures.antilink.delete) {
        await sock.sendMessage(from, { delete: { remoteJid: from, id: msg.key.id } });
        await sock.sendMessage(from, { react: { text: "🔥", key: msg.key } });
      }

      // WARN with emoji
      if (global.botFeatures.antilink.warn) {
        await sock.sendMessage(from, {
          text: `⚠️ @${sender.split("@")[0]}, sending links is not allowed!`,
          mentions: [sender]
        });
        await sock.sendMessage(from, { react: { text: "⚠️", key: msg.key } });
      }

      // REMOVE with emoji + GIF (requires bot to be admin)
      if (global.botFeatures.antilink.remove) {
        try {
          await sock.groupParticipantsUpdate(from, [sender], "remove");
          await sock.sendMessage(from, { react: { text: "👢", key: msg.key } });

          // Send GIF
          await sock.sendMessage(from, {
            video: { url: "./remover.gif" }, // Hapa weka path ya GIF yako
            gifPlayback: true,
            caption: `🚫 @${sender.split("@")[0]} removed for sending a link!`,
            mentions: [sender]
          });

        } catch (err) {
          console.log("⚠️ Cannot remove user or send GIF, maybe bot is not admin");
        }
      }

    } catch (e) {
      console.error("⚠️ AntiLink handler error:", e);
    }
  }
};
