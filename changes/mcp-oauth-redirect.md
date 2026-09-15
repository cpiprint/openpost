### Fixed

- Keep the MCP authorization action locked until its callback redirect starts, so repeated clicks cannot consume a second one-time authorization code or show a failure after the connection already succeeded.
