import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";

export async function getConsoleAccountId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const accountId = (session?.user as { id?: string } | undefined)?.id;
  if (!accountId) redirect("/login");
  return accountId;
}
