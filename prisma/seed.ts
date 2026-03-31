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
    // 1. Spaghetti & Meatballs
    {
      title: "Spaghetti & Meatballs",
      description:
        "Classic Italian-American comfort food with tender homemade meatballs in a rich marinara sauce over spaghetti. A family favorite that never gets old.",
      prepTimeMinutes: 20,
      cookTimeMinutes: 30,
      difficulty: "easy",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: true,
      timesCooked: 12,
      lastCookedAt: daysAgo(5),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Ground Beef", quantity: 1, unit: "lb", category: "protein" },
        { name: "Spaghetti", quantity: 1, unit: "lb", category: "pantry" },
        { name: "Marinara Sauce", quantity: 24, unit: "oz", category: "pantry" },
        { name: "Breadcrumbs", quantity: 0.5, unit: "cup", category: "pantry" },
        { name: "Parmesan Cheese", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Egg", quantity: 1, unit: "pcs", category: "protein" },
        { name: "Garlic", quantity: 4, unit: "cloves", category: "produce" },
        { name: "Italian Seasoning", quantity: 1, unit: "tbsp", category: "spice" },
      ],
    },
    // 2. Chicken Stir Fry
    {
      title: "Chicken Stir Fry",
      description:
        "Tender chicken and crisp vegetables tossed in a savory soy-ginger sauce. A quick weeknight staple that beats takeout every time.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      difficulty: "medium",
      cuisine: "Chinese",
      category: "dinner",
      isFavorite: false,
      timesCooked: 7,
      lastCookedAt: daysAgo(8),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Broccoli Florets", quantity: 2, unit: "cup", category: "produce" },
        { name: "Bell Pepper", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Soy Sauce", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Fresh Ginger", quantity: 1, unit: "tbsp", note: "minced", category: "produce" },
        { name: "Garlic", quantity: 3, unit: "cloves", category: "produce" },
        { name: "Cornstarch", quantity: 1, unit: "tbsp", category: "pantry" },
        { name: "Sesame Oil", quantity: 1, unit: "tsp", category: "pantry" },
      ],
    },
    // 3. Tacos
    {
      title: "Tacos",
      description:
        "Seasoned ground beef in warm tortillas with all the classic toppings. The ultimate easy weeknight dinner the whole family loves.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: "easy",
      cuisine: "Mexican",
      category: "dinner",
      isFavorite: true,
      timesCooked: 15,
      lastCookedAt: daysAgo(3),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Ground Beef", quantity: 1, unit: "lb", category: "protein" },
        { name: "Taco Shells", quantity: 12, unit: "pcs", category: "pantry" },
        { name: "Shredded Cheddar", quantity: 1, unit: "cup", category: "dairy" },
        { name: "Lettuce", quantity: 2, unit: "cup", note: "shredded", category: "produce" },
        { name: "Tomato", quantity: 2, unit: "pcs", note: "diced", category: "produce" },
        { name: "Sour Cream", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Taco Seasoning", quantity: 1, unit: "packet", category: "spice" },
      ],
    },
    // 4. Grilled Cheese & Tomato Soup
    {
      title: "Grilled Cheese & Tomato Soup",
      description:
        "Buttery, golden grilled cheese sandwiches paired with creamy homemade tomato soup. Pure comfort in a bowl.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      difficulty: "easy",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 9,
      lastCookedAt: daysAgo(6),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Sourdough Bread", quantity: 8, unit: "slices", category: "pantry" },
        { name: "Cheddar Cheese", quantity: 8, unit: "slices", category: "dairy" },
        { name: "Butter", quantity: 4, unit: "tbsp", category: "dairy" },
        { name: "Crushed Tomatoes", quantity: 28, unit: "oz", note: "canned", category: "pantry" },
        { name: "Heavy Cream", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Garlic", quantity: 2, unit: "cloves", category: "produce" },
        { name: "Basil", quantity: 1, unit: "tsp", note: "dried", category: "spice" },
      ],
    },
    // 5. Mac & Cheese
    {
      title: "Mac & Cheese",
      description:
        "Creamy, cheesy baked macaroni with a golden breadcrumb crust. The ultimate crowd-pleaser for kids and adults alike.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 25,
      difficulty: "easy",
      cuisine: "American",
      category: "dinner",
      isFavorite: true,
      timesCooked: 14,
      lastCookedAt: daysAgo(4),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Elbow Macaroni", quantity: 1, unit: "lb", category: "pantry" },
        { name: "Sharp Cheddar", quantity: 2, unit: "cup", note: "shredded", category: "dairy" },
        { name: "Whole Milk", quantity: 2, unit: "cup", category: "dairy" },
        { name: "Butter", quantity: 3, unit: "tbsp", category: "dairy" },
        { name: "All-Purpose Flour", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Breadcrumbs", quantity: 0.5, unit: "cup", category: "pantry" },
        { name: "Mustard Powder", quantity: 0.5, unit: "tsp", category: "spice" },
      ],
    },
    // 6. BBQ Chicken
    {
      title: "BBQ Chicken",
      description:
        "Juicy chicken thighs glazed with smoky BBQ sauce, perfect for meal prepping lunches all week. Great with coleslaw and cornbread.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 35,
      difficulty: "medium",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 6,
      lastCookedAt: daysAgo(11),
      tags: ["Meal Prep"],
      ingredients: [
        { name: "Chicken Thighs", quantity: 2, unit: "lb", category: "protein" },
        { name: "BBQ Sauce", quantity: 1, unit: "cup", category: "pantry" },
        { name: "Brown Sugar", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Apple Cider Vinegar", quantity: 1, unit: "tbsp", category: "pantry" },
        { name: "Smoked Paprika", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Garlic Powder", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Onion Powder", quantity: 0.5, unit: "tsp", category: "spice" },
      ],
    },
    // 7. Chicken Parmesan
    {
      title: "Chicken Parmesan",
      description:
        "Crispy breaded chicken cutlets topped with marinara and melted mozzarella. Serve over spaghetti for a restaurant-worthy dinner.",
      prepTimeMinutes: 20,
      cookTimeMinutes: 25,
      difficulty: "medium",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: true,
      timesCooked: 8,
      lastCookedAt: daysAgo(9),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Breadcrumbs", quantity: 1, unit: "cup", category: "pantry" },
        { name: "Marinara Sauce", quantity: 16, unit: "oz", category: "pantry" },
        { name: "Mozzarella Cheese", quantity: 1, unit: "cup", note: "shredded", category: "dairy" },
        { name: "Parmesan Cheese", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Eggs", quantity: 2, unit: "pcs", category: "protein" },
        { name: "Olive Oil", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Italian Seasoning", quantity: 1, unit: "tsp", category: "spice" },
      ],
    },
    // 8. Beef Stew
    {
      title: "Beef Stew",
      description:
        "Hearty chunks of beef slow-cooked with potatoes, carrots, and onions in a rich savory broth. Worth the wait on a cold evening.",
      prepTimeMinutes: 25,
      cookTimeMinutes: 120,
      difficulty: "hard",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 3,
      lastCookedAt: daysAgo(18),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Beef Chuck", quantity: 2, unit: "lb", note: "cubed", category: "protein" },
        { name: "Russet Potatoes", quantity: 3, unit: "pcs", note: "cubed", category: "produce" },
        { name: "Carrots", quantity: 4, unit: "pcs", note: "sliced", category: "produce" },
        { name: "Yellow Onion", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Beef Broth", quantity: 4, unit: "cup", category: "pantry" },
        { name: "Tomato Paste", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Garlic", quantity: 3, unit: "cloves", category: "produce" },
        { name: "Thyme", quantity: 1, unit: "tsp", note: "dried", category: "spice" },
      ],
    },
    // 9. Salmon with Roasted Veggies
    {
      title: "Salmon with Roasted Veggies",
      description:
        "Perfectly seared salmon fillets served alongside colorful roasted seasonal vegetables. A healthy, satisfying dinner on one sheet pan.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 25,
      difficulty: "medium",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 5,
      lastCookedAt: daysAgo(7),
      tags: ["Health-Conscious"],
      ingredients: [
        { name: "Salmon Fillets", quantity: 4, unit: "pcs", category: "protein" },
        { name: "Asparagus", quantity: 1, unit: "bunch", category: "produce" },
        { name: "Cherry Tomatoes", quantity: 1, unit: "cup", category: "produce" },
        { name: "Zucchini", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Olive Oil", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Lemon", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Garlic Powder", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Salt and Pepper", quantity: 1, unit: "tsp", category: "spice" },
      ],
    },
    // 10. Chicken Caesar Salad
    {
      title: "Chicken Caesar Salad",
      description:
        "Crisp romaine, grilled chicken, shaved parmesan, and crunchy croutons tossed in creamy Caesar dressing. Light but filling.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      difficulty: "easy",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 4,
      lastCookedAt: daysAgo(10),
      tags: ["Health-Conscious"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1, unit: "lb", category: "protein" },
        { name: "Romaine Lettuce", quantity: 2, unit: "heads", category: "produce" },
        { name: "Parmesan Cheese", quantity: 0.5, unit: "cup", note: "shaved", category: "dairy" },
        { name: "Croutons", quantity: 1, unit: "cup", category: "pantry" },
        { name: "Caesar Dressing", quantity: 0.5, unit: "cup", category: "pantry" },
        { name: "Lemon", quantity: 1, unit: "pcs", category: "produce" },
      ],
    },
    // 11. Burrito Bowls
    {
      title: "Burrito Bowls",
      description:
        "Build-your-own bowls with seasoned rice, black beans, chicken, and all the fixings. Meal prep these on Sunday for easy weekday lunches.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      difficulty: "easy",
      cuisine: "Mexican",
      category: "dinner",
      isFavorite: true,
      timesCooked: 10,
      lastCookedAt: daysAgo(2),
      tags: ["Meal Prep"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Rice", quantity: 2, unit: "cup", category: "pantry" },
        { name: "Black Beans", quantity: 15, unit: "oz", note: "canned, drained", category: "pantry" },
        { name: "Corn Kernels", quantity: 1, unit: "cup", category: "produce" },
        { name: "Salsa", quantity: 1, unit: "cup", category: "pantry" },
        { name: "Shredded Cheddar", quantity: 1, unit: "cup", category: "dairy" },
        { name: "Cumin", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Lime", quantity: 2, unit: "pcs", category: "produce" },
      ],
    },
    // 12. Teriyaki Chicken
    {
      title: "Teriyaki Chicken",
      description:
        "Sweet and savory glazed chicken thighs with steamed rice and broccoli. Great for prepping containers for the whole week.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 25,
      difficulty: "medium",
      cuisine: "Japanese",
      category: "dinner",
      isFavorite: false,
      timesCooked: 6,
      lastCookedAt: daysAgo(12),
      tags: ["Meal Prep"],
      ingredients: [
        { name: "Chicken Thighs", quantity: 2, unit: "lb", category: "protein" },
        { name: "Soy Sauce", quantity: 0.25, unit: "cup", category: "pantry" },
        { name: "Mirin", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Brown Sugar", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Rice", quantity: 2, unit: "cup", category: "pantry" },
        { name: "Broccoli Florets", quantity: 3, unit: "cup", category: "produce" },
        { name: "Fresh Ginger", quantity: 1, unit: "tbsp", note: "grated", category: "produce" },
        { name: "Sesame Seeds", quantity: 1, unit: "tbsp", category: "spice" },
      ],
    },
    // 13. Pizza (homemade)
    {
      title: "Homemade Pizza",
      description:
        "Classic margherita pizza with a crispy homemade crust, San Marzano sauce, and fresh mozzarella. Friday night tradition.",
      prepTimeMinutes: 20,
      cookTimeMinutes: 15,
      difficulty: "medium",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: true,
      timesCooked: 11,
      lastCookedAt: daysAgo(7),
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
    // 14. Shrimp Scampi
    {
      title: "Shrimp Scampi",
      description:
        "Succulent shrimp sauteed in garlic butter and white wine over linguine. An elegant date night dinner that comes together in 20 minutes.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 12,
      difficulty: "medium",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: false,
      timesCooked: 3,
      lastCookedAt: daysAgo(15),
      tags: ["Date Night"],
      ingredients: [
        { name: "Large Shrimp", quantity: 1.5, unit: "lb", note: "peeled and deveined", category: "protein" },
        { name: "Linguine", quantity: 12, unit: "oz", category: "pantry" },
        { name: "Butter", quantity: 4, unit: "tbsp", category: "dairy" },
        { name: "Garlic", quantity: 6, unit: "cloves", note: "minced", category: "produce" },
        { name: "White Wine", quantity: 0.5, unit: "cup", category: "pantry" },
        { name: "Lemon", quantity: 2, unit: "pcs", category: "produce" },
        { name: "Red Pepper Flakes", quantity: 0.25, unit: "tsp", category: "spice" },
        { name: "Fresh Parsley", quantity: 0.25, unit: "cup", note: "chopped", category: "produce" },
      ],
    },
    // 15. Chili
    {
      title: "Chili",
      description:
        "A big-batch beef and bean chili loaded with tomatoes and spices. Makes great leftovers and freezes beautifully for busy weeks.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 45,
      difficulty: "easy",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 8,
      lastCookedAt: daysAgo(14),
      tags: ["Meal Prep"],
      ingredients: [
        { name: "Ground Beef", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Kidney Beans", quantity: 30, unit: "oz", note: "canned, drained", category: "pantry" },
        { name: "Diced Tomatoes", quantity: 28, unit: "oz", note: "canned", category: "pantry" },
        { name: "Yellow Onion", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Garlic", quantity: 4, unit: "cloves", category: "produce" },
        { name: "Chili Powder", quantity: 2, unit: "tbsp", category: "spice" },
        { name: "Cumin", quantity: 1, unit: "tbsp", category: "spice" },
      ],
    },
    // 16. Fried Rice
    {
      title: "Fried Rice",
      description:
        "The perfect way to use leftover rice. Scrambled eggs, veggies, and soy sauce come together in a hot wok for a fast, delicious meal.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      difficulty: "easy",
      cuisine: "Chinese",
      category: "dinner",
      isFavorite: false,
      timesCooked: 9,
      lastCookedAt: daysAgo(5),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Cooked Rice", quantity: 4, unit: "cup", note: "day-old preferred", category: "pantry" },
        { name: "Eggs", quantity: 3, unit: "pcs", category: "protein" },
        { name: "Frozen Peas and Carrots", quantity: 1, unit: "cup", category: "produce" },
        { name: "Soy Sauce", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Sesame Oil", quantity: 1, unit: "tsp", category: "pantry" },
        { name: "Green Onions", quantity: 3, unit: "pcs", category: "produce" },
        { name: "Garlic", quantity: 2, unit: "cloves", category: "produce" },
      ],
    },
    // 17. Chicken Pot Pie
    {
      title: "Chicken Pot Pie",
      description:
        "Tender chicken and vegetables in a creamy sauce tucked under a flaky golden pie crust. The ultimate comfort food that warms the soul.",
      prepTimeMinutes: 25,
      cookTimeMinutes: 45,
      difficulty: "hard",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 2,
      lastCookedAt: daysAgo(22),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", note: "cooked and shredded", category: "protein" },
        { name: "Pie Crust", quantity: 2, unit: "pcs", note: "store-bought", category: "pantry" },
        { name: "Frozen Mixed Vegetables", quantity: 2, unit: "cup", category: "produce" },
        { name: "Butter", quantity: 4, unit: "tbsp", category: "dairy" },
        { name: "All-Purpose Flour", quantity: 0.33, unit: "cup", category: "pantry" },
        { name: "Chicken Broth", quantity: 1.5, unit: "cup", category: "pantry" },
        { name: "Heavy Cream", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Salt and Pepper", quantity: 1, unit: "tsp", category: "spice" },
      ],
    },
    // 18. Grilled Steak & Potatoes
    {
      title: "Grilled Steak & Potatoes",
      description:
        "A perfectly seasoned ribeye with crispy roasted potatoes and a side of sauteed garlic butter asparagus. Date night done right.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 25,
      difficulty: "medium",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 4,
      lastCookedAt: daysAgo(16),
      tags: ["Date Night"],
      ingredients: [
        { name: "Ribeye Steak", quantity: 2, unit: "pcs", note: "1 inch thick", category: "protein" },
        { name: "Baby Potatoes", quantity: 1.5, unit: "lb", note: "halved", category: "produce" },
        { name: "Asparagus", quantity: 1, unit: "bunch", category: "produce" },
        { name: "Butter", quantity: 3, unit: "tbsp", category: "dairy" },
        { name: "Garlic", quantity: 4, unit: "cloves", category: "produce" },
        { name: "Olive Oil", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Fresh Rosemary", quantity: 2, unit: "sprigs", category: "produce" },
        { name: "Salt and Pepper", quantity: 1, unit: "tbsp", category: "spice" },
      ],
    },
    // 19. Fish Tacos
    {
      title: "Fish Tacos",
      description:
        "Flaky white fish with tangy slaw and creamy chipotle sauce in warm corn tortillas. Light, fresh, and full of flavor.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 10,
      difficulty: "easy",
      cuisine: "Mexican",
      category: "dinner",
      isFavorite: false,
      timesCooked: 5,
      lastCookedAt: daysAgo(13),
      tags: ["Health-Conscious"],
      ingredients: [
        { name: "Cod Fillets", quantity: 1, unit: "lb", category: "protein" },
        { name: "Corn Tortillas", quantity: 8, unit: "pcs", category: "pantry" },
        { name: "Cabbage", quantity: 2, unit: "cup", note: "shredded", category: "produce" },
        { name: "Lime", quantity: 2, unit: "pcs", category: "produce" },
        { name: "Sour Cream", quantity: 0.25, unit: "cup", category: "dairy" },
        { name: "Chipotle Pepper", quantity: 1, unit: "pcs", note: "canned in adobo", category: "pantry" },
        { name: "Cumin", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Cilantro", quantity: 0.25, unit: "cup", category: "produce" },
      ],
    },
    // 20. Pulled Pork Sandwiches
    {
      title: "Pulled Pork Sandwiches",
      description:
        "Fork-tender slow-cooked pork shoulder in smoky BBQ sauce piled high on soft buns. Make a big batch and eat all week.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 480,
      difficulty: "hard",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 2,
      lastCookedAt: daysAgo(25),
      tags: ["Meal Prep"],
      ingredients: [
        { name: "Pork Shoulder", quantity: 4, unit: "lb", category: "protein" },
        { name: "BBQ Sauce", quantity: 1.5, unit: "cup", category: "pantry" },
        { name: "Hamburger Buns", quantity: 8, unit: "pcs", category: "pantry" },
        { name: "Apple Cider Vinegar", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Brown Sugar", quantity: 3, unit: "tbsp", category: "pantry" },
        { name: "Smoked Paprika", quantity: 1, unit: "tbsp", category: "spice" },
        { name: "Garlic Powder", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Yellow Onion", quantity: 1, unit: "pcs", category: "produce" },
      ],
    },
    // 21. Pesto Pasta
    {
      title: "Pesto Pasta",
      description:
        "Simple penne tossed with bright basil pesto, cherry tomatoes, and fresh parmesan. On the table in 15 minutes flat.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      difficulty: "easy",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: false,
      timesCooked: 7,
      lastCookedAt: daysAgo(4),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Penne Pasta", quantity: 1, unit: "lb", category: "pantry" },
        { name: "Basil Pesto", quantity: 0.5, unit: "cup", category: "pantry" },
        { name: "Cherry Tomatoes", quantity: 1, unit: "cup", note: "halved", category: "produce" },
        { name: "Parmesan Cheese", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Pine Nuts", quantity: 2, unit: "tbsp", note: "toasted", category: "pantry" },
        { name: "Garlic", quantity: 2, unit: "cloves", category: "produce" },
        { name: "Olive Oil", quantity: 2, unit: "tbsp", category: "pantry" },
      ],
    },
    // 22. Greek Salad with Grilled Chicken
    {
      title: "Greek Salad with Grilled Chicken",
      description:
        "Herb-marinated grilled chicken over a bed of crisp cucumbers, tomatoes, olives, and feta with a tangy red wine vinaigrette.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      difficulty: "easy",
      cuisine: "Mediterranean",
      category: "dinner",
      isFavorite: false,
      timesCooked: 4,
      lastCookedAt: daysAgo(8),
      tags: ["Health-Conscious"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Cucumber", quantity: 1, unit: "pcs", note: "diced", category: "produce" },
        { name: "Cherry Tomatoes", quantity: 1, unit: "cup", category: "produce" },
        { name: "Kalamata Olives", quantity: 0.5, unit: "cup", category: "pantry" },
        { name: "Feta Cheese", quantity: 0.5, unit: "cup", note: "crumbled", category: "dairy" },
        { name: "Red Onion", quantity: 0.25, unit: "pcs", note: "thinly sliced", category: "produce" },
        { name: "Red Wine Vinegar", quantity: 2, unit: "tbsp", category: "pantry" },
        { name: "Oregano", quantity: 1, unit: "tsp", note: "dried", category: "spice" },
      ],
    },
    // 23. Chicken Fajitas
    {
      title: "Chicken Fajitas",
      description:
        "Sizzling strips of chicken with peppers and onions, seasoned with smoky spices. Serve with warm tortillas and all the toppings.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 12,
      difficulty: "easy",
      cuisine: "Mexican",
      category: "dinner",
      isFavorite: false,
      timesCooked: 6,
      lastCookedAt: daysAgo(9),
      tags: ["Quick & Easy"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", note: "sliced", category: "protein" },
        { name: "Bell Peppers", quantity: 3, unit: "pcs", note: "mixed colors", category: "produce" },
        { name: "Yellow Onion", quantity: 1, unit: "pcs", note: "sliced", category: "produce" },
        { name: "Flour Tortillas", quantity: 8, unit: "pcs", category: "pantry" },
        { name: "Lime", quantity: 1, unit: "pcs", category: "produce" },
        { name: "Chili Powder", quantity: 1, unit: "tbsp", category: "spice" },
        { name: "Cumin", quantity: 1, unit: "tsp", category: "spice" },
        { name: "Sour Cream", quantity: 0.25, unit: "cup", category: "dairy" },
      ],
    },
    // 24. Meatloaf
    {
      title: "Meatloaf",
      description:
        "Old-fashioned glazed meatloaf with mashed potatoes. A nostalgic American dinner that brings the whole family to the table.",
      prepTimeMinutes: 15,
      cookTimeMinutes: 55,
      difficulty: "medium",
      cuisine: "American",
      category: "dinner",
      isFavorite: false,
      timesCooked: 3,
      lastCookedAt: daysAgo(20),
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Ground Beef", quantity: 2, unit: "lb", category: "protein" },
        { name: "Breadcrumbs", quantity: 0.75, unit: "cup", category: "pantry" },
        { name: "Eggs", quantity: 2, unit: "pcs", category: "protein" },
        { name: "Ketchup", quantity: 0.5, unit: "cup", category: "pantry" },
        { name: "Yellow Onion", quantity: 1, unit: "pcs", note: "diced", category: "produce" },
        { name: "Worcestershire Sauce", quantity: 1, unit: "tbsp", category: "pantry" },
        { name: "Garlic Powder", quantity: 1, unit: "tsp", category: "spice" },
      ],
    },
    // 25. Lemon Herb Salmon
    {
      title: "Lemon Herb Salmon",
      description:
        "Elegant salmon fillets with a bright lemon-herb butter, pan-seared to perfection. A sophisticated yet simple date night centerpiece.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 15,
      difficulty: "medium",
      cuisine: "American",
      category: "dinner",
      isFavorite: true,
      timesCooked: 4,
      lastCookedAt: daysAgo(11),
      tags: ["Date Night"],
      ingredients: [
        { name: "Salmon Fillets", quantity: 2, unit: "pcs", note: "6 oz each", category: "protein" },
        { name: "Lemon", quantity: 2, unit: "pcs", category: "produce" },
        { name: "Butter", quantity: 3, unit: "tbsp", category: "dairy" },
        { name: "Fresh Dill", quantity: 2, unit: "tbsp", note: "chopped", category: "produce" },
        { name: "Fresh Thyme", quantity: 3, unit: "sprigs", category: "produce" },
        { name: "Garlic", quantity: 3, unit: "cloves", category: "produce" },
        { name: "Olive Oil", quantity: 1, unit: "tbsp", category: "pantry" },
        { name: "Salt and Pepper", quantity: 1, unit: "tsp", category: "spice" },
      ],
    },
    // Two incomplete meals imported from social media
    {
      title: "Birria Tacos",
      description:
        "Slow-braised beef birria stuffed into crispy cheese-crusted tortillas with a rich consomme for dipping. Saw this on Instagram.",
      sourceUrl: "https://www.instagram.com/p/BirriaTacos2026/",
      sourceType: "instagram",
      isComplete: false,
      difficulty: "hard",
      cuisine: "Mexican",
      category: "dinner",
      isFavorite: false,
      timesCooked: 0,
      lastCookedAt: null,
      tags: ["Comfort Food"],
      ingredients: [
        { name: "Beef Chuck", quantity: 3, unit: "lb", category: "protein" },
        { name: "Dried Guajillo Chiles", quantity: 4, unit: "pcs", category: "spice" },
        { name: "Corn Tortillas", quantity: 12, unit: "pcs", category: "pantry" },
        { name: "Oaxaca Cheese", quantity: 8, unit: "oz", category: "dairy" },
      ],
    },
    {
      title: "Marry Me Chicken",
      description:
        "Creamy sun-dried tomato and basil chicken that went viral. Need to try this for date night.",
      sourceUrl: "https://www.instagram.com/reel/MarryMeChicken2026/",
      sourceType: "instagram",
      isComplete: false,
      difficulty: "medium",
      cuisine: "Italian",
      category: "dinner",
      isFavorite: false,
      timesCooked: 0,
      lastCookedAt: null,
      tags: ["Date Night"],
      ingredients: [
        { name: "Chicken Breast", quantity: 1.5, unit: "lb", category: "protein" },
        { name: "Sun-Dried Tomatoes", quantity: 0.5, unit: "cup", category: "pantry" },
        { name: "Heavy Cream", quantity: 1, unit: "cup", category: "dairy" },
        { name: "Parmesan Cheese", quantity: 0.5, unit: "cup", category: "dairy" },
        { name: "Fresh Basil", quantity: 0.25, unit: "cup", category: "produce" },
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
            note: (ing as any).note ?? null,
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

  // Pick 7 meals for Mon-Sun (good variety of tags and cuisines)
  const planAssignments = [
    { dayOfWeek: 0, title: "Chicken Stir Fry" },              // Monday
    { dayOfWeek: 1, title: "Burrito Bowls" },                  // Tuesday
    { dayOfWeek: 2, title: "Salmon with Roasted Veggies" },    // Wednesday
    { dayOfWeek: 3, title: "Spaghetti & Meatballs" },         // Thursday
    { dayOfWeek: 4, title: "Shrimp Scampi" },                 // Friday
    { dayOfWeek: 5, title: "Homemade Pizza" },                 // Saturday
    { dayOfWeek: 6, title: "Chicken Caesar Salad" },           // Sunday
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
