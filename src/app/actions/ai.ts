"use server";

import { getSupabaseServerClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Banana.dev (or similar) API configuration
const BANANA_API_KEY = process.env.BANANA_API_KEY;
const BANANA_MODEL_KEY = process.env.BANANA_MODEL_KEY;

interface GenerateImageResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

export async function generateImage(prompt: string, style: string): Promise<GenerateImageResult> {
    try {
        if (!process.env.BANANA_API_KEY) {
            // Mock response for development if no key is present
            console.log("Mocking AI Generation for:", prompt);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return {
                success: true,
                imageUrl: "https://images.unsplash.com/photo-1633511090164-b43840ea1607?w=1024&q=80"
            };
        }

        // Real API Call (Example structure for Banana/Replicate)
        const response = await fetch("https://api.banana.dev/start/v4/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                apiKey: BANANA_API_KEY,
                modelKey: BANANA_MODEL_KEY,
                modelInputs: {
                    prompt: `${style} style: ${prompt}`,
                    negative_prompt: "blurry, low quality, distorted",
                    num_inference_steps: 30,
                    guidance_scale: 7.5
                }
            }),
        });

        const data = await response.json();

        // Polling logic would go here if async, but assuming sync or fast return for this snippet
        // For Banana, you usually poll the ID. For simplicity in this v1, we'll return the mock or handle direct result.

        // Saving to Supabase
        const supabase = getSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // In a real app, upload the base64/url image to Supabase Storage first
            // const { data: uploadData } = await supabase.storage.from('artworks').upload(...)

            // Then save reference to DB
            await (supabase.from("artworks") as any).insert({
                title: prompt.slice(0, 50),
                artist_id: user.id,
                image_url: data.modelOutputs?.[0]?.image_base64 || "https://placeholder.com/img", // Handle actual response format
                price: 0,
                currency: "SAR",
                category_id: null, // Draft
                status: 'draft'
            });
        }

        return { success: true, imageUrl: "returned_url_here" };

    } catch (error) {
        console.error("AI Generation Error:", error);
        return { success: false, error: "Failed to generate image" };
    }
}
