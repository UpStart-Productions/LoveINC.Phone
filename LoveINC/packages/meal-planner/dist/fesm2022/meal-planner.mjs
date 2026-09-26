import { startOfDay, addDays, format } from 'date-fns';
import * as i0 from '@angular/core';
import { Injectable } from '@angular/core';
import { SQLiteConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import * as i1 from '@ionic/angular';

const MEALS_PER_WEEK = 3;

const MEAL_RECAP_REACTIONS = [
    { id: 'meh', emoji: '😐', label: 'Meh' },
    { id: 'good', emoji: '👍', label: 'Good' },
    { id: 'fantastic', emoji: '🤩', label: 'Fantastic!' },
];
const MEAL_RECAP_RATING_DIMENSIONS = [
    { key: 'effort', label: 'Effort' },
    { key: 'time', label: 'Time' },
    { key: 'cost', label: 'Cost' },
];
const MEAL_RECAP_COMPLEXITY_VALUES = ['easy', 'ok', 'hard'];
function complexityToIndex(value) {
    if (value === 'easy') {
        return 0;
    }
    if (value === 'hard') {
        return 2;
    }
    return 1;
}
function indexToComplexity(index) {
    if (index <= 0) {
        return 'easy';
    }
    if (index >= 2) {
        return 'hard';
    }
    return 'ok';
}
const REACTION_BASE_STARS = {
    meh: 2,
    good: 4,
    fantastic: 5,
};
function computeMealStarRating(input) {
    const reaction = MEAL_RECAP_REACTIONS.find((row) => row.emoji === input.reactionEmoji);
    if (!reaction) {
        return undefined;
    }
    let score = REACTION_BASE_STARS[reaction.id];
    for (const thumb of [input.effortRating, input.timeRating, input.costRating]) {
        if (thumb === 'up') {
            score += 0.25;
        }
        else if (thumb === 'down') {
            score -= 0.25;
        }
    }
    const clamped = Math.min(5, Math.max(1, score));
    return Math.round(clamped * 10) / 10;
}

function getSundayForDate(d) {
    const copy = startOfDay(d);
    const day = copy.getDay();
    return addDays(copy, -day);
}
function getCurrentWeekStart() {
    return format(getSundayForDate(new Date()), 'yyyy-MM-dd');
}
function formatWeekLabel(weekStartDate) {
    const sunday = new Date(`${weekStartDate}T00:00:00`);
    const saturday = addDays(sunday, 6);
    return `${format(sunday, 'MMM d')} – ${format(saturday, 'MMM d')}`;
}

function getTargetServings(householdSize, weekServingDelta, extraGuests) {
    return householdSize + weekServingDelta + extraGuests;
}
function getRecipeScaleFactor(recipeServings, targetServings) {
    if (recipeServings <= 0) {
        return 1;
    }
    return targetServings / recipeServings;
}
/** Leading quantity from a free-text ingredient line (MyPlate text, or Spoonacular original). */
function parseLeadingAmount(original) {
    const mixed = original.match(/^(\d+)\s+(\d+)\/(\d+)(?:\s|$)/);
    if (mixed) {
        return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    }
    const fraction = original.match(/^(\d+)\/(\d+)(?:\s|$)/);
    if (fraction) {
        return Number(fraction[1]) / Number(fraction[2]);
    }
    const decimal = original.match(/^(\d+(?:\.\d+)?)(?:\s|$)/);
    if (decimal) {
        return Number(decimal[1]);
    }
    return undefined;
}
function getIngredientBaseAmount(ingredient) {
    if (ingredient.amount > 0) {
        return ingredient.amount;
    }
    return parseLeadingAmount(ingredient.original) ?? 0;
}
function roundScaledAmount(value) {
    return Math.round(value * 100) / 100;
}
const COMMON_FRACTIONS = [
    [1 / 8, '1/8'],
    [1 / 4, '1/4'],
    [1 / 3, '1/3'],
    [3 / 8, '3/8'],
    [1 / 2, '1/2'],
    [5 / 8, '5/8'],
    [2 / 3, '2/3'],
    [3 / 4, '3/4'],
    [7 / 8, '7/8'],
];
/** Grocery list amount text (amount + unit, or original when unscaled). */
function formatScaledIngredientAmount(ingredient, scale) {
    if (scale === 1) {
        return ingredient.original;
    }
    const baseAmount = getIngredientBaseAmount(ingredient);
    if (!baseAmount) {
        return ingredient.original;
    }
    if (ingredient.unit) {
        const scaledText = formatScaledAmountForDisplay(roundScaledAmount(baseAmount * scale));
        return `${scaledText} ${ingredient.unit}`.trim();
    }
    return formatScaledIngredientLine(ingredient, scale);
}
/** Full ingredient line for recipe detail — scales the leading quantity, keeps Spoonacular wording. */
function formatScaledIngredientLine(ingredient, scale) {
    if (scale === 1) {
        return ingredient.original;
    }
    const baseAmount = getIngredientBaseAmount(ingredient);
    if (!baseAmount) {
        return ingredient.original;
    }
    const scaledText = formatScaledAmountForDisplay(roundScaledAmount(baseAmount * scale));
    const leadingQuantity = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)\s*/;
    const match = ingredient.original.match(leadingQuantity);
    if (!match) {
        return ingredient.original;
    }
    const rest = ingredient.original.slice(match[0].length).trimStart();
    return rest ? `${scaledText} ${rest}` : scaledText;
}
function formatScaledAmountForDisplay(value) {
    const rounded = roundScaledAmount(value);
    if (rounded <= 0) {
        return '0';
    }
    let whole = Math.floor(rounded + 1e-9);
    let frac = roundScaledAmount(rounded - whole);
    if (frac >= 1 - 1e-9) {
        whole += 1;
        frac = 0;
    }
    if (frac < 0.01) {
        return String(whole);
    }
    let closest = COMMON_FRACTIONS[0];
    let closestDiff = Math.abs(frac - closest[0]);
    for (const entry of COMMON_FRACTIONS) {
        const diff = Math.abs(frac - entry[0]);
        if (diff < closestDiff) {
            closestDiff = diff;
            closest = entry;
        }
    }
    const fractionText = closest[1];
    return whole > 0 ? `${whole} ${fractionText}` : fractionText;
}
/** Split a quantity-led ingredient line so UI can style the fraction smaller. */
function parseIngredientLineForDisplay(line) {
    const mixed = line.match(/^(\d+)\s+(\d+\/\d+)\s+(.*)$/);
    if (mixed) {
        return normalizeIngredientLineDisplay({
            whole: mixed[1],
            fraction: mixed[2],
            remainder: mixed[3],
        });
    }
    const mixedGlued = line.match(/^(\d+)\s+(\d+\/\d+)([^\s].*)$/);
    if (mixedGlued) {
        return normalizeIngredientLineDisplay({
            whole: mixedGlued[1],
            fraction: mixedGlued[2],
            remainder: mixedGlued[3],
        });
    }
    const fractionLeading = line.match(/^(\d+\/\d+)\s+(.*)$/);
    if (fractionLeading) {
        return normalizeIngredientLineDisplay({
            fraction: fractionLeading[1],
            remainder: fractionLeading[2],
        });
    }
    const fractionGlued = line.match(/^(\d+\/\d+)([^\s].*)$/);
    if (fractionGlued) {
        return normalizeIngredientLineDisplay({
            fraction: fractionGlued[1],
            remainder: fractionGlued[2],
        });
    }
    const wholeLeading = line.match(/^(\d+)\s+(.*)$/);
    if (wholeLeading) {
        return normalizeIngredientLineDisplay({
            whole: wholeLeading[1],
            remainder: wholeLeading[2],
        });
    }
    const wholeGlued = line.match(/^(\d+)([^\s\d/].*)$/);
    if (wholeGlued) {
        return normalizeIngredientLineDisplay({
            whole: wholeGlued[1],
            remainder: wholeGlued[2],
        });
    }
    return { remainder: line };
}
function normalizeIngredientLineDisplay(parts) {
    if (!parts.whole && !parts.fraction) {
        return parts;
    }
    return {
        ...parts,
        remainder: parts.remainder.trimStart(),
    };
}

