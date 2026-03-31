# Set the Table

A mobile-first weekly meal planning app that helps households plan meals, reuse favorites, discover complementary meal combinations, and generate shopping lists.

**Live:** https://setthetable.vercel.app

## Features

- **Weekly planner** with three views: horizontal weekly grid (desktop), vertical daily scroll (mobile), and monthly calendar
- **Smart suggestions** — every week is auto-filled with meals using a rules-based engine that considers ingredient overlap, effort balance, cuisine variety, and recency
- **Swap any meal** — tap to replace a suggestion with something from your catalog or a new meal
- **25 popular family meals** pre-loaded (tacos, spaghetti, stir fry, mac & cheese, etc.)
- **Add meals fast** — type a name and ingredients, the app auto-parses quantities, estimates prep/cook time, assigns difficulty, and suggests tags
- **Shopping list** — aggregated ingredients for the week, grouped by category, with checkboxes and copy/share
- **Illustrative meal thumbnails** — colorful gradient cards with food emoji, generated from meal name and ingredients
- **Google sign-in** — household accounts with partner sharing
- **Onboarding walkthrough** for new visitors
- **5 meal categories**: Quick & Easy, Comfort Food, Health-Conscious, Date Night, Meal Prep
- **Toast notifications** and loading skeletons for responsive feedback
- **Import from links** — paste Instagram/TikTok/recipe URLs to extract meal data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (local) / Turso LibSQL (production) |
| ORM | Prisma with driver adapters |
| Auth | NextAuth.js v4 with Google OAuth |
| Hosting | Vercel |
| Icons | Lucide React |

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/specheva/set-the-table.git
cd set-the-table

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed with sample data (25 meals + weekly plan)
npx tsx prisma/seed.ts

# Start the dev server
npm run dev
```

Open http://localhost:3000.

### Environment Variables

Create a `.env` file:

```env
# Local SQLite database
DATABASE_URL="file:./dev.db"

# Google OAuth (optional for local dev — app works without auth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=any-random-string
NEXTAUTH_URL=http://localhost:3000

# Turso cloud database (only needed for production)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
```

## Google OAuth Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project (or select existing)
3. Go to **APIs & Services > OAuth consent screen**, choose External, fill in app name and emails
4. Go to **APIs & Services > Credentials**, click **Create Credentials > OAuth client ID**
5. Application type: **Web application**
6. Add **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.vercel.app/api/auth/callback/google`
7. Copy the Client ID and Client Secret into your `.env`

## Deploying to Vercel

### 1. Set up Turso (cloud database)

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Login and create a database
turso auth login
turso db create set-the-table

# Get connection details
turso db show set-the-table --url
turso db tokens create set-the-table

# Apply the schema
turso db shell set-the-table < prisma/migrations/20260330230104_init/migration.sql

# Apply user/household tables
turso db shell set-the-table << 'SQL'
CREATE TABLE IF NOT EXISTS "Household" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'My Household',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "householdId" TEXT REFERENCES "Household"("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
ALTER TABLE "Meal" ADD COLUMN "createdById" TEXT REFERENCES "User"("id");
ALTER TABLE "Meal" ADD COLUMN "householdId" TEXT REFERENCES "Household"("id");
ALTER TABLE "WeekPlan" ADD COLUMN "householdId" TEXT REFERENCES "Household"("id");
SQL

# Seed with sample data
TURSO_DATABASE_URL=<your-url> TURSO_AUTH_TOKEN=<your-token> npx tsx prisma/seed.ts
```

### 2. Deploy

```bash
npm install -g vercel

vercel --yes --prod \
  -e TURSO_DATABASE_URL="libsql://your-db.turso.io" \
  -e TURSO_AUTH_TOKEN="your-token" \
  -e DATABASE_URL="file:./dev.db" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.vercel.app" \
  -e GOOGLE_CLIENT_ID="your-client-id" \
  -e GOOGLE_CLIENT_SECRET="your-client-secret"
```

## Project Structure

```
src/
  app/
    page.tsx                  # Weekly planner (home)
    catalog/page.tsx          # Meal catalog
    catalog/[id]/page.tsx     # Meal detail
    meals/new/page.tsx        # Add meal
    meals/[id]/edit/page.tsx  # Edit meal
    settings/page.tsx         # Account & household settings
    login/page.tsx            # Google sign-in
    api/
      auth/[...nextauth]/    # NextAuth handler
      meals/                 # CRUD for meals
      plans/                 # Weekly plans + entries
      plans/autofill/        # Auto-suggest meals for empty days
      plans/shopping-list/   # Aggregated ingredient list
      plans/month/           # Monthly calendar data
      suggestions/           # Complementary meal suggestions
      tags/                  # Tag management
      import/                # Social link parser
      household/             # Partner invite + members
      user/                  # User settings
  components/
    planner/                 # WeeklyView, DailyView, MonthlyView, MealPicker, ShoppingList
    catalog/                 # MealGrid, MealCard, MealDetail
    meals/                   # MealForm, ImportFromLink
    onboarding/              # OnboardingFlow
    settings/                # SettingsPage
    auth/                    # AuthProvider
    shared/                  # Navigation, Logo, MealIllustration, Toast, Skeleton
  lib/
    db.ts                    # Prisma client (SQLite local, Turso production)
    auth.ts                  # NextAuth config
    suggestions.ts           # Complementary meal scoring engine
    meal-parser.ts           # Freeform ingredient parser + time estimator
    import-parser.ts         # Social media URL metadata extractor
    ingredient-utils.ts      # Ingredient normalization + overlap detection
    prefill-week.ts          # Auto-fill new weeks with suggestions
    utils.ts                 # Date helpers, cn() utility
```

## Suggestion Engine

Meals are scored across 6 dimensions when suggesting for a day:

| Factor | Weight | Logic |
|--------|--------|-------|
| Ingredient overlap | 30% | More shared ingredients with planned meals = less waste |
| Effort balance | 20% | Easy meals after hard days, and vice versa |
| Cuisine variety | 20% | Penalize 3+ of the same cuisine, back-to-back repeats |
| Recency | 15% | Penalize meals cooked in last 7 days, boost 14+ days |
| Favorite boost | 10% | Small boost for favorited meals |
| Monotony penalty | 5% | Penalize same category on adjacent days |

## License

MIT
