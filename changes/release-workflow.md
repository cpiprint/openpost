### Fixed

- Release candidates now prove the full core product on their own tag instead of inheriting proof from a path-filtered main run.
- Server-only releases keep the released Android identity and publish without waiting for Android packaging; mobile releases still require a monotonic identity advance.
- Release preparation validates changelog and contract inputs before touching files, stages only the changelog and its fragments, and no longer captures screenshots, runs broad browser suites, or waits for main CI.
- A broken production no longer blocks shipping its fix; readiness gates deployment health instead.
- Generated-contract checks restore the working tree before reporting, and provider-claim derivation survives import and variable renames.
