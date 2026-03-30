import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { MealDetail } from "@/components/catalog/MealDetail";

interface Props {
  params: { id: string };
}

export default async function MealDetailPage({ params }: Props) {
  const meal = await prisma.meal.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      ingredients: true,
    },
  });

  if (!meal) {
    notFound();
  }

  return <MealDetail meal={meal} />;
}
