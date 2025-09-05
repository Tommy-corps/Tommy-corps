// commands/groupinfo.js
module.exports = {
  name: "groupinfo",
  description: "Show group information beautifully",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const meta = await sock.groupMetadata(from);
    const text = `📌 *Group Information*\n────────────────────\n👥 Name: *${meta.subject}*\n🆔 ID: *${meta.id}*\n🧑‍🤝‍🧑 Members: *${meta.participants.length}*\n────────────────────\n✨ Enjoy chatting!`;
    await sock.sendMessage(from, { text });
  },
};
