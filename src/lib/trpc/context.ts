import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type SessionResult = Awaited<ReturnType<typeof auth.api.getSession>>;

export type Context = {
  session: NonNullable<SessionResult> | null;
};

export const createContext = async (): Promise<Context> => {
  const session = await auth.api.getSession({ headers: await headers() });
  return { session };
};
