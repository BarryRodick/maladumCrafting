// Loads materials.json and provides utility functions
export async function loadMaterials() {
  const res = await fetch('materials.json');
  return res.json();
}
