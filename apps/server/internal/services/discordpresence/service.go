// Package discordpresence keeps the configured OpenPost Discord bot connected
// to the Gateway and publishes its rotating presence.
package discordpresence

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"

	"github.com/openpost/backend/internal/platform"
)

const (
	// Discord rate-limits Gateway presence updates, so the rotation stays at
	// seconds scale instead of firing on every tick.
	defaultRotationInterval = 10 * time.Second
	retryInitialDelay       = 5 * time.Second
	retryMaxDelay           = 5 * time.Minute
)

var activityNames = []string{
	"your next post",
	"content on autopilot",
	"across your socials",
	"sooo many posts",
}

// Options controls the bot presence. An empty StreamURL uses a Watching
// activity. Discord only renders Streaming activities for Twitch and YouTube
// URLs, so an explicit valid URL is required before using that label.
type Options struct {
	RotationInterval time.Duration
	StreamURL        string
}

type gatewaySession interface {
	AddHandler(interface{}) func()
	Open() error
	Close() error
	UpdateStatusComplex(discordgo.UpdateStatusData) error
}

type sessionFactory func(string) (gatewaySession, error)

// Service owns one long-lived Discord Gateway session for the instance-owned
// bot. Start is non-blocking and retries initial connection failures without
// taking the web or durable job worker down with Discord.
type Service struct {
	token        string
	rotation     time.Duration
	streamURL    string
	newSession   sessionFactory
	initialRetry time.Duration
	maximumRetry time.Duration
}

func NewService(token string, options Options) (*Service, error) {
	return newService(token, options, newDiscordSession)
}

func newService(token string, options Options, factory sessionFactory) (*Service, error) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, fmt.Errorf("discord bot token is required for presence")
	}
	if factory == nil {
		return nil, fmt.Errorf("discord presence session factory is required")
	}
	if options.RotationInterval < 0 {
		return nil, fmt.Errorf("discord presence rotation interval must not be negative")
	}
	streamURL, err := platform.NormalizeDiscordPresenceStreamURL(options.StreamURL)
	if err != nil {
		return nil, err
	}
	rotation := options.RotationInterval
	if rotation == 0 {
		rotation = defaultRotationInterval
	}
	return &Service{
		token:        token,
		rotation:     rotation,
		streamURL:    streamURL,
		newSession:   factory,
		initialRetry: retryInitialDelay,
		maximumRetry: retryMaxDelay,
	}, nil
}

// Start connects the bot in the background. A failed initial connection is
// retried with a bounded backoff; DiscordGo handles heartbeat and reconnect
// traffic after the session is open.
func (s *Service) Start(ctx context.Context) {
	go s.run(ctx)
}

func (s *Service) run(ctx context.Context) {
	delay := s.initialRetry
	for {
		if ctx.Err() != nil {
			return
		}
		if err := s.runSession(ctx); err != nil {
			log.Printf("Discord presence Gateway unavailable: %v; retrying in %s", err, delay)
		}
		if ctx.Err() != nil {
			return
		}
		if !wait(ctx, delay) {
			return
		}
		delay = min(delay*2, s.maximumRetry)
	}
}

func (s *Service) runSession(ctx context.Context) error {
	session, err := s.newSession(s.token)
	if err != nil {
		return err
	}
	if err := session.Open(); err != nil {
		return fmt.Errorf("opening Discord Gateway: %w", err)
	}
	defer func() {
		if err := session.Close(); err != nil {
			log.Printf("Discord presence Gateway shutdown failed: %v", err)
		}
	}()

	activityIndex := 0
	var activityMu sync.Mutex
	updateCurrentPresence := func() {
		activityMu.Lock()
		defer activityMu.Unlock()
		if err := updatePresence(session, activityIndex, s.streamURL); err != nil {
			log.Printf("Discord presence update failed: %v", err)
		}
	}
	removeConnectHandler := session.AddHandler(func(_ *discordgo.Session, _ *discordgo.Connect) {
		updateCurrentPresence()
	})
	defer removeConnectHandler()
	updateCurrentPresence()
	ticker := time.NewTicker(s.rotation)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			activityMu.Lock()
			activityIndex = (activityIndex + 1) % len(activityNames)
			if err := updatePresence(session, activityIndex, s.streamURL); err != nil {
				log.Printf("Discord presence update failed: %v", err)
			}
			activityMu.Unlock()
		}
	}
}

func updatePresence(session gatewaySession, index int, streamURL string) error {
	if index < 0 || index >= len(activityNames) {
		return fmt.Errorf("discord presence activity index %d is out of range", index)
	}
	activityType := discordgo.ActivityTypeWatching
	if streamURL != "" {
		activityType = discordgo.ActivityTypeStreaming
	}
	return session.UpdateStatusComplex(discordgo.UpdateStatusData{
		Activities: []*discordgo.Activity{{Name: activityNames[index], Type: activityType, URL: streamURL}},
		Status:     "online",
		AFK:        false,
	})
}

func newDiscordSession(token string) (gatewaySession, error) {
	session, err := discordgo.New("Bot " + token)
	if err != nil {
		return nil, fmt.Errorf("creating Discord Gateway session: %w", err)
	}
	// Presence updates do not require message, member, or presence intents.
	// Keeping them disabled avoids privileged-intent configuration and limits
	// the event stream to what this process actually needs.
	session.Identify.Intents = discordgo.IntentsNone
	session.LogLevel = discordgo.LogError
	return session, nil
}

func wait(ctx context.Context, delay time.Duration) bool {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}
