import "dotenv/config";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function sanitizeUsername(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_.-]+/g, "")
      .replace(/(^[._-]+|[._-]+$)/g, "") || "admin"
  );
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in your environment before running this bootstrap.",
    );
  }

  const normalizedEmail = normalizeEmail(email);
  const configuredUsername = sanitizeUsername(email.split("@")[0]);
  const configuredName = "Admin User";

  const existingUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      username: users.username,
    })
    .from(users);

  if (existingUsers.length === 0) {
    const response = await auth.api.signUpEmail({
      body: {
        name: configuredName,
        email: normalizedEmail,
        password,
      },
    });

    console.log(
      `Created admin user ${response.user.email} with username ${configuredUsername}.`,
    );
    return;
  }

  const matchingUser = existingUsers.find(
    (user) => normalizeEmail(user.email) === normalizedEmail,
  );

  if (!matchingUser) {
    const existingSummary = existingUsers.map((user) => user.email).join(", ");
    console.warn(
      `[bootstrap-admin] An admin already exists with a different email. Expected ${normalizedEmail}, found: ${existingSummary || "none"}. Keeping the existing admin and skipping bootstrap.`,
    );
    return;
  }

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(password);

  const credentialAccounts = (
    await ctx.internalAdapter.findAccounts(matchingUser.id)
  ).filter((account) => account.providerId === "credential");

  if (credentialAccounts.length > 0) {
    await ctx.internalAdapter.updateAccount(credentialAccounts[0].id, {
      password: passwordHash,
    });
  } else {
    await ctx.internalAdapter.linkAccount({
      userId: matchingUser.id,
      providerId: "credential",
      accountId: matchingUser.id,
      password: passwordHash,
    });
  }

  const updateFields: Partial<Record<string, string>> = {};
  if (matchingUser.name !== configuredName) {
    updateFields.name = configuredName;
  }

  if ((matchingUser.username || "") !== configuredUsername) {
    updateFields.username = configuredUsername;
  }

  if (Object.keys(updateFields).length > 0) {
    await ctx.internalAdapter.updateUser(matchingUser.id, updateFields);
  }

  console.log(
    `Updated admin user ${matchingUser.email} and refreshed the password and profile details.`,
  );
}

main().catch((error) => {
  console.error("[bootstrap-admin] Error:", error);
  process.exit(1);
});
