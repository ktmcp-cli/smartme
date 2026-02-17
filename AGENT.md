# AGENT.md — smart-me CLI for AI Agents

This document explains how to use the smart-me CLI as an AI agent.

## Overview

The `smartme` CLI provides access to the smart-me energy monitoring API. Use it to read energy meters, monitor power consumption, and manage devices.

## Prerequisites

Configure with credentials:

```bash
smartme config set --username <email> --password <pass>
smartme config show
```

## All Commands

### Config

```bash
smartme config set --username <email> --password <pass>
smartme config show
```

### Devices

```bash
smartme devices list
smartme devices get <device-id>
smartme devices find --serial <serial-number>
```

### Values (Live Readings)

```bash
smartme values get <device-id>
smartme values history <device-id>
smartme values history <device-id> --date 2024-01-15T12:00:00
```

### Meters

```bash
smartme meters values <device-id>
smartme meters counters <device-id>
```

### Users

```bash
smartme users me
smartme users list
```

## JSON Output

Use `--json` for structured output:

```bash
smartme devices list --json
smartme values get <device-id> --json
smartme meters values <device-id> --json
```

## Key Fields

- `ActivePower` — Current power consumption in Watts
- `CounterReading` — Total energy consumed in kWh
- `Voltage` — Line voltage in Volts
- `Current` — Line current in Amperes
- `PowerFactor` — Power factor (0-1)

## Error Handling

The CLI exits with code 1 on error. Common errors:
- `Authentication failed` — Check username and password
- `Resource not found` — Verify device ID is correct
