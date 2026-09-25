import { Injectable } from '@angular/core';
import type { MealPlannerProfile } from '../types/meal-planner.types';
import { MealPlannerDatabaseService } from './meal-planner-database.service';

@Injectable({
  providedIn: 'root',
})
export class MealPlannerProfileService {
  constructor(private dbService: MealPlannerDatabaseService) {}

  async getProfile(): Promise<MealPlannerProfile | null> {
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

  async saveProfile(profile: Pick<MealPlannerProfile, 'householdSize' | 'maxReadyMinutes'>): Promise<MealPlannerProfile> {
    const db = await this.dbService.getDbConnection();
    const updatedAt = new Date().toISOString();
    const existing = await this.getProfile();
    if (existing) {
      await db.run(
        'UPDATE meal_planner_profile SET household_size = ?, max_ready_minutes = ?, updated_at = ? WHERE id = 1',
        [profile.householdSize, profile.maxReadyMinutes, updatedAt]
      );
    } else {
      await db.run(
        'INSERT INTO meal_planner_profile (id, household_size, max_ready_minutes, updated_at) VALUES (1, ?, ?, ?)',
        [profile.householdSize, profile.maxReadyMinutes, updatedAt]
      );
    }
    return {
      householdSize: profile.householdSize,
      maxReadyMinutes: profile.maxReadyMinutes,
      updatedAt,
    };
  }
}
