"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  BookOpen,
  Users,
  Clock,
  Grid3x3,
  List,
  ChevronRight,
  GraduationCap,
  Loader2,
} from "lucide-react";
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { getAllCourses, type ICourseRes } from "@/services/course.service";
import { toast } from "sonner";
import { getInitials } from "@/utils/get-initial";

interface CourseWithQuizzes extends ICourseRes {
  quizCount?: number;
}

const COURSE_CATEGORIES = [
  "Development",
  "Business",
  "Finance & Accounting",
  "IT & Software",
  "Office Productivity",
  "Personal Development",
  "Design",
  "Marketing",
  "Lifestyle",
  "Photography & Video",
  "Health & Fitness",
  "Music",
  "Teaching & Academics",
] as const;

const ITEMS_PER_PAGE = 12;
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

// Loading Skeleton
function CoursesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden flex flex-col">
          <Skeleton className="h-48 w-full rounded-none" />
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function CoursesListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="flex">
            <Skeleton className="w-80 h-48 rounded-none flex-shrink-0" />
            <div className="flex-1 p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Course Card Grid View
function CourseCardGrid({ course }: { course: CourseWithQuizzes }) {
  const router = useRouter();

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group flex flex-col"
      onClick={() => router.push(`/course/${course.id}`)}
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap className="h-20 w-20 text-primary/20" />
          </div>
        )}
      </div>

      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={getLevelColor(course.level)}>
            {getLevelLabel(course.level)}
          </Badge>
          {course.category && (
            <Badge variant="secondary" className="text-xs">
              {course.category}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.smallDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {course.smallDescription}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={course.instructor?.avatar} />
            <AvatarFallback>
              {getInitials(course.instructor?.fullName || "Unknown")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground line-clamp-1">
            {course.instructor?.fullName}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course._count?.enrollments || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{course._count?.chapters || 0} chapters</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto">
        <Button variant="default" className="w-full group-hover:bg-primary/90">
          View Course
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Course Card List View
function CourseCardList({ course }: { course: CourseWithQuizzes }) {
  const router = useRouter();

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={() => router.push(`/course/${course.id}`)}
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-80 h-48 flex-shrink-0 bg-gradient-to-br from-primary/10 to-primary/5">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap className="h-20 w-20 text-primary/20" />
            </div>
          )}
        </div>

        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={getLevelColor(course.level)}
                >
                  {getLevelLabel(course.level)}
                </Badge>
                {course.category && (
                  <Badge variant="secondary">{course.category}</Badge>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {course.smallDescription || course.description}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={course.instructor?.avatar} />
                  <AvatarFallback>
                    {getInitials(course.instructor?.fullName || "Unknown")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {course.instructor?.fullName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{course._count?.enrollments || 0} students</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{course._count?.chapters || 0} chapters</span>
            </div>
            {course.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{course.duration} hours</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper Functions
function getLevelColor(level: string): string {
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
}

function getLevelLabel(level: string): string {
  switch (level) {
    case "BEGINNER":
      return "Beginner";
    case "INTERMEDIATE":
      return "Intermediate";
    case "ADVANCED":
      return "Advanced";
    default:
      return level;
  }
}

// Main Component
export default function CoursesPage() {
  const router = useRouter();

  const [allCourses, setAllCourses] = useState<CourseWithQuizzes[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);

  // Fetch all courses
  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        setLoading(true);
        let allData: CourseWithQuizzes[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await getAllCourses(page, 100);

          const publishedCourses = response.data.filter(
            (course) => course.status === "PUBLISHED"
          );

          allData = [...allData, ...publishedCourses];

          hasMore = page < response.totalPages;
          page++;
        }

        setAllCourses(allData);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Failed to load courses");
        setAllCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCourses();
  }, []);

  // Filter and sort courses
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = [...allCourses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          course.instructor?.fullName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (course) => course.category === selectedCategory
      );
    }

    // Level filter
    if (selectedLevel !== "all") {
      filtered = filtered.filter((course) => course.level === selectedLevel);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b._count?.enrollments || 0) - (a._count?.enrollments || 0);
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "chapters":
          return (b._count?.chapters || 0) - (a._count?.chapters || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allCourses, searchQuery, selectedCategory, selectedLevel, sortBy]);

  // Get displayed courses
  const displayedCourses = useMemo(() => {
    return filteredAndSortedCourses.slice(0, displayedCount);
  }, [filteredAndSortedCourses, displayedCount]);

  const hasMore = displayedCount < filteredAndSortedCourses.length;

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, filteredAndSortedCourses.length)
      );
      setLoadingMore(false);
    }, 300);
  }, [filteredAndSortedCourses.length]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory, selectedLevel, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore Courses</h1>
          <p className="text-muted-foreground">
            Discover {allCourses.length} courses to boost your skills
          </p>
        </div>
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "grid" | "list")}
        >
          <TabsList>
            <TabsTrigger value="grid">
              <Grid3x3 className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses, instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {COURSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {getLevelLabel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="chapters">Most Chapters</SelectItem>
                  <SelectItem value="title">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Content */}
      {loading ? (
        viewMode === "grid" ? (
          <CoursesGridSkeleton />
        ) : (
          <CoursesListSkeleton />
        )
      ) : displayedCourses.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCourses.map((course) => (
                <CourseCardGrid key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedCourses.map((course) => (
                <CourseCardList key={course.id} course={course} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                size="lg"
                variant="outline"
              >
                {loadingMore && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                )}
                Load More ({filteredAndSortedCourses.length - displayedCount}{" "}
                remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
