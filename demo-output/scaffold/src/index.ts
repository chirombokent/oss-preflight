import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import { summarizeMessages } from './summarizer.js';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!summarize') {
    const channel = message.channel as TextChannel;
    
    // Fetch last 24 hours of messages
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const messages = await channel.messages.fetch({ limit: 100 });
    
    const recentMessages = messages.filter(
      (msg) => msg.createdTimestamp > oneDayAgo && !msg.author.bot
    );

    if (recentMessages.size === 0) {
      await message.reply('No messages found in the last 24 hours.');
      return;
    }

    const messageTexts = recentMessages.map((msg) => ({
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }));

    const summary = await summarizeMessages(messageTexts);
    await message.reply(`**Channel Summary (Last 24h)**\n\n${summary}`);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Error: DISCORD_TOKEN environment variable is required');
  process.exit(1);
}

client.login(token);

// Made with Bob