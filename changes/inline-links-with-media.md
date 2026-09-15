### Fixed

- Keep URLs in post text when publishing media to X, Threads, Mastodon, and LinkedIn.
- Remove stale native link settings from existing media publications during readiness checks and publishing.
- Verify that ordinary URLs in body text remain supported alongside media, using the provider's text-plus-media APIs for [X](https://docs.x.com/x-api/posts/create-post), [Threads](https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api), [Mastodon](https://docs.joinmastodon.org/methods/statuses/), and [LinkedIn](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/multiimage-post-api?view=li-lms-2026-08). Native link cards and articles remain format-specific.
