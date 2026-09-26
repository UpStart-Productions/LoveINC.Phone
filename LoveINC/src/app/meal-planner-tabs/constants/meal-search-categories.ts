export interface MealSearchCategory {
  id: string;
  label: string;
  lucideIcon: string;
  iconBackgroundColor: string;
  search: {
    type?: string;
    query?: string;
    diet?: string;
  };
}

export const MEAL_SEARCH_CATEGORIES: MealSearchCategory[] = [
  {
    id: 'main-course',
    label: 'Main course',
    lucideIcon: 'utensils-crossed',
    iconBackgroundColor: '#d56132',
    search: { type: 'main course' },
  },
  {
    id: 'soup',
    label: 'Soup',
    lucideIcon: 'soup',
    iconBackgroundColor: '#349394',
    search: { type: 'soup' },
  },
  {
    id: 'salad',
    label: 'Salad',
    lucideIcon: 'salad',
    iconBackgroundColor: '#1e9e5a',
    search: { type: 'salad' },
  },
  {
    id: 'breakfast',
    label: 'Breakfast',
    lucideIcon: 'egg-fried',
    iconBackgroundColor: '#eaa535',
    search: { type: 'breakfast' },
  },
  {
    id: 'appetizer',
    label: 'Appetizer',
    lucideIcon: 'shrimp',
    iconBackgroundColor: '#214491',
    search: { type: 'snack' },
  },
  {
    id: 'side-dish',
    label: 'Side dish',
    lucideIcon: 'carrot',
    iconBackgroundColor: '#5433c6',
    search: { type: 'side dish' },
  },
  {
    id: 'pasta',
    label: 'Pasta',
    lucideIcon: 'wheat',
    iconBackgroundColor: '#8b7355',
    search: { query: 'pasta' },
  },
  {
    id: 'dessert',
    label: 'Dessert',
    lucideIcon: 'cake-slice',
    iconBackgroundColor: '#fe4c40',
    search: { type: 'dessert' },
  },
  {
    id: 'fish',
    label: 'Fish',
    lucideIcon: 'fish',
    iconBackgroundColor: '#2c5f7d',
    search: { query: 'fish' },
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    lucideIcon: 'leaf',
    iconBackgroundColor: '#3d8b40',
    search: { diet: 'vegetarian' },
  },
  {
    id: 'poultry',
    label: 'Poultry',
    lucideIcon: 'bird',
    iconBackgroundColor: '#c47f17',
    search: { query: 'chicken' },
  },
  {
    id: 'beef',
    label: 'Beef',
    lucideIcon: 'beef',
    iconBackgroundColor: '#8b3a3a',
    search: { query: 'beef' },
  },
];
