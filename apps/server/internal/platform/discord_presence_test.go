package platform

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestNormalizeDiscordPresenceStreamURL(t *testing.T) {
	url, err := NormalizeDiscordPresenceStreamURL(" https://www.youtube.com/watch?v=openpost ")

	require.NoError(t, err)
	require.Equal(t, "https://www.youtube.com/watch?v=openpost", url)
}

func TestNormalizeDiscordPresenceStreamURLRejectsUnsupportedURL(t *testing.T) {
	_, err := NormalizeDiscordPresenceStreamURL("https://openpo.st/live")

	require.ErrorContains(t, err, "Twitch or YouTube")
}
