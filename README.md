# Vibe Player Bot

**UNDER CONSTRUCTION**

A "Background music" discord bot for your server to chill together.
This bot is made possible with disGo and their list of libraries.

## Background

Play chill music with background noise to enhance your voice channel experience
whether you're studying, chatting, or doing other things; alone or together.

## Features

- Play music from several sources, including your own provided direct url.
- Complete control over your queue and current playback.
- Dynamically adjust background noise including volume, intensity, or change to a completely different noise. **You can also use a music to mix.**
- Save queue into a playlist or made one beforehand, with ability to transfer playlist you created between servers and/or your DM.
- Watch a dedicated voice channel to automatically join and play selected playlist when someone joins.

## Dependencies

- **ffmpeg**: streaming audio from the network.
- **yt-dlp**: searching and fetching music from sources including youtube and soundcloud.
- **libdave**: playing audio to voice channel as Discord enforced Dave E2EE protocol.

## Todo List

- Resolver to enables multi source playback and expose a smart resolver that finalizes output as direct streaming url.
- Ffmpeg expired / invalid url silent error handling.
- Finishes streamer to playback and mix background noise.
- Add queue system.
- Add per-guild playlist system and way to send a playlist to another guild / personal chat.
- Requires Libdave installation and MSYS2 (or WSL) for disgo voice to work. Need to write a simple guide how to.
