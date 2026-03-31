import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Clear existing data in correct order (respecting foreign keys)
  await prisma.planEntry.deleteMany();
  await prisma.weekPlan.deleteMany();
  await prisma.mealTag.deleteMany();
  await prisma.mealIngredient.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.tag.deleteMany();

  console.log("Cleared existing data.\n");

  // ── Tags ──────────────────────────────────────────────────────────────
  // 5 mutually exclusive tags — each meal gets exactly one
  const tagData = [
    { name: "Quick & Easy", color: "#3b82f6" },
    { name: "Comfort Food", color: "#f97316" },
    { name: "Health-Conscious", color: "#22c55e" },
    { name: "Date Night", color: "#ec4899" },
    { name: "Meal Prep", color: "#8b5cf6" },
  ] as const;

  const tags: Record<string, { id: string }> = {};
  for (const t of tagData) {
    const tag = await prisma.tag.create({ data: { name: t.name, color: t.color } });
    tags[t.name] = tag;
  }

  console.log(`Created ${Object.keys(tags).length} tags.`);

  // ── Helper ────────────────────────────────────────────────────────────
  function daysAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  // ── Meals ─────────────────────────────────────────────────────────────
  const mealsData = [
    {
      title: "Chicken Tacos",
      description:
        "Juicy seasoned chicken with fresh toppings in warm tortillas. A crowd-pleasing weeknight dinner that comes together fast.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: "easy",
      cuisine: "Mexican",
      category: "dinner",
      isFavorite: true,
      timesCooked: 8,
      lastCookedAt: daysAgo(4),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Flour Tortillas", quantity: 8, unit: "pcs", category: "pantry" },
        { name: "Lime", quantity: 2, unit: "pcs", category: "produce" },
        { name: "Cilantro", quantity: 0.5, unit: "cup", category: "produce" },
        { name: "Cumin", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Chili Powder", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Sour Cream", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Avocado", quantity: 1, unit: "pcs", category: "produce" },
      ],
    },
    {
      title: "Pasta Primavera",
      description:
        "Colorful seasonal vegetables tossed with penne in a light garlic and olive oil sauce. Simple, fresh, and satisfying.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      difficulty: "easy",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: false,
      timesCooked: 3,
      lastCookedAt: daysAgo(12),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Penne Pasta", quantity: 1, unit: "lb", category: "pantry" },
        { name: "Zucchini", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Bell Pepper", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Cherry Tomatoes", quantity: 1, unit: "cup", category: "produce" },
        { name: "Garlic", quantity: 3, unit: "cloves", category: "produce" },
        { name: "Olive Oil", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Parmesan Cheese", quantity: 0.5, unit: "cup", category: "dairy" },
      ],
    },
    {
      title: "Salmon Teriyaki Bowl",
      description:
        "Glazed salmon fillet over steamed rice with edamame and pickled ginger. Restaurant-quality at home.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 25,
      difficulty: "medium",
      cuisine: "Japanese",
      category: "dinner",
      isFavorite: true,
      timesCooked: 5,
      lastCookedAt: daysAgo(7),
      tags: ["Date Night"],
      ingredients: [
        { name: "Salmon Fillet", quantity: 2, unit: "pcs", category: "protein" },
        { name: "Soy Sauce", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Mirin", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Rice", quantity: 1.5, unit: "cup", category: "pantry" },
        { name: "Edamame", quantity: 1, unit: "cup", category: "produce" },
        { name: "Sesame Seeds", quantity: 1, unit: "tbsp", category: "spice" },
        { name: "Fresh Ginger", quantity: 1, unit: "tbsp", note: "grated", category: "produce" },
      ],
    },
    {
      title: "One-Pot Chicken Alfredo",
      description:
        "Creamy fettuccine alfredo with tender chicken, all made in a single pot. Minimal cleanup, maximum flavor.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 25,
      difficulty: "easy",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: true,
      timesCooked: 11,
      lastCookedAt: daysAgo(2),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1, unit: "lb", category: "protein" },
        { name: "Fettuccine", quantity: 12, unit: "oz", category: "pantry" },
        { name: "Heavy Cream", quantity: 1, unit: "cup", category: "dairy" },
        { name: "Parmesan Cheese", quantity: 0.75, unit: "cup", category: "dairy" },
        { name: "Garlic", quantity: 4, unit: "cloves", category: "produce" },
        { name: "Butter", quantity: 2, unit: "tbsp", category: "dairy" },
        { name: "Italian Seasoning", quantity: 1, unit: "tsp", category: "spice" },
      ],
    },
    {
      title: "Sheet Pan Fajitas",
      description:
        "Sizzling peppers, onions, and seasoned chicken roasted on a sheet pan. Just slice, season, and bake.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      difficulty: "easy",
      cuisine: "Mexican",
      category: "dinner",
      isFavorite: false,
      timesCooked: 4,
      lastCookedAt: daysAgo(18),
      tags: ["Meal Prep"],
      ingredients: [
        { name: "Chicken Thighs", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Bell Peppers", quantity: 3, unit: "pcs", note: "mixed colors", category: "produce" },
        { name: "Yellow Onion", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Fajita Seasoning", quantity: 2, unit: "tbsp", category: "spice" },
        { name: "Olive Oil", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Flour Tortillas", quantity: 8, unit: "pcs", category: "pantry" },
        { name: "Lime", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Sour Cream", quantity: 0.25, unit: "cup", category: "dairy" },
      ],
    },
    {
      title: "Thai Basil Stir Fry",
      description:
        "Aromatic ground chicken with Thai basil, chili, and garlic over jasmine rice. Bold flavors in under 20 minutes.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 15,
      difficulty: "medium",
      cuisine: "Thai",
      category: "dinner",
      isFavorite: false,
      timesCooked: 2,
      lastCookedAt: daysAgo(21),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Ground Chicken", quantity: 1, unit: "lb", category: "protein" },
        { name: "Thai Basil", quantity: 1, unit: "cup", category: "produce" },
        { name: "Garlic", quantity: 5, unit: "cloves", category: "produce" },
        { name: "Thai Chili", quantity: 3, unit: "pcs", category: "produce" },
        { name: "Fish Sauce", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Oyster Sauce", quantity: 1, unit: "tbsp", category: "pantry" },
        { name: "Jasmine Rice", quantity: 1.5, unit: "cup", category: "pantry" },
      ],
    },
    {
      title: "Homemade Pizza",
      description:
        "Classic margherita pizza with a crispy homemade crust, San Marzano sauce, and fresh mozzarella. Worth the effort.",
      prepTimeMinutes: 20,
      cookTimeMinutes: 25,
      difficulty: "medium",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: true,
      timesCooked: 6,
      lastCookedAt: daysAgo(10),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Pizza Dough", quantity: 1, unit: "lb", category: "pantry" },
        { name: "San Marzano Tomatoes", quantity: 14, unit: "oz", note: "canned, crushed", category: "pantry" },
        { name: "Fresh Mozzarella", quantity: 8, unit: "oz", category: "dairy" },
        { name: "Fresh Basil", quantity: 0.25, unit: "cup", category: "produce" },
        { name: "Olive Oil", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Garlic", quantity: 2, unit: "cloves", category: "produce" },
      ],
    },
    {
      title: "Greek Chicken Bowl",
      description:
        "Herb-marinated chicken over fluffy rice with cucumber, tomato, feta, and tangy tzatziki.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: "easy",
      cuisine: "Mediterranean",
      category: "dinner",
      isFavorite: false,
      timesCooked: 3,
      lastCookedAt: daysAgo(14),
      tags: ["Health-Conscious"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Cucumber", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Cherry Tomatoes", quantity: 1, unit: "cup", category: "produce" },
        { name: "Feta Cheese", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Red Onion", quantity: 0.5, unit: "pcs", category: "produce" },
        { name: "Rice", quantity: 1, unit: "cup", category: "pantry" },
        { name: "Greek Yogurt", quantity: 0.5, unit: "cup", note: "for tzatziki", category: "dairy" },
        { name: "Oregano", quantity: 1, unit: "tsp", category: "spice" },
      ],
    },
    {
      title: "Beef Stir Fry with Broccoli",
      description:
        "Tender sliced beef and crisp broccoli in a savory garlic-ginger sauce. A takeout classic you can make better at home.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: "medium",
      cuisine: "Chinese",
      category: "dinner",
      isFavorite: false,
      timesCooked: 4,
      lastCookedAt: daysAgo(9),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Flank Steak", quantity: 1, unit: "lb", note: "thinly sliced", category: "protein" },
        { name: "Broccoli Florets", quantity: 3, unit: "cup", category: "produce" },
        { name: "Soy Sauce", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Fresh Ginger", quantity: 1, unit: "tbsp", note: "minced", category: "produce" },
        { name: "Garlic", quantity: 3, unit: "cloves", category: "produce" },
        { name: "Cornstarch", quantity: 1, unit: "tbsp", category: "pantry" },
        { name: "Sesame Oil", quantity: 1, unit: "tsp", category: "pantry" },
        { name: "Rice", quantity: 1.5, unit: "cup", category: "pantry" },
      ],
    },
    {
      title: "Lemon Herb Roast Chicken",
      description:
        "A beautifully golden whole roast chicken stuffed with lemon and herbs. The ultimate Sunday dinner centerpiece.",
      prepTimeMinutes: 20,
      cookTimeMinutes: 70,
      difficulty: "hard",
      cuisine: "American",
      category: "dinner",
      isFavorite: true,
      timesCooked: 2,
      lastCookedAt: daysAgo(30),
      tags: ["Date Night"],
      ingredients: [
        { name: "Whole Chicken", quantity: 4, unit: "lb", category: "protein" },
        { name: "Lemon", quantity: 2, unit: "pcs", category: "produce" },
        { name: "Fresh Rosemary", quantity: 3, unit: "sprigs", category: "produce" },
        { name: "Fresh Thyme", quantity: 5, unit: "sprigs", category: "produce" },
        { name: "Garlic", quantity: 6, unit: "cloves", category: "produce" },
        { name: "Butter", quantity: 4, unit: "tbsp", category: "dairy" },
        { name: "Olive Oil", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Salt and Pepper", quantity: 1, unit: "tbsp", category: "spice" },
      ],
    },
    {
      title: "Black Bean Quesadillas",
      description:
        "Crispy tortillas stuffed with seasoned black beans, melty cheese, and corn. Ready in 15 minutes flat.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      difficulty: "easy",
      cuisine: "Mexican",
      category: "lunch",
      isFavorite: false,
      timesCooked: 7,
      lastCookedAt: daysAgo(3),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Black Beans", quantity: 15, unit: "oz", note: "canned, drained", category: "pantry" },
        { name: "Flour Tortillas", quantity: 4, unit: "pcs", category: "pantry" },
        { name: "Shredded Cheddar", quantity: 1, unit: "cup", category: "dairy" },
        { name: "Corn Kernels", quantity: 0.5, unit: "cup", category: "produce" },
        { name: "Cumin", quantity: 0.5, unit: "tsp", category: "spice" },
        { name: "Salsa", quantity: 0.5, unit: "cup", category: "pantry" },
      ],
    },
    {
      title: "Shrimp Fried Rice",
      description:
        "Better-than-takeout fried rice loaded with plump shrimp, scrambled eggs, and crispy vegetables.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: "medium",
      cuisine: "Chinese",
      category: "dinner",
      isFavorite: false,
      timesCooked: 3,
      lastCookedAt: daysAgo(16),
      tags: ["Meal Prep"],
      ingredients: [
        { name: "Shrimp", quantity: 1, unit: "lb", note: "peeled and deveined", category: "protein" },
        { name: "Cooked Rice", quantity: 3, unit: "cup", note: "day-old preferred", category: "pantry" },
        { name: "Eggs", quantity: 3, unit: "pcs", category: "protein" },
        { name: "Frozen Peas and Carrots", quantity: 1, unit: "cup", category: "produce" },
        { name: "Soy Sauce", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Sesame Oil", quantity: 1, unit: "tsp", category: "pantry" },
        { name: "Green Onions", quantity: 3, unit: "pcs", category: "produce" },
        { name: "Garlic", quantity: 2, unit: "cloves", category: "produce" },
      ],
    },
    {
      title: "Caprese Pasta Salad",
      description:
        "Cool rotini tossed with fresh mozzarella, ripe tomatoes, basil, and balsamic glaze. Perfect for warm evenings or potlucks.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 5,
      difficulty: "easy",
      cuisine: "Italian",
      category: "lunch",
      isFavorite: false,
      timesCooked: 2,
      lastCookedAt: daysAgo(25),
      tags: ["Health-Conscious"],
      ingredients: [
        { name: "Rotini Pasta", quantity: 12, unit: "oz", category: "pantry" },
        { name: "Fresh Mozzarella", quantity: 8, unit: "oz", note: "cubed", category: "dairy" },
        { name: "Cherry Tomatoes", quantity: 1.5, unit: "cup", note: "halved", category: "produce" },
        { name: "Fresh Basil", quantity: 0.5, unit: "cup", category: "produce" },
        { name: "Balsamic Glaze", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Olive Oil", quantity: 3, unit: "tbsp", category: "pantry" },
      ],
    },
    {
      title: "Korean Beef Bulgogi",
      description:
        "Thinly sliced beef marinated in a sweet soy-pear sauce, seared until caramelized. Served with rice and kimchi.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      difficulty: "medium",
      cuisine: "Korean",
      category: "dinner",
      isFavorite: true,
      timesCooked: 3,
      lastCookedAt: daysAgo(11),
      tags: ["Date Night"],
      ingredients: [
        { name: "Ribeye Steak", quantity: 1.5, unit: "lb", note: "thinly sliced", category: "protein" },
        { name: "Asian Pear", quantity: 1, unit: "pcs", note: "grated", category: "produce" },
        { name: "Soy Sauce", quantity: 4, unit: "tbsp", category: "pantry" },
        { name: "Brown Sugar", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Sesame Oil", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Garlic", quantity: 5, unit: "cloves", category: "produce" },
        { name: "Green Onions", quantity: 4, unit: "pcs", category: "produce" },
        { name: "Rice", quantity: 1.5, unit: "cup", category: "pantry" },
      ],
    },
    {
      title: "Vegetable Curry",
      description:
        "A rich and aromatic coconut curry brimming with chickpeas, sweet potato, and spinach. Warming and deeply satisfying.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 25,
      difficulty: "medium",
      cuisine: "Indian",
      category: "dinner",
      isFavorite: false,
      timesCooked: 4,
      lastCookedAt: daysAgo(6),
      tags: ["Health-Conscious"],
      ingredients: [
        { name: "Chickpeas", quantity: 15, unit: "oz", note: "canned, drained", category: "pantry" },
        { name: "Sweet Potato", quantity: 1, unit: "pcs", note: "cubed", category: "produce" },
        { name: "Coconut Milk", quantity: 14, unit: "oz", category: "pantry" },
        { name: "Baby Spinach", quantity: 2, unit: "cup", category: "produce" },
        { name: "Curry Paste", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Garlic", quantity: 3, unit: "cloves", category: "produce" },
        { name: "Fresh Ginger", quantity: 1, unit: "tbsp", note: "grated", category: "produce" },
        { name: "Basmati Rice", quantity: 1, unit: "cup", category: "pantry" },
      ],
    },
    {
      title: "BLT Wraps",
      description:
        "Classic bacon, lettuce, and tomato wrapped in a flour tortilla with garlic aioli. The easiest lunch on the planet.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      difficulty: "easy",
      cuisine: "American",
      category: "lunch",
      isFavorite: false,
      timesCooked: 5,
      lastCookedAt: daysAgo(1),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Bacon", quantity: 8, unit: "slices", category: "protein" },
        { name: "Romaine Lettuce", quantity: 4, unit: "leaves", category: "produce" },
        { name: "Tomato", quantity: 1, unit: "pcs", note: "sliced", category: "produce" },
        { name: "Flour Tortillas", quantity: 4, unit: "pcs", category: "pantry" },
        { name: "Mayonnaise", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Garlic Powder", quantity: 0.25, unit: "tsp", category: "spice" },
      ],
    },
    // Two incomplete meals imported from social media
    {
      title: "Crispy Chili Oil Noodles",
      description:
        "Spicy, garlicky noodles tossed in homemade chili oil. Saw this on Instagram and need to try it.",
      sourceUrl: "https://www.instagram.com/p/ABC123example/",
      sourceType: "instagram",
      isComplete: false,
      difficulty: "medium",
      cuisine: "Chinese",
      category: "dinner",
      isFavorite: false,
      timesCooked: 0,
      lastCookedAt: null,
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Lo Mein Noodles", quantity: 12, unit: "oz", category: "pantry" },
        { name: "Chili Flakes", quantity: 2, unit: "tbsp", category: "spice" },
        { name: "Garlic", quantity: 4, unit: "cloves", category: "produce" },
        { name: "Soy Sauce", quantity: 2, unit: "tbsp", category: "pantry" },
      ],
    },
    {
      title: "Smash Burger Tacos",
      description:
        "Crispy smash burger patties served in corn tortillas with special sauce. Trending everywhere right now.",
      sourceUrl: "https://www.instagram.com/reel/XYZ789example/",
      sourceType: "instagram",
      isComplete: false,
      difficulty: "easy",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 0,
      lastCookedAt: null,
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Ground Beef", quantity: 1, unit: "lb", category: "protein" },
        { name: "Corn Tortillas", quantity: 8, unit: "pcs", category: "pantry" },
        { name: "American Cheese", quantity: 4, unit: "slices", category: "dairy" },
        { name: "Pickles", quantity: 0.25, unit: "cup", note: "diced", category: "produce" },
        { name: "Special Sauce", quantity: 0.25, unit: "cup", note: "mayo + ketchup + relish", category: "pantry" },
      ],
    },
  ];

  const createdMeals: Array<{ id: string; title: string }> = [];

  for (const m of mealsData) {
    const meal = await prisma.meal.create({
      data: {
        title: m.title,
        description: m.description,
        sourceUrl: m.sourceUrl ?? null,
        sourceType: m.sourceType ?? null,
        prepTimeMinutes: m.prepTimeMinutes ?? null,
        cookTimeMinutes: m.cookTimeMinutes ?? null,
        difficulty: m.difficulty,
        cuisine: m.cuisine,
        category: m.category,
        isFavorite: m.isFavorite,
        isComplete: m.isComplete ?? true,
        timesCooked: m.timesCooked,
        lastCookedAt: m.lastCookedAt ?? null,
        tags: {
          create: m.tags.map((tagName) => ({
            tagId: tags[tagName].id,
          })),
        },
        ingredients: {
          create: m.ingredients.map((ing) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            note: ing.note ?? null,
            category: ing.category,
          })),
        },
      },
    });
    createdMeals.push({ id: meal.id, title: meal.title });
  }

  console.log(`Created ${createdMeals.length} meals.`);

  // ── WeekPlan ──────────────────────────────────────────────────────────
  // Current week: find the Monday of this week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weekPlan = await prisma.weekPlan.create({
    data: {
      weekStart: monday,
    },
  });

  // Pick 5 meals for Mon-Fri
  const planAssignments = [
    { dayOfWeek: 0, title: "Chicken Tacos" },           // Monday
    { dayOfWeek: 1, title: "Vegetable Curry" },          // Tuesday
    { dayOfWeek: 2, title: "One-Pot Chicken Alfredo" },  // Wednesday
    { dayOfWeek: 4, title: "Salmon Teriyaki Bowl" },     // Friday
    { dayOfWeek: 5, title: "Homemade Pizza" },           // Saturday
  ];

  let entriesCreated = 0;
  for (const assignment of planAssignments) {
    const meal = createdMeals.find((m) => m.title === assignment.title);
    if (meal) {
      await prisma.planEntry.create({
        data: {
          weekPlanId: weekPlan.id,
          mealId: meal.id,
          dayOfWeek: assignment.dayOfWeek,
          slot: "dinner",
          sortOrder: 0,
        },
      });
      entriesCreated++;
    }
  }

  console.log(`Created 1 week plan with ${entriesCreated} entries.`);
  console.log("\nSeed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
