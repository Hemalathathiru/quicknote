"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, BookText, Trash2, FilePenLine, StickyNote, Loader2, LogOut } from "lucide-react";
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
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import {
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from "@/firebase/non-blocking-updates";


export default function NotesPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editorState, setEditorState] = useState<{ open: boolean; note?: Note }>({ open: false });
  const [deleteAlertState, setDeleteAlertState] = useState<{ open: boolean; noteId?: string }>({ open: false });

  const notesCollection = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, "users", user.uid, "notes");
  }, [firestore, user]);

  const { data: notes, isLoading: isLoadingNotes } = useCollection<Omit<Note, 'id'>>(notesCollection);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const sortedNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes].sort((a, b) => a.title.localeCompare(b.title));
  }, [notes]);

  useEffect(() => {
    if (!activeNoteId && sortedNotes.length > 0) {
      setActiveNoteId(sortedNotes[0].id);
    } else if (activeNoteId && !sortedNotes.some(n => n.id === activeNoteId)) {
      setActiveNoteId(sortedNotes.length > 0 ? sortedNotes[0].id : null);
    }
  }, [sortedNotes, activeNoteId]);

  const handleSaveNote = (data: NoteFormValues, id?: string) => {
    if (!notesCollection) return;
    if (id) {
      const noteRef = doc(notesCollection, id);
      updateDocumentNonBlocking(noteRef, { ...data, updatedAt: serverTimestamp() });
    } else {
      const newNoteId = doc(notesCollection).id;
      const noteRef = doc(notesCollection, newNoteId);
      const newNote = {
        id: newNoteId,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      setDocumentNonBlocking(noteRef, newNote, {});
      setActiveNoteId(newNote.id);
    }
    setEditorState({ open: false });
  };

  const handleDeleteRequest = (noteId: string) => {
    setDeleteAlertState({ open: true, noteId });
  };

  const handleDeleteConfirm = () => {
    if (!deleteAlertState.noteId || !notesCollection) return;
    const noteRef = doc(notesCollection, deleteAlertState.noteId);
    deleteDocumentNonBlocking(noteRef);
    setDeleteAlertState({ open: false });
  };

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/");
  };
  
  const filteredAndSortedNotes = useMemo(() => {
    return (notes || [])
      .filter(note => note.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [notes, searchTerm]);

  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes?.find(note => note.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-transparent">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-dvh w-full bg-transparent overflow-hidden p-4">
        <aside className="flex flex-col w-full shrink-0 md:w-[320px] border border-white/20 bg-white/10 shadow-lg backdrop-blur-lg rounded-l-xl">
          <header className="flex items-center justify-between gap-2 px-4 h-16 border-b border-white/20 shrink-0">
             <div className="flex items-center gap-2">
                <StickyNote className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold tracking-tight text-foreground">QuickNote</h1>
             </div>
             <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-4 w-4" />
             </Button>
          </header>
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title..."
                className="pl-9 bg-white/10 border-white/20"
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
             {isLoadingNotes ? (
               <div className="p-4 space-y-2">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="p-3 rounded-lg bg-white/10">
                     <div className="h-4 w-3/4 rounded bg-muted/50 animate-pulse mb-2"></div>
                     <div className="h-3 w-full rounded bg-muted/50 animate-pulse"></div>
                   </div>
                 ))}
               </div>
             ) : (
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
                              : "hover:bg-white/10"
                          )}
                        >
                          <p className="truncate font-semibold">{note.title}</p>
                          <p className="truncate text-xs text-muted-foreground mt-1">{note.content || "No content"}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
             )}
          </ScrollArea>
        </aside>

        <main className="flex-1 flex-col hidden md:flex bg-white/5 border-t border-b border-r border-white/20 backdrop-blur-lg rounded-r-xl">
          {activeNote ? (
            <>
              <header className="flex items-center justify-between p-4 h-16 border-b border-white/20 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold">{activeNote.title}</h2>
                   {activeNote.createdAt && (
                     <p className="text-sm text-muted-foreground">
                       Created on {format(new Date(activeNote.createdAt), "PPP")}
                     </p>
                   )}
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
               {isLoadingNotes ? (
                 <p className="mt-2 max-w-xs mx-auto">Loading your notes...</p>
               ) : (
                 <p className="mt-2 max-w-xs mx-auto">
                   Select a note from the list to view it, or create a new one to get started.
                 </p>
               )}
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
