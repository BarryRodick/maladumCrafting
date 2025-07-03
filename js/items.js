// Loads items.json and provides utility functions
export async function loadItems() {
  const res = await fetch('items.json');
  return res.json();
}