/** Store walk order for normalized grocery sections. */
const GROCERY_AISLE_ORDER = [
    'Produce',
    'Meat & Seafood',
    'Dairy & Eggs',
    'Bakery & Bread',
    'Frozen',
    'Canned & Jarred',
    'Pasta, Rice & Grains',
    'Baking',
    'Oils & Vinegars',
    'Spices & Seasonings',
    'Condiments & Sauces',
    'Snacks',
    'Beverages',
    'International & Ethnic',
    'Pantry',
    'Other',
];
const NAME_AISLE_RULES = [
    { pattern: /\b(oils?|vinegars?|vinaigrettes?|salad dressings?|dressings?)\b/i, aisle: 'Oils & Vinegars' },
    { pattern: /\b(soy sauce|fish sauce|oyster sauce|hoisin|sriracha|ketchup|mustard|mayonnaise|mayo)\b/i, aisle: 'Condiments & Sauces' },
    { pattern: /\b(chicken|beef|pork|lamb|turkey|sausage|bacon|steak|ground meat)\b/i, aisle: 'Meat & Seafood' },
    { pattern: /\b(shrimp|salmon|tuna|cod|fish|seafood|scallops?|crab|lobster)\b/i, aisle: 'Meat & Seafood' },
];
const SPOONACULAR_AISLE_RULES = [
    { pattern: /produce/i, aisle: 'Produce' },
    { pattern: /meat|seafood|poultry/i, aisle: 'Meat & Seafood' },
    { pattern: /milk|dairy|egg|cheese/i, aisle: 'Dairy & Eggs' },
    { pattern: /bakery|bread/i, aisle: 'Bakery & Bread' },
    { pattern: /frozen/i, aisle: 'Frozen' },
    { pattern: /canned|jarred/i, aisle: 'Canned & Jarred' },
    { pattern: /pasta|rice|grain/i, aisle: 'Pasta, Rice & Grains' },
    { pattern: /baking/i, aisle: 'Baking' },
    { pattern: /oil|vinegar|dressing/i, aisle: 'Oils & Vinegars' },
    { pattern: /spice|seasoning/i, aisle: 'Spices & Seasonings' },
    { pattern: /condiment|sauce/i, aisle: 'Condiments & Sauces' },
    { pattern: /snack/i, aisle: 'Snacks' },
    { pattern: /beverage|coffee|tea|drink/i, aisle: 'Beverages' },
    { pattern: /ethnic|international/i, aisle: 'International & Ethnic' },
    { pattern: /nut butter|jam|honey|gourmet|health food|pantry|cereal/i, aisle: 'Pantry' },
];
function normalizeLookupKey(value) {
    return value.trim().toLowerCase();
}
function matchAisleRules(rules, value) {
    for (const rule of rules) {
        if (rule.pattern.test(value)) {
            return rule.aisle;
        }
    }
    return undefined;
}
/**
 * Map Spoonacular aisle + ingredient name to a consistent in-store section.
 * Pure string rules — no network or AI.
 */
function normalizeGroceryAisle(spoonacularAisle, ingredientName, ingredientOriginal) {
    for (const candidate of [ingredientName, ingredientOriginal]) {
        const text = candidate?.trim();
        if (!text) {
            continue;
        }
        const fromName = matchAisleRules(NAME_AISLE_RULES, text);
        if (fromName) {
            return fromName;
        }
    }
    const aisle = normalizeLookupKey(spoonacularAisle ?? '');
    if (!aisle) {
        return 'Other';
    }
    const fromAisle = matchAisleRules(SPOONACULAR_AISLE_RULES, aisle);
    if (fromAisle) {
        return fromAisle;
    }
    return 'Pantry';
}
function compareGroceryAisles(a, b) {
    const order = GROCERY_AISLE_ORDER;
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    const aRank = aIndex === -1 ? order.length : aIndex;
    const bRank = bIndex === -1 ? order.length : bIndex;
    if (aRank !== bRank) {
        return aRank - bRank;
    }
    return a.localeCompare(b);
}

