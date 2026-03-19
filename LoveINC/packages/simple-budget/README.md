# @upstart-productions/simple-budget

Angular/Ionic Simple Weekly Budget – track income and expenses with SQLite storage. Designed for beginners and nonprofit organizations.

## Usage

- **Access**: More → Tools → Simple Budget Planner
- **Storage**: SQLite (local only, no network)
- **Tabs**: Weekly Budget, Quick Adjust, Review, Export

## Package

- Types: `WeekPlan`, `CategoryInstance`, `WeekSummary`, etc.
- Services: `SimpleBudgetDatabaseService`, `WeekPlanService`
- Utils: `calculateWeekSummary`, `exportToJson`, `exportToCsv`

## Local development

```bash
# From LoveINC root
npm run build:simple-budget
```

Use `"@upstart-productions/simple-budget": "file:packages/simple-budget"` in `package.json` for local linking.
