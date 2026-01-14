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
    const cid = Number(data?.cid || data?.id || profile?.id);

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
        const cid = (user as any).cid;
        const teams = (user as any).teams || [];

        // Determine role based on team membership
        let roleFromTeams = "VISITOR";
        if (teams.includes("PMP Mentor")) {
          roleFromTeams = "MENTOR";
        }
        if (teams.includes("Developer")) {
          roleFromTeams = "ADMIN";
        }
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { cid },
        });

        let userRecord;
        if (existingUser) {
          // Update user with new team-based role and other info
          userRecord = await prisma.user.update({
            where: { cid },
            data: {
              name: (user as any).name,
              role: roleFromTeams as any,
            },
          });
        } else {
          // Create new user with role based on teams or admin CID
          const isAdmin = ADMIN_CIDS.includes(cid);
          const finalRole = isAdmin ? "ADMIN" : roleFromTeams;
          userRecord = await prisma.user.create({
            data: {
              cid,
              name: (user as any).name,
              email: (user as any).email,
              image: (user as any).image,
              role: finalRole as any,
            },
          });
        }

        // Persist selected fields from user into the JWT
        token.id = userRecord.id;
        token.cid = cid;
        token.name = (user as any).name;
        token.rating = (user as any).rating;
        token.role = userRecord.role;
        token.fir = (user as any).fir || "";
        token.teams = teams;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose JWT fields to the session
      const sessionUser = {
        id: token.id,
        cid: token.cid,
        name: token.name,
        rating: token.rating,
        role: token.role || "VISITOR",
        fir: token.fir || "",
        teams: token.teams || [],
      };
      (session as any).user = sessionUser;

      console.log("[SSO] Session created:", sessionUser);

      return session;
    },
    async redirect({ url, baseUrl }) {
      // After OAuth callback, redirect to signin page for role-based routing
      if (url.startsWith(baseUrl)) return url;
      (session as any).user = {
        id: token.id,
        cid: token.cid,
        name: token.name,
        rating: token.rating,
        role: token.role || "VISITOR",
        fir: token.fir || "",
        teams: token.teams || [],
      };