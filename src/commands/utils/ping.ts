import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Get bot inbound and outbound latency");

async function execute(interaction: ChatInputCommandInteraction) {
  const receive = Date.now();
  const initiate = interaction.createdTimestamp;
  const inboundDelta = Math.abs(receive - initiate);

  var msg: string = `📥 Discord -> Bot: ${inboundDelta}ms`;

  const firstResponse = await interaction.reply({
    content: msg,
    withResponse: true,
  });

  const sent = Date.now();
  if (firstResponse) {
    const outboundDelta = Math.abs(sent - receive);
    msg += `\n📤 Bot -> Discord: ${outboundDelta}ms`;
    msg += `\n**Total: ${inboundDelta + outboundDelta}ms**`;
    msg +=
      "\n-# This can be innacurate as it depend entirely on the assumption of exact time match on both discord server and bot server.";
    interaction.editReply(msg);
  }
}

export const pingCommand = {
  data,
  execute,
};
