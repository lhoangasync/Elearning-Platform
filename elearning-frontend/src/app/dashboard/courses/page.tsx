"use client";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  getAllCourses,
  getAllCoursesBaseRole,
  ICourse,
  ICourseRes,
} from "@/services/course.service";
import { getErrorMessage } from "@/utils/error-message";
import {
  BookOpen,
  Clock,
  Edit,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

const LEVEL_COLORS = {
  BEGINNER: "bg-green-500 text-white border-green-600",
  INTERMEDIATE: "bg-blue-500 text-white border-blue-600",
  ADVANCED: "bg-purple-500 text-white border-purple-600",
};

const STATUS_COLORS = {
  DRAFT: "bg-yellow-500 text-white border-yellow-600",
  PUBLISHED: "bg-green-500 text-white border-green-600",
  ARCHIVED: "bg-red-500 text-white border-red-600",
};

function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<ICourseRes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 500);
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<ICourse | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchCourses = async (pageNum: number = 1, append: boolean = false) => {
    setIsLoading(true);
    try {
      const response = await getAllCoursesBaseRole(pageNum, 8);

      if (append) {
        setCourses((prev) => [...prev, ...response.data]);
      } else {
        setCourses(response.data);
      }

      setTotalItems(response.totalItems);
      setHasMore(pageNum < response.totalPages);
    } catch (error) {
      toast.error("Failed to fetch courses", {
        description: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCourses(1, false);
  }, [debouncedSearch, levelFilter, statusFilter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCourses(nextPage, true);
  };

  const clearFilters = () => {
    setLevelFilter("");
    setStatusFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = levelFilter || statusFilter || searchQuery;

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your courses
          </p>
        </div>
        <Link href="/dashboard/courses/create" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Create Course
        </Link>
      </div>

      {/* Filters & Search Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses by title..."
                className="pl-9 pr-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters:</span>
              </div>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Levels</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {courses.length} currently loaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.filter((c) => c.status === "PUBLISHED").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Live on platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.filter((c) => c.status === "DRAFT").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In preparation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses.reduce(
                (sum, c) => sum + (c._count?.enrollments || 0),
                0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all courses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      {isLoading && courses.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden flex flex-col">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 flex flex-col flex-grow">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-2/3 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-3 w-full mb-3" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No courses found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Try adjusting your filters or search query"
                : "Get started by creating your first course"}
            </p>
            {hasActiveFilters ? (
              <Button className="mt-4" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button
                className="mt-4"
                onClick={() => router.push("/dashboard/courses/create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col cursor-pointer"
              >
                {/* Course Thumbnail */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/90 to-primary">
                  {course.thumbnail ? (
                    <Image
                      src={course.thumbnail || ""}
                      alt={course.title}
                      width={400}
                      height={160}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                        <BookOpen className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  {/* Action Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/course/${course.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/courses/${course.id}/edit`)
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setCourseToDelete(course);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Badges */}
                  <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shadow-md border font-semibold backdrop-blur-sm text-[10px] px-2 py-0.5 leading-tight",
                        STATUS_COLORS[course.status]
                      )}
                    >
                      {course.status}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "shadow-md border font-semibold backdrop-blur-sm text-[10px] px-2 py-0.5 leading-tight",
                        LEVEL_COLORS[course.level]
                      )}
                    >
                      {course.level}
                    </Badge>
                  </div>
                </div>

                {/* Course Content */}
                <div className="flex flex-col flex-grow p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">
                    {course.smallDescription ||
                      "This is a great place to provide quick context about your course."}
                  </p>

                  {/* Instructor */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                    <Avatar className="h-5 w-5 ring-2 ring-background">
                      <AvatarImage
                        src={course.instructor.avatar || undefined}
                      />
                      <AvatarFallback className="text-[10px]">
                        {course.instructor.fullName.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate">
                      {course.instructor.fullName}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-medium">{course.duration}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {course._count?.enrollments || 0} students
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs font-semibold">4.9</span>
                    <span className="text-xs text-muted-foreground">
                      (1,890)
                    </span>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/courses/${course.id}/edit`);
                    }}
                  >
                    Edit Course
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                {isLoading ? "Loading..." : "Load More Courses"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the course{" "}
              <strong>{courseToDelete?.title}</strong> and all its chapters and
              lessons. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default CoursesPage;
