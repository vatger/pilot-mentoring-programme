import type { NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import { prisma } from "./prisma";

// Admin CID that can manage other admins
const ADMIN_CIDS = ["1893789"];

export interface VatsimProfile {
  id?: number;
  firstname?: string;
  lastname?: string;
  fullname?: string;
  rating_atc?: number;
  rating_atc_short?: string;
  fir_code?: string;
  data?: {
    cid?: string | number;
    personal?: {
      name_full?: string;
      name_first?: string;
      name_last?: string;
    };
    vatsim?: {
      rating?: {
        short?: string;
      };
    };
    teams?: string[];
  };
  cid?: string | number;
  personal?: {
    name_full?: string;
    name_first?: string;
    name_last?: string;
  };
  vatsim?: {
    rating?: {
      short?: string;
    };
  };
  teams?: string[];
}

const AUTHORIZATION_URL = process.env.VATGER_CONNECT_URL || "https://vatsim-germany.org/oauth/authorize";
// Use public endpoints for token and userinfo
const TOKEN_URL = process.env.VATGER_TOKEN_URL || "http://hp.vatsim-germany.org/oauth/token";
const USERINFO_URL = process.env.VATGER_USER_INFO || "http://hp.vatsim-germany.org/oauth/userinfo";

function isPrismaConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const message =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";
  const code = "code" in error ? String((error as { code?: unknown }).code ?? "") : "";

  return (
    code === "45009" ||
    code === "P1001" ||
    code === "P1002" ||
    message.includes("socket has unexpectedly been closed") ||
    message.includes("Database server closed the connection") ||
    message.includes("Can't reach database server")
  );
}

async function withPrismaRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isPrismaConnectionError(error)) {
      throw error;
    }

    await prisma.$connect().catch(() => undefined);
    return await operation();
  }
}

export const VatgerProvider: OAuthConfig<VatsimProfile> = {
  id: "vatger",
  name: "VATGER",
  type: "oauth",
  authorization: {
    url: AUTHORIZATION_URL,
    params: { scope: "name rating assignment teams" },
  },
  token: TOKEN_URL,
  userinfo: USERINFO_URL,
  clientId: process.env.VATGER_CLIENT_ID!,
  clientSecret: process.env.VATGER_CLIENT_SECRET!,
  profile(profile: VatsimProfile) {
    const data = profile?.data || profile;
    // CID can be in data.cid or data.id (new API response format)
    const cidRaw = (data as any)?.cid ?? (data as any)?.id ?? profile?.id;
    const cid = Number(cidRaw);

    let fullName: string = "Unknown User";
    if (data && data.personal?.name_full) {
      fullName = data.personal.name_full;
    } else if (data?.personal?.name_first || data?.personal?.name_last) {
      const first = data.personal?.name_first ?? "";
      const last = data.personal?.name_last ?? "";
      fullName = `${first} ${last}`.trim() || "Unknown User";
    } else if (profile?.fullname) {
      fullName = profile.fullname;
    }

    const rating = data?.vatsim?.rating?.short || profile?.rating_atc_short || "UNKNOWN";
    const fir = profile?.fir_code || "";
    const teams = Array.isArray((data as any)?.teams)
      ? (data as any).teams.map((t: any) => String(t)).filter(Boolean)
      : Array.isArray((profile as any)?.teams)
        ? (profile as any).teams.map((t: any) => String(t)).filter(Boolean)
        : [];

    return {
      id: String(Number.isFinite(cid) ? cid : profile?.id ?? Date.now()),
      cid: String(Number.isFinite(cid) ? cid : ""),
      name: fullName,
      rating,
      fir,
      teams,
    } as any;
  },
};

export const authOptions: NextAuthOptions = {
  providers: [VatgerProvider],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, create or update user in DB with VISITOR role (unless already set)
      if (user) {
        const cid = String((user as any).cid ?? "");
        const teams = (user as any).teams || [];

        // Determine role based on team membership
        let roleFromTeams = "VISITOR";
        if (teams.includes("PMP Mentor")) {
          roleFromTeams = "MENTOR";
        }
        if (teams.includes("PMP Leitung")) {
          roleFromTeams = "PMP_LEITUNG";
        }

        const fallbackRole = ADMIN_CIDS.includes(cid) ? "ADMIN" : roleFromTeams;

        token.cid = cid;
        token.name = (user as any).name;
        token.rating = (user as any).rating;
        token.role = fallbackRole;
        token.fir = (user as any).fir || "";
        token.teams = teams;
        token.userStatus = token.userStatus || null;

        if (!cid) {
          return token;
        }

        try {
          let userRecord = await withPrismaRetry(() =>
            prisma.user.upsert({
              where: { cid },
              create: {
                cid,
                name: (user as any).name,
                email: (user as any).email,
                image: (user as any).image,
                role: fallbackRole as any,
              },
              update: {
                name: (user as any).name,
                email: (user as any).email,
                image: (user as any).image,
              },
              select: { id: true, role: true, userStatus: true },
            })
          );

          if (userRecord.role === "VISITOR" && fallbackRole !== "VISITOR" && !userRecord.userStatus) {
            userRecord = await withPrismaRetry(() =>
              prisma.user.update({
                where: { cid },
                data: { role: fallbackRole as any },
                select: { id: true, role: true, userStatus: true },
              })
            );
          }

          // Persist selected fields from user into the JWT
          token.id = userRecord.id;
          token.role = userRecord.role;
          token.userStatus = userRecord.userStatus || null;
        } catch (error) {
          console.error("Failed to sync auth user with Prisma:", error);
          token.id = cid;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const sessionUser = {
        id: token.id,
        cid: token.cid,
        name: token.name,
        rating: token.rating,
        role: token.role || "VISITOR",
        userStatus: token.userStatus || null,
        fir: token.fir || "",
        teams: token.teams || [],
      };
      (session as any).user = sessionUser;

      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const resolvedUrl = new URL(url, baseUrl);
        const baseOrigin = new URL(baseUrl).origin;

        if (resolvedUrl.origin !== baseOrigin) {
          return `${baseUrl}/signin?postauth=true`;
        }

        // Preserve direct invite callbacks so the token can be executed after login
        if (resolvedUrl.pathname === "/direkt-einladung") {
          return resolvedUrl.toString();
        }

        // Route all other callbacks through signin for role-based redirect handling
        return `${baseUrl}/signin?postauth=true`;
      } catch {
        return `${baseUrl}/signin?postauth=true`;
      }
    },
  },
  // Default pages can be used; customize if you want a bespoke /signin route
  secret: process.env.NEXTAUTH_SECRET,
};