import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { createPlaylist } from "../../db/playlist.ts";
import { titleCheck } from "../../utils/regex.ts";

const data = new SlashCommandBuilder()
  .setName("playlist-create")
  .setDescription("Create a new tracks playlist")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription(
        "Type playlist name. Must be 3-50 characters long and only contain letter, number, hypens and space.",
      )
      .setRequired(true),
  );

async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name", true);

  if (!interaction.guildId) {
    await interaction.reply("This command only works on server at the moment.");
    return;
  }

  try {
    titleCheck(name);
  } catch (e) {
    if (e instanceof Error) {
      switch (e.message) {
        case "TOO SHORT":
          await interaction.reply(
            "Playlist name must be at least 3 characters long.",
          );
          return;
        case "TOO LONG":
          await interaction.reply(
            "Playlist name must exactly or less than 50 characters long ",
          );
        default:
          await interaction.reply("Playlist name contains invalid characters.");
      }
    }
  }

  try {
    await createPlaylist(interaction.client.db, interaction.guildId!, name);
    await interaction.reply(`Playlist **${name}** created.`);
  } catch (e) {
    if (e instanceof Error && e.message === "PLAYLIST_EXIST") {
      await interaction.reply(`Playlist **${name}** already exists.`);
    } else {
      throw e;
    }
  }
}

export const createPlaylistCommand = {
  data,
  execute,
};
