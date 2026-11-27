import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD, DEMO_USERS, seedDemoData } from "./demo-data.mjs";

const prisma = new PrismaClient();

async function main() {
  const created = await seedDemoData(prisma, await bcrypt.hash(DEMO_PASSWORD, 10));
  if (created === 0) console.log("Jobs already seeded, skipping.");
  else console.log(`Seeded ${created} jobs and ${DEMO_USERS.length} users (password: ${DEMO_PASSWORD}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
