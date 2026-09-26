import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Platform } from '@ionic/angular';
import * as i0 from '@angular/core';

declare const MEAL_RECAP_REACTIONS: readonly [{
    readonly id: "meh";
    readonly emoji: "😐";
    readonly label: "Meh";
}, {
    readonly id: "good";
    readonly emoji: "👍";
    readonly label: "Good";
}, {
    readonly id: "fantastic";
    readonly emoji: "🤩";
    readonly label: "Fantastic!";
}];
type MealRecapThumb = 'up' | 'down';
declare const MEAL_RECAP_RATING_DIMENSIONS: readonly [{
    readonly key: "effort";
    readonly label: "Effort";
}, {
    readonly key: "time";
    readonly label: "Time";
}, {
    readonly key: "cost";
    readonly label: "Cost";
}];
type MealRecapRatingKey = (typeof MEAL_RECAP_RATING_DIMENSIONS)[number]['key'];
type MealRecapComplexity = 'easy' | 'ok' | 'hard';
declare const MEAL_RECAP_COMPLEXITY_VALUES: MealRecapComplexity[];
declare function complexityToIndex(value?: MealRecapComplexity): number;
declare function indexToComplexity(index: number): MealRecapComplexity;
declare function computeMealStarRating(input: {
    reactionEmoji?: string;
    effortRating?: MealRecapThumb;
    timeRating?: MealRecapThumb;
    costRating?: MealRecapThumb;
}): number | undefined;

interface MealPlannerProfile {
    householdSize: number;
    maxReadyMinutes: number;
    updatedAt: string;
}
interface RecipeIngredient {
    name: string;
    aisle: string;
    amount: number;
    unit: string;
    original: string;
}
type RecipeSource = 'spoonacular' | 'myplate';
interface RecipeExternalKey {
    recipeSource: RecipeSource;
    externalId: string;
}
interface RecipeNutritionFact {
    key: string;
    name: string;
    amount: number;
    unit?: string;
    indent?: number;
}
interface CachedRecipe {
    id?: number;
    recipeSource: RecipeSource;
    externalId: string;
    spoonacularId: number;
    title: string;
    imageUrl?: string;
    readyInMinutes?: number;
    caloriesPerServing?: number;
    nutrition?: RecipeNutritionFact[];
    servings: number;
    ingredients: RecipeIngredient[];
    instructions: string[];
    sourceUrl?: string;
    cachedAt: string;
}

interface MealRecap {
    reactionEmoji?: string;
    actualCookMinutes?: number;
    complexity?: MealRecapComplexity;
    effortRating?: MealRecapThumb;
    timeRating?: MealRecapThumb;
    costRating?: MealRecapThumb;
    notes?: string;
}
interface PlanMeal {
    id?: number;
    weeklyPlanId?: number;
    cachedRecipeId: number;
    slotIndex: number;
    recipe?: CachedRecipe;
    extraGuests: number;
    eventNote?: string;
    isCooked: boolean;
    cookTimeBucket?: string;
    reactionEmoji?: string;
    actualCookMinutes?: number;
    complexity?: MealRecapComplexity;
    effortRating?: MealRecapThumb;
    timeRating?: MealRecapThumb;
    costRating?: MealRecapThumb;
    starRating?: number;
    recapNotes?: string;
    cookedAt?: string;
}
interface WeeklyPlan {
    id?: number;
    weekStartDate: string;
    weekServingDelta: number;
    mealsPerWeek: number;
    weekNote?: string;
    meals: PlanMeal[];
    createdAt: string;
    updatedAt: string;
}
interface GroceryItem {
    id?: number;
    weeklyPlanId: number;
    aisle: string;
    ingredientName: string;
    amountText: string;
    isChecked: boolean;
    isManual: boolean;
    sortOrder: number;
}
interface WeeklySummary {
    weekStartDate: string;
    mealsPlanned: number;
    averageReadyMinutes?: number;
}
/** @deprecated Use app-layer RecipeSearchResult. Kept for backward compatibility. */
interface SpoonacularSearchResult {
    id: number;
    title: string;
    image?: string;
    readyInMinutes?: number;
}

declare const MEALS_PER_WEEK = 3;

