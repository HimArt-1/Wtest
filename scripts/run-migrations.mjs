/**
 * تنفيذ ترحيلات Supabase عبر API
 * يُنشئ باكت avatars ويتحقق من عمود profile_id
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  console.log("=== Supabase Migrations ===\n");

  // 1) Create avatars bucket
  console.log("1) Creating avatars bucket...");
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasAvatars = buckets?.some((b) => b.id === "avatars");

  if (hasAvatars) {
    console.log("   ✓ avatars bucket already exists\n");
  } else {
    const { error } = await supabase.storage.createBucket("avatars", {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (error) {
      console.error("   ✗ Failed to create avatars bucket:", error.message);
    } else {
      console.log("   ✓ avatars bucket created successfully\n");
    }
  }

  // 2) Check if profile_id column exists on applications
  console.log("2) Checking profile_id column on applications...");
  const { data: testRow, error: selectErr } = await supabase
    .from("applications")
    .select("profile_id")
    .limit(1);

  if (selectErr && selectErr.message.includes("profile_id")) {
    console.log("   ✗ profile_id column does NOT exist yet.");
    console.log("   → Please run this SQL in Supabase Dashboard → SQL Editor:\n");
    console.log("   ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;");
    console.log("   CREATE INDEX IF NOT EXISTS idx_applications_profile_id ON applications(profile_id);\n");
  } else {
    console.log("   ✓ profile_id column exists on applications\n");
  }

  // 3) Check products bucket
  console.log("3) Checking products bucket...");
  const hasProducts = buckets?.some((b) => b.id === "products");
  if (hasProducts) {
    console.log("   ✓ products bucket already exists\n");
  } else {
    const { error } = await supabase.storage.createBucket("products", {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (error) {
      console.error("   ✗ Failed to create products bucket:", error.message);
    } else {
      console.log("   ✓ products bucket created successfully\n");
    }
  }

  // 4) Check designs bucket
  console.log("4) Checking designs bucket...");
  const hasDesigns = buckets?.some((b) => b.id === "designs");
  if (hasDesigns) {
    console.log("   ✓ designs bucket already exists\n");
  } else {
    const { error } = await supabase.storage.createBucket("designs", {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      fileSizeLimit: 10 * 1024 * 1024,
    });
    if (error) {
      console.error("   ✗ Failed to create designs bucket:", error.message);
    } else {
      console.log("   ✓ designs bucket created successfully\n");
    }
  }

  console.log("=== Done ===");
}

run().catch(console.error);
