"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  Target,
  RotateCcw,
  FileText,
  Users,
  Edit,
  BarChart3,
  Trash2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAllQuizzesManage,
  deleteQuiz,
  type IQuiz,
} from "@/services/quiz.service";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

type QuizWithCount = IQuiz & {
  _count?: { questions: number; attempts: number };
  course?: {
    id: string;
    title: string;
    chapters: { id: string; title: string }[];
    instructor: { id: string; fullName: string };
  };
};

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

// Loading Skeleton Component
function QuizListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex">
            <Skeleton className="w-48 h-48 flex-shrink-0 rounded-none" />

            <div className="flex-1 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-6 w-96" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>

              <div className="flex items-center gap-6 mb-4">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-4 w-20" />
                ))}
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function QuizzesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [quizzes, setQuizzes] = useState<QuizWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterChapter, setFilterChapter] = useState("all");
  const [filterInstructor, setFilterInstructor] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalItems: 0,
    totalPages: 1,
    page: 1,
    limit: 10,
  });

  // Get unique values for filters
  const uniqueCourses = Array.from(
    new Map(quizzes.map((q) => [q.course?.id, q.course])).values()
  ).filter(Boolean);

  const uniqueInstructors = Array.from(
    new Map(
      quizzes.map((q) => [q.course?.instructor?.id, q.course?.instructor])
    ).values()
  ).filter(Boolean);

  const selectedCourse = uniqueCourses.find((c) => c?.id === filterCourse);
  const availableChapters = selectedCourse?.chapters || [];

  useEffect(() => {
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.page,
    filterCourse,
    filterChapter,
    filterInstructor,
    searchQuery,
  ]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (searchQuery) params.search = searchQuery;
      if (filterCourse && filterCourse !== "all")
        params.courseId = filterCourse;
      if (filterChapter && filterChapter !== "all")
        params.chapterId = filterChapter;

      // Admin có thể filter theo instructor
      if (
        user?.role.name === "ADMIN" &&
        filterInstructor &&
        filterInstructor !== "all"
      ) {
        params.instructorId = filterInstructor;
      }

      const response = await getAllQuizzesManage(params);

      setQuizzes(response.data || []);
      setPagination({
        totalItems: response.totalItems,
        totalPages: response.totalPages,
        page: response.page,
        limit: response.limit,
      });
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      await deleteQuiz(quizId);
      toast.success("Quiz deleted successfully");
      fetchQuizzes(); // Refresh list
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const getQuizStatus = (quiz: QuizWithCount) => {
    const now = new Date();
    const availableFrom = quiz.availableFrom
      ? new Date(quiz.availableFrom)
      : null;
    const availableTo = quiz.availableTo ? new Date(quiz.availableTo) : null;

    if (!availableFrom && !availableTo) {
      return {
        label: "Available",
        className:
          "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      };
    }

    if (availableFrom && now < availableFrom) {
      return {
        label: "Upcoming",
        className:
          "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      };
    }
    if (availableTo && now > availableTo) {
      return {
        label: "Expired",
        className:
          "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      };
    }
    return {
      label: "Available",
      className:
        "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isAdmin = user?.role.name === "ADMIN";
  const isInstructor = user?.role.name === "INSTRUCTOR";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by quiz title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filterCourse}
            onValueChange={(value) => {
              setFilterCourse(value);
              setFilterChapter("all"); // Reset chapter when course changes
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {uniqueCourses.map((course) => (
                <SelectItem key={course?.id} value={course?.id || ""}>
                  {course?.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Chapter filter - only for Instructor */}
          {isInstructor && (
            <Select
              value={filterChapter}
              onValueChange={setFilterChapter}
              disabled={filterCourse === "all" || !availableChapters.length}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Chapter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {availableChapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Instructor filter - only for Admin */}
          {isAdmin && (
            <Select
              value={filterInstructor}
              onValueChange={setFilterInstructor}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Instructor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instructors</SelectItem>
                {uniqueInstructors.map((instructor) => (
                  <SelectItem key={instructor?.id} value={instructor?.id || ""}>
                    {instructor?.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Link href="/dashboard/quizzes/create">
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              Create New Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Quiz List */}
      {loading ? (
        <QuizListSkeleton />
      ) : quizzes.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Quizzes Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No quizzes match your current filters. Try adjusting your search
              or create a new quiz.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {quizzes.map((quiz) => {
              const status = getQuizStatus(quiz);
              return (
                <Card key={quiz.id} className="overflow-hidden">
                  <div className="flex">
                    <div className="relative w-48 flex-shrink-0 overflow-hidden">
                      <Image
                        src={"/logoquiz.svg"}
                        alt="logo"
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span>Course: {quiz?.course?.title}</span>
                            {quiz.chapterId && (
                              <>
                                <span>|</span>
                                <span>
                                  Chapter:{" "}
                                  {
                                    quiz?.course?.chapters.find(
                                      (ch) => ch.id === quiz.chapterId
                                    )?.title
                                  }
                                </span>
                              </>
                            )}
                            {isAdmin && quiz?.course?.instructor && (
                              <>
                                <span>|</span>
                                <span>
                                  Instructor: {quiz.course.instructor.fullName}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="text-xl font-semibold mb-2">
                            {quiz.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {quiz.availableFrom && quiz.availableTo ? (
                              <>
                                Availability: {formatDate(quiz.availableFrom)} -{" "}
                                {formatDate(quiz.availableTo)}
                              </>
                            ) : quiz.availableFrom ? (
                              <>
                                Available from: {formatDate(quiz.availableFrom)}
                              </>
                            ) : quiz.availableTo ? (
                              <>
                                Available until: {formatDate(quiz.availableTo)}
                              </>
                            ) : (
                              <>Created on: {formatDate(quiz.createdAt)}</>
                            )}
                          </p>
                        </div>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{quiz.timeLimitMinutes || 0} mins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>{quiz.passingScore}% Passing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-4 w-4" />
                          <span>{quiz.maxAttempts || "∞"} Attempts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{quiz._count?.questions || 0} Questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {quiz._count?.attempts || 0} Attempts Made
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            router.push(`/dashboard/quizzes/${quiz.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() =>
                            router.push(`/dashboard/quizzes/${quiz.id}/results`)
                          }
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalItems
                )}{" "}
                of {pagination.totalItems} quizzes
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-9"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
