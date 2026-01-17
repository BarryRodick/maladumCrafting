// Loads materials.json and provides utility functions
export async function loadMaterials() {
  try {
    const res = await fetch('materials.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('Failed to load materials:', err);
    return []; // Return empty array as fallback
  }
}