class MealPlannerDatabaseService {
    platformService;
    sqlite;
    db = null;
    platform = '';
    static sharedDb = null;
    static initPromise = null;
    DB_NAME = 'meal_planner';
    constructor(platformService) {
        this.platformService = platformService;
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }
    async initializePlugin() {
        if (this.platformService.is('ios') || this.platformService.is('android')) {
            this.platform = 'native';
        }
        else {
            this.platform = 'web';
        }
        try {
            await CapacitorSQLite.isSecretStored();
        }
        catch {
            // Plugin may not be ready on web before jeep-sqlite init
        }
        if (Capacitor.isNativePlatform()) {
            try {
                const { result } = await this.sqlite.checkConnectionsConsistency();
                if (result === false) {
                    this.resetConnection();
                    MealPlannerDatabaseService.initPromise = null;
                }
            }
            catch {
                this.resetConnection();
                MealPlannerDatabaseService.initPromise = null;
            }
        }
        return true;
    }
    async reconcileConnectionsOnResume() {
        if (!Capacitor.isNativePlatform()) {
            return;
        }
        try {
            const { result } = await this.sqlite.checkConnectionsConsistency();
            if (result !== false) {
                return;
            }
        }
        catch {
            // Fall through to reset stale handles.
        }
        this.resetConnection();
        MealPlannerDatabaseService.initPromise = null;
        await this.getDbConnection().catch(() => { });
    }
    async openDatabase() {
        if (MealPlannerDatabaseService.sharedDb) {
            this.db = MealPlannerDatabaseService.sharedDb;
            return;
        }
        if (!MealPlannerDatabaseService.initPromise) {
            MealPlannerDatabaseService.initPromise = this.performOpenDatabase();
        }
        await MealPlannerDatabaseService.initPromise;
        if (MealPlannerDatabaseService.sharedDb) {
            this.db = MealPlannerDatabaseService.sharedDb;
        }
    }
    async performOpenDatabase() {
        try {
            try {
                this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
                if (typeof this.db.isDBOpen === 'function') {
                    const isOpen = await this.db.isDBOpen();
                    if (!isOpen)
                        await this.db.open();
                }
                MealPlannerDatabaseService.sharedDb = this.db;
                await this.createTables();
                return;
            }
            catch {
                this.db = null;
            }
            if (this.platform === 'web') {
                await this.sqlite.saveToStore(this.DB_NAME);
            }
            try {
                this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);
            }
            catch (error) {
                const msg = error?.message ?? '';
                if (msg.includes('Connection') && msg.includes('already exists')) {
                    this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
                }
                else {
                    throw error;
                }
            }
            await this.db.open();
            MealPlannerDatabaseService.sharedDb = this.db;
            await this.createTables();
        }
        catch (err) {
            this.resetConnection();
            MealPlannerDatabaseService.initPromise = null;
            throw err;
        }
        finally {
            MealPlannerDatabaseService.initPromise = null;
        }
    }
    async createTables() {
        const db = await this.getDbConnection();
        await db.execute(`
      CREATE TABLE IF NOT EXISTS meal_planner_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        household_size INTEGER NOT NULL DEFAULT 2,
        max_ready_minutes INTEGER NOT NULL DEFAULT 45,
        updated_at TEXT NOT NULL
      );
    `);
        await db.execute(`
      CREATE TABLE IF NOT EXISTS cached_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        spoonacular_id INTEGER NOT NULL UNIQUE,
        title TEXT NOT NULL,
        image_url TEXT,
        ready_in_minutes INTEGER,
        servings INTEGER NOT NULL DEFAULT 4,
        ingredients_json TEXT NOT NULL,
        instructions_json TEXT NOT NULL,
        source_url TEXT,
        cached_at TEXT NOT NULL
      );
    `);
        await db.execute(`
      CREATE TABLE IF NOT EXISTS favorite_recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cached_recipe_id INTEGER NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        FOREIGN KEY (cached_recipe_id) REFERENCES cached_recipes(id) ON DELETE CASCADE
      );
    `);
        await db.execute(`
      CREATE TABLE IF NOT EXISTS weekly_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start_date TEXT NOT NULL UNIQUE,
        week_serving_delta INTEGER NOT NULL DEFAULT 0,
        week_note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
        await db.execute(`
      CREATE TABLE IF NOT EXISTS plan_meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekly_plan_id INTEGER NOT NULL,
        cached_recipe_id INTEGER NOT NULL,
        slot_index INTEGER NOT NULL,
        extra_guests INTEGER NOT NULL DEFAULT 0,
        event_note TEXT,
        is_cooked INTEGER NOT NULL DEFAULT 0,
        cook_time_bucket TEXT,
        reaction_emoji TEXT,
        cooked_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (cached_recipe_id) REFERENCES cached_recipes(id),
        UNIQUE(weekly_plan_id, slot_index)
      );
    `);
        await db.execute(`
      CREATE TABLE IF NOT EXISTS grocery_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekly_plan_id INTEGER NOT NULL,
        aisle TEXT NOT NULL,
        ingredient_name TEXT NOT NULL,
        amount_text TEXT NOT NULL,
        is_checked INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE
      );
    `);
        await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_plan_meals_week
      ON plan_meals(weekly_plan_id);
    `);
        await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_grocery_items_week
      ON grocery_items(weekly_plan_id);
    `);
        await this.migrateTables(db);
    }
    async migrateTables(db) {
        await this.addColumnIfMissing(db, 'plan_meals', 'actual_cook_minutes', 'INTEGER');
        await this.addColumnIfMissing(db, 'plan_meals', 'complexity', 'TEXT');
        await this.addColumnIfMissing(db, 'plan_meals', 'recap_notes', 'TEXT');
        await this.addColumnIfMissing(db, 'plan_meals', 'recap_effort', 'TEXT');
        await this.addColumnIfMissing(db, 'plan_meals', 'recap_time', 'TEXT');
        await this.addColumnIfMissing(db, 'plan_meals', 'recap_cost', 'TEXT');
        await this.addColumnIfMissing(db, 'plan_meals', 'star_rating', 'REAL');
        await this.addColumnIfMissing(db, 'weekly_plans', 'meals_per_week', 'INTEGER NOT NULL DEFAULT 3');
        await this.addColumnIfMissing(db, 'grocery_items', 'is_manual', 'INTEGER DEFAULT 0');
        await this.addColumnIfMissing(db, 'grocery_items', 'image_url', 'TEXT');
        await this.addColumnIfMissing(db, 'cached_recipes', 'recipe_source', "TEXT NOT NULL DEFAULT 'spoonacular'");
        await this.addColumnIfMissing(db, 'cached_recipes', 'external_id', 'TEXT');
        await db.run(`UPDATE cached_recipes
       SET external_id = CAST(spoonacular_id AS TEXT)
       WHERE external_id IS NULL OR external_id = ''`);
        await this.addColumnIfMissing(db, 'cached_recipes', 'nutrition_json', 'TEXT');
        await this.addColumnIfMissing(db, 'cached_recipes', 'calories_per_serving', 'INTEGER');
        await db.run(`UPDATE cached_recipes
       SET ready_in_minutes = NULL
       WHERE recipe_source = 'myplate'`);
        await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_cached_recipes_source_external
      ON cached_recipes(recipe_source, external_id);
    `);
        await db.execute(`
      CREATE TABLE IF NOT EXISTS grocery_item_exclusions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekly_plan_id INTEGER NOT NULL,
        ingredient_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (weekly_plan_id) REFERENCES weekly_plans(id) ON DELETE CASCADE,
        UNIQUE(weekly_plan_id, ingredient_key)
      );
    `);
        await db.execute(`
      CREATE TABLE IF NOT EXISTS ingredient_images (
        name_key TEXT PRIMARY KEY,
        image_url TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );
    `);
    }
    async addColumnIfMissing(db, table, column, type) {
        const result = await db.query(`PRAGMA table_info(${table})`);
        const exists = (result.values ?? []).some((row) => String(row['name']) === column);
        if (!exists) {
            await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
        }
    }
    resetConnection() {
        this.db = null;
        MealPlannerDatabaseService.sharedDb = null;
    }
    async getDbConnection() {
        if (!this.db) {
            await this.initializePlugin();
            await this.openDatabase();
        }
        if (!this.db) {
            throw new Error('Failed to establish database connection');
        }
        try {
            await this.ensureDbOpen(this.db);
            return this.db;
        }
        catch {
            this.resetConnection();
            MealPlannerDatabaseService.initPromise = null;
            await this.openDatabase();
            if (!this.db) {
                throw new Error('Failed to establish database connection');
            }
            await this.ensureDbOpen(this.db);
            return this.db;
        }
    }
    async ensureDbOpen(db) {
        if (typeof db.isDBOpen !== 'function') {
            return;
        }
        const isOpen = await db.isDBOpen();
        if (!isOpen) {
            await db.open();
        }
    }
    async wipeAll() {
        const db = await this.getDbConnection();
        await db.execute('DELETE FROM grocery_item_exclusions');
        await db.execute('DELETE FROM grocery_items');
        await db.execute('DELETE FROM ingredient_images');
        await db.execute('DELETE FROM plan_meals');
        await db.execute('DELETE FROM weekly_plans');
        await db.execute('DELETE FROM favorite_recipes');
        await db.execute('DELETE FROM cached_recipes');
        await db.execute('DELETE FROM meal_planner_profile');
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerDatabaseService, deps: [{ token: i1.Platform }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerDatabaseService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerDatabaseService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: i1.Platform }] });

