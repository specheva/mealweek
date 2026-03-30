import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { MealForm } from "@/components/meals/MealForm";

interface Props {
  params: { id: string };
}

export default async function EditMealPage({ params }: Props) {
  const [meal, tags] = await Promise.all([
    prisma.meal.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        ingredients: true,
      },
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  if (!meal) {
    notFound();
  }

  return <MealForm meal={meal} tags={tags} />;
}
