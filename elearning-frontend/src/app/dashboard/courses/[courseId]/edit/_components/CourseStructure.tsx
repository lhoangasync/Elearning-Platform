"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  GripVertical,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ICourseDetailRes,
  createChapter,
  deleteChapter as deleteChapterAPI,
  reorderChapters,
  createLesson,
  deleteLesson as deleteLessonAPI,
  reorderLessons,
} from "@/services/course.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EditLessonModal } from "./EditLessonModal";

interface Lesson {
  id: string;
  title: string;
  order: number;
  videoUrl: string | null;
  documentUrl: string | null;
  content?: string | null;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  isExpanded: boolean;
}

function mapCourseStructure(course: ICourseDetailRes): Chapter[] {
  if (!course?.chapters?.length) return [];
  return course.chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    order: ch.position,
    isExpanded: true,
    lessons:
      ch.lessons?.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.position,
        videoUrl: l.videoUrl ?? null,
        documentUrl: l.documentUrl ?? null,
        content: l.content ?? null,
      })) ?? [],
  }));
}

function SortableLesson({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors",
        isDragging && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1 text-sm">{lesson.title}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={() => onEdit(lesson)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(lesson.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SortableChapter({
  chapter,
  onToggle,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onUpdateLessons,
}: {
  chapter: Chapter;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddLesson: (chapterId: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (chapterId: string, lessonId: string) => void;
  onUpdateLessons: (chapterId: string, lessons: Lesson[]) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapter.lessons.findIndex((l) => l.id === active.id);
      const newIndex = chapter.lessons.findIndex((l) => l.id === over.id);

      const newLessons = arrayMove(chapter.lessons, oldIndex, newIndex);
      onUpdateLessons(chapter.id, newLessons);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("rounded-lg border bg-card", isDragging && "opacity-50")}
    >
      <div className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onToggle(chapter.id)}
        >
          {chapter.isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <span className="flex-1 font-medium">{chapter.title}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(chapter.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {chapter.isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chapter.lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="ml-8 space-y-2">
                {chapter.lessons.map((lesson) => (
                  <SortableLesson
                    key={lesson.id}
                    lesson={lesson}
                    onEdit={onEditLesson}
                    onDelete={(lessonId) =>
                      onDeleteLesson(chapter.id, lessonId)
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={() => onAddLesson(chapter.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New lesson
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CourseStructure({
  course,
}: {
  course: ICourseDetailRes;
}) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [originalChapters, setOriginalChapters] = useState<Chapter[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const [newLessonName, setNewLessonName] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "chapter" | "lesson";
    id: string;
    chapterId?: string;
  }>({ open: false, type: "chapter", id: "" });
  const [editLessonDialog, setEditLessonDialog] = useState<{
    open: boolean;
    lesson: Lesson | null;
  }>({ open: false, lesson: null });

  const router = useRouter();

  useEffect(() => {
    if (course) {
      const mappedChapters = mapCourseStructure(course);
      setChapters(mappedChapters);
      setOriginalChapters(JSON.parse(JSON.stringify(mappedChapters)));
      setHasChanges(false);
    }
  }, [course]);

  // Check if there are any changes
  useEffect(() => {
    const hasOrderChanges =
      JSON.stringify(chapters) !== JSON.stringify(originalChapters);
    setHasChanges(hasOrderChanges);
  }, [chapters, originalChapters]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((item) => item.id === active.id);
      const newIndex = chapters.findIndex((item) => item.id === over.id);

      const newChapters = arrayMove(chapters, oldIndex, newIndex).map(
        (ch, idx) => ({
          ...ch,
          order: idx + 1,
        })
      );

      setChapters(newChapters);
    }
  };

  const toggleChapter = (id: string) => {
    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === id
          ? { ...chapter, isExpanded: !chapter.isExpanded }
          : chapter
      )
    );
  };

  const handleDeleteChapter = (id: string) => {
    setDeleteDialog({ open: true, type: "chapter", id });
  };

  const confirmDeleteChapter = async () => {
    try {
      setIsLoading(true);
      await deleteChapterAPI(deleteDialog.id);

      const updatedChapters = chapters.filter(
        (ch) => ch.id !== deleteDialog.id
      );
      setChapters(updatedChapters);
      setOriginalChapters(JSON.parse(JSON.stringify(updatedChapters)));

      toast.success("Chapter deleted successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting chapter:", error);
      toast.error(error?.response?.data?.message || "Failed to delete chapter");
    } finally {
      setIsLoading(false);
      setDeleteDialog({ open: false, type: "chapter", id: "" });
    }
  };

  const addChapter = async () => {
    if (!newChapterName.trim()) {
      toast.error("Please enter a chapter name");
      return;
    }

    try {
      setIsLoading(true);
      const newChapter = await createChapter({
        title: newChapterName,
        courseId: course.id,
      });

      const updatedChapters = [
        ...chapters,
        {
          id: newChapter.id,
          title: newChapter.title,
          order: newChapter.position,
          lessons: [],
          isExpanded: true,
        },
      ];

      setChapters(updatedChapters);
      setOriginalChapters(JSON.parse(JSON.stringify(updatedChapters)));

      toast.success("Chapter created successfully");
      setNewChapterName("");
      setIsChapterDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Error creating chapter:", error);
      toast.error(error?.response?.data?.message || "Failed to create chapter");
    } finally {
      setIsLoading(false);
    }
  };

  const addLesson = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setIsLessonDialogOpen(true);
  };

  const saveLesson = async () => {
    if (!newLessonName.trim() || !selectedChapterId) {
      toast.error("Please enter a lesson name");
      return;
    }

    try {
      setIsLoading(true);
      const chapter = chapters.find((ch) => ch.id === selectedChapterId);
      if (!chapter) return;

      const newLesson = await createLesson({
        title: newLessonName,
        chapterId: selectedChapterId,
      });

      const updatedChapters = chapters.map((ch) =>
        ch.id === selectedChapterId
          ? {
              ...ch,
              lessons: [
                ...ch.lessons,
                {
                  id: newLesson.id,
                  title: newLesson.title,
                  order: newLesson.position,
                  videoUrl: newLesson.videoUrl ?? null,
                  documentUrl: newLesson.documentUrl ?? null,
                  content: newLesson.content ?? null,
                },
              ],
            }
          : ch
      );

      setChapters(updatedChapters);
      setOriginalChapters(JSON.parse(JSON.stringify(updatedChapters)));

      toast.success("Lesson created successfully");
      setNewLessonName("");
      setIsLessonDialogOpen(false);
      setSelectedChapterId(null);
      router.refresh();
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      toast.error(error?.response?.data?.message || "Failed to create lesson");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditLessonDialog({ open: true, lesson });
  };

  const handleDeleteLesson = (chapterId: string, lessonId: string) => {
    setDeleteDialog({ open: true, type: "lesson", id: lessonId, chapterId });
  };

  const confirmDeleteLesson = async () => {
    try {
      setIsLoading(true);
      await deleteLessonAPI(deleteDialog.id);

      const updatedChapters = chapters.map((ch) =>
        ch.id === deleteDialog.chapterId
          ? {
              ...ch,
              lessons: ch.lessons.filter((l) => l.id !== deleteDialog.id),
            }
          : ch
      );

      setChapters(updatedChapters);
      setOriginalChapters(JSON.parse(JSON.stringify(updatedChapters)));

      toast.success("Lesson deleted successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      toast.error(error?.response?.data?.message || "Failed to delete lesson");
    } finally {
      setIsLoading(false);
      setDeleteDialog({ open: false, type: "lesson", id: "", chapterId: "" });
    }
  };

  const updateLessons = (chapterId: string, lessons: Lesson[]) => {
    const updatedLessons = lessons.map((l, idx) => ({
      ...l,
      order: idx + 1,
    }));

    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, lessons: updatedLessons } : ch
      )
    );
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      // Collect all reorder operations
      const chapterReorderPromises = [];
      const lessonReorderPromises: any = [];

      // Check chapter order changes
      const chapterOrderChanged = chapters.some((ch, idx) => {
        const original = originalChapters.find((o) => o.id === ch.id);
        return original && original.order !== ch.order;
      });

      if (chapterOrderChanged) {
        chapterReorderPromises.push(
          reorderChapters({
            courseId: course.id,
            chapters: chapters.map((ch) => ({
              id: ch.id,
              position: ch.order,
            })),
          })
        );
      }

      // Check lesson order changes for each chapter
      chapters.forEach((ch) => {
        const original = originalChapters.find((o) => o.id === ch.id);
        if (original) {
          const lessonOrderChanged = ch.lessons.some((lesson, idx) => {
            const originalLesson = original.lessons.find(
              (l) => l.id === lesson.id
            );
            return originalLesson && originalLesson.order !== lesson.order;
          });

          if (lessonOrderChanged) {
            lessonReorderPromises.push(
              reorderLessons({
                chapterId: ch.id,
                lessons: ch.lessons.map((l) => ({
                  id: l.id,
                  position: l.order,
                })),
              })
            );
          }
        }
      });

      // Execute all reorder operations
      await Promise.all([...chapterReorderPromises, ...lessonReorderPromises]);

      // Update original state
      setOriginalChapters(JSON.parse(JSON.stringify(chapters)));
      setHasChanges(false);

      toast.success("Changes saved successfully!");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setChapters(JSON.parse(JSON.stringify(originalChapters)));
    setHasChanges(false);
    toast.info("Changes discarded");
  };

  const handleLessonUpdateSuccess = () => {
    // Refresh the course data to get the updated lesson info
    router.refresh();
    setEditLessonDialog({ open: false, lesson: null });
  };

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              You have unsaved changes to the course structure
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <LoadingSpinner />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Chapters</h3>
          <Button onClick={() => setIsChapterDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New chapter
          </Button>
        </div>

        {chapters.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No chapters yet. Create your first chapter to get started!</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chapters.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {chapters.map((chapter) => (
                  <SortableChapter
                    key={chapter.id}
                    chapter={chapter}
                    onToggle={toggleChapter}
                    onDelete={handleDeleteChapter}
                    onAddLesson={addLesson}
                    onEditLesson={handleEditLesson}
                    onDeleteLesson={handleDeleteLesson}
                    onUpdateLessons={updateLessons}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Create Chapter Dialog */}
      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new chapter</DialogTitle>
            <DialogDescription>
              What would you like to name your chapter?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chapter-name">Name</Label>
              <Input
                id="chapter-name"
                placeholder="Chapter title"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    addChapter();
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsChapterDialogOpen(false);
                setNewChapterName("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={addChapter} disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Creating...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Lesson Dialog */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new lesson</DialogTitle>
            <DialogDescription>
              What would you like to name your lesson?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-name">Name</Label>
              <Input
                id="lesson-name"
                placeholder="Lesson title"
                value={newLessonName}
                onChange={(e) => setNewLessonName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    saveLesson();
                  }
                }}
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsLessonDialogOpen(false);
                setNewLessonName("");
                setSelectedChapterId(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={saveLesson} disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Creating...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              {deleteDialog.type}
              {deleteDialog.type === "chapter" && " and all its lessons"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                deleteDialog.type === "chapter"
                  ? confirmDeleteChapter
                  : confirmDeleteLesson
              }
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Lesson Modal */}
      <EditLessonModal
        open={editLessonDialog.open}
        onOpenChange={(open) =>
          setEditLessonDialog({ ...editLessonDialog, open })
        }
        lesson={editLessonDialog.lesson}
        onSuccess={handleLessonUpdateSuccess}
      />
    </div>
  );
}
