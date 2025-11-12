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
} from "lucide-react";
import { getAllQuizzes, deleteQuiz, type IQuiz } from "@/services/quiz.service";
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

type QuizWithCount = IQuiz & {
  _count?: { questions: number; attempts: number };
  course?: {
    id: string;
    title: string;
    chapters: { id: string; title: string }[];
  };
};

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
  const [quizzes, setQuizzes] = useState<QuizWithCount[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<QuizWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    filterAndSortQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizzes, searchQuery, filterCourse, sortBy]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await getAllQuizzes();
      setQuizzes(response.data || []);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortQuizzes = () => {
    let filtered = [...quizzes];

    if (searchQuery) {
      filtered = filtered.filter((quiz) =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCourse && filterCourse !== "all") {
      filtered = filtered.filter((quiz) => quiz.courseId === filterCourse);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredQuizzes(filtered);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      await deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (error) {
      console.error("Error deleting quiz:", error);
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

  const uniqueCourses = [...new Set(quizzes.map((q) => q.courseId))];

  return (
    <div className="space-y-6">
      {/* Filters */}
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

        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {uniqueCourses.map((courseId) => (
              <SelectItem key={courseId} value={courseId}>
                {courseId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Sort by: Newest</SelectItem>
            <SelectItem value="oldest">Sort by: Oldest</SelectItem>
            <SelectItem value="title">Sort by: Title</SelectItem>
          </SelectContent>
        </Select>
        <Link href="/dashboard/quizzes/create">
          <Button>
            <BookOpen className="h-4 w-4 mr-2" />
            Create New Quiz
          </Button>
        </Link>
      </div>

      {/* Quiz List */}
      {loading ? (
        <QuizListSkeleton />
      ) : filteredQuizzes.length === 0 ? (
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
        <div className="space-y-4">
          {filteredQuizzes.map((quiz) => {
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
                            <>Available until: {formatDate(quiz.availableTo)}</>
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
                        <span>{quiz._count?.attempts || 0} Attempts Made</span>
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
      )}
    </div>
  );
}