declare function getSundayForDate(d: Date): Date;
declare function getCurrentWeekStart(): string;
declare function formatWeekLabel(weekStartDate: string): string;

interface IngredientLineDisplay {
    whole?: string;
    fraction?: string;
    remainder: string;
}
declare function getTargetServings(householdSize: number, weekServingDelta: number, extraGuests: number): number;
declare function getRecipeScaleFactor(recipeServings: number, targetServings: number): number;
/** Grocery list amount text (amount + unit, or original when unscaled). */
declare function formatScaledIngredientAmount(ingredient: RecipeIngredient, scale: number): string;
/** Full ingredient line for recipe detail — scales the leading quantity, keeps Spoonacular wording. */
declare function formatScaledIngredientLine(ingredient: RecipeIngredient, scale: number): string;
/** Split a quantity-led ingredient line so UI can style the fraction smaller. */
declare function parseIngredientLineForDisplay(line: string): IngredientLineDisplay;

/** Store walk order for normalized grocery sections. */
declare const GROCERY_AISLE_ORDER: readonly ["Produce", "Meat & Seafood", "Dairy & Eggs", "Bakery & Bread", "Frozen", "Canned & Jarred", "Pasta, Rice & Grains", "Baking", "Oils & Vinegars", "Spices & Seasonings", "Condiments & Sauces", "Snacks", "Beverages", "International & Ethnic", "Pantry", "Other"];
/**
 * Map Spoonacular aisle + ingredient name to a consistent in-store section.
 * Pure string rules — no network or AI.
 */
declare function normalizeGroceryAisle(spoonacularAisle: string | undefined, ingredientName: string, ingredientOriginal?: string): string;
declare function compareGroceryAisles(a: string, b: string): number;

declare class MealPlannerDatabaseService {
    private platformService;
    private sqlite;
    private db;
    private platform;
    private static sharedDb;
    private static initPromise;
    private readonly DB_NAME;
    constructor(platformService: Platform);
    initializePlugin(): Promise<boolean>;
    reconcileConnectionsOnResume(): Promise<void>;
    openDatabase(): Promise<void>;
    private performOpenDatabase;
    private createTables;
    private migrateTables;
    private addColumnIfMissing;
    resetConnection(): void;
    getDbConnection(): Promise<SQLiteDBConnection>;
    private ensureDbOpen;
    wipeAll(): Promise<void>;
    static ɵfac: i0.ɵɵFactoryDeclaration<MealPlannerDatabaseService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MealPlannerDatabaseService>;
}

declare class MealPlannerProfileService {
    private dbService;
    constructor(dbService: MealPlannerDatabaseService);
    getProfile(): Promise<MealPlannerProfile | null>;
    saveProfile(profile: Pick<MealPlannerProfile, 'householdSize' | 'maxReadyMinutes'>): Promise<MealPlannerProfile>;
    static ɵfac: i0.ɵɵFactoryDeclaration<MealPlannerProfileService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MealPlannerProfileService>;
}

declare class MealPlannerRecipeService {
    private dbService;
    constructor(dbService: MealPlannerDatabaseService);
    myplateSpoonacularPlaceholder(slug: string): number;
    getCachedRecipeCount(): Promise<number>;
    getCachedRecipeById(id: number): Promise<CachedRecipe | null>;
    getCachedRecipeBySpoonacularId(spoonacularId: number): Promise<CachedRecipe | null>;
    getCachedRecipeByExternalKey(recipeSource: RecipeSource, externalId: string): Promise<CachedRecipe | null>;
    getReadyMinutesBySpoonacularIds(spoonacularIds: readonly number[]): Promise<Map<number, number>>;
    getReadyMinutesByRecipeKeys(keys: readonly RecipeExternalKey[]): Promise<Map<string, number>>;
    upsertCachedRecipe(recipe: Omit<CachedRecipe, 'id' | 'cachedAt'> & {
        cachedAt?: string;
    }): Promise<CachedRecipe>;
    listRecommendations(limit?: number): Promise<CachedRecipe[]>;
    listFavorites(): Promise<CachedRecipe[]>;
    isFavorite(cachedRecipeId: number): Promise<boolean>;
    setFavorite(cachedRecipeId: number, favorite: boolean): Promise<void>;
    recipeKeyToken(key: RecipeExternalKey): string;
    private mapRecipeRow;
    static ɵfac: i0.ɵɵFactoryDeclaration<MealPlannerRecipeService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MealPlannerRecipeService>;
}

