// Favourites management
import { loadState, saveState } from './localStorageUtil.js';

const FAVOURITES_KEY = 'maladum_favourites';
const DEFAULT_FAVOURITES = [];

export function loadFavourites() {
  return loadState(FAVOURITES_KEY, DEFAULT_FAVOURITES);
}

export function saveFavourites(favourites) {
  saveState(FAVOURITES_KEY, favourites);
}

export function toggleFavourite(itemName) {
  let favourites = loadFavourites(); // Uses new loadState with default []

  const itemIndex = favourites.indexOf(itemName);

  if (itemIndex > -1) {
    favourites.splice(itemIndex, 1); // Remove item
  } else {
    favourites.push(itemName); // Add item
  }

  saveFavourites(favourites);
  return favourites;
}

export function clearFavourites() {
  saveFavourites(DEFAULT_FAVOURITES);
  return DEFAULT_FAVOURITES;
}
