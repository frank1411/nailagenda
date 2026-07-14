#!/usr/bin/env node

/**
 * validate-env.ts — Validates required environment variables on startup.
 * Run with: npx tsx scripts/validate-env.ts
 * Add to package.json "prestart" or Docker entrypoint.
 */

const REQUIRED_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
] as const;

const errors: string[] = [];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    errors.push(`❌ ${varName} is required but not set`);
  }
}

if (process.env.AUTH_SECRET) {
  const secret = process.env.AUTH_SECRET;
  if (secret.length < 32) {
    errors.push(
      `❌ AUTH_SECRET is too short (${secret.length} chars). Minimum 32 characters required.`
    );
  }
  // Warn if using common weak secrets
  const weakPatterns = [
    "default-secret",
    "change-in-production",
    "change-me",
    "your-secret",
    "your_auth_secret",
  ];
  for (const pattern of weakPatterns) {
    if (secret.toLowerCase().includes(pattern)) {
      errors.push(
        `⚠️  AUTH_SECRET contains a known weak pattern ("${pattern}"). Generate a strong one with: openssl rand -base64 32`
      );
      break;
    }
  }
}

if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  if (
    !dbUrl.startsWith("postgresql://") &&
    !dbUrl.startsWith("postgres://") &&
    !dbUrl.startsWith("file:") &&
    !dbUrl.startsWith("mysql://")
  ) {
    errors.push(
      `⚠️  DATABASE_URL has unexpected format: ${dbUrl.substring(0, 50)}...`
    );
  }
}

if (errors.length > 0) {
  console.error("\n🔴 Environment validation failed:\n");
  for (const err of errors) {
    console.error(`  ${err}`);
  }
  console.error(
    "\n💡 Fix these issues before starting the application.\n"
  );
  process.exit(1);
}

console.log("✅ Environment validation passed\n");
