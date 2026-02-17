import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  listDevices,
  getDevice,
  getDeviceBySerial,
  getDeviceValues,
  getDeviceValuesInPast,
  getMeterValues,
  getCounterValues,
  getUser,
  listUsers
} from './api.js';

const program = new Command();

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }
  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });
  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));
  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });
  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('smart-me credentials not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  smartme config set --username <user> --password <pass>'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('smartme')
  .description(chalk.bold('smart-me CLI') + ' - Energy monitoring from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--username <user>', 'smart-me username')
  .option('--password <pass>', 'smart-me password')
  .action((options) => {
    if (options.username) { setConfig('username', options.username); printSuccess('Username set'); }
    if (options.password) { setConfig('password', options.password); printSuccess('Password set'); }
    if (!options.username && !options.password) {
      printError('No options provided. Use --username and --password');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const username = getConfig('username');
    const password = getConfig('password');
    console.log(chalk.bold('\nsmart-me CLI Configuration\n'));
    console.log('Username: ', username ? chalk.green(username) : chalk.red('not set'));
    console.log('Password: ', password ? chalk.green('*'.repeat(8)) : chalk.red('not set'));
    console.log('');
  });

// ============================================================
// DEVICES (meters)
// ============================================================

const devicesCmd = program.command('devices').description('Manage energy meters/devices');

devicesCmd
  .command('list')
  .description('List all devices (energy meters)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const devices = await withSpinner('Fetching devices...', () => listDevices());
      if (options.json) { printJson(devices); return; }
      const arr = Array.isArray(devices) ? devices : [devices];
      printTable(arr, [
        { key: 'Id', label: 'ID', format: (v) => v ? String(v).substring(0, 16) : 'N/A' },
        { key: 'Name', label: 'Name', format: (v) => v || 'N/A' },
        { key: 'Serial', label: 'Serial', format: (v) => v ? String(v) : 'N/A' },
        { key: 'DeviceEnergyType', label: 'Energy Type', format: (v) => v !== undefined ? String(v) : 'N/A' },
        { key: 'ActivePower', label: 'Active Power (W)', format: (v) => v !== undefined ? v.toFixed(2) : 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

devicesCmd
  .command('get <device-id>')
  .description('Get a specific device')
  .option('--json', 'Output as JSON')
  .action(async (deviceId, options) => {
    requireAuth();
    try {
      const device = await withSpinner('Fetching device...', () => getDevice(deviceId));
      if (options.json) { printJson(device); return; }
      console.log(chalk.bold('\nDevice Details\n'));
      console.log('ID:           ', chalk.cyan(device.Id || deviceId));
      console.log('Name:         ', device.Name || 'N/A');
      console.log('Serial:       ', device.Serial || 'N/A');
      console.log('Energy Type:  ', device.DeviceEnergyType !== undefined ? String(device.DeviceEnergyType) : 'N/A');
      console.log('Active Power: ', device.ActivePower !== undefined ? `${device.ActivePower.toFixed(2)} W` : 'N/A');
      console.log('Counter:      ', device.CounterReading !== undefined ? `${device.CounterReading} kWh` : 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

devicesCmd
  .command('find')
  .description('Find a device by serial number')
  .requiredOption('--serial <serial>', 'Device serial number')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const device = await withSpinner('Finding device...', () => getDeviceBySerial(options.serial));
      if (options.json) { printJson(device); return; }
      printSuccess(`Found device: ${device.Name || 'N/A'}`);
      console.log('ID:     ', device.Id);
      console.log('Serial: ', device.Serial);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// VALUES (live readings)
// ============================================================

const valuesCmd = program.command('values').description('Get device readings and measurements');

valuesCmd
  .command('get <device-id>')
  .description('Get current live values from a device')
  .option('--json', 'Output as JSON')
  .action(async (deviceId, options) => {
    requireAuth();
    try {
      const values = await withSpinner('Fetching device values...', () => getDeviceValues(deviceId));
      if (options.json) { printJson(values); return; }
      console.log(chalk.bold('\nDevice Values\n'));
      console.log('Device ID:     ', chalk.cyan(deviceId));
      console.log('Active Power:  ', values.ActivePower !== undefined ? chalk.green(`${values.ActivePower.toFixed(2)} W`) : 'N/A');
      console.log('Apparent Power:', values.ApparentPower !== undefined ? `${values.ApparentPower.toFixed(2)} VA` : 'N/A');
      console.log('Reactive Power:', values.ReactivePower !== undefined ? `${values.ReactivePower.toFixed(2)} VAR` : 'N/A');
      console.log('Voltage:       ', values.Voltage !== undefined ? `${values.Voltage.toFixed(2)} V` : 'N/A');
      console.log('Current:       ', values.Current !== undefined ? `${values.Current.toFixed(3)} A` : 'N/A');
      console.log('Power Factor:  ', values.PowerFactor !== undefined ? values.PowerFactor.toFixed(3) : 'N/A');
      console.log('Frequency:     ', values.Frequency !== undefined ? `${values.Frequency.toFixed(2)} Hz` : 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

valuesCmd
  .command('history <device-id>')
  .description('Get historical values for a device')
  .option('--date <date>', 'Date in ISO format (YYYY-MM-DDTHH:mm:ss)')
  .option('--json', 'Output as JSON')
  .action(async (deviceId, options) => {
    requireAuth();
    try {
      const values = await withSpinner('Fetching historical values...', () =>
        getDeviceValuesInPast(deviceId, { date: options.date })
      );
      if (options.json) { printJson(values); return; }
      const arr = Array.isArray(values) ? values : [values];
      printTable(arr, [
        { key: 'Date', label: 'Date', format: (v) => v ? new Date(v).toLocaleString() : 'N/A' },
        { key: 'ActivePower', label: 'Active Power (W)', format: (v) => v !== undefined ? v.toFixed(2) : 'N/A' },
        { key: 'CounterReading', label: 'Counter (kWh)', format: (v) => v !== undefined ? v.toFixed(3) : 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// METERS (energy consumption)
// ============================================================

const metersCmd = program.command('meters').description('Get meter readings and energy consumption');

metersCmd
  .command('values <device-id>')
  .description('Get meter values (energy consumption data)')
  .option('--json', 'Output as JSON')
  .action(async (deviceId, options) => {
    requireAuth();
    try {
      const values = await withSpinner('Fetching meter values...', () => getMeterValues(deviceId));
      if (options.json) { printJson(values); return; }
      console.log(chalk.bold('\nMeter Values\n'));
      console.log('Device ID:           ', chalk.cyan(deviceId));
      console.log('Counter Reading:     ', values.CounterReading !== undefined ? chalk.green(`${values.CounterReading.toFixed(3)} kWh`) : 'N/A');
      console.log('Counter Reading T1:  ', values.CounterReadingT1 !== undefined ? `${values.CounterReadingT1.toFixed(3)} kWh` : 'N/A');
      console.log('Counter Reading T2:  ', values.CounterReadingT2 !== undefined ? `${values.CounterReadingT2.toFixed(3)} kWh` : 'N/A');
      console.log('Counter Reading Export:', values.CounterReadingExport !== undefined ? `${values.CounterReadingExport.toFixed(3)} kWh` : 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

metersCmd
  .command('counters <device-id>')
  .description('Get counter values for a device')
  .option('--json', 'Output as JSON')
  .action(async (deviceId, options) => {
    requireAuth();
    try {
      const values = await withSpinner('Fetching counter values...', () => getCounterValues(deviceId));
      if (options.json) { printJson(values); return; }
      console.log(chalk.bold('\nCounter Values\n'));
      console.log('Device ID: ', chalk.cyan(deviceId));
      if (Array.isArray(values)) {
        const arr = values;
        printTable(arr, [
          { key: 'Obis', label: 'OBIS Code', format: (v) => v || 'N/A' },
          { key: 'Value', label: 'Value', format: (v) => v !== undefined ? String(v) : 'N/A' },
          { key: 'Unit', label: 'Unit', format: (v) => v || 'N/A' }
        ]);
      } else {
        printJson(values);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// USERS
// ============================================================

const usersCmd = program.command('users').description('Manage users');

usersCmd
  .command('me')
  .description('Get current user info')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const user = await withSpinner('Fetching user info...', () => getUser());
      if (options.json) { printJson(user); return; }
      console.log(chalk.bold('\nCurrent User\n'));
      console.log('ID:       ', chalk.cyan(user.Id || user.id || 'N/A'));
      console.log('Username: ', user.Username || user.username || 'N/A');
      console.log('Email:    ', user.EMail || user.email || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

usersCmd
  .command('list')
  .description('List all users')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const users = await withSpinner('Fetching users...', () => listUsers());
      if (options.json) { printJson(users); return; }
      const arr = Array.isArray(users) ? users : [users];
      printTable(arr, [
        { key: 'Id', label: 'ID', format: (v) => v ? String(v).substring(0, 16) : 'N/A' },
        { key: 'Username', label: 'Username', format: (v) => v || 'N/A' },
        { key: 'EMail', label: 'Email', format: (v) => v || 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
