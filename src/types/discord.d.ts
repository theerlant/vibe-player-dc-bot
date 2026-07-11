import {
  Collection,
  SharedSlashCommand,
  SlashCommandBuilder,
} from "discord.js";
import type { Low } from "lowdb";
import type { DBRoot } from "../db/types.ts";

declare module "discord.js" {
  export interface Client {
    db: Low<DBRoot>;
    commands: Collection<
      String,
      {
        data: SharedSlashCommand;
        autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
        execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
      }
    >;
  }
}
