"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DraftManager, RecoveryBufferData } from "@/lib/drafts/draft-manager";
import { getBookById } from "@/lib/book-store";
import { BookIdentity } from "@/types/book";

export type SaveStatus =
  | "saved"
  | "saving"
  | "unsaved"
  | "offline_saved"
  | "conflict"
  | "error";

export interface ConflictData {
  serverVersion: number;
  serverUpdatedAt?: string;
  serverTitle?: string;
  localTitle: string;
  localContentHtml: string;
  localContentJson?: string | object | null;
}

export interface UseStudioDocumentOptions {
  initialDocumentId?: string | null;
  bookId?: string | null;
}

export function useStudioDocument({
  initialDocumentId,
  bookId,
}: UseStudioDocumentOptions) {
  // Document Identity & Versioning
  const [documentId, setDocumentId] = useState<string | null>(initialDocumentId || null);
  const [version, setVersion] = useState<number>(1);
  const [activeBook, setActiveBook] = useState<BookIdentity | null>(null);

  // Document Content & Metadata
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [contentJson, setContentJson] = useState<object | string | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED">("DRAFT");
  const [publication, setPublication] = useState("Architecture & Craft");
  const [scheduledDate, setScheduledDate] = useState("");
  const [words, setWords] = useState(0);
  const [targetWords, setTargetWords] = useState(1200);

  // Persistence State Machine
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authorId, setAuthorId] = useState<string | null>(null);

  // References for Safe Lifecycle & Request Ordering
  const isInitializedRef = useRef(false);
  const isSavingRef = useRef(false);
  const saveSequenceRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep latest mutable values in refs for asynchronous flushes
  const stateRef = useRef({
    documentId,
    version,
    title,
    excerpt,
    contentHtml,
    contentJson,
    status,
    publication,
    scheduledDate,
    targetWords,
    isDirty,
    isAuthenticated,
  });

  useEffect(() => {
    stateRef.current = {
      documentId,
      version,
      title,
      excerpt,
      contentHtml,
      contentJson,
      status,
      publication,
      scheduledDate,
      targetWords,
      isDirty,
      isAuthenticated,
    };
  }, [
    documentId,
    version,
    title,
    excerpt,
    contentHtml,
    contentJson,
    status,
    publication,
    scheduledDate,
    targetWords,
    isDirty,
    isAuthenticated,
  ]);

  // Check user authentication
  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (mounted && json.success && json.data) {
            setIsAuthenticated(true);
            setAuthorId(json.data.id);
            return;
          }
        }
      } catch {
        // Unauthenticated or network error
      }
      if (mounted) {
        setIsAuthenticated(false);
        setAuthorId(null);
      }
    }
    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener("inkforge_auth_change", handleAuthChange);
    return () => {
      mounted = false;
      window.removeEventListener("inkforge_auth_change", handleAuthChange);
    };
  }, []);

  // Calculate words and reading time
  const updateContentCounts = useCallback((html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").trim();
    const count = text.split(/\s+/).filter(Boolean).length;
    setWords(count);
  }, []);

  // 1. Initial Load Logic
  useEffect(() => {
    let mounted = true;
    isInitializedRef.current = false;
    setIsLoading(true);

    async function loadInitial() {
      try {
        // Case A: Book context passed via ?bookId=
        if (bookId) {
          const book = getBookById(bookId);
          if (book && mounted) {
            setActiveBook(book);
            setTitle(book.title);
            setExcerpt(book.description);
            setPublication(book.genre);
            if (book.chapters && book.chapters.length > 0) {
              const ch = book.chapters[0];
              if (ch.wordCount) setWords(ch.wordCount);
            }
            setSaveStatus("saved");
            setIsLoading(false);
            isInitializedRef.current = true;
            return;
          }
        }

        // Case B: Explicit document ID passed via ?id=
        if (initialDocumentId) {
          try {
            const res = await fetch(`/api/v1/documents/${initialDocumentId}`);
            if (res.ok) {
              const json = await res.json();
              if (json.success && json.data && mounted) {
                const doc = json.data;
                setDocumentId(doc.id);
                setVersion(doc.version || 1);
                setTitle(doc.title || "");
                setExcerpt(doc.excerpt || "");
                setContentHtml(doc.contentHtml || "");
                setContentJson(doc.contentJson ? JSON.parse(doc.contentJson) : null);
                setStatus(doc.status || "DRAFT");
                setTargetWords(doc.targetWords || 1200);
                if (doc.contentHtml) updateContentCounts(doc.contentHtml);

                // Check if local recovery buffer has newer unsaved edits for this doc
                const buffer = DraftManager.getRecoveryBuffer(doc.id);
                if (buffer && buffer.timestamp > new Date(doc.updatedAt).getTime()) {
                  console.log("[useStudioDocument] Found newer local recovery buffer for document:", doc.id);
                  setTitle(buffer.title);
                  if (buffer.excerpt) setExcerpt(buffer.excerpt);
                  setContentHtml(buffer.contentHtml);
                  if (buffer.contentJson) setContentJson(buffer.contentJson);
                  setIsDirty(true);
                  setSaveStatus("unsaved");
                } else {
                  setSaveStatus("saved");
                  setIsDirty(false);
                }

                setIsLoading(false);
                isInitializedRef.current = true;
                return;
              }
            } else if (res.status === 403) {
              if (mounted) {
                setErrorMessage("You do not have permission to view or edit this manuscript.");
                setIsLoading(false);
              }
              return;
            } else if (res.status === 404) {
              if (mounted) {
                setErrorMessage("The requested manuscript could not be found in the registry.");
                setIsLoading(false);
              }
              return;
            }
          } catch (e) {
            console.warn("[useStudioDocument] Failed to load server document, checking offline buffer:", e);
          }
        }

        // Case C: Check Recovery Buffer or Local Active Draft
        const recoveryNew = DraftManager.getRecoveryBuffer(null);
        const savedDraft = DraftManager.getActiveDraft();
        const fallback = recoveryNew || savedDraft;

        if (fallback && mounted) {
          if (fallback.title) setTitle(fallback.title);
          if (fallback.excerpt) setExcerpt(fallback.excerpt);
          if (fallback.contentHtml) {
            setContentHtml(fallback.contentHtml);
            updateContentCounts(fallback.contentHtml);
          }
          if (fallback.contentJson) {
            setContentJson(
              typeof fallback.contentJson === "string"
                ? JSON.parse(fallback.contentJson)
                : fallback.contentJson
            );
          }
          if (fallback.status) {
            setStatus(fallback.status as "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED");
          }
          if (fallback.publication) setPublication(fallback.publication);

          setIsDirty(Boolean(recoveryNew));
          setSaveStatus(recoveryNew ? "unsaved" : "saved");
        }
      } catch (err) {
        console.error("[useStudioDocument] Error during initial load:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
          // Allow DOM to settle before arming the autosave engine
          setTimeout(() => {
            isInitializedRef.current = true;
          }, 300);
        }
      }
    }

    loadInitial();

    return () => {
      mounted = false;
    };
  }, [initialDocumentId, bookId, updateContentCounts]);

  // 2. Core Server & Local Save Execution
  const executeSave = useCallback(
    async (overrideStatus?: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED") => {
      const state = stateRef.current;
      if (!isInitializedRef.current) return;
      if (isSavingRef.current) return;

      const currentSequence = ++saveSequenceRef.current;
      isSavingRef.current = true;
      setSaveStatus("saving");
      setErrorMessage(null);

      const targetStatus = overrideStatus || state.status;
      const targetTitle = state.title.trim() || "Untitled Manuscript";
      const targetContentHtml = state.contentHtml;
      const targetContentJson =
        typeof state.contentJson === "object" && state.contentJson !== null
          ? JSON.stringify(state.contentJson)
          : (state.contentJson as string | null);

      // Save immediately to local recovery buffer
      DraftManager.saveRecoveryBuffer(state.documentId, {
        title: targetTitle,
        excerpt: state.excerpt,
        contentHtml: targetContentHtml,
        contentJson: state.contentJson,
        status: targetStatus,
        version: state.version,
      });

      // Also persist legacy local draft for backward compatibility
      DraftManager.setActiveDraft({
        id: state.documentId || undefined,
        title: targetTitle,
        excerpt: state.excerpt,
        contentHtml: targetContentHtml,
        contentJson: state.contentJson || undefined,
        publication: state.publication,
        status: targetStatus,
        scheduledFor: targetStatus === "SCHEDULED" ? state.scheduledDate : null,
        updatedAt: new Date().toISOString(),
        version: state.version,
      });

      try {
        // If unauthenticated, remain in local buffer mode safely
        if (!state.isAuthenticated) {
          if (currentSequence === saveSequenceRef.current) {
            setSaveStatus("offline_saved");
            setIsDirty(false);
            setLastSavedAt(new Date());
          }
          isSavingRef.current = false;
          return;
        }

        // Authenticated Backend Save
        if (state.documentId) {
          // UPDATE existing document
          const res = await fetch(`/api/v1/documents/${state.documentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: targetTitle,
              excerpt: state.excerpt,
              contentHtml: targetContentHtml,
              contentJson: targetContentJson,
              status: targetStatus,
              expectedVersion: state.version,
              targetWords: state.targetWords,
              scheduledFor: targetStatus === "SCHEDULED" && state.scheduledDate ? state.scheduledDate : null,
            }),
          });

          const data = await res.json();

          // Check if superseded by newer request
          if (currentSequence !== saveSequenceRef.current) {
            isSavingRef.current = false;
            return;
          }

          if (res.ok && data.success) {
            setVersion(data.data.version);
            setSaveStatus("saved");
            setIsDirty(false);
            setLastSavedAt(new Date());
            DraftManager.clearRecoveryBuffer(state.documentId);
          } else if (res.status === 409) {
            // Optimistic concurrency conflict detected
            setSaveStatus("conflict");
            setConflictData({
              serverVersion: data.error?.details?.currentVersion || state.version + 1,
              serverUpdatedAt: data.error?.details?.currentUpdatedAt,
              localTitle: targetTitle,
              localContentHtml: targetContentHtml,
              localContentJson: state.contentJson,
            });
          } else {
            setSaveStatus("error");
            setErrorMessage(data.error?.message || "Failed to save manuscript to ledger.");
          }
        } else {
          // CREATE new document
          const res = await fetch("/api/v1/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: targetTitle,
              excerpt: state.excerpt,
              contentHtml: targetContentHtml,
              contentJson: targetContentJson,
              status: targetStatus,
              targetWords: state.targetWords,
              scheduledFor: targetStatus === "SCHEDULED" && state.scheduledDate ? state.scheduledDate : null,
            }),
          });

          const data = await res.json();

          // Check if superseded by newer request
          if (currentSequence !== saveSequenceRef.current) {
            isSavingRef.current = false;
            return;
          }

          if (res.ok && data.success) {
            const newDoc = data.data;
            setDocumentId(newDoc.id);
            setVersion(newDoc.version);
            setSaveStatus("saved");
            setIsDirty(false);
            setLastSavedAt(new Date());

            // Clear old "new" recovery buffer and update active draft
            DraftManager.clearRecoveryBuffer(null);

            // Update browser URL query string without reloading page
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.set("id", newDoc.id);
              window.history.replaceState({}, "", url.toString());
            }
          } else {
            setSaveStatus("error");
            setErrorMessage(data.error?.message || "Failed to create manuscript on server.");
          }
        }
      } catch (err) {
        console.warn("[useStudioDocument] Network error during save, preserved locally:", err);
        if (currentSequence === saveSequenceRef.current) {
          setSaveStatus("offline_saved");
          setErrorMessage("Network unavailable — manuscript preserved in local sanctuary.");
        }
      } finally {
        isSavingRef.current = false;
      }
    },
    []
  );

  // 3. Debounced Autosave Trigger
  const scheduleAutosave = useCallback(() => {
    if (!isInitializedRef.current) return;
    setIsDirty(true);
    setSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSave();
    }, 1500);
  }, [executeSave]);

  // Content mutators with autosave
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      scheduleAutosave();
    },
    [scheduleAutosave]
  );

  const handleExcerptChange = useCallback(
    (newExcerpt: string) => {
      setExcerpt(newExcerpt);
      scheduleAutosave();
    },
    [scheduleAutosave]
  );

  const handleEditorChange = useCallback(
    (data: { html: string; json: object; text: string }) => {
      if (!isInitializedRef.current) return;
      setContentHtml(data.html);
      setContentJson(data.json);
      updateContentCounts(data.html);
      scheduleAutosave();
    },
    [scheduleAutosave, updateContentCounts]
  );

  const handleStatusChange = useCallback(
    (newStatus: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED") => {
      setStatus(newStatus);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      executeSave(newStatus);
    },
    [executeSave]
  );

  // Explicit manual save (e.g. Save button click or Cmd+S)
  const manualSave = useCallback(
    async (targetStatus?: "DRAFT" | "IN_REVIEW" | "SCHEDULED" | "PUBLISHED") => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      await executeSave(targetStatus);
    },
    [executeSave]
  );

  // 4. Version Conflict Resolution Handlers
  const resolveConflictKeepMine = useCallback(async () => {
    if (!documentId) return;
    try {
      setSaveStatus("saving");
      // Fetch latest document to get the authoritative current version number
      const res = await fetch(`/api/v1/documents/${documentId}`);
      if (res.ok) {
        const json = await res.json();
        const latestVersion = json.data?.version || version;
        setVersion(latestVersion);

        // Force save with latest expected version
        const updateRes = await fetch(`/api/v1/documents/${documentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || "Untitled Manuscript",
            excerpt,
            contentHtml,
            contentJson: typeof contentJson === "object" ? JSON.stringify(contentJson) : contentJson,
            status,
            expectedVersion: latestVersion,
          }),
        });

        const updateData = await updateRes.json();
        if (updateRes.ok && updateData.success) {
          setVersion(updateData.data.version);
          setConflictData(null);
          setSaveStatus("saved");
          setIsDirty(false);
          setLastSavedAt(new Date());
          DraftManager.clearRecoveryBuffer(documentId);
          return;
        }
      }
      setSaveStatus("error");
      setErrorMessage("Could not resolve conflict. Please export your local text.");
    } catch {
      setSaveStatus("error");
      setErrorMessage("Network error while resolving conflict.");
    }
  }, [documentId, version, title, excerpt, contentHtml, contentJson, status]);

  const resolveConflictLoadServer = useCallback(async () => {
    if (!documentId) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/documents/${documentId}`);
      if (res.ok) {
        const json = await res.json();
        const doc = json.data;
        setVersion(doc.version);
        setTitle(doc.title);
        setExcerpt(doc.excerpt || "");
        setContentHtml(doc.contentHtml || "");
        setContentJson(doc.contentJson ? JSON.parse(doc.contentJson) : null);
        setStatus(doc.status);
        updateContentCounts(doc.contentHtml || "");
        setConflictData(null);
        setSaveStatus("saved");
        setIsDirty(false);
        DraftManager.clearRecoveryBuffer(documentId);
      }
    } catch {
      setErrorMessage("Failed to load server version.");
    } finally {
      setIsLoading(false);
    }
  }, [documentId, updateContentCounts]);

  // 5. Browser Unload & Flush Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (stateRef.current.isDirty) {
        // Attempt quick synchronous save to recovery buffer
        DraftManager.saveRecoveryBuffer(stateRef.current.documentId, {
          title: stateRef.current.title,
          excerpt: stateRef.current.excerpt,
          contentHtml: stateRef.current.contentHtml,
          contentJson: stateRef.current.contentJson,
          status: stateRef.current.status,
          version: stateRef.current.version,
        });
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return {
    documentId,
    version,
    title,
    excerpt,
    contentHtml,
    contentJson,
    status,
    publication,
    scheduledDate,
    words,
    targetWords,
    saveStatus,
    isDirty,
    lastSavedAt,
    isLoading,
    errorMessage,
    conflictData,
    isAuthenticated,
    authorId,
    activeBook,
    setPublication,
    setScheduledDate,
    setTargetWords,
    handleTitleChange,
    handleExcerptChange,
    handleEditorChange,
    handleStatusChange,
    manualSave,
    resolveConflictKeepMine,
    resolveConflictLoadServer,
  };
}
