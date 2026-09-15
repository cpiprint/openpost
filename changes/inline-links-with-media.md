### Fixed

- Keep URLs in post text when publishing media to X, Threads, Mastodon, and LinkedIn.
- Remove stale native link settings from existing media publications during readiness checks and publishing.

Provider rules verified 2026-09-15:

- [X Create Posts](https://docs.x.com/x-api/posts/create-post) accepts post text together with `media.media_ids`, including up to four photos. A URL in `text` is distinct from a native card attachment.
- [Meta's Threads API collection](https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api) accepts text on image and carousel containers. `link_attachment` is the native link-preview mode for text posts, not the way to include a URL in a media caption.
- [Mastodon statuses](https://docs.joinmastodon.org/methods/statuses/) accepts a `status` together with `media_ids[]`.
- [LinkedIn's MultiImage API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/multiimage-post-api?view=li-lms-2026-08) accepts `commentary` together with two to twenty images. An article is a separate post shape.

The readiness error was caused by treating every URL as a native link setting. Native link cards or articles remain format-specific, but an ordinary URL in the body is supported with media on these providers.
