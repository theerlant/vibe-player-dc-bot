package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"vibe-bot/core/client"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	"github.com/joho/godotenv"
)

var (
	Token    string
	ClientID string
	Intents  gateway.Intents
)

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Failed to load .env files required to boot the Bot,", err)
	}

	Token = os.Getenv("TOKEN") 
	ClientID = os.Getenv("CLIENT_ID")

	Intents = gateway.IntentGuildMessages
	Intents |= gateway.IntentMessageContent
	Intents |= gateway.IntentGuildVoiceStates
	Intents |= gateway.IntentGuilds
}

func main() {
	c, err := client.NewClient(Token, Intents)
	if err != nil {
		log.Fatal("Failed to create a Discord client instance,", err)
	}

	err = c.SetMessagePrefix("vibe!")
	if err != nil {
		log.Fatal("Failed to set message prefix,", err)
	}

	c.AddCommand(
		"hello",
		func(e *events.MessageCreate, args ...string) {
			_, err := e.Client().Rest.CreateMessage(
				e.ChannelID, 
				discord.NewMessageCreate().WithContent(fmt.Sprintf("Aloha %s!", e.Message.Author.EffectiveName())),
			)
			if err != nil {
				log.Println("Error sending hello message: ", err)
			}
		},
		"Respond with greeting",
	)

	c.AddCommand(
		"join",
		func(e *events.MessageCreate, args ...string) {
			if e.GuildID == nil {
				e.Client().Rest.CreateMessage(
					e.ChannelID, 
					discord.NewMessageCreate().WithContent("This command must be used in a guild."),
				)
				return
			}

			voiceState, ok := e.Client().Caches.VoiceState(*e.GuildID, e.Message.Author.ID)
			if !ok || voiceState.ChannelID == nil {
				e.Client().Rest.CreateMessage(e.ChannelID, discord.NewMessageCreate().WithContent("You're not in a voice channel"))
				return
			}

			conn := e.Client().VoiceManager.CreateConn(*e.GuildID)

			ctx := context.Background()
			err := conn.Open(ctx, *voiceState.ChannelID, false, true)
			if err != nil {
				log.Println("Fail to join voice channel,", err)
				e.Client().Rest.CreateMessage(e.ChannelID, discord.NewMessageCreate().WithContent(fmt.Sprintf("Cannot join voice channel due to: **%v**", err)))
			} else {
				// To get channel name we can fetch the channel from cache or rest
				channel, ok := e.Client().Caches.Channel(*voiceState.ChannelID)
				var channelName string
				if ok {
					channelName = channel.Name()
				} else {
					channelName = "Unknown Channel"
				}
				e.Client().Rest.CreateMessage(e.ChannelID, discord.NewMessageCreate().WithContent(fmt.Sprintf("Joined Voice channel **%s**", channelName)))
			}
		},
		"Try joining a voice channel",
	)

	err = c.Client.OpenGateway(context.TODO())
	if err != nil {
		log.Fatal("Error opening connection,", err)
	}

	fmt.Println("Ze bot is now running!")
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-sc

	c.Client.Close(context.TODO())
}
