import { REST, Routes } from "discord.js";

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  console.error("Missing TOKEN or CLIENT_ID environment variables.");
  process.exit(1);
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log("Started removing all application (/) commands.");

    // Sending an empty array fully clears all global commands
    await rest.put(Routes.applicationCommands(clientId), { body: [] });

    console.log("Successfully removed all application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
