import axios from 'axios';
import { getConfig } from './config.js';

const BASE_URL = 'https://smart-me.com';

function getClient() {
  const username = getConfig('username');
  const password = getConfig('password');
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
}

function handleApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    if (status === 401) throw new Error('Authentication failed. Check your username and password.');
    if (status === 403) throw new Error('Access forbidden. Check your API permissions.');
    if (status === 404) throw new Error('Resource not found.');
    if (status === 429) throw new Error('Rate limit exceeded. Please wait before retrying.');
    const message = data?.message || data?.error || JSON.stringify(data);
    throw new Error(`API Error (${status}): ${message}`);
  } else if (error.request) {
    throw new Error('No response from smart-me API. Check your internet connection.');
  } else {
    throw error;
  }
}

// ============================================================
// DEVICES (meters)
// ============================================================

export async function listDevices() {
  const client = getClient();
  try {
    const response = await client.get('/api/Devices');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getDevice(deviceId) {
  const client = getClient();
  try {
    const response = await client.get(`/api/Devices/${deviceId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getDeviceBySerial(serial) {
  const client = getClient();
  try {
    const response = await client.get(`/api/DeviceBySerial`, { params: { serial } });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// DEVICE VALUES
// ============================================================

export async function getDeviceValues(deviceId) {
  const client = getClient();
  try {
    const response = await client.get(`/api/DeviceValues/${deviceId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getDeviceValuesInPast(deviceId, { date } = {}) {
  const client = getClient();
  try {
    const params = {};
    if (date) params.date = date;
    const response = await client.get(`/api/DeviceValuesInPast/${deviceId}`, { params });
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// METER VALUES (energy consumption)
// ============================================================

export async function getMeterValues(deviceId) {
  const client = getClient();
  try {
    const response = await client.get(`/api/MeterValues/${deviceId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function getCounterValues(deviceId) {
  const client = getClient();
  try {
    const response = await client.get(`/api/CounterValues/${deviceId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

// ============================================================
// USERS
// ============================================================

export async function getUser() {
  const client = getClient();
  try {
    const response = await client.get('/api/User');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}

export async function listUsers() {
  const client = getClient();
  try {
    const response = await client.get('/api/Users');
    return response.data;
  } catch (error) {
    handleApiError(error);
  }
}
