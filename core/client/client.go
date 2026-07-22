package client

import (
	"fmt"
	"log"
	"strings"

	"github.com/disgoorg/disgo"
	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/gateway"
	"github.com/disgoorg/disgo/voice"
	"github.com/disgoorg/godave/golibdave"
)

type MsgCmdCallback func(e *events.MessageCreate, args ...string)

type MsgCmd struct {
	command     string
	description string
	callback    MsgCmdCallback
}

type DgClient struct {
	Client    *bot.Client
	intents   gateway.Intents
	msgPrefix string
	commands  []MsgCmd
}

func NewClient(
	token string,
	intents gateway.Intents,
) (*DgClient, error) {
	var dgClient DgClient
	dgClient.intents = intents

	client, err := disgo.New(token,
		bot.WithGatewayConfigOpts(
			gateway.WithIntents(intents),
		),
		bot.WithCacheConfigOpts(
			cache.WithCaches(cache.FlagVoiceStates, cache.FlagChannels),
		),
		bot.WithEventListenerFunc(dgClient.messageCommandHandler),
		bot.WithVoiceManagerConfigOpts(
			voice.WithDaveSessionCreateFunc(golibdave.NewSession),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("Failed to create a Discord client instance, %w", err)
	}

	dgClient.Client = client

	return &dgClient, nil
}

func (c *DgClient) SetMessagePrefix(prefix string) error {
	if prefix == "" {
		return fmt.Errorf("Cannot assign empty string as command prefix")
	}

	c.msgPrefix = prefix + " " // Add space because that's how things work

	return nil
}

func (c *DgClient) AddCommand(command string, callback MsgCmdCallback, description string) error {
	if command == "" {
		return fmt.Errorf("Cannot assign empty string as command prefix")
	}

	c.commands = append(c.commands, MsgCmd{
		command:     strings.ToLower(command),
		description: description,
		callback:    callback,
	})

	return nil
}

func (c *DgClient) messageCommandHandler(e *events.MessageCreate) {
	if e.Message.Author.Bot {
		return // Ignore bot messages
	}

	if !strings.HasPrefix(e.Message.Content, c.msgPrefix) {
		return
	}

	trimmedMsg, _ := strings.CutPrefix(e.Message.Content, c.msgPrefix)

	args := strings.Split(trimmedMsg, " ")

	command := strings.ToLower(strings.TrimSpace(args[0]))
	args = args[1:]

	for _, msgCmd := range c.commands {
		if msgCmd.command == command {
			msgCmd.callback(e, args...)
			return
		}
	}

	log.Println("A command is not found in client:", command)
}
