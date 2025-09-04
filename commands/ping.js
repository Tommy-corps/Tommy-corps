module.exports = {
  name: "ping",
  description: "Simple ping with latency, branding, and emoji react",

  async execute(sock, msg, args) {
    try {
      const from = msg.key.remoteJid;
      const start = Date.now();

      // Temporary ping message
      const tempMsg = await sock.sendMessage(from, { text: "🏓 Pinging Tommy-Corps..." });

      const latency = Date.now() - start;

      // React with emoji
      await sock.sendMessage(from, { react: { text: "🏓", key: tempMsg.key } });

      // Send final short ping reply
      await sock.sendMessage(from, { text: `🏓 Tommy-Corps: ${latency} ms` });

      // Delete temporary ping message
      await sock.sendMessage(from, { delete: tempMsg.key });

    } catch (e) {
      console.error("❌ Ping failed:", e);
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Ping failed: ${e.message}` });
    }
  },
};
