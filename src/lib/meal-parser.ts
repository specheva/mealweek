// Parses freeform ingredient text into structured ingredients
// and estimates prep/cook time + suggests tags

interface ParsedIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  category: string | null;
}

interface ParsedMealData {
  ingredients: ParsedIngredient[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: string;
  suggestedTagNames: string[];
}


const CATEGORIES: Record<string, string[]> = {
  protein: [
    "chicken", "beef", "pork", "salmon", "shrimp", "tofu", "turkey", "lamb",
    "steak", "ground", "bacon", "sausage", "fish", "tuna", "egg", "eggs",
  ],
  produce: [
    "onion", "garlic", "tomato", "pepper", "lettuce", "spinach", "broccoli",
    "carrot", "potato", "avocado", "lime", "lemon", "cucumber", "zucchini",
    "mushroom", "cilantro", "basil", "ginger", "corn", "peas", "bean sprout",
  ],
  dairy: [
    "cheese", "cream", "milk", "butter", "yogurt", "mozzarella", "parmesan",
    "cheddar", "feta", "sour cream",
  ],
  pantry: [
    "rice", "pasta", "noodle", "tortilla", "bread", "flour", "oil", "sauce",
    "soy sauce", "vinegar", "sugar", "honey", "broth", "stock", "coconut milk",
    "can", "dough", "ketchup", "mayo", "mustard",
  ],
  spice: [
    "salt", "pepper", "cumin", "paprika", "chili", "oregano", "thyme",
    "cinnamon", "curry", "seasoning", "powder",
  ],
};

// Quick-cook ingredients suggest shorter times
const QUICK_INGREDIENTS = [
  "tortilla", "bread", "wrap", "lettuce", "salsa", "cheese", "mayo",
  "pre-cooked", "canned",
];

// Slow-cook ingredients suggest longer times
const SLOW_INGREDIENTS = [
  "whole chicken", "roast", "brisket", "ribs", "stew", "braise",
  "dough", "bean", "lentil",
];

function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return "other";
}

function parseIngredientLine(line: string): ParsedIngredient | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 2) return null;

  // Try to extract leading quantity + unit: "2 cups rice" or "1.5 lb chicken"
  const match = trimmed.match(
    /^(\d+\.?\d*)\s*(cup|cups|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|pcs|pieces?|slices?|cloves?|cans?|bunch|sprigs?|pinch)s?\s+(.+)$/i
  );

  if (match) {
    const name = match[3].trim();
    return {
      name,
      quantity: parseFloat(match[1]),
      unit: match[2].toLowerCase(),
      note: null,
      category: detectCategory(name),
    };
  }

  // Try just a number: "3 eggs"
  const numMatch = trimmed.match(/^(\d+\.?\d*)\s+(.+)$/);
  if (numMatch) {
    const name = numMatch[2].trim();
    return {
      name,
      quantity: parseFloat(numMatch[1]),
      unit: null,
      note: null,
      category: detectCategory(name),
    };
  }

  // Plain name
  return {
    name: trimmed,
    quantity: null,
    unit: null,
    note: null,
    category: detectCategory(trimmed),
  };
}

function estimateTimes(ingredients: ParsedIngredient[]): {
  prep: number;
  cook: number;
  difficulty: string;
} {
  const count = ingredients.length;
  const names = ingredients.map((i) => i.name.toLowerCase()).join(" ");

  const hasQuick = QUICK_INGREDIENTS.some((kw) => names.includes(kw));
  const hasSlow = SLOW_INGREDIENTS.some((kw) => names.includes(kw));
  const hasProtein = ingredients.some((i) => i.category === "protein");

  if (hasSlow) {
    return { prep: 20, cook: 60, difficulty: "hard" };
  }

  if (hasQuick && count <= 5) {
    return { prep: 5, cook: 10, difficulty: "easy" };
  }

  if (!hasProtein || count <= 4) {
    return { prep: 5, cook: 15, difficulty: "easy" };
  }

  if (count <= 7) {
    return { prep: 10, cook: 20, difficulty: "medium" };
  }

  return { prep: 15, cook: 25, difficulty: "medium" };
}

function suggestTags(
  ingredients: ParsedIngredient[],
  prep: number,
  cook: number,
  difficulty: string
): string[] {
  const tags: string[] = [];
  const names = ingredients.map((i) => i.name.toLowerCase()).join(" ");
  const totalTime = prep + cook;

  // Quick & Easy
  if (totalTime <= 25 && difficulty === "easy") {
    tags.push("Quick & Easy");
  }

  // Comfort Food — hearty ingredients
  const comfortKeywords = [
    "cheese", "pasta", "cream", "butter", "bread", "potato", "bacon", "pizza",
    "noodle", "mac", "burger",
  ];
  if (comfortKeywords.some((kw) => names.includes(kw))) {
    tags.push("Comfort Food");
  }

  // Health-Conscious — lots of produce, no heavy dairy/carbs
  const produceCount = ingredients.filter((i) => i.category === "produce").length;
  if (produceCount >= ingredients.length * 0.4 && !names.includes("cream") && !names.includes("cheese")) {
    tags.push("Health-Conscious");
  }

  // Date Night — complex meals with many ingredients
  if (difficulty !== "easy" && ingredients.length >= 7) {
    tags.push("Date Night");
  }

  // Meal Prep — grains + protein
  const hasGrain = ["rice", "pasta", "quinoa", "couscous", "noodle"].some((g) =>
    names.includes(g)
  );
  const hasProtein = ingredients.some((i) => i.category === "protein");
  if (hasGrain && hasProtein && ingredients.length >= 5) {
    tags.push("Meal Prep");
  }

  return tags.slice(0, 2);
}

export function parseMealInput(ingredientText: string): ParsedMealData {
  // Split by commas, newlines, or semicolons
  const lines = ingredientText
    .split(/[,;\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const ingredients = lines
    .map(parseIngredientLine)
    .filter((i): i is ParsedIngredient => i !== null);

  const { prep, cook, difficulty } = estimateTimes(ingredients);
  const suggestedTagNames = suggestTags(ingredients, prep, cook, difficulty);

  return {
    ingredients,
    prepTimeMinutes: prep,
    cookTimeMinutes: cook,
    difficulty,
    suggestedTagNames,
  };
}
