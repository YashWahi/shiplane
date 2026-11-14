import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { generateApiKey } from "./crypto";

const DEMO_EMAIL = "demo@nebula.local";
const localAuthEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.NEBULA_DEV_AUTH === "true" ||
  process.env.ENABLE_DEMO_AUTH === "true";
const googleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);
const nextAuthSecret = process.env.NEXTAUTH_SECRET || "nebula-dev-nextauth-secret-key-32chars";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(googleAuthEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    ...(localAuthEnabled
      ? [
          CredentialsProvider({
            id: "credentials",
            name: "Nebula Demo & Developer Access",
            credentials: {
              email: { label: "Email", type: "email", placeholder: DEMO_EMAIL },
            },
            async authorize(credentials) {
              const rawEmail = credentials?.email?.trim();
              const email = (rawEmail || DEMO_EMAIL).toLowerCase();

              let account = await prisma.account.findUnique({
                where: { email },
              });

              if (!account) {
                account = await prisma.account.create({
                  data: {
                    email,
                    name: email === DEMO_EMAIL ? "Demo User" : "Developer",
                    plan: "PRO",
                    status: "active",
                  },
                });
              }

              // Ensure demo account has an API key
              const existingKey = await prisma.apiKey.findFirst({
                where: { accountId: account.id },
              });
              if (!existingKey) {
                try {
                  const { hashedKey, prefix } = generateApiKey("neb_live");
                  await prisma.apiKey.create({
                    data: {
                      accountId: account.id,
                      name: "Default Demo API Key",
                      hashedKey,
                      prefix,
                      scopes: "deploy,database,secrets,admin",
                    },
                  });
                } catch (keyErr) {
                  console.warn("[Auth] Could not create default API key:", keyErr);
                }
              }

              // Ensure demo account has a sample app
              const existingApp = await prisma.application.findFirst({
                where: { accountId: account.id },
              });
              if (!existingApp) {
                try {
                  await prisma.application.create({
                    data: {
                      accountId: account.id,
                      name: "demo-app",
                      subdomain: "demo",
                      sourceType: "archive",
                      runtime: "Node 20",
                      status: "sleeping",
                      scalingEnabled: true,
                      minInstances: 0,
                      maxInstances: 3,
                      currentInstances: 0,
                      port: 3000,
                    },
                  });
                } catch (appErr) {
                  console.warn("[Auth] Could not create sample app:", appErr);
                }
              }

              return {
                id: account.id,
                email: account.email,
                name: account.name || (email === DEMO_EMAIL ? "Demo User" : "Developer"),
              };
            },
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.trim().toLowerCase();
        if (!email) return false;

        let dbAccount = await prisma.account.findUnique({
          where: { email },
        });

        if (!dbAccount) {
          dbAccount = await prisma.account.create({
            data: {
              email,
              name: user.name || "Google User",
              plan: "PRO",
              status: "active",
            },
          });
        }

        try {
          const existingIdentity = await prisma.accountIdentity.findUnique({
            where: {
              provider_providerSubject: {
                provider: "google",
                providerSubject: account.providerAccountId,
              },
            },
          });

          if (!existingIdentity) {
            await prisma.accountIdentity.create({
              data: {
                accountId: dbAccount.id,
                provider: "google",
                providerSubject: account.providerAccountId,
                email: dbAccount.email,
              },
            });
          }
        } catch (identErr) {
          console.warn("[Auth] Could not link account identity:", identErr);
        }

        user.id = dbAccount.id;
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: nextAuthSecret,
};
