import { prisma } from "@/lib/db";
import { MealGrid } from "@/components/catalog/MealGrid";

export default async function CatalogPage() {
  const [meals, tags] = await Promise.all([
    prisma.meal.findMany({
      include: {
        tags: { include: { tag: true } },
        ingredients: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return <MealGrid meals={meals} tags={tags} />;
}
