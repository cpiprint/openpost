# OpenPost CLI workflows

Use live `--help` output if a flag in this reference differs from the installed CLI.

## Authenticate and select the target

```sh
openpost auth login https://app.openpo.st
openpost auth login https://app.openpo.st --device
printf '%s\n' "$OPENPOST_TOKEN" | openpost auth login https://app.openpo.st --with-token
openpost auth status --json
openpost auth logout
```

Manage API tokens without exposing them:

```sh
openpost auth token list --json
openpost auth token revoke token-id --json
```

Manage instance profiles and workspaces:

```sh
openpost instance add personal https://app.openpo.st --json
openpost instance list --json
openpost instance use personal --json
openpost instance health --json
openpost workspace create personal --json
openpost workspace list --json
openpost workspace use personal --json
```

## Inspect the target

```sh
openpost instance diagnostics --json
openpost workspace list --json
openpost account list --json
openpost provider readiness --json
```

`instance diagnostics` also accepts `--deployment`, `--provider`, and `--logs-file` for support snapshots.

Select a different target without changing the saved profile:

```sh
openpost --instance https://app.example.com --workspace workspace-id account list --json
```

## Manage connected accounts

```sh
openpost account list --json
openpost account list --platform x --json
openpost account rename main-x --slug company-x --json
openpost account disconnect account-id --yes --json
```

New accounts are connected in the web UI at `<instance>/settings?tab=accounts`; the CLI has no provider credential flow. Disconnect asks for confirmation unless `--yes` is already authorized.

## Manage billing (Hosted)

```sh
openpost billing status --json
openpost billing checkout founder --billing-period annual --json
openpost billing portal --json
```

Checkout plans are `founder`, `team`, or `agency` with `--billing-period monthly` (default) or `annual`.

## Manage provider context

```sh
openpost provider list --json
openpost provider readiness --workspace workspace-id --json
openpost provider capabilities --provider youtube --json
openpost provider capabilities --provider tiktok --content-profile short_video --json
```

Readiness reports setup and account blockers. Capabilities report supported profiles, media shapes, text limits, and provider settings.

## Create and edit text posts

Create a draft:

```sh
openpost post create \
  --accounts main-x,company-linkedin \
  --content 'Release notes are ready.' \
  --json
```

Attach an existing media ID or upload a local file in the same command:

```sh
openpost post create \
  --accounts main-x \
  --content 'The new queue is live.' \
  --media media-id \
  --json

openpost post create \
  --accounts main-x \
  --content 'The new queue is live.' \
  --media ./queue.png \
  --media-alt 'OpenPost queue screen' \
  --json
```

Update and verify:

```sh
openpost post update post-id --content 'Revised copy.' --json
openpost post view post-id --json
```

Read content from a file, add a random delay, or attach an encoded thread draft:

```sh
openpost post create --accounts main-x --file ./draft.txt --json
openpost post create --accounts main-x --content 'Staggered rollout.' --random-delay 30 --json
```

List, schedule, and delete existing posts (`post delete` asks for confirmation unless `--yes` is already authorized):

```sh
openpost post list --status scheduled --json
openpost post schedule post-id --at '2026-08-03T09:00:00+01:00' --json
openpost post delete post-id --yes --json
```

The CLI loads the current draft revision before an update. If the server reports a revision conflict, reload and reconcile instead of forcing a stale write.

Schedule at an exact instant or the next configured slot:

```sh
openpost post create \
  --accounts main-x \
  --content 'Scheduled update.' \
  --schedule '2026-08-03T09:00:00+01:00' \
  --json

openpost post create \
  --accounts main-x \
  --content 'Use the next free slot.' \
  --schedule next-slot \
  --json
```

Use `post update <id> --schedule draft` to clear a queued schedule.

## Create a Markdown thread

The file needs at least two non-empty posts separated by a line containing only `---`:

```md
First post.

---

Second post.
```

Create a draft or schedule it:

```sh
openpost thread create ./thread.md --accounts main-x --json
openpost thread create ./thread.md --accounts main-x --schedule next-slot --json
```

The file may start with optional front matter containing `workspace`, `accounts`, `schedule`, and `random_delay`.

## Create format-first publications

Profiles:

