> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# smart-me CLI

A production-ready command-line interface for the [smart-me](https://smart-me.com) energy monitoring API. Monitor electricity consumption, read meter values, and manage energy devices directly from your terminal.

> **Disclaimer**: This is an unofficial CLI tool and is not affiliated with, endorsed by, or supported by smart-me AG.

## Features

- **Devices** — List and inspect energy meters and smart devices
- **Values** — Get live power readings (watts, voltage, current, power factor)
- **Meters** — Read energy consumption counters (kWh)
- **Users** — Manage user accounts
- **JSON output** — All commands support `--json` for scripting and piping
- **Colorized output** — Clean, readable terminal output with chalk

## Why CLI > MCP

MCP servers are complex, stateful, and require a running server process. A CLI is:

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe output to `jq`, `grep`, `awk`, and other tools
- **Scriptable** — Use in shell scripts, CI/CD pipelines, cron jobs
- **Debuggable** — See exactly what's happening with `--json` flag
- **AI-friendly** — AI agents can call CLIs just as easily as MCPs, with less overhead

## Installation

```bash
npm install -g @ktmcp-cli/smartme
```

## Authentication Setup

Use your smart-me account credentials (username and password).

### Configure the CLI

```bash
smartme config set --username YOUR_EMAIL --password YOUR_PASSWORD
```

### Verify

```bash
smartme config show
```

## Commands

### Configuration

```bash
smartme config set --username <email> --password <pass>
smartme config show
```

### Devices (Meters)

```bash
# List all devices
smartme devices list

# Get a specific device
smartme devices get <device-id>

# Find device by serial number
smartme devices find --serial 12345678
```

### Values (Live Readings)

```bash
# Get current live values
smartme values get <device-id>

# Get historical values
smartme values history <device-id>
smartme values history <device-id> --date 2024-01-15T12:00:00
```

### Meters (Energy Consumption)

```bash
# Get meter/energy consumption values
smartme meters values <device-id>

# Get counter readings (OBIS)
smartme meters counters <device-id>
```

### Users

```bash
# Get current user info
smartme users me

# List all users
smartme users list
```

## JSON Output

All commands support `--json` for machine-readable output:

```bash
# Monitor all devices
smartme devices list --json

# Get live power consumption
smartme values get <device-id> --json | jq '.ActivePower'

# Get energy counter reading
smartme meters values <device-id> --json | jq '.CounterReading'
```

## Examples

### Monitor energy consumption

```bash
# Check current power draw across all meters
smartme devices list --json | jq '.[].ActivePower'

# Get detailed live readings for a meter
smartme values get <device-id>
```

### Track energy usage

```bash
# Get current counter (kWh)
smartme meters values <device-id> --json | jq '.CounterReading'

# Get historical counter at specific time
smartme values history <device-id> --date 2024-01-01T00:00:00 --json
```

## Contributing

Issues and pull requests are welcome at [github.com/ktmcp-cli/smartme](https://github.com/ktmcp-cli/smartme).

## License

MIT — see [LICENSE](LICENSE) for details.

---

Part of the [KTMCP CLI](https://killthemcp.com) project — replacing MCPs with simple, composable CLIs.
