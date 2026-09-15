package platform

import (
	"fmt"
	"net/url"
	"strings"
)

// NormalizeDiscordPresenceStreamURL validates and canonicalizes the optional
// URL used by Discord's Streaming activity. Discord only accepts HTTPS Twitch
// or YouTube URLs for that activity.
func NormalizeDiscordPresenceStreamURL(rawURL string) (string, error) {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return "", nil
	}
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Scheme != "https" || parsed.User != nil || parsed.Port() != "" || parsed.Fragment != "" {
		return "", fmt.Errorf("must be an HTTPS Twitch or YouTube URL")
	}
	switch strings.ToLower(parsed.Hostname()) {
	case "twitch.tv", "www.twitch.tv", "youtube.com", "www.youtube.com":
		return parsed.String(), nil
	default:
		return "", fmt.Errorf("must use Twitch or YouTube")
	}
}
