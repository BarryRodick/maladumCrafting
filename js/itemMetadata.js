const EMPTY_ITEM_METADATA = {
  glossary: {},
  items: {}
};

export async function loadItemMetadata() {
  try {
    const res = await fetch('item-metadata.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('Failed to load item metadata:', err);
    return EMPTY_ITEM_METADATA;
  }
}
