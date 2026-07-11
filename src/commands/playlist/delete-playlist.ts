import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { deletePlaylist, getPlaylists } from "../../db/playlist.ts";

const data = new SlashCommandBuilder()
  .setName("playlist-delete")
  .setDescription("Delete existing playlist.")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Type playlist name")
      .setRequired(true)
      .setAutocomplete(true),
  );

async function autocomplete(interaction: AutocompleteInteraction) {
  const value = interaction.options.getFocused();

  if (!interaction.guild) {
    return;
  }

  const playlists = await getPlaylists(
    interaction.client.db,
    interaction.guild.id,
  );

  const playlists_arr = Object.keys(playlists);

  if (value.length === 0) {
    await interaction.respond(
      // Sliced to 25 to prevent Discord API errors
      playlists_arr
        .slice(0, 25)
        .map((choice) => ({ name: choice, value: choice })),
    );
    return;
  }

  const filtered = playlists_arr.filter((playlist) =>
    playlist.toLowerCase().startsWith(value.toLowerCase()),
  );

  await interaction.respond(
    filtered.slice(0, 25).map((choice) => ({ name: choice, value: choice })),
  );
}

async function execute(interaction: ChatInputCommandInteraction) {
  const name = interaction.options.getString("name", true);

  if (!interaction.guildId) {
    await interaction.reply("This command only works on server at the moment.");
    return;
  }

  try {
    await deletePlaylist(interaction.client.db, interaction.guildId, name);
    await interaction.reply(`Deleted playlist **${name}**`);
  } catch (e) {
    if (e instanceof Error && e.message === "PLAYLIST NOT FOUND") {
      await interaction.reply(`Deleting imaginary **${name}**.`);
    } else {
      throw e;
    }
  }
}

export const deletePlaylistCommand = {
  data,
  autocomplete,
  execute,
};
