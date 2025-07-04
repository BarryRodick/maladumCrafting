// Storage helpers for settings, etc.
import { loadState, saveState } from './localStorageUtil.js';

const SETTINGS_KEY = 'maladum_settings';
const DEFAULT_SETTINGS = {
  darkMode: true, // Default to dark mode as per new design
  // Add other default settings as needed
};

export function loadSettings() {
  // Provide default settings if nothing is stored or loading fails
  return loadState(SETTINGS_KEY, DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  saveState(SETTINGS_KEY, settings);
}
