// Dark mode and theming
export function setupTheme() {
  const settings = JSON.parse(localStorage.getItem('maladum_settings') || '{}');
  if (settings.darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