declare class MealPlannerPlanService {
    private dbService;
    private profileService;
    private recipeService;
    private groceryRebuildPromises;
    constructor(dbService: MealPlannerDatabaseService, profileService: MealPlannerProfileService, recipeService: MealPlannerRecipeService);
    getEarliestWeekStart(): Promise<string | null>;
    getWeeklyPlansBetweenWeekStarts(fromWeekStart: string, toWeekStart: string): Promise<WeeklyPlan[]>;
    getWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan | null>;
    ensureWeeklyPlan(weekStartDate: string): Promise<WeeklyPlan>;
    updateWeekSettings(weekStartDate: string, settings: {
        weekServingDelta: number;
        mealsPerWeek: number;
        weekNote?: string;
    }): Promise<WeeklyPlan>;
    setMealForSlot(weekStartDate: string, slotIndex: number, cachedRecipeId: number): Promise<WeeklyPlan>;
    clearMealForSlot(weekStartDate: string, slotIndex: number): Promise<WeeklyPlan>;
    saveMealRecap(planMealId: number, recap: MealRecap): Promise<void>;
    getLatestStarRatingsForRecipes(options: {
        cachedRecipeIds?: readonly number[];
        spoonacularIds?: readonly number[];
        recipeKeys?: readonly {
            recipeSource: string;
            externalId: string;
        }[];
    }): Promise<{
        byCachedRecipeId: Map<number, number>;
        bySpoonacularId: Map<number, number>;
        byRecipeKey: Map<string, number>;
    }>;
    updateMealGuests(planMealId: number, extraGuests: number, eventNote?: string): Promise<void>;
    refreshGroceryList(weekStartDate: string): Promise<void>;
    getGroceryItems(weekStartDate: string): Promise<GroceryItem[]>;
    private awaitGroceryRebuild;
    private queryGroceryItems;
    private mapGroceryItemRow;
    addGroceryItem(weekStartDate: string, ingredientName: string): Promise<GroceryItem>;
    removeGroceryItem(itemId: number): Promise<void>;
    private groceryListNeedsRebuild;
    setGroceryItemChecked(itemId: number, checked: boolean): Promise<void>;
    getWeeklySummary(weekStartDate: string): Promise<WeeklySummary>;
    getCurrentWeekPlan(): Promise<WeeklyPlan | null>;
    private rebuildGroceryList;
    private performRebuildGroceryList;
    private mergeRecipeIngredientsIntoGroceryMap;
    private mergeMealIngredientsIntoGroceryMap;
    private buildGroceryIngredientKey;
    private titleCase;
    private normalizeMealsPerWeek;
    static ɵfac: i0.ɵɵFactoryDeclaration<MealPlannerPlanService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<MealPlannerPlanService>;
}

export { GROCERY_AISLE_ORDER, MEALS_PER_WEEK, MEAL_RECAP_COMPLEXITY_VALUES, MEAL_RECAP_RATING_DIMENSIONS, MEAL_RECAP_REACTIONS, MealPlannerDatabaseService, MealPlannerPlanService, MealPlannerProfileService, MealPlannerRecipeService, compareGroceryAisles, complexityToIndex, computeMealStarRating, formatScaledIngredientAmount, formatScaledIngredientLine, formatWeekLabel, getCurrentWeekStart, getRecipeScaleFactor, getSundayForDate, getTargetServings, indexToComplexity, normalizeGroceryAisle, parseIngredientLineForDisplay };
export type { CachedRecipe, GroceryItem, IngredientLineDisplay, MealPlannerProfile, MealRecap, MealRecapComplexity, MealRecapRatingKey, MealRecapThumb, PlanMeal, RecipeExternalKey, RecipeIngredient, RecipeNutritionFact, RecipeSource, SpoonacularSearchResult, WeeklyPlan, WeeklySummary };
