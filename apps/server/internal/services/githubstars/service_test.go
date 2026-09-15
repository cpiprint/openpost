package githubstars

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestCountCachesSuccessfulResponse(t *testing.T) {
	now := time.Date(2026, 9, 15, 12, 0, 0, 0, time.UTC)
	requests := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		require.Equal(t, "application/vnd.github+json", r.Header.Get("Accept"))
		_, _ = w.Write([]byte(`{"stargazers_count":512}`))
	}))
	defer server.Close()

	client := server.Client()
	service := NewService(Options{HTTPClient: client, Now: func() time.Time { return now }})
	// The fixed endpoint is replaced only in this test transport, keeping the
	// service's production URL and redirect policy under test elsewhere.
	service.client.Transport = rewriteTransport{base: client.Transport, target: server.URL}

	count, ok := service.Count(context.Background())
	require.True(t, ok)
	require.Equal(t, 512, count)
	count, ok = service.Count(context.Background())
	require.True(t, ok)
	require.Equal(t, 512, count)
	require.Equal(t, 1, requests)
}

func TestCountRetainsPreviousValueAfterFailure(t *testing.T) {
	now := time.Date(2026, 9, 15, 12, 0, 0, 0, time.UTC)
	status := http.StatusOK
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(status)
		if status == http.StatusOK {
			_, _ = w.Write([]byte(`{"stargazers_count":513}`))
		}
	}))
	defer server.Close()

	client := server.Client()
	service := NewService(Options{HTTPClient: client, Now: func() time.Time { return now }})
	service.client.Transport = rewriteTransport{base: client.Transport, target: server.URL}

	count, ok := service.Count(context.Background())
	require.True(t, ok)
	require.Equal(t, 513, count)

	now = now.Add(successCacheTTL)
	status = http.StatusForbidden
	count, ok = service.Count(context.Background())
	require.True(t, ok)
	require.Equal(t, 513, count)
}

type rewriteTransport struct {
	base   http.RoundTripper
	target string
}

func (t rewriteTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	clone := request.Clone(request.Context())
	clone.URL.Scheme = "http"
	clone.URL.Host = t.target[len("http://"):]
	return t.base.RoundTrip(clone)
}
