import "dotenv/config";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in your environment before running this bootstrap.");
  }

  const normalizedEmail = normalizeEmail(email);

  const existingUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    username: users.username,
  }).from(users);

  if (existingUsers.length === 0) {
    const response = await auth.api.signUpEmail({
      body: {
        name: "",
        email: normalizedEmail,
        password,
      },
    });

    console.log(`Created admin user ${response.user.email}.`);
    return;
  }

  const matchingUser = existingUsers.find((user) => normalizeEmail(user.email) === normalizedEmail);

  if (!matchingUser) {
    const existingSummary = existingUsers.map((user) => user.email).join(", ");
    throw new Error(
      `An admin bootstrap user already exists with a different email. Expected ${normalizedEmail}, found: ${existingSummary || "none"}.`
    );
  }

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(password);

  const credentialAccounts = (await ctx.internalAdapter.findAccounts(matchingUser.id)).filter(
    (account) => account.providerId === "credential"
  );

  if (credentialAccounts.length > 0) {
    await ctx.internalAdapter.updateAccount(credentialAccounts[0].id, { password: passwordHash });
  } else {
    await ctx.internalAdapter.linkAccount({
      userId: matchingUser.id,
      providerId: "credential",
      accountId: matchingUser.id,
      password: passwordHash,
    });
  }

  console.log(`Updated admin user ${matchingUser.email} and refreshed the password and profile details.`);
}

main()
  .catch((error) => {
    console.error("[bootstrap-admin] Error:", error);
    process.exit(1);
  });
