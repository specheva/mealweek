"use client";

// Generates a colorful illustrative thumbnail for a meal based on its
// name and ingredients. Uses emoji + gradient backgrounds to create
// visually distinct cards without requiring external image APIs.

interface MealIllustrationProps {
  title: string;
  ingredients?: string[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Map common food keywords to emoji
const FOOD_EMOJI: [RegExp, string][] = [
  [/taco/i, "🌮"],
  [/burrito|wrap/i, "🌯"],
  [/pizza/i, "🍕"],
  [/burger/i, "🍔"],
  [/pasta|spaghetti|fettuccine|penne|noodle/i, "🍝"],
  [/sushi|roll/i, "🍣"],
  [/ramen/i, "🍜"],
  [/soup|stew|chowder/i, "🍲"],
  [/salad/i, "🥗"],
  [/sandwich|sub|blt/i, "🥪"],
  [/steak|beef|bulgogi/i, "🥩"],
  [/chicken|poultry/i, "🍗"],
  [/fish|salmon|tuna/i, "🐟"],
  [/shrimp|prawn/i, "🦐"],
  [/rice|bowl/i, "🍚"],
  [/curry/i, "🍛"],
  [/egg|omelette|frittata/i, "🍳"],
  [/cake|dessert|brownie/i, "🍰"],
  [/cookie|biscuit/i, "🍪"],
  [/pie/i, "🥧"],
  [/bread|toast/i, "🍞"],
  [/pancake|waffle/i, "🥞"],
  [/fry|fries/i, "🍟"],
  [/hot dog/i, "🌭"],
  [/quesadilla|cheese/i, "🧀"],
  [/roast/i, "🍖"],
  [/stir.?fry|wok/i, "🥘"],
  [/fajita/i, "🌶️"],
];

// Ingredient-based emoji fallbacks
const INGREDIENT_EMOJI: [RegExp, string][] = [
  [/chicken/i, "🍗"],
  [/beef|steak/i, "🥩"],
  [/pork|bacon/i, "🥓"],
  [/fish|salmon/i, "🐟"],
  [/shrimp/i, "🦐"],
  [/tofu/i, "🫘"],
  [/avocado/i, "🥑"],
  [/tomato/i, "🍅"],
  [/pepper|chili/i, "🌶️"],
  [/lemon|lime/i, "🍋"],
  [/corn/i, "🌽"],
  [/broccoli/i, "🥦"],
  [/mushroom/i, "🍄"],
  [/onion|garlic/i, "🧅"],
  [/rice/i, "🍚"],
  [/cheese/i, "🧀"],
  [/egg/i, "🥚"],
];

// Gradient palettes based on cuisine/dish character
const GRADIENTS = [
  "from-orange-400 to-red-500",     // warm/spicy
  "from-green-400 to-teal-500",     // fresh/healthy
  "from-amber-400 to-orange-500",   // comfort
  "from-blue-400 to-indigo-500",    // seafood
  "from-pink-400 to-rose-500",      // sweet
  "from-yellow-400 to-amber-500",   // golden
  "from-emerald-400 to-green-500",  // veggie
  "from-violet-400 to-purple-500",  // exotic
  "from-red-400 to-pink-500",       // bold
  "from-cyan-400 to-blue-500",      // light
];

function getEmoji(title: string, ingredients: string[]): string {
  // Try title first
  for (const [pattern, emoji] of FOOD_EMOJI) {
    if (pattern.test(title)) return emoji;
  }

  // Try ingredients
  const joined = ingredients.join(" ");
  for (const [pattern, emoji] of INGREDIENT_EMOJI) {
    if (pattern.test(joined)) return emoji;
  }

  return "🍽";
}

function getGradient(title: string): string {
  // Simple hash to pick a consistent gradient
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

// Get a second decorative emoji from ingredients
function getAccentEmoji(ingredients: string[]): string | null {
  const accents = ["🌿", "🧄", "🫒", "🧂", "🌶️", "🍋", "🧀", "🥬"];
  for (const ing of ingredients) {
    const lower = ing.toLowerCase();
    if (lower.includes("garlic")) return "🧄";
    if (lower.includes("herb") || lower.includes("basil") || lower.includes("cilantro")) return "🌿";
    if (lower.includes("olive")) return "🫒";
    if (lower.includes("chili") || lower.includes("pepper")) return "🌶️";
    if (lower.includes("lemon") || lower.includes("lime")) return "🍋";
    if (lower.includes("cheese")) return "🧀";
  }
  // Pick based on ingredient count
  if (ingredients.length > 0) {
    let hash = 0;
    for (const c of ingredients[0]) hash = (hash * 17 + c.charCodeAt(0)) | 0;
    return accents[Math.abs(hash) % accents.length];
  }
  return null;
}

const sizes = {
  sm: { container: "w-10 h-10", emoji: "text-xl", accent: "text-[8px]" },
  md: { container: "w-14 h-14", emoji: "text-2xl", accent: "text-xs" },
  lg: { container: "w-full h-32", emoji: "text-5xl", accent: "text-lg" },
};

export function MealIllustration({
  title,
  ingredients = [],
  size = "md",
  className = "",
}: MealIllustrationProps) {
  const emoji = getEmoji(title, ingredients);
  const gradient = getGradient(title);
  const accent = getAccentEmoji(ingredients);
  const s = sizes[size];

  return (
    <div
      className={`${s.container} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden ${className}`}
    >
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 text-white text-6xl -rotate-12 translate-x-4 -translate-y-4 select-none">
          {emoji}
        </div>
      </div>

      {/* Main emoji */}
      <span className={`${s.emoji} select-none relative z-10 drop-shadow-sm`}>
        {emoji}
      </span>

      {/* Accent emoji */}
      {accent && size !== "sm" && (
        <span
          className={`absolute bottom-0.5 right-1 ${s.accent} select-none opacity-80`}
        >
          {accent}
        </span>
      )}
    </div>
  );
}
