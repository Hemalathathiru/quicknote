"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, BookText, Trash2, FilePenLine, StickyNote } from "lucide-react";
import type { Note } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NoteEditor, type NoteFormValues } from "@/components/note-editor";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const initialNotesData: Omit<Note, 'id' | 'createdAt'>[] = [
    {
        title: "Meeting Notes",
        content: "Discussed Q3 goals and project timelines. Key takeaways: focus on user acquisition, improve onboarding.",
    },
    {
        title: "Grocery List",
        content: "- Milk\n- Bread\n- Eggs\n- Cheese\n- Apples",
    },
    {
        title: "Book Ideas",
        content: "A sci-fi novel about a society where memories can be bought and sold. The protagonist is a memory thief who stumbles upon a dangerous secret.",
    },
    {
        title: "Recipe: Pasta Carbonara",
        content: "Ingredients:\n- Spaghetti\n- Pancetta or Guanciale\n- Pecorino Romano cheese\n- Black pepper\n- Eggs\n\nInstructions:...\n",
    },
    {
        title: "Workout Plan",
        content: "Monday: Chest & Triceps\nTuesday: Back & Biceps\nWednesday: Legs\nThursday: Shoulders\nFriday: Cardio",
    },
];

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editorState, setEditorState] = useState<{ open: boolean; note?: Note }>({ open: false });
  const [deleteAlertState, setDeleteAlertState] = useState<{ open: boolean; noteId?: string }>({ open: false });

  useEffect(() => {
    const loadedNotes = initialNotesData.map((note, index) => ({
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date(Date.now() - (index + 1) * 1000 * 60 * 60 * 24).toISOString(),
    })).sort((a,b) => a.title.localeCompare(b.title));
    
    setNotes(loadedNotes);
    if (loadedNotes.length > 0) {
      setActiveNoteId(loadedNotes[0].id);
    }
  }, []);

  const handleSaveNote = (data: NoteFormValues, id?: string) => {
    if (id) {
      setNotes(notes.map(n => n.id === id ? { ...n, title: data.title, content: data.content } : n));
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        title: data.title,
        content: data.content,
      };
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      setActiveNoteId(newNote.id);
    }
    setEditorState({ open: false });
  };

  const handleDeleteRequest = (noteId: string) => {
    setDeleteAlertState({ open: true, noteId });
  };

  const handleDeleteConfirm = () => {
    if (!deleteAlertState.noteId) return;

    const newNotes = notes.filter(n => n.id !== deleteAlertState.noteId);
    setNotes(newNotes);

    if (activeNoteId === deleteAlertState.noteId) {
      const sortedNotes = [...newNotes].sort((a, b) => a.title.localeCompare(b.title));
      setActiveNoteId(sortedNotes.length > 0 ? sortedNotes[0].id : null);
    }
    setDeleteAlertState({ open: false });
  };

  const filteredAndSortedNotes = useMemo(() => {
    return notes
      .filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [notes, searchTerm]);

  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes.find(note => note.id === activeNoteId);
  }, [notes, activeNoteId]);

  return (
    <>
      <div className="flex h-dvh w-full bg-background overflow-hidden">
        <aside className="flex flex-col w-full shrink-0 md:w-[320px] border-r bg-muted/20">
          <header className="flex items-center gap-2 px-4 h-16 border-b shrink-0">
            <StickyNote className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">QuickNote</h1>
          </header>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => setEditorState({ open: true, note: undefined })}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Note
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <nav className="px-4 pb-4">
              <ul className="space-y-1">
                {filteredAndSortedNotes.map(note => (
                  <li key={note.id}>
                    <button
                      onClick={() => setActiveNoteId(note.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors text-sm",
                        activeNoteId === note.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <p className="truncate font-semibold">{note.title}</p>
                      <p className="truncate text-xs text-muted-foreground mt-1">{note.content || "No content"}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </ScrollArea>
        </aside>

        <main className="flex-1 flex-col hidden md:flex">
          {activeNote ? (
            <>
              <header className="flex items-center justify-between p-4 h-16 border-b shrink-0">
                <div>
                  <h2 className="text-2xl font-bold">{activeNote.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    Created on {format(new Date(activeNote.createdAt), "PPP")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setEditorState({ open: true, note: activeNote })}>
                    <FilePenLine className="h-4 w-4" />
                    <span className="sr-only">Edit Note</span>
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteRequest(activeNote.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Note</span>
                  </Button>
                </div>
              </header>
              <ScrollArea className="flex-1">
                <div className="p-6 lg:p-8">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {activeNote.content}
                  </p>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center p-8 text-muted-foreground">
              <BookText className="h-16 w-16 text-muted-foreground/50" />
              <h2 className="mt-4 text-2xl font-semibold">Welcome to QuickNote</h2>
              <p className="mt-2 max-w-xs mx-auto">
                Select a note from the list to view it, or create a new one to get started.
              </p>
            </div>
          )}
        </main>
      </div>

      <NoteEditor
        open={editorState.open}
        onOpenChange={(open) => setEditorState({ ...editorState, open })}
        onSave={handleSaveNote}
        note={editorState.note}
      />
      
      <AlertDialog open={deleteAlertState.open} onOpenChange={(open) => setDeleteAlertState({ ...deleteAlertState, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className={cn(buttonVariants({ variant: "destructive" }))}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
