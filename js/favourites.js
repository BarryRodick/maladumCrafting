// Favourites management
const FAV_KEY = 'maladum_favourites';

export function loadFavourites() {
  return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
}

export function saveFavourites(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

export function toggleFavourite(itemName) {
  let favs = loadFavourites();
  if (favs.includes(itemName)) {
    favs = favs.filter(f => f !== itemName);
  } else {
    favs.push(itemName);
  }
  saveFavourites(favs);
  return favs;
}
