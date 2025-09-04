// Global owner number
const OWNER = "255624236654";

// Example: setprefix command
module.exports = {
  name: "setprefix",
  description: "Change bot command prefix (owner only)",
  async execute(sock, msg, args) {
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!sender.includes(OWNER)) {
      return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Only the bot owner can use this command." });
    }

    const newPrefix = args[0];
    if (!newPrefix) {
      return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Please provide a new prefix.\nUsage: !setprefix <newprefix>" });
    }

    // Save globally
    global.botPrefix = newPrefix;

    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Bot prefix changed successfully to: *${newPrefix}*` });
  }
};
