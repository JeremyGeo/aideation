import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { $notes } from "./schema"; // Import the notes table schema

// Step 1: Configure the Supabase connection string
const connectionString = process.env.DATABASE_URL; // Ensure this is set in your .env file



if (!connectionString) {
  throw new Error("SUPABASE_DATABASE_URL is not defined in the environment variables.");
}

// Step 2: Initialize the Postgres client
const client = postgres(connectionString, { prepare: false });

// Step 3: Initialize the Drizzle ORM
const db = drizzle(client, { schema: { notes: $notes } }); // Use the notes table in the schema

// Step 5: Export the database instance for use in your app
export { db };
