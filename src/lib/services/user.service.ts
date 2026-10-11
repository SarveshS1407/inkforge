import { prisma } from "../db";
import { NotFoundError } from "../errors";

export async function getOrCreateDefaultUser() {
  const defaultEmail = "author@inkforge.local";
  const defaultUsername = "resident-author";

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ email: defaultEmail }, { username: defaultUsername }],
    },
    include: { profile: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: defaultEmail,
        username: defaultUsername,
        displayName: "Resident Author",
        role: "WRITER",
        bio: "Writing fellow and essayist at the Inkforge Publishing Sanctuary.",
        profile: {
          create: {
            displayName: "Resident Author",
            slug: "resident-author",
            bio: "Writing fellow and essayist at the Inkforge Publishing Sanctuary.",
          },
        },
      },
      include: { profile: true },
    });
  }

  return user;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });

  if (!user) {
    throw new NotFoundError(`User with ID '${id}' not found`);
  }

  return user;
}
