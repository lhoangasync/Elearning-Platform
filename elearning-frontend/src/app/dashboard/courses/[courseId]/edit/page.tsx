import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";
import EditCourseForm from "./_components/EditCourseForm";
import CourseStructure from "./_components/CourseStructure";
import { getCourseById } from "@/services/course.service";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Params = Promise<{ courseId: string }>;
export default async function EditCourse({ params }: { params: Params }) {
  const courseId = await params;
  const courseInfo = await getCourseById(courseId.courseId);
  return (
    <div>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/courses"
          className={cn(
            buttonVariants({
              variant: "outline",
              size: "icon",
            }),
            "mb-8"
          )}
        >
          <ArrowLeft className="size-4" />
        </Link>

        <h1 className="text-3xl font-bold mb-8">
          Edit Course:{" "}
          <span className="text-primary underline">{courseInfo.title}</span>
        </h1>
      </div>
      <Tabs defaultValue="basic-info" className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
          <TabsTrigger value="course-structure">Course Structure</TabsTrigger>
        </TabsList>

        {/* Basic Info  */}
        <TabsContent value="basic-info">
          <Card>
            <CardHeader>
              <CardTitle>Basic Info</CardTitle>
              <CardDescription>
                Provide basic information about the course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditCourseForm course={courseInfo} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Structure */}
        <TabsContent value="course-structure" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Structure</CardTitle>
              <CardDescription>
                Organize your course into chapters and lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseStructure course={courseInfo} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
