import { Collection } from "discord.js";
import { pingCommand } from "./utils/ping.ts";
import { createPlaylistCommand } from "./playlist/create-playlist.ts";
import { deletePlaylistCommand } from "./playlist/delete-playlist.ts";
import { joinCommand } from "./playback/join.ts";
import type { CommandData } from "../types/discord.ts";

export const commands: CommandData = new Collection();

// ---- Utility commands ----
commands.set(pingCommand.data.name, pingCommand);

// ---- Playlist commands ----
commands.set(createPlaylistCommand.data.name, createPlaylistCommand);
commands.set(deletePlaylistCommand.data.name, deletePlaylistCommand);

// ---- Playback commands ----
commands.set(joinCommand.data.name, joinCommand);
