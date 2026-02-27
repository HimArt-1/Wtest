// إنشاء حساب أدمن في Supabase Auth وربطه بالملف الشخصي
import { createClient } from "@supabase/supabase-js";

const url = "https://moutdsnsyioovjyqovan.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing");
    process.exit(1);
}

const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
});

const ADMIN_EMAIL = "admin@wusha.store";
const ADMIN_PASSWORD = "Wusha2024!";

async function main() {
    console.log("🔧 Creating admin user in Supabase Auth...");

    // 1. Create auth user
    const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: "هيثم الزهراني" },
        });

    if (authError) {
        if (authError.message?.includes("already been registered")) {
            console.log("⚠️ User already exists, fetching...");
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existing = users?.find((u) => u.email === ADMIN_EMAIL);
            if (existing) {
                console.log("✅ Found existing user:", existing.id);
                await linkProfile(existing.id);
            }
            return;
        }
        console.error("❌ Auth error:", authError);
        return;
    }

    console.log("✅ Auth user created:", authUser.user.id);

    // 2. Link to profile
    await linkProfile(authUser.user.id);
}

async function linkProfile(userId) {
    // Check if admin profile exists
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, clerk_id, display_name, role")
        .eq("role", "admin")
        .limit(1)
        .single();

    if (profile) {
        console.log("📝 Found admin profile:", profile.display_name, "| current clerk_id:", profile.clerk_id);
        const { error } = await supabase
            .from("profiles")
            .update({ clerk_id: userId })
            .eq("id", profile.id);

        if (error) {
            console.error("❌ Update error:", error);
        } else {
            console.log("✅ Profile linked to Supabase Auth user:", userId);
        }
    } else {
        console.log("📝 No admin profile found. Creating one...");
        const { error } = await supabase.from("profiles").insert({
            clerk_id: userId,
            display_name: "هيثم الزهراني",
            username: "haitham_admin",
            role: "admin",
        });
        if (error) {
            console.error("❌ Insert error:", error);
        } else {
            console.log("✅ Admin profile created and linked.");
        }
    }

    console.log("\n═══════════════════════════════════════");
    console.log("  بيانات تسجيل الدخول:");
    console.log("  البريد:", ADMIN_EMAIL);
    console.log("  كلمة المرور:", ADMIN_PASSWORD);
    console.log("═══════════════════════════════════════\n");
}

main().catch(console.error);
