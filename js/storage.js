// Storage helpers for settings, etc.
const SETTINGS_KEY = 'maladum_settings';

export function loadSettings() {
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
