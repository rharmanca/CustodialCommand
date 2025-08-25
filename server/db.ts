if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Check your Replit Secrets tab.",
  );
}

