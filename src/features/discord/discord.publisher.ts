import "server-only";

import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { env } from "@/lib/env";

export async function publishDiscordMessage(channelId: string | undefined, content: string) {
  if (!env.DISCORD_TOKEN || !channelId) {
    return { skipped: true };
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  await client.login(env.DISCORD_TOKEN);
  const channel = await client.channels.fetch(channelId);

  if (!(channel instanceof TextChannel)) {
    await client.destroy();
    throw new Error("Configured Discord channel is not a text channel.");
  }

  const message = await channel.send(content.slice(0, 1900));
  await client.destroy();

  return { skipped: false, messageId: message.id };
}
