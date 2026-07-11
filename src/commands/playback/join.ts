import {
  createAudioPlayer,
  joinVoiceChannel,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { setupPlayer } from "../../player/player.ts";

const data: SlashCommandBuilder = new SlashCommandBuilder()
  .setName("join")
  .setDescription("Join the user's audio channel");

async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember;
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel) {
    await interaction.reply({
      content: "You are not in a voice channel.",
      flags: "Ephemeral",
    });
    return;
  }

  const permission = voiceChannel.permissionsFor(interaction.client.user);
  if (!permission?.has("Connect") || !permission.has("Speak")) {
    await interaction.reply(
      "I don't have the required permission to join and speak in your voice channel",
    );
    return;
  }

  if (!interaction.guild) {
    await interaction.reply("I can only do this on a server");
    return;
  }

  try {
    // 1. Establish the Voice Connection
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
      selfDeaf: true, // Good practice to save bot bandwidth
    });

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    connection.subscribe(player);

    setupPlayer(player, connection, interaction.guild.id);
    interaction.reply(
      `🚀 Successfully joined **${voiceChannel.name}** and initialized the player!`,
    );
  } catch (error) {
    console.error("Connection Error:", error);
    interaction.reply("❌ Failed to join the voice channel.");
  }
}

export const joinCommand = {
  data,
  execute,
};
