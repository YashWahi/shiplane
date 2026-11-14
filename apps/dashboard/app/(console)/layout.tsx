import React from "react";
import { ConsoleNav } from "@/components/console-nav";
import { getConsoleAccountId } from "@/lib/console-auth";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getConsoleAccountId();
  return <ConsoleNav>{children}</ConsoleNav>;
}
