import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL — set the DATABASE_URL environment variable or provide one in a .env file."
  );
}

export default defineConfig({
  migrate: {
    datasourceUrl: process.env.DATABASE_URL,
  },
});
