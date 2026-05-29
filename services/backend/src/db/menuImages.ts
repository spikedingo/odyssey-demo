/** Local asset slugs served by the dashboard bundle (apps/dashboard/assets/menu/). */
export const MENU_ITEM_IMAGES: Record<string, string> = {
  Edamame: 'menu/edamame.jpg',
  Gyoza: 'menu/gyoza.jpg',
  'Miso Soup': 'menu/miso-soup.jpg',
  'Seaweed Salad': 'menu/seaweed-salad.jpg',
  'Salmon Teriyaki': 'menu/salmon-teriyaki.jpg',
  'Chicken Katsu': 'menu/chicken-katsu.jpg',
  'Beef Ramen': 'menu/beef-ramen.jpg',
  'Vegetable Curry': 'menu/vegetable-curry.jpg',
  'Green Tea': 'menu/green-tea.jpg',
  'Sake Flight': 'menu/sake-flight.jpg',
  'Yuzu Soda': 'menu/yuzu-soda.jpg',
  'Matcha Latte': 'menu/matcha-latte.jpg',
};

export function getMenuImageUrl(name: string): string | undefined {
  return MENU_ITEM_IMAGES[name];
}
