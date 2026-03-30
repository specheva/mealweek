import { prisma } from "@/lib/db";
import { MealForm } from "@/components/meals/MealForm";

interface Props {
  searchParams: { import?: string };
}

export default async function NewMealPage({ searchParams }: Props) {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  return <MealForm tags={tags} showImport={searchParams.import === "true"} />;
}
