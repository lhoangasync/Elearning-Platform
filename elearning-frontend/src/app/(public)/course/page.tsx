"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  X,
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
import { useDebounce } from "use-debounce";

interface CourseWithQuizzes extends ICourseRes {
  quizCount?: number;
}

interface PaginationState {
  pageIndex: number;
  pageSize: number;
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

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest First" },
  { value: "chapters", label: "Most Chapters" },
  { value: "title", label: "A-Z" },
] as const;

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
      return "BEGINNER";
    case "INTERMEDIATE":
      return "INTERMEDIATE";
    case "ADVANCED":
      return "ADVANCED";
    default:
      return level;
  }
}

// Main Component
export default function CoursesPage() {
  const router = useRouter();

  const [data, setData] = useState<CourseWithQuizzes[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filterChangedRef = useRef(false);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllCourses(
        pagination.pageIndex + 1,
        pagination.pageSize,
        "PUBLISHED",
        selectedLevel !== "all" ? selectedLevel : undefined,
        debouncedSearchQuery || undefined
      );

      // Apply category filter on client side
      let filteredData = response.data;
      if (selectedCategory !== "all") {
        filteredData = filteredData.filter(
          (course) => course.category === selectedCategory
        );
      }

      // Apply sorting
      filteredData = applySorting(filteredData, sortBy);

      setData(filteredData);
      setTotalItems(response.totalItems);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
      setData([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    selectedLevel,
    debouncedSearchQuery,
    selectedCategory,
    sortBy,
  ]);

  // Khi search hoặc filter đổi → reset page về đầu
  useEffect(() => {
    filterChangedRef.current = true;
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedSearchQuery, selectedCategory, selectedLevel, sortBy]);

  // Khi pagination hoặc filter đổi → fetch dữ liệu
  useEffect(() => {
    if (filterChangedRef.current && pagination.pageIndex !== 0) {
      return; // chặn fetch sai trang khi vừa đổi filter
    }

    fetchCourses();
    filterChangedRef.current = false;
  }, [fetchCourses, pagination.pageIndex]);

  const pageCount = Math.ceil(totalItems / pagination.pageSize);

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.max(0, prev.pageIndex - 1),
    }));
  };

  const handleNextPage = () => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
    }));
  };

  const handlePageSize = (size: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
      pageSize: size,
    }));
  };

  const startItem = pagination.pageIndex * pagination.pageSize + 1;
  const endItem = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalItems
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore Courses</h1>
          <p className="text-muted-foreground">
            Discover{" "}
            <span className="font-semibold text-foreground">{totalItems}</span>{" "}
            courses to boost your skills
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
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedCategory !== "all" ||
                selectedLevel !== "all" ||
                searchQuery) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedLevel("all");
                    setSortBy("popular");
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Content */}
      {isLoading ? (
        viewMode === "grid" ? (
          <CoursesGridSkeleton />
        ) : (
          <CoursesListSkeleton />
        )
      ) : data.length === 0 ? (
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
              {data.map((course) => (
                <CourseCardGrid key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((course) => (
                <CourseCardList key={course.id} course={course} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between gap-8 mt-8">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Rows per page
              </span>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => handlePageSize(Number(value))}
              >
                <SelectTrigger className="w-fit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[6, 12, 18, 24].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {totalItems > 0 ? (
                  <p aria-live="polite">
                    <span className="text-foreground font-medium">
                      {startItem}-{endItem}
                    </span>{" "}
                    of{" "}
                    <span className="text-foreground font-medium">
                      {totalItems}
                    </span>
                  </p>
                ) : (
                  <p>No items to display</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={pagination.pageIndex === 0}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground min-w-fit">
                  Page {pagination.pageIndex + 1} of {pageCount || 1}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={
                    pagination.pageIndex === pageCount - 1 || pageCount === 0
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Sorting function
function applySorting(courses: CourseWithQuizzes[], sortBy: string) {
  const sorted = [...courses];
  sorted.sort((a, b) => {
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
  return sorted;
}
