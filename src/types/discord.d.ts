import {
  Collection,
  SharedSlashCommand,
  SlashCommandBuilder,
} from "discord.js";


export type CommandData = Collection<
  String,
  {
    data: SharedSlashCommand;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  }
>;

declare module "discord.js" {
  export interface Client {
    commands: CommandData;
  }
}
