package githubstars

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

const (
	repositoryAPIURL = "https://api.github.com/repos/getopenpost/openpost"
	maxResponseBytes = 64 << 10
	requestTimeout   = 3 * time.Second
	successCacheTTL  = 24 * time.Hour
	failureCacheTTL  = 15 * time.Minute
)

type Options struct {
	HTTPClient *http.Client
	Now        func() time.Time
}

type Service struct {
	client *http.Client
	now    func() time.Time

	mu          sync.Mutex
	count       int
	hasCount    bool
	nextCheckAt time.Time
}

type githubRepository struct {
	StargazersCount int `json:"stargazers_count"`
}

func NewService(options Options) *Service {
	now := options.Now
	if now == nil {
		now = time.Now
	}

	client := http.DefaultClient
	if options.HTTPClient != nil {
		client = options.HTTPClient
	}
	boundedClient := *client
	boundedClient.CheckRedirect = sameHostRedirectPolicy

	return &Service{client: &boundedClient, now: now}
}

func (s *Service) Count(ctx context.Context) (int, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := s.now().UTC()
	if !s.nextCheckAt.IsZero() && now.Before(s.nextCheckAt) {
		return s.count, s.hasCount
	}

	count, ok := s.fetch(ctx)
	if ok {
		s.count = count
		s.hasCount = true
		s.nextCheckAt = now.Add(successCacheTTL)
		return count, true
	}

	s.nextCheckAt = now.Add(failureCacheTTL)
	return s.count, s.hasCount
}

func (s *Service) fetch(ctx context.Context) (int, bool) {
	requestCtx, cancel := context.WithTimeout(ctx, requestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(requestCtx, http.MethodGet, repositoryAPIURL, nil)
	if err != nil {
		return 0, false
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "openpost-star-count")

	resp, err := s.client.Do(req)
	if err != nil {
		return 0, false
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, false
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBytes+1))
	if err != nil || len(body) > maxResponseBytes {
		return 0, false
	}

	var repository githubRepository
	if err := json.Unmarshal(body, &repository); err != nil || repository.StargazersCount < 0 {
		return 0, false
	}
	return repository.StargazersCount, true
}

func sameHostRedirectPolicy(req *http.Request, via []*http.Request) error {
	if len(via) > 3 {
		return errors.New("GitHub star lookup stopped after three redirects")
	}
	if len(via) == 0 ||
		req.URL.Scheme != "https" ||
		req.URL.Port() != "" ||
		!strings.EqualFold(req.URL.Hostname(), via[0].URL.Hostname()) {
		return errors.New("GitHub star lookup refused a cross-host redirect")
	}
	return nil
}
