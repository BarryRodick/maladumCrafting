## 2025-07-03 - [Material Inventory A11y]
**Learning:** Icon-only buttons (like +/-) in a grid context are major accessibility traps; users lose track of which item they are modifying without explicit context.
**Action:** Always bind the item name into the aria-label (e.g., "Decrease [ItemName]") for repetitive list actions.
