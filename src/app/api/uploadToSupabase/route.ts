import { db } from "@/lib/db";
import { $notes } from "@/lib/db/schema";
import { uploadFileToSupabase } from "@/lib/uploadFileToSupabase";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { noteId } = await req.json();

    // Fetch the note by ID using Drizzle ORM
    const notes = await db
      .select()
      .from($notes)
      .where(eq($notes.id, parseInt(noteId)));

    if (!notes[0]?.imageUrl) {
      return new NextResponse("No image URL", { status: 400 });
    }

    // Upload the image to Supabase Storage
    const supabaseUrl = await uploadFileToSupabase(
      notes[0].imageUrl,
      notes[0].name
    );

    // Update the note with the Supabase URL
    await db
      .update($notes)
      .set({
        imageUrl: supabaseUrl,
      })
      .where(eq($notes.id, parseInt(noteId)));

    return new NextResponse("ok", { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse("error", { status: 500 });
  }
}
