import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { auth } from ".";

export const getUserAuth = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return { session };
};

export const checkAuth = async () => {
  const { session } = await getUserAuth();
  if (!session) redirect(routes.register);
};