- `short_text`
- `thread`
- `link_share`
- `image_post`
- `carousel`
- `story`
- `short_video`
- `long_video`

Inspect capabilities for every target provider before filling provider-specific fields.

Link share:

```sh
openpost publication create \
  --content-profile link_share \
  --accounts company-linkedin \
  --url https://example.com/release \
  --content 'Release notes' \
  --json
```

Short video for mixed providers:

```sh
openpost publication create \
  --content-profile short_video \
  --accounts youtube-shorts,tiktok-main \
  --video-title 'Launch demo' \
  --video-description 'A short product walkthrough.' \
  --caption 'A short product walkthrough.' \
  --media ./launch.mp4 \
  --json
```

Long YouTube video:

```sh
openpost publication create \
  --content-profile long_video \
  --accounts youtube-main \
  --video-title 'Full walkthrough' \
  --video-description 'Complete product walkthrough.' \
  --privacy private \
  --media ./walkthrough.mp4 \
  --json
```

List and update editable publications (`--force` on update only after reviewing a revision conflict):

```sh
openpost publication list --status draft --json
openpost publication update publication-id --content 'Revised copy.' --json
openpost publication update publication-id --schedule draft --json
```

Validate, then schedule, publish, or cancel:

```sh
openpost publication validate publication-id --json
openpost publication schedule publication-id --at '2026-08-03T09:00:00+01:00' --json
openpost publication publish-now publication-id --json
openpost publication cancel publication-id --json
```

Read shared text from a file or stdin, and set video provider fields at create time:

```sh
openpost publication create --content-profile short_text --accounts main-x --file ./draft.txt --json
openpost publication create \
  --content-profile short_video \
  --accounts tiktok-main \
  --tiktok-method DIRECT_POST \
  --tiktok-privacy SELF_ONLY \
  --media ./launch.mp4 --json
```

Replace destination-specific renditions with a JSON array:

```sh
openpost publication renditions publication-id --file ./renditions.json --json
```

Run `openpost publication renditions --help` and inspect `provider capabilities` before constructing provider settings.

## Manage media

```sh
openpost media upload ./image.png --alt 'Descriptive alt text' --json
openpost media list --limit 100 --json
openpost media update media-id --alt 'Revised alt text' --json
openpost media usage media-id --json
openpost media storage --json
openpost media delete media-id --yes --json
```

Check usage before deletion. OpenPost rejects deletion while media is used by an editable draft, design, template, or brand kit.

## Manage reusable schedule slots

List slots and find the next free time:

```sh
openpost schedule list --json
openpost schedule next --json
```

Create or edit a workspace-local weekly slot. Days use `0=Sunday` through `6=Saturday`:

```sh
openpost schedule create --day 1 --hour 9 --minute 30 --label Morning --json
openpost schedule update schedule-id --hour 10 --minute 0 --json
openpost schedule update schedule-id --inactive --json
```

Create a suggested seven-day schedule only when the user asked for it. This adds `7 × posts-per-day` slots:

```sh
openpost schedule suggest --posts-per-day 2 --yes --json
```

Delete one exact slot:

```sh
openpost schedule delete schedule-id --yes --json
```

## Inspect and recover publication activity

```sh
openpost publication view publication-id --json
openpost publication events publication-id --json
openpost jobs list --json
```

Retry one failed and retryable destination:

```sh
openpost publication retry publication-id account-id --json
```

Do not retry a failure that requires account reconnection or a content change.

Delete one saved rendition or an editable publication only after explicit authorization:

```sh
openpost publication delete-rendition publication-id account-id --confirm --json
openpost publication delete publication-id --confirm --json
```

## Reply to a published rendition

```sh
openpost publication reply rendition-id --body 'Follow-up with the numbers.' --json
openpost publication reply rendition-id --file ./reply.txt --at '2026-08-03T09:00:00+01:00' --json
```

`--parent-id` targets an external provider post or comment. Replies change the provider's remote state.

## Read and moderate comments

```sh
openpost publication comments rendition-id --json
openpost publication reply-comment comment-id --body 'Thanks for the feedback.' --json
openpost publication hide-comment comment-id --json
openpost publication delete-comment comment-id --json
```

Use only actions marked supported in the comment data. Replies and moderation change the provider's remote state.