class MealPlannerProfileService {
    dbService;
    constructor(dbService) {
        this.dbService = dbService;
    }
    async getProfile() {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT * FROM meal_planner_profile WHERE id = 1');
        const row = result.values?.[0];
        if (!row) {
            return null;
        }
        return {
            householdSize: Number(row['household_size']),
            maxReadyMinutes: Number(row['max_ready_minutes']),
            updatedAt: String(row['updated_at']),
        };
    }
    async saveProfile(profile) {
        const db = await this.dbService.getDbConnection();
        const updatedAt = new Date().toISOString();
        const existing = await this.getProfile();
        if (existing) {
            await db.run('UPDATE meal_planner_profile SET household_size = ?, max_ready_minutes = ?, updated_at = ? WHERE id = 1', [profile.householdSize, profile.maxReadyMinutes, updatedAt]);
        }
        else {
            await db.run('INSERT INTO meal_planner_profile (id, household_size, max_ready_minutes, updated_at) VALUES (1, ?, ?, ?)', [profile.householdSize, profile.maxReadyMinutes, updatedAt]);
        }
        return {
            householdSize: profile.householdSize,
            maxReadyMinutes: profile.maxReadyMinutes,
            updatedAt,
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerProfileService, deps: [{ token: MealPlannerDatabaseService }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerProfileService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerProfileService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: MealPlannerDatabaseService }] });

