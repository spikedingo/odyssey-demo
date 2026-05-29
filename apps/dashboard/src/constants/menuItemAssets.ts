import type { ImageSourcePropType } from 'react-native';

/** Bundled menu images keyed by seed dish name. */
export const MENU_ITEM_ASSETS: Record<string, ImageSourcePropType> = {
  Edamame: require('../../assets/menu/edamame.jpg'),
  Gyoza: require('../../assets/menu/gyoza.jpg'),
  'Miso Soup': require('../../assets/menu/miso-soup.jpg'),
  'Seaweed Salad': require('../../assets/menu/seaweed-salad.jpg'),
  'Salmon Teriyaki': require('../../assets/menu/salmon-teriyaki.jpg'),
  'Chicken Katsu': require('../../assets/menu/chicken-katsu.jpg'),
  'Beef Ramen': require('../../assets/menu/beef-ramen.jpg'),
  'Vegetable Curry': require('../../assets/menu/vegetable-curry.jpg'),
  'Green Tea': require('../../assets/menu/green-tea.jpg'),
  'Sake Flight': require('../../assets/menu/sake-flight.jpg'),
  'Yuzu Soda': require('../../assets/menu/yuzu-soda.jpg'),
  'Matcha Latte': require('../../assets/menu/matcha-latte.jpg'),
};

export const MENU_ITEM_FALLBACK = MENU_ITEM_ASSETS.Edamame!;

export function getMenuItemAsset(name: string): ImageSourcePropType | undefined {
  return MENU_ITEM_ASSETS[name];
}
