import { supabase, bucketName } from "@/lib/db/supabase";

export async function uploadFileToSupabase(image_url: string, name: string) {
  try {
    console.log("Starting file upload...");

    // Fetch the image from the provided URL
    const response = await fetch(image_url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const fileName = `${name.replace(/\s+/g, "")}-${Date.now()}.jpeg`;
    const filePath = `public/${fileName}`; // Ensure file goes to the public folder

    console.log(`Uploading file to: ${filePath}`);

    // Upload the file to the specified bucket and folder
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, new Blob([buffer]), {
        contentType: "image/jpeg",
        upsert: true, // Optional: Overwrite if the file exists
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    console.log("File uploaded successfully:", data);

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to generate public URL for the file.");
    }

    console.log("Public URL generated:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error during file upload:", error);
    throw new Error("Failed to upload image to Supabase");
  }
}
