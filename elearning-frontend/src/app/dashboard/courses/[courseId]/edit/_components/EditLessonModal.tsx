// src/app/dashboard/courses/[courseId]/_components/EditLessonModal.tsx
"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateLesson } from "@/services/course.service";
import { toast } from "sonner";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";

interface Lesson {
  id: string;
  title: string;
  videoUrl: string | null;
  documentUrl: string | null;
  content?: string | null;
}

interface EditLessonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson | null;
  onSuccess: () => void;
}

export function EditLessonModal({
  open,
  onOpenChange,
  lesson,
  onSuccess,
}: EditLessonModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    videoUrl: string;
    documentUrl: string;
    content: string;
  }>({
    title: "",
    videoUrl: "",
    documentUrl: "",
    content: "",
  });

  // Update form when lesson changes or modal opens
  useEffect(() => {
    if (open && lesson) {
      setFormData({
        title: lesson.title || "",
        videoUrl: lesson.videoUrl || "",
        documentUrl: lesson.documentUrl || "",
        content: lesson.content || "",
      });
    }
  }, [open, lesson]);

  const handleSave = async () => {
    if (!lesson || !formData.title.trim()) {
      toast.error("Please enter a lesson title");
      return;
    }

    try {
      setIsLoading(true);

      await updateLesson(lesson.id, {
        title: formData.title,
        videoUrl: formData.videoUrl || undefined,
        documentUrl: formData.documentUrl || undefined,
        content: formData.content || undefined,
      });

      toast.success("Lesson updated successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating lesson:", error);
      toast.error(error?.response?.data?.message || "Failed to update lesson");
    } finally {
      setIsLoading(false);
    }
  };

  // Create a field object for RichTextEditor that mimics react-hook-form field
  const contentField = {
    value: formData.content,
    onChange: (value: string) => {
      setFormData({ ...formData, content: value });
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogDescription>
            Update the lesson details and content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title</Label>
            <Input
              id="lesson-title"
              placeholder="Enter lesson title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Tabs for different content types */}
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="document">Document</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            {/* Video Tab */}
            <TabsContent value="video" className="space-y-2 mt-4">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                placeholder="https://example.com/video.mp4"
                value={formData.videoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, videoUrl: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Add a video URL for this lesson (YouTube, Vimeo, or direct video
                link)
              </p>
            </TabsContent>

            {/* Document Tab */}
            <TabsContent value="document" className="space-y-2 mt-4">
              <Label htmlFor="document-url">Document URL</Label>
              <Input
                id="document-url"
                placeholder="https://example.com/document.pdf"
                value={formData.documentUrl}
                onChange={(e) =>
                  setFormData({ ...formData, documentUrl: e.target.value })
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Add a document URL (PDF, etc.) for this lesson
              </p>
            </TabsContent>

            {/* Content Tab with Rich Text Editor */}
            <TabsContent value="content" className="space-y-2 mt-4">
              <Label htmlFor="content">Content</Label>
              <RichTextEditor
                field={contentField}
                minHeight="400px"
                placeholder="Add lesson content here..."
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
