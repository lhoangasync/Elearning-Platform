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
  updateChapter,
  deleteChapter as deleteChapterAPI,
  reorderChapters,
  createLesson,
  updateLesson,
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

interface Lesson {
  id: string;
  title: string;
  order: number;
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
      })) ?? [],
  }));
}

function SortableLesson({
  lesson,
  onDelete,
}: {
  lesson: Lesson;
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
  onDeleteLesson,
  onUpdateLessons,
}: {
  chapter: Chapter;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddLesson: (chapterId: string) => void;
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
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const [newLessonName, setNewLessonName] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "chapter" | "lesson";
    id: string;
    chapterId?: string;
  }>({ open: false, type: "chapter", id: "" });

  const router = useRouter();

  useEffect(() => {
    if (course) {
      setChapters(mapCourseStructure(course));
    }
  }, [course]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
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

      try {
        await reorderChapters({
          courseId: course.id,
          chapters: newChapters.map((ch) => ({
            id: ch.id,
            position: ch.order,
          })),
        });
        toast.success("Chapters reordered successfully");
      } catch (error: any) {
        console.error("Error reordering chapters:", error);
        toast.error("Failed to reorder chapters");
        setChapters(mapCourseStructure(course));
      }
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
      setChapters((prev) => prev.filter((ch) => ch.id !== deleteDialog.id));
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

      setChapters((prev) => [
        ...prev,
        {
          id: newChapter.id,
          title: newChapter.title,
          order: newChapter.position,
          lessons: [],
          isExpanded: true,
        },
      ]);

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

      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === selectedChapterId
            ? {
                ...ch,
                lessons: [
                  ...ch.lessons,
                  {
                    id: newLesson.id,
                    title: newLesson.title,
                    order: newLesson.position,
                  },
                ],
              }
            : ch
        )
      );

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

  const handleDeleteLesson = (chapterId: string, lessonId: string) => {
    setDeleteDialog({ open: true, type: "lesson", id: lessonId, chapterId });
  };

  const confirmDeleteLesson = async () => {
    try {
      setIsLoading(true);
      await deleteLessonAPI(deleteDialog.id);

      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === deleteDialog.chapterId
            ? {
                ...ch,
                lessons: ch.lessons.filter((l) => l.id !== deleteDialog.id),
              }
            : ch
        )
      );

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

  const updateLessons = async (chapterId: string, lessons: Lesson[]) => {
    const updatedLessons = lessons.map((l, idx) => ({
      ...l,
      order: idx + 1,
    }));

    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId ? { ...ch, lessons: updatedLessons } : ch
      )
    );

    try {
      await reorderLessons({
        chapterId,
        lessons: updatedLessons.map((l) => ({
          id: l.id,
          position: l.order,
        })),
      });
      toast.success("Lessons reordered successfully");
    } catch (error: any) {
      console.error("Error reordering lessons:", error);
      toast.error("Failed to reorder lessons");
      setChapters(mapCourseStructure(course));
    }
  };

  return (
    <div className="space-y-6">
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
    </div>
  );
}
