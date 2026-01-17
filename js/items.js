// Loads items.json and provides utility functions
export async function loadItems() {
  try {
    const res = await fetch('items.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('Failed to load items:', err);
    return []; // Return empty array as fallback
  }
}
