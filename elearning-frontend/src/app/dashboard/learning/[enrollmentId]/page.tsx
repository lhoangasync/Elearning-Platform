// src/app/learning/[enrollmentId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  PlayCircle,
  CheckCircle2,
  FileText,
  Clock,
  BookOpen,
  X,
  Menu,
  ArrowLeft,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getEnrollmentById,
  type IEnrollmentDetail,
  type ILesson,
  type IChapter,
} from "@/services/enrollment.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Loading skeleton for the entire page
function LearningPageSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-14 w-full" />
        <div className="flex-1 bg-muted flex items-center justify-center">
          <Skeleton className="w-3/4 h-3/4" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

type Params = Promise<{ enrollmentId: string }>;

export default function LearningPage({ params }: { params: Params }) {
  const router = useRouter();
  const [enrollmentId, setEnrollmentId] = useState<string>("");
  const [enrollmentData, setEnrollmentData] =
    useState<IEnrollmentDetail | null>(null);
  const [currentLesson, setCurrentLesson] = useState<ILesson | null>(null);
  const [currentChapter, setCurrentChapter] = useState<IChapter | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set()
  );

  // Unwrap params
  useEffect(() => {
    params.then(({ enrollmentId }) => {
      setEnrollmentId(enrollmentId);
    });
  }, [params]);

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollmentData();
    }
  }, [enrollmentId]);

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      const data = await getEnrollmentById(enrollmentId);
      setEnrollmentData(data);

      // Auto select first lesson
      if (
        data.course.chapters.length > 0 &&
        data.course.chapters[0].lessons.length > 0
      ) {
        const firstChapter = data.course.chapters[0];
        const firstLesson = firstChapter.lessons[0];
        setCurrentChapter(firstChapter);
        setCurrentLesson(firstLesson);
        setExpandedChapters(new Set([firstChapter.id]));
      }
    } catch (error) {
      console.error("Error fetching enrollment:", error);
      toast.error("Failed to load course content");
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const selectLesson = (lesson: ILesson, chapter: IChapter) => {
    setCurrentLesson(lesson);
    setCurrentChapter(chapter);
  };

  const markAsComplete = () => {
    if (currentLesson) {
      setCompletedLessons((prev) => new Set(prev).add(currentLesson.id));
      toast.success("Lesson marked as complete!");

      // Auto navigate to next lesson
      goToNextLesson();
    }
  };

  const goToNextLesson = () => {
    if (!enrollmentData || !currentChapter || !currentLesson) return;

    const currentChapterIndex = enrollmentData.course.chapters.findIndex(
      (ch) => ch.id === currentChapter.id
    );
    const currentLessonIndex = currentChapter.lessons.findIndex(
      (l) => l.id === currentLesson.id
    );

    // Try next lesson in current chapter
    if (currentLessonIndex < currentChapter.lessons.length - 1) {
      const nextLesson = currentChapter.lessons[currentLessonIndex + 1];
      selectLesson(nextLesson, currentChapter);
      return;
    }

    // Try first lesson of next chapter
    if (currentChapterIndex < enrollmentData.course.chapters.length - 1) {
      const nextChapter =
        enrollmentData.course.chapters[currentChapterIndex + 1];
      if (nextChapter.lessons.length > 0) {
        selectLesson(nextChapter.lessons[0], nextChapter);
        setExpandedChapters((prev) => new Set(prev).add(nextChapter.id));
        return;
      }
    }

    toast.info("You've reached the end of the course!");
  };

  const goToPreviousLesson = () => {
    if (!enrollmentData || !currentChapter || !currentLesson) return;

    const currentChapterIndex = enrollmentData.course.chapters.findIndex(
      (ch) => ch.id === currentChapter.id
    );
    const currentLessonIndex = currentChapter.lessons.findIndex(
      (l) => l.id === currentLesson.id
    );

    // Try previous lesson in current chapter
    if (currentLessonIndex > 0) {
      const prevLesson = currentChapter.lessons[currentLessonIndex - 1];
      selectLesson(prevLesson, currentChapter);
      return;
    }

    // Try last lesson of previous chapter
    if (currentChapterIndex > 0) {
      const prevChapter =
        enrollmentData.course.chapters[currentChapterIndex - 1];
      if (prevChapter.lessons.length > 0) {
        selectLesson(
          prevChapter.lessons[prevChapter.lessons.length - 1],
          prevChapter
        );
        setExpandedChapters((prev) => new Set(prev).add(prevChapter.id));
        return;
      }
    }

    toast.info("You're at the beginning of the course!");
  };

  const getTotalLessons = () => {
    return (
      enrollmentData?.course.chapters.reduce(
        (acc, ch) => acc + ch.lessons.length,
        0
      ) || 0
    );
  };

  const getCompletedLessonsCount = () => {
    return completedLessons.size;
  };

  const progressPercentage =
    getTotalLessons() > 0
      ? Math.round((getCompletedLessonsCount() / getTotalLessons()) * 100)
      : 0;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "BEGINNER":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "INTERMEDIATE":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "ADVANCED":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      BEGINNER: "Beginner",
      INTERMEDIATE: "Intermediate",
      ADVANCED: "Advanced",
    };
    return labels[level] || level;
  };

  if (loading) {
    return <LearningPageSkeleton />;
  }

  if (!enrollmentData) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Course not found</p>
          <Button onClick={() => router.push("/my-courses")}>
            Back to My Courses
          </Button>
        </div>
      </div>
    );
  }

  const currentLessonIndex = currentChapter?.lessons.findIndex(
    (l) => l.id === currentLesson?.id
  );
  const isFirstLesson =
    enrollmentData.course.chapters[0]?.id === currentChapter?.id &&
    currentLessonIndex === 0;
  const isLastLesson =
    enrollmentData.course.chapters[enrollmentData.course.chapters.length - 1]
      ?.id === currentChapter?.id &&
    currentLessonIndex === currentChapter.lessons.length - 1;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "w-80 border-r bg-card flex flex-col transition-all duration-300 overflow-hidden",
          !sidebarOpen && "-ml-80 md:ml-0 md:w-0"
        )}
      >
        {/* Course Header */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/my-courses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Badge
            variant="outline"
            className={getLevelColor(enrollmentData.course.level)}
          >
            {getLevelLabel(enrollmentData.course.level)}
          </Badge>

          <h1 className="font-bold text-lg line-clamp-2">
            {enrollmentData.course.title}
          </h1>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {progressPercentage}% complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {getCompletedLessonsCount()}/{getTotalLessons()} lessons completed
            </p>
          </div>
        </div>

        {/* Chapters & Lessons */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {enrollmentData.course.chapters
              .sort((a, b) => a.position - b.position)
              .map((chapter, chapterIndex) => (
                <div key={chapter.id} className="mb-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 h-auto"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    {expandedChapters.has(chapter.id) ? (
                      <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">
                        {chapterIndex + 1}. {chapter.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chapter.lessons.length} lessons
                      </p>
                    </div>
                  </Button>

                  {expandedChapters.has(chapter.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {chapter.lessons
                        .sort((a, b) => a.position - b.position)
                        .map((lesson, lessonIndex) => {
                          const isActive = currentLesson?.id === lesson.id;
                          const isCompleted = completedLessons.has(lesson.id);

                          return (
                            <Button
                              key={lesson.id}
                              variant={isActive ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start px-3 py-2 h-auto",
                                isActive && "bg-primary/10 hover:bg-primary/20"
                              )}
                              onClick={() => selectLesson(lesson, chapter)}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 dark:text-green-400 flex-shrink-0" />
                              ) : lesson.videoUrl ? (
                                <PlayCircle className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <FileText className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className="flex-1 text-left">
                                <p className="text-sm font-medium line-clamp-2">
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                              </div>
                            </Button>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b flex items-center px-4 bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-4 flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">
              {currentChapter?.title}
            </p>
            <h2 className="font-semibold truncate">{currentLesson?.title}</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={markAsComplete}
            disabled={
              currentLesson ? completedLessons.has(currentLesson.id) : true
            }
          >
            {currentLesson && completedLessons.has(currentLesson.id) ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                Completed
              </>
            ) : (
              "Mark as Complete"
            )}
          </Button>
        </div>

        {/* Video/Content Player */}
        <div className="flex-1 overflow-auto bg-muted">
          {currentLesson?.videoUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <video
                key={currentLesson.id}
                controls
                className="w-full h-full max-h-full object-contain"
                src={currentLesson.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : currentLesson?.documentUrl ? (
            <div className="w-full h-full p-8 bg-background overflow-auto">
              <Card className="max-w-4xl mx-auto">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xl truncate">
                        {currentLesson.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Document Lesson
                      </p>
                    </div>
                  </div>
                  <Separator className="mb-6" />
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-muted-foreground mb-4">
                      This lesson contains document materials for you to review.
                    </p>
                    <Button asChild variant="default">
                      <a
                        href={currentLesson.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Document
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-background">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No content available for this lesson
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="h-16 border-t flex items-center justify-between px-6 bg-card">
          <Button
            variant="outline"
            onClick={goToPreviousLesson}
            disabled={isFirstLesson}
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Previous
          </Button>
          <div className="text-sm text-muted-foreground hidden sm:block">
            Lesson {(currentLessonIndex || 0) + 1} of{" "}
            {currentChapter?.lessons.length || 0}
          </div>
          <Button onClick={goToNextLesson} disabled={isLastLesson}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
