// commands/leave.js
module.exports = {
  name: "leave",
  description: "Bot leaves the group",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    await sock.groupLeave(from);
    console.log(`✅ Left group: ${from}`);
  },
};
