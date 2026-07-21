import { createAuthClient } from "better-auth/react";

export const client = createAuthClient({});

export const { signUp, signIn, signOut, useSession } = client;