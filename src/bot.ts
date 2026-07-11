import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";
import type { Low } from "lowdb";
import { getDatabase } from "./db/db.ts";
import { type DBRoot } from "./db/types.ts";
import { pingCommand } from "./commands/utils/ping.ts";
import { createPlaylistCommand } from "./commands/playlist/create-playlist.ts";
import { Connectors, Shoukaku } from "shoukaku";
import { joinCommand } from "./commands/playback/join.ts";
import { deletePlaylistCommand } from "./commands/playlist/delete-playlist.ts";

// Setup client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Client ready callback
client.once(Events.ClientReady, async (readyClient) => {
  readyClient.db = await getDatabase("db");
  console.log("The bot is ready, Sir!");
});

// Command callback will find command and try to execute it.
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isAutocomplete() && !interaction.isChatInputCommand()) {
    return;
  }

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  if (interaction.isAutocomplete() && command.autocomplete) {
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
      await interaction.respond([]);
    }
  }

  if (interaction.isChatInputCommand()) {
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
});

// ---- ADD COMMANDS HERE ----
client.commands = new Collection();
client.commands.set(pingCommand.data.name, pingCommand);
client.commands.set(createPlaylistCommand.data.name, createPlaylistCommand);
client.commands.set(deletePlaylistCommand.data.name, deletePlaylistCommand);
client.commands.set(joinCommand.data.name, joinCommand);

// Start bot
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (TOKEN === undefined || CLIENT_ID === undefined) {
  throw Error("Token or ClientID is not setup on .env!");
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

try {
  // Register slash command before starting the bot
  console.log("Started refreshing application (/) commands...");

  const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];

  client.commands.forEach((command) => {
    commands.push(command.data.toJSON());
  });

  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: commands,
  });

  console.log("Successfully reloaded application (/) commands...");

  await client.login(TOKEN);
} catch (error) {
  console.error("Error starting bot:", error);
}
