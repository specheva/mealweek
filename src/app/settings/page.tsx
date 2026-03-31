import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsPage } from "@/components/settings/SettingsPage";

export const dynamic = "force-dynamic";

export default async function SettingsRoute() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session as any).userId;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) redirect("/login");

  const household = user.householdId
    ? await prisma.household.findUnique({
        where: { id: user.householdId },
        include: {
          members: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      })
    : null;

  return (
    <SettingsPage
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }}
      household={
        household
          ? {
              id: household.id,
              name: household.name,
              members: household.members,
            }
          : null
      }
    />
  );
}
