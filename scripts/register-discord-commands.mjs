import { REST, Routes, SlashCommandBuilder } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN?.trim();
const applicationId = process.env.DISCORD_APPLICATION_ID?.trim();

if (!token || !applicationId) {
  throw new Error(
    "DISCORD_BOT_TOKEN and DISCORD_APPLICATION_ID are required.",
  );
}

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setNameLocalizations({ ko: "핑" })
    .setDescription("Check whether BOBO bot is online")
    .setDescriptionLocalizations({ ko: "BOBO 봇의 연결 상태를 확인합니다" })
    .toJSON(),
  new SlashCommandBuilder()
    .setName("boboking")
    .setNameLocalizations({ ko: "보보킹" })
    .setDescription("Display the current weekly BOBOKING ranking")
    .setDescriptionLocalizations({ ko: "이번 주 BOBOKING 순위를 표시합니다" })
    .toJSON(),
];

const rest = new REST({ version: "10" }).setToken(token);

// 봇이 설치된 모든 Discord 서버에서 사용할 수 있도록 글로벌 명령으로 등록한다.
await rest.put(Routes.applicationCommands(applicationId), {
  body: commands,
});

console.log(`Registered ${commands.length} global Discord command(s).`);