class MealPlannerRecipeService {
    dbService;
    constructor(dbService) {
        this.dbService = dbService;
    }
    myplateSpoonacularPlaceholder(slug) {
        let hash = 2166136261;
        for (let i = 0; i < slug.length; i++) {
            hash ^= slug.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        hash |= 0;
        if (hash === 0) {
            return -1;
        }
        return hash > 0 ? -hash : hash;
    }
    async getCachedRecipeCount() {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT COUNT(*) AS count FROM cached_recipes');
        return Number(result.values?.[0]?.['count'] ?? 0);
    }
    async getCachedRecipeById(id) {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT * FROM cached_recipes WHERE id = ?', [id]);
        const row = result.values?.[0];
        return row ? this.mapRecipeRow(row) : null;
    }
    async getCachedRecipeBySpoonacularId(spoonacularId) {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT * FROM cached_recipes WHERE spoonacular_id = ?', [spoonacularId]);
        const row = result.values?.[0];
        return row ? this.mapRecipeRow(row) : null;
    }
    async getCachedRecipeByExternalKey(recipeSource, externalId) {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT * FROM cached_recipes WHERE recipe_source = ? AND external_id = ?', [recipeSource, externalId]);
        const row = result.values?.[0];
        return row ? this.mapRecipeRow(row) : null;
    }
    async getReadyMinutesBySpoonacularIds(spoonacularIds) {
        const ids = [...new Set(spoonacularIds.filter((id) => id > 0))];
        if (!ids.length) {
            return new Map();
        }
        const db = await this.dbService.getDbConnection();
        const placeholders = ids.map(() => '?').join(',');
        const result = await db.query(`SELECT spoonacular_id, ready_in_minutes FROM cached_recipes WHERE spoonacular_id IN (${placeholders})`, ids);
        const readyMinutesBySpoonacularId = new Map();
        for (const row of result.values ?? []) {
            if (row['ready_in_minutes'] == null) {
                continue;
            }
            readyMinutesBySpoonacularId.set(Number(row['spoonacular_id']), Number(row['ready_in_minutes']));
        }
        return readyMinutesBySpoonacularId;
    }
    async getReadyMinutesByRecipeKeys(keys) {
        const uniqueKeys = [...new Map(keys.map((key) => [this.recipeKeyToken(key), key])).values()];
        if (!uniqueKeys.length) {
            return new Map();
        }
        const db = await this.dbService.getDbConnection();
        const conditions = uniqueKeys.map(() => '(recipe_source = ? AND external_id = ?)').join(' OR ');
        const params = uniqueKeys.flatMap((key) => [key.recipeSource, key.externalId]);
        const result = await db.query(`SELECT recipe_source, external_id, ready_in_minutes
       FROM cached_recipes
       WHERE ${conditions}`, params);
        const readyMinutesByKey = new Map();
        for (const row of result.values ?? []) {
            if (row['ready_in_minutes'] == null) {
                continue;
            }
            const key = {
                recipeSource: String(row['recipe_source']),
                externalId: String(row['external_id']),
            };
            readyMinutesByKey.set(this.recipeKeyToken(key), Number(row['ready_in_minutes']));
        }
        return readyMinutesByKey;
    }
    async upsertCachedRecipe(recipe) {
        const db = await this.dbService.getDbConnection();
        const cachedAt = recipe.cachedAt ?? new Date().toISOString();
        const existing = await this.getCachedRecipeByExternalKey(recipe.recipeSource, recipe.externalId);
        const ingredientsJson = JSON.stringify(recipe.ingredients);
        const instructionsJson = JSON.stringify(recipe.instructions);
        const nutritionJson = recipe.nutrition?.length ? JSON.stringify(recipe.nutrition) : null;
        if (existing?.id) {
            await db.run(`UPDATE cached_recipes SET spoonacular_id = ?, title = ?, image_url = ?, ready_in_minutes = ?,
         calories_per_serving = ?, nutrition_json = ?, servings = ?,
         ingredients_json = ?, instructions_json = ?, source_url = ?, cached_at = ?
         WHERE id = ?`, [
                recipe.spoonacularId,
                recipe.title,
                recipe.imageUrl ?? null,
                recipe.readyInMinutes ?? null,
                recipe.caloriesPerServing ?? null,
                nutritionJson,
                recipe.servings,
                ingredientsJson,
                instructionsJson,
                recipe.sourceUrl ?? null,
                cachedAt,
                existing.id,
            ]);
            return { ...recipe, id: existing.id, cachedAt };
        }
        const insert = await db.run(`INSERT INTO cached_recipes
       (spoonacular_id, recipe_source, external_id, title, image_url, ready_in_minutes, calories_per_serving,
        nutrition_json, servings, ingredients_json, instructions_json, source_url, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            recipe.spoonacularId,
            recipe.recipeSource,
            recipe.externalId,
            recipe.title,
            recipe.imageUrl ?? null,
            recipe.readyInMinutes ?? null,
            recipe.caloriesPerServing ?? null,
            nutritionJson,
            recipe.servings,
            ingredientsJson,
            instructionsJson,
            recipe.sourceUrl ?? null,
            cachedAt,
        ]);
        return { ...recipe, id: insert.changes?.lastId, cachedAt };
    }
    async listRecommendations(limit = 12) {
        const db = await this.dbService.getDbConnection();
        const result = await db.query(`SELECT cr.* FROM cached_recipes cr
       LEFT JOIN favorite_recipes fr ON fr.cached_recipe_id = cr.id
       ORDER BY CASE WHEN fr.id IS NULL THEN 1 ELSE 0 END, cr.cached_at DESC
       LIMIT ?`, [limit]);
        return (result.values ?? []).map((row) => this.mapRecipeRow(row));
    }
    async listFavorites() {
        const db = await this.dbService.getDbConnection();
        const result = await db.query(`SELECT cr.* FROM favorite_recipes fr
       JOIN cached_recipes cr ON cr.id = fr.cached_recipe_id
       ORDER BY fr.created_at DESC`);
        return (result.values ?? []).map((row) => this.mapRecipeRow(row));
    }
    async isFavorite(cachedRecipeId) {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT id FROM favorite_recipes WHERE cached_recipe_id = ?', [cachedRecipeId]);
        return Boolean(result.values?.length);
    }
    async setFavorite(cachedRecipeId, favorite) {
        const db = await this.dbService.getDbConnection();
        if (favorite) {
            await db.run('INSERT OR IGNORE INTO favorite_recipes (cached_recipe_id, created_at) VALUES (?, ?)', [cachedRecipeId, new Date().toISOString()]);
            return;
        }
        await db.run('DELETE FROM favorite_recipes WHERE cached_recipe_id = ?', [cachedRecipeId]);
    }
    recipeKeyToken(key) {
        return `${key.recipeSource}:${key.externalId}`;
    }
    mapRecipeRow(row) {
        const recipeSource = (row.recipe_source ?? 'spoonacular');
        const externalId = row.external_id ? String(row.external_id) : String(row.spoonacular_id);
        return {
            id: Number(row.id),
            recipeSource,
            externalId,
            spoonacularId: Number(row.spoonacular_id),
            title: String(row.title),
            imageUrl: row.image_url ? String(row.image_url) : undefined,
            readyInMinutes: row.ready_in_minutes != null ? Number(row.ready_in_minutes) : undefined,
            caloriesPerServing: row.calories_per_serving != null ? Number(row.calories_per_serving) : undefined,
            nutrition: row.nutrition_json
                ? JSON.parse(String(row.nutrition_json))
                : undefined,
            servings: Number(row.servings),
            ingredients: JSON.parse(String(row.ingredients_json)),
            instructions: JSON.parse(String(row.instructions_json)),
            sourceUrl: row.source_url ? String(row.source_url) : undefined,
            cachedAt: String(row.cached_at),
        };
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerRecipeService, deps: [{ token: MealPlannerDatabaseService }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerRecipeService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerRecipeService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: MealPlannerDatabaseService }] });

class MealPlannerPlanService {
    dbService;
    profileService;
    recipeService;
    groceryRebuildPromises = new Map();
    constructor(dbService, profileService, recipeService) {
        this.dbService = dbService;
        this.profileService = profileService;
        this.recipeService = recipeService;
    }
    async getEarliestWeekStart() {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT week_start_date FROM weekly_plans ORDER BY week_start_date ASC LIMIT 1');
        const row = result.values?.[0];
        return row ? String(row['week_start_date']) : null;
    }
    async getWeeklyPlansBetweenWeekStarts(fromWeekStart, toWeekStart) {
        const db = await this.dbService.getDbConnection();
        const planResult = await db.query(`SELECT week_start_date FROM weekly_plans
       WHERE week_start_date >= ? AND week_start_date <= ?
       ORDER BY week_start_date ASC`, [fromWeekStart, toWeekStart]);
        const weekStarts = (planResult.values ?? []).map((row) => String(row['week_start_date']));
        const plans = [];
        for (const weekStart of weekStarts) {
            const plan = await this.getWeeklyPlan(weekStart);
            if (plan) {
                plans.push(plan);
            }
        }
        return plans;
    }
    async getWeeklyPlan(weekStartDate) {
        const db = await this.dbService.getDbConnection();
        const planResult = await db.query('SELECT * FROM weekly_plans WHERE week_start_date = ?', [
            weekStartDate,
        ]);
        const planRow = planResult.values?.[0];
        if (!planRow) {
            return null;
        }
        const mealsResult = await db.query('SELECT * FROM plan_meals WHERE weekly_plan_id = ? ORDER BY slot_index ASC', [planRow['id']]);
        const meals = [];
        for (const mealRow of mealsResult.values ?? []) {
            const recipe = await this.recipeService.getCachedRecipeById(Number(mealRow['cached_recipe_id']));
            const reactionEmoji = mealRow['reaction_emoji'] ? String(mealRow['reaction_emoji']) : undefined;
            const effortRating = mealRow['recap_effort']
                ? String(mealRow['recap_effort'])
                : undefined;
            const timeRating = mealRow['recap_time']
                ? String(mealRow['recap_time'])
                : undefined;
            const costRating = mealRow['recap_cost']
                ? String(mealRow['recap_cost'])
                : undefined;
            const storedStarRating = mealRow['star_rating'] != null ? Number(mealRow['star_rating']) : undefined;
            meals.push({
                id: Number(mealRow['id']),
                weeklyPlanId: Number(mealRow['weekly_plan_id']),
                cachedRecipeId: Number(mealRow['cached_recipe_id']),
                slotIndex: Number(mealRow['slot_index']),
                recipe: recipe ?? undefined,
                extraGuests: Number(mealRow['extra_guests']),
                eventNote: mealRow['event_note'] ? String(mealRow['event_note']) : undefined,
                isCooked: Boolean(mealRow['is_cooked']),
                cookTimeBucket: mealRow['cook_time_bucket'] ? String(mealRow['cook_time_bucket']) : undefined,
                reactionEmoji,
                actualCookMinutes: mealRow['actual_cook_minutes'] != null ? Number(mealRow['actual_cook_minutes']) : undefined,
                complexity: mealRow['complexity']
                    ? String(mealRow['complexity'])
                    : undefined,
                effortRating,
                timeRating,
                costRating,
                recapNotes: mealRow['recap_notes'] ? String(mealRow['recap_notes']) : undefined,
                starRating: storedStarRating ??
                    computeMealStarRating({ reactionEmoji, effortRating, timeRating, costRating }),
                cookedAt: mealRow['cooked_at'] ? String(mealRow['cooked_at']) : undefined,
            });
        }
        const mealsPerWeek = Number(planRow['meals_per_week']) || MEALS_PER_WEEK;
        return {
            id: Number(planRow['id']),
            weekStartDate: String(planRow['week_start_date']),
            weekServingDelta: Number(planRow['week_serving_delta']),
            mealsPerWeek,
            weekNote: planRow['week_note'] ? String(planRow['week_note']) : undefined,
            meals,
            createdAt: String(planRow['created_at']),
            updatedAt: String(planRow['updated_at']),
        };
    }
    async ensureWeeklyPlan(weekStartDate) {
        const existing = await this.getWeeklyPlan(weekStartDate);
        if (existing) {
            return existing;
        }
        const db = await this.dbService.getDbConnection();
        const now = new Date().toISOString();
        const insert = await db.run(`INSERT INTO weekly_plans (week_start_date, week_serving_delta, meals_per_week, week_note, created_at, updated_at)
       VALUES (?, 0, ?, NULL, ?, ?)`, [weekStartDate, MEALS_PER_WEEK, now, now]);
        return {
            id: insert.changes?.lastId,
            weekStartDate,
            weekServingDelta: 0,
            mealsPerWeek: MEALS_PER_WEEK,
            meals: [],
            createdAt: now,
            updatedAt: now,
        };
    }
    async updateWeekSettings(weekStartDate, settings) {
        const plan = await this.ensureWeeklyPlan(weekStartDate);
        const db = await this.dbService.getDbConnection();
        const updatedAt = new Date().toISOString();
        const mealsPerWeek = this.normalizeMealsPerWeek(settings.mealsPerWeek);
        await db.run(`UPDATE weekly_plans
       SET week_serving_delta = ?, meals_per_week = ?, week_note = ?, updated_at = ?
       WHERE id = ?`, [settings.weekServingDelta, mealsPerWeek, settings.weekNote ?? null, updatedAt, plan.id]);
        if (mealsPerWeek < plan.mealsPerWeek) {
            await db.run('DELETE FROM plan_meals WHERE weekly_plan_id = ? AND slot_index >= ?', [
                plan.id,
                mealsPerWeek,
            ]);
        }
        const refreshed = await this.getWeeklyPlan(weekStartDate);
        if (refreshed) {
            await this.rebuildGroceryList(refreshed);
            return refreshed;
        }
        throw new Error('Failed to update weekly plan');
    }
    async setMealForSlot(weekStartDate, slotIndex, cachedRecipeId) {
        const plan = await this.ensureWeeklyPlan(weekStartDate);
        if (slotIndex < 0 || slotIndex >= plan.mealsPerWeek) {
            throw new Error('Invalid meal slot');
        }
        const db = await this.dbService.getDbConnection();
        const now = new Date().toISOString();
        const existingMeal = plan.meals.find((m) => m.slotIndex === slotIndex);
        if (existingMeal?.id) {
            await db.run(`UPDATE plan_meals SET cached_recipe_id = ?, is_cooked = 0, cook_time_bucket = NULL,
         reaction_emoji = NULL, actual_cook_minutes = NULL, complexity = NULL,
         recap_notes = NULL, recap_effort = NULL, recap_time = NULL, recap_cost = NULL,
         star_rating = NULL, cooked_at = NULL WHERE id = ?`, [cachedRecipeId, existingMeal.id]);
        }
        else {
            await db.run(`INSERT INTO plan_meals
         (weekly_plan_id, cached_recipe_id, slot_index, extra_guests, is_cooked, created_at)
         VALUES (?, ?, ?, 0, 0, ?)`, [plan.id, cachedRecipeId, slotIndex, now]);
        }
        await db.run('UPDATE weekly_plans SET updated_at = ? WHERE id = ?', [now, plan.id]);
        const refreshed = await this.getWeeklyPlan(weekStartDate);
        if (!refreshed) {
            throw new Error('Failed to save meal');
        }
        await this.rebuildGroceryList(refreshed);
        return refreshed;
    }
    async clearMealForSlot(weekStartDate, slotIndex) {
        const plan = await this.getWeeklyPlan(weekStartDate);
        if (!plan?.id || slotIndex < 0 || slotIndex >= plan.mealsPerWeek) {
            throw new Error('Invalid meal slot');
        }
        const existingMeal = plan.meals.find((meal) => meal.slotIndex === slotIndex);
        if (!existingMeal?.id) {
            return plan;
        }
        const db = await this.dbService.getDbConnection();
        const now = new Date().toISOString();
        await db.run('DELETE FROM plan_meals WHERE id = ?', [existingMeal.id]);
        await db.run('UPDATE weekly_plans SET updated_at = ? WHERE id = ?', [now, plan.id]);
        const refreshed = await this.getWeeklyPlan(weekStartDate);
        if (!refreshed) {
            throw new Error('Failed to clear meal');
        }
        await this.rebuildGroceryList(refreshed);
        return refreshed;
    }
    async saveMealRecap(planMealId, recap) {
        const db = await this.dbService.getDbConnection();
        const mealResult = await db.query('SELECT cooked_at FROM plan_meals WHERE id = ?', [planMealId]);
        const existingCookedAt = mealResult.values?.[0]?.['cooked_at'];
        const cookedAt = existingCookedAt ? String(existingCookedAt) : new Date().toISOString();
        const starRating = computeMealStarRating(recap);
        await db.run(`UPDATE plan_meals
       SET is_cooked = 1,
           reaction_emoji = ?,
           actual_cook_minutes = NULL,
           complexity = NULL,
           recap_effort = ?,
           recap_time = ?,
           recap_cost = ?,
           recap_notes = ?,
           star_rating = ?,
           cooked_at = ?
       WHERE id = ?`, [
            recap.reactionEmoji ?? null,
            recap.effortRating ?? null,
            recap.timeRating ?? null,
            recap.costRating ?? null,
            recap.notes?.trim() || null,
            starRating ?? null,
            cookedAt,
            planMealId,
        ]);
    }
    async getLatestStarRatingsForRecipes(options) {
        const byCachedRecipeId = new Map();
        const bySpoonacularId = new Map();
        const byRecipeKey = new Map();
        const cachedRecipeIds = [...new Set((options.cachedRecipeIds ?? []).filter((id) => id > 0))];
        const spoonacularIds = [...new Set((options.spoonacularIds ?? []).filter((id) => id > 0))];
        const recipeKeys = [
            ...new Map((options.recipeKeys ?? [])
                .filter((key) => key.externalId.trim())
                .map((key) => [`${key.recipeSource}:${key.externalId}`, key])).values(),
        ];
        if (!cachedRecipeIds.length && !spoonacularIds.length && !recipeKeys.length) {
            return { byCachedRecipeId, bySpoonacularId, byRecipeKey };
        }
        const db = await this.dbService.getDbConnection();
        const conditions = [];
        const params = [];
        if (cachedRecipeIds.length) {
            conditions.push(`pm.cached_recipe_id IN (${cachedRecipeIds.map(() => '?').join(',')})`);
            params.push(...cachedRecipeIds);
        }
        if (spoonacularIds.length) {
            conditions.push(`cr.spoonacular_id IN (${spoonacularIds.map(() => '?').join(',')})`);
            params.push(...spoonacularIds);
        }
        if (recipeKeys.length) {
            conditions.push(recipeKeys.map(() => '(cr.recipe_source = ? AND cr.external_id = ?)').join(' OR '));
            for (const key of recipeKeys) {
                params.push(key.recipeSource, key.externalId);
            }
        }
        const result = await db.query(`SELECT pm.cached_recipe_id, cr.spoonacular_id, cr.recipe_source, cr.external_id, pm.star_rating, pm.cooked_at
       FROM plan_meals pm
       JOIN cached_recipes cr ON cr.id = pm.cached_recipe_id
       WHERE pm.star_rating IS NOT NULL
       AND (${conditions.join(' OR ')})
       ORDER BY pm.cooked_at DESC`, params);
        for (const row of result.values ?? []) {
            const cachedRecipeId = Number(row['cached_recipe_id']);
            const spoonacularId = Number(row['spoonacular_id']);
            const recipeSource = String(row['recipe_source'] ?? 'spoonacular');
            const externalId = String(row['external_id'] ?? spoonacularId);
            const recipeKey = `${recipeSource}:${externalId}`;
            const rating = Number(row['star_rating']);
            if (!byCachedRecipeId.has(cachedRecipeId)) {
                byCachedRecipeId.set(cachedRecipeId, rating);
            }
            if (!bySpoonacularId.has(spoonacularId)) {
                bySpoonacularId.set(spoonacularId, rating);
            }
            if (!byRecipeKey.has(recipeKey)) {
                byRecipeKey.set(recipeKey, rating);
            }
        }
        return { byCachedRecipeId, bySpoonacularId, byRecipeKey };
    }
    async updateMealGuests(planMealId, extraGuests, eventNote) {
        const db = await this.dbService.getDbConnection();
        if (eventNote !== undefined) {
            await db.run('UPDATE plan_meals SET extra_guests = ?, event_note = ? WHERE id = ?', [
                extraGuests,
                eventNote,
                planMealId,
            ]);
        }
        else {
            await db.run('UPDATE plan_meals SET extra_guests = ? WHERE id = ?', [extraGuests, planMealId]);
        }
        const mealResult = await db.query('SELECT weekly_plan_id FROM plan_meals WHERE id = ?', [planMealId]);
        const weekPlanId = mealResult.values?.[0]?.['weekly_plan_id'];
        if (!weekPlanId) {
            return;
        }
        const planResult = await db.query('SELECT week_start_date FROM weekly_plans WHERE id = ?', [weekPlanId]);
        const weekStart = planResult.values?.[0]?.['week_start_date'];
        if (!weekStart) {
            return;
        }
        const plan = await this.getWeeklyPlan(String(weekStart));
        if (plan) {
            await this.rebuildGroceryList(plan);
        }
    }
    async refreshGroceryList(weekStartDate) {
        const plan = await this.getWeeklyPlan(weekStartDate);
        if (plan?.id && plan.meals.length > 0) {
            await this.rebuildGroceryList(plan);
        }
    }
    async getGroceryItems(weekStartDate) {
        const plan = await this.getWeeklyPlan(weekStartDate);
        if (!plan?.id) {
            return [];
        }
        await this.awaitGroceryRebuild(plan.id);
        let items = await this.queryGroceryItems(plan.id);
        if (await this.groceryListNeedsRebuild(plan, items)) {
            await this.rebuildGroceryList(plan);
            await this.awaitGroceryRebuild(plan.id);
            items = await this.queryGroceryItems(plan.id);
        }
        return items;
    }
    async awaitGroceryRebuild(weeklyPlanId) {
        const inFlight = this.groceryRebuildPromises.get(weeklyPlanId);
        if (inFlight) {
            await inFlight;
        }
    }
    async queryGroceryItems(weeklyPlanId) {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT * FROM grocery_items WHERE weekly_plan_id = ? ORDER BY sort_order ASC, ingredient_name ASC', [weeklyPlanId]);
        return (result.values ?? []).map((row) => this.mapGroceryItemRow(row));
    }
    mapGroceryItemRow(row) {
        return {
            id: Number(row['id']),
            weeklyPlanId: Number(row['weekly_plan_id']),
            aisle: String(row['aisle']),
            ingredientName: String(row['ingredient_name']),
            amountText: String(row['amount_text']),
            isChecked: Boolean(row['is_checked']),
            isManual: Boolean(row['is_manual']),
            sortOrder: Number(row['sort_order']),
        };
    }
    async addGroceryItem(weekStartDate, ingredientName) {
        const trimmed = ingredientName.trim();
        if (!trimmed) {
            throw new Error('Item name is required');
        }
        const plan = await this.ensureWeeklyPlan(weekStartDate);
        if (!plan.id) {
            throw new Error('Weekly plan not found');
        }
        const db = await this.dbService.getDbConnection();
        const aisle = normalizeGroceryAisle(undefined, trimmed);
        const displayName = this.titleCase(trimmed);
        const ingredientKey = this.buildGroceryIngredientKey(aisle, displayName);
        const existing = await db.query('SELECT ingredient_name FROM grocery_items WHERE weekly_plan_id = ?', [plan.id]);
        const duplicate = (existing.values ?? []).some((row) => String(row['ingredient_name']).toLowerCase() === displayName.toLowerCase());
        if (duplicate) {
            throw new Error('That item is already on your list');
        }
        const sortResult = await db.query('SELECT COALESCE(MAX(sort_order), -1) AS max_sort FROM grocery_items WHERE weekly_plan_id = ?', [plan.id]);
        const sortOrder = Number(sortResult.values?.[0]?.['max_sort'] ?? -1) + 1;
        const insert = await db.run(`INSERT INTO grocery_items
       (weekly_plan_id, aisle, ingredient_name, amount_text, is_checked, sort_order, is_manual, image_url)
       VALUES (?, ?, ?, '', 0, ?, 1, NULL)`, [plan.id, aisle, displayName, sortOrder]);
        await db.run('DELETE FROM grocery_item_exclusions WHERE weekly_plan_id = ? AND ingredient_key = ?', [plan.id, ingredientKey]);
        let itemId = insert.changes?.lastId;
        if (!itemId) {
            const fallback = await db.query(`SELECT id FROM grocery_items
         WHERE weekly_plan_id = ? AND ingredient_name = ? AND is_manual = 1
         ORDER BY id DESC LIMIT 1`, [plan.id, displayName]);
            itemId = Number(fallback.values?.[0]?.['id']);
        }
        if (!itemId) {
            throw new Error('Failed to add grocery item');
        }
        const row = await db.query('SELECT * FROM grocery_items WHERE id = ?', [itemId]);
        const created = row.values?.[0];
        if (!created) {
            throw new Error('Failed to load grocery item');
        }
        return this.mapGroceryItemRow(created);
    }
    async removeGroceryItem(itemId) {
        const db = await this.dbService.getDbConnection();
        const result = await db.query('SELECT * FROM grocery_items WHERE id = ?', [itemId]);
        const row = result.values?.[0];
        if (!row) {
            return;
        }
        const weeklyPlanId = Number(row['weekly_plan_id']);
        const aisle = String(row['aisle']);
        const ingredientName = String(row['ingredient_name']);
        const isManual = Boolean(row['is_manual']);
        if (!isManual) {
            const ingredientKey = this.buildGroceryIngredientKey(aisle, ingredientName);
            await db.run(`INSERT OR IGNORE INTO grocery_item_exclusions (weekly_plan_id, ingredient_key, created_at)
         VALUES (?, ?, ?)`, [weeklyPlanId, ingredientKey, new Date().toISOString()]);
        }
        await db.run('DELETE FROM grocery_items WHERE id = ?', [itemId]);
    }
    async groceryListNeedsRebuild(plan, items) {
        if (plan.meals.length > 0 && !items.length) {
            return true;
        }
        if (!items.length) {
            return false;
        }
        const seen = new Set();
        for (const item of items) {
            const key = `${item.aisle}::${item.ingredientName.toLowerCase()}`;
            if (seen.has(key)) {
                return true;
            }
            seen.add(key);
        }
        const normalizedAisles = new Set(GROCERY_AISLE_ORDER);
        if (items.some((item) => !normalizedAisles.has(item.aisle))) {
            return true;
        }
        return false;
    }
    async setGroceryItemChecked(itemId, checked) {
        const db = await this.dbService.getDbConnection();
        await db.run('UPDATE grocery_items SET is_checked = ? WHERE id = ?', [checked ? 1 : 0, itemId]);
    }
    async getWeeklySummary(weekStartDate) {
        const plan = await this.getWeeklyPlan(weekStartDate);
        const meals = plan?.meals ?? [];
        let readyTotal = 0;
        let readyCount = 0;
        for (const meal of meals) {
            if (meal.recipe?.readyInMinutes) {
                readyTotal += meal.recipe.readyInMinutes;
                readyCount += 1;
            }
        }
        return {
            weekStartDate,
            mealsPlanned: meals.length,
            averageReadyMinutes: readyCount ? Math.round(readyTotal / readyCount) : undefined,
        };
    }
    async getCurrentWeekPlan() {
        return this.getWeeklyPlan(getCurrentWeekStart());
    }
    async rebuildGroceryList(plan) {
        if (!plan.id) {
            return;
        }
        const planId = plan.id;
        const inFlight = this.groceryRebuildPromises.get(planId);
        if (inFlight) {
            await inFlight;
            return;
        }
        const rebuildPromise = this.performRebuildGroceryList(plan);
        this.groceryRebuildPromises.set(planId, rebuildPromise);
        try {
            await rebuildPromise;
        }
        finally {
            if (this.groceryRebuildPromises.get(planId) === rebuildPromise) {
                this.groceryRebuildPromises.delete(planId);
            }
        }
    }
    async performRebuildGroceryList(plan) {
        if (!plan.id) {
            return;
        }
        const profile = await this.profileService.getProfile();
        const householdSize = profile?.householdSize ?? 2;
        const db = await this.dbService.getDbConnection();
        const checkedByIngredient = new Map();
        const existingItems = await db.query('SELECT ingredient_name, is_checked FROM grocery_items WHERE weekly_plan_id = ?', [plan.id]);
        for (const row of existingItems.values ?? []) {
            const key = String(row['ingredient_name']).toLowerCase();
            const checked = Boolean(row['is_checked']);
            checkedByIngredient.set(key, checkedByIngredient.get(key) || checked);
        }
        const manualItemsResult = await db.query('SELECT ingredient_name, aisle FROM grocery_items WHERE weekly_plan_id = ? AND is_manual = 1', [plan.id]);
        const savedManualItems = (manualItemsResult.values ?? []).map((row) => ({
            ingredientName: String(row['ingredient_name']),
            aisle: String(row['aisle']),
        }));
        const exclusions = new Set();
        const exclusionsResult = await db.query('SELECT ingredient_key FROM grocery_item_exclusions WHERE weekly_plan_id = ?', [plan.id]);
        for (const row of exclusionsResult.values ?? []) {
            exclusions.add(String(row['ingredient_key']));
        }
        await db.run('DELETE FROM grocery_items WHERE weekly_plan_id = ?', [plan.id]);
        const merged = new Map();
        let activeExclusions = exclusions;
        await this.mergeRecipeIngredientsIntoGroceryMap(plan, householdSize, merged, activeExclusions);
        if (merged.size === 0 && plan.meals.length > 0 && activeExclusions.size > 0) {
            await db.run('DELETE FROM grocery_item_exclusions WHERE weekly_plan_id = ?', [plan.id]);
            activeExclusions = new Set();
            await this.mergeRecipeIngredientsIntoGroceryMap(plan, householdSize, merged, activeExclusions);
        }
        for (const manual of savedManualItems) {
            const key = this.buildGroceryIngredientKey(manual.aisle, manual.ingredientName);
            if (activeExclusions.has(key) || merged.has(key)) {
                continue;
            }
            merged.set(key, {
                aisle: manual.aisle,
                amounts: [''],
                isManual: true,
            });
        }
        const aisleOrder = [...merged.values()]
            .map((v) => v.aisle)
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .sort(compareGroceryAisles);
        let sortOrder = 0;
        for (const aisle of aisleOrder) {
            const items = [...merged.entries()]
                .filter(([, v]) => v.aisle === aisle)
                .sort((a, b) => a[0].localeCompare(b[0]));
            for (const [key, value] of items) {
                const ingredientName = key.split('::')[1] ?? key;
                const displayName = this.titleCase(ingredientName);
                const amountText = value.amounts.filter(Boolean).join(' + ');
                const isChecked = checkedByIngredient.get(displayName.toLowerCase()) ? 1 : 0;
                await db.run(`INSERT INTO grocery_items
           (weekly_plan_id, aisle, ingredient_name, amount_text, is_checked, sort_order, is_manual, image_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                    plan.id,
                    aisle,
                    displayName,
                    amountText,
                    isChecked,
                    sortOrder++,
                    value.isManual ? 1 : 0,
                    null,
                ]);
            }
        }
    }
    async mergeRecipeIngredientsIntoGroceryMap(plan, householdSize, merged, exclusions) {
        for (const meal of plan.meals) {
            await this.mergeMealIngredientsIntoGroceryMap(meal, plan, householdSize, merged, exclusions);
        }
    }
    async mergeMealIngredientsIntoGroceryMap(meal, plan, householdSize, merged, exclusions) {
        const recipe = meal.recipe ?? (await this.recipeService.getCachedRecipeById(meal.cachedRecipeId));
        if (!recipe) {
            return;
        }
        const targetServings = getTargetServings(householdSize, plan.weekServingDelta, meal.extraGuests);
        const scale = getRecipeScaleFactor(recipe.servings, targetServings);
        for (const ingredient of recipe.ingredients) {
            const normalizedAisle = normalizeGroceryAisle(ingredient.aisle, ingredient.name, ingredient.original);
            const key = this.buildGroceryIngredientKey(normalizedAisle, ingredient.name);
            if (exclusions.has(key)) {
                continue;
            }
            const scaledAmount = formatScaledIngredientAmount(ingredient, scale);
            const existing = merged.get(key);
            if (existing) {
                existing.amounts.push(scaledAmount);
            }
            else {
                merged.set(key, {
                    aisle: normalizedAisle,
                    amounts: [scaledAmount],
                    isManual: false,
                });
            }
        }
    }
    buildGroceryIngredientKey(aisle, ingredientName) {
        return `${aisle}::${ingredientName.trim().toLowerCase()}`;
    }
    titleCase(value) {
        return value.replace(/\b\w/g, (char) => char.toUpperCase());
    }
    normalizeMealsPerWeek(value) {
        const parsed = Math.round(Number(value));
        if (!Number.isFinite(parsed) || parsed < 1) {
            return MEALS_PER_WEEK;
        }
        return Math.min(parsed, 7);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerPlanService, deps: [{ token: MealPlannerDatabaseService }, { token: MealPlannerProfileService }, { token: MealPlannerRecipeService }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerPlanService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.16", ngImport: i0, type: MealPlannerPlanService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: () => [{ type: MealPlannerDatabaseService }, { type: MealPlannerProfileService }, { type: MealPlannerRecipeService }] });

/**
 * Generated bundle index. Do not edit.
 */

export { GROCERY_AISLE_ORDER, MEALS_PER_WEEK, MEAL_RECAP_COMPLEXITY_VALUES, MEAL_RECAP_RATING_DIMENSIONS, MEAL_RECAP_REACTIONS, MealPlannerDatabaseService, MealPlannerPlanService, MealPlannerProfileService, MealPlannerRecipeService, compareGroceryAisles, complexityToIndex, computeMealStarRating, formatScaledIngredientAmount, formatScaledIngredientLine, formatWeekLabel, getCurrentWeekStart, getRecipeScaleFactor, getSundayForDate, getTargetServings, indexToComplexity, normalizeGroceryAisle, parseIngredientLineForDisplay };
//# sourceMappingURL=meal-planner.mjs.map
