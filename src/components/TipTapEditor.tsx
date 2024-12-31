"use client";

import React, { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import TipTapMenuBar from "./TipTapMenuBar";
import { Button } from "./ui/button";
import { useDebounce } from "@/lib/useDebounce";
import { useMutation } from "@tanstack/react-query";
import Text from "@tiptap/extension-text";
import axios from "axios";
import { NoteType } from "@/lib/db/schema";
import { useCompletion } from "ai/react";

type Props = { note: NoteType };

const TipTapEditor = ({ note }: Props) => {
  const [editorState, setEditorState] = useState(
    note.editorState || `<h1>${note.name}</h1>`
  );
  const [fullSentence, setFullSentence] = useState<string>(""); // Track the full sentence

  const saveNote = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/saveNote", {
        noteId: note.id,
        editorState,
      });
      return response.data;
    },
  });

  // Custom Text extension for Shift+A keyboard shortcut
  const customText = Text.extend({
    addKeyboardShortcuts() {
      return {
        "Shift-a": () => {
          const prompt = this.editor?.getText()?.split(" ").slice(-30).join(" ");
          if (prompt) {
            fetchCompletion(prompt); 
          }
          return true;
        },
      };
    },
  });

  const editor = useEditor({
    autofocus: true,
    extensions: [StarterKit, customText],
    content: editorState,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setEditorState(newContent);
    },
  });

  const lastCompletion = useRef<string>("");

  const fetchCompletion = async (prompt: string) => {
    try {
      const response = await fetch("/api/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });
  
      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
  
        // Read the stream and process chunks
        const stream = new ReadableStream({
          start(controller) {
            const processStream = async () => {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {

                  controller.close();
                  break;
                }
  
                const chunk = decoder.decode(value, { stream: true });
                fullResponse += chunk;
  
                // Clean up unwanted prefixes, like "data:", "## ##", etc.
                let cleanResponse = fullResponse.replace(/(?:data:\s*)+/g, '');  // Remove "data:" prefixes
                cleanResponse = cleanResponse.replace(/##\s*##/g, ''); // Remove ## ## markers or any unwanted formatting
  
                // Update the editor content and full sentence as new chunks arrive
                if (chunk && chunk !== lastCompletion.current) {
                  lastCompletion.current = chunk;
                  setFullSentence(cleanResponse); // Set the cleaned-up response
                  
                }
              }
            };
            processStream();
          },
        });
  
        // Wait for the stream to be processed
        await new Response(stream);
      } else {
        console.error("Failed to fetch the completion response");
      }
    } catch (error) {
      console.error("Error fetching completion:", error);
    }
  };
  
  
  

  const debouncedEditorState = useDebounce(editorState, 500);

  useEffect(() => {
    if (debouncedEditorState === "") return;

    saveNote.mutate(undefined, {
      onSuccess: (data) => {

        if (data.updatedContent) {
          setEditorState(data.updatedContent);
        }
      },
      onError: (err) => {
        console.error("Error saving note:", err);
      },
    });
  }, [debouncedEditorState]);

  return (
    <>
      <div className="flex">
        {editor && <TipTapMenuBar editor={editor} />}
        <Button disabled variant={"outline"}>
  {saveNote.status === 'pending' ? "Saving..." : "Saved"}
</Button>

      </div>

      <div className="prose prose-sm w-full mt-4">
        {editor && <EditorContent editor={editor} />}
      </div>

      <div className="h-4"></div>

      {/* Display the full sentence */}
      <div className="mt-4 mb-4">
        <h3 className="text-lg font-semibold">Add the Autocomplete to the editor</h3>
        <p>{fullSentence}</p> {/* Display the full sentence here */}
      </div>

      <span className="text-sm mt-4">
        Tip: Press{" "}
        <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
          Shift + A
        </kbd>{" "}
        for AI autocomplete
      </span>
    </>
  );
};

export default TipTapEditor;
