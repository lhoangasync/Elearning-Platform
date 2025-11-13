import { getCourseById } from "@/services/course.service";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  BarChart3,
  Users,
  CheckCircle2,
  PlayCircle,
  FileText,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/get-initial";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Params = Promise<{ courseId: string }>;

export default async function CourseDetailPage({ params }: { params: Params }) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  const levelColors = {
    BEGINNER: "bg-green-500/10 text-green-600 border-green-500/20",
    INTERMEDIATE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    ADVANCED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  };

  const levelLabels = {
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b rounded-md">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-sm">
                  {course.category}
                </Badge>
                <Badge variant="outline" className={levelColors[course.level]}>
                  {levelLabels[course.level]}
                </Badge>
                {course.status === "PUBLISHED" && (
                  <Badge className="bg-green-600">Published</Badge>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                {course.title}
              </h1>

              <p className="text-xl text-muted-foreground">
                {course.smallDescription}
              </p>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <Card className="border-2">
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {course._count?.enrollments || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="p-4 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {course.chapters?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Chapters</p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="p-4 text-center">
                    <PlayCircle className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">
                      {course.chapters?.reduce(
                        (acc, ch) => acc + (ch.lessons?.length || 0),
                        0
                      ) || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Lessons</p>
                  </CardContent>
                </Card>
                <Card className="border-2">
                  <CardContent className="p-4 text-center">
                    <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500 fill-yellow-500" />
                    <p className="text-2xl font-bold">4.8</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </CardContent>
                </Card>
              </div>

              {/* Instructor Info */}
              {course.instructor && (
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-primary">
                        <AvatarImage src={course.instructor.avatar} />
                        <AvatarFallback className="bg-primary/10">
                          {getInitials(course.instructor.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Created by
                        </p>
                        <p className="font-semibold text-lg">
                          {course.instructor.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {course.instructor.email}
                        </p>
                      </div>
                      <Badge variant="secondary" className="hidden sm:flex">
                        Instructor
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Info Tags */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge variant="outline" className="px-4 py-2">
                  <Clock className="h-4 w-4 mr-2" />
                  Lifetime access
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Certificate of completion
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <Users className="h-4 w-4 mr-2" />
                  Community support
                </Badge>
              </div>

              {/* Mobile Enroll Button */}
              <div className="lg:hidden pt-4">
                <Button size="lg" className="w-full">
                  Enroll Now
                </Button>
              </div>
            </div>

            {/* Right - Course Card */}
            <div className="lg:col-span-1 hidden lg:block">
              <Card className="sticky top-4 border-2 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  {course.thumbnail && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2">
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center hover:bg-black/30 transition-colors cursor-pointer">
                        <div className="bg-accent rounded-full p-4 shadow-xl hover:scale-110 transition-transform">
                          <PlayCircle className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button size="lg" className="w-full">
                      Enroll Now
                    </Button>
                    <Button size="lg" variant="outline" className="w-full">
                      Preview Course
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <h3 className="font-semibold">This course includes:</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Lifetime access</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {course.chapters?.reduce(
                            (acc, ch) => acc + (ch.lessons?.length || 0),
                            0
                          ) || 0}{" "}
                          lessons
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span>{levelLabels[course.level]} level</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    What you will learn
                  </h2>
                  <div className="grid md:grid-cols-2 gap-3">
                    {course.whatYouWillLearn.map((item, index) => (
                      <div key={index} className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">Course Description</h2>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: course.description || "",
                  }}
                />
              </CardContent>
            </Card>

            {/* Course Content */}
            {course.chapters && course.chapters.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Course Content</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {course.chapters.length} chapters •{" "}
                    {course.chapters.reduce(
                      (acc, ch) => acc + (ch.lessons?.length || 0),
                      0
                    )}{" "}
                    lessons
                  </p>
                  <Accordion type="multiple" className="w-full">
                    {course.chapters
                      .sort((a, b) => a.position - b.position)
                      .map((chapter) => (
                        <AccordionItem key={chapter.id} value={chapter.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium text-left">
                                {chapter.title}
                              </span>
                              <Badge variant="secondary" className="ml-auto">
                                {chapter.lessons?.length || 0} lessons
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pl-8 pt-2">
                              {chapter.lessons
                                ?.sort((a, b) => a.position - b.position)
                                .map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center gap-3 py-2 text-sm text-muted-foreground"
                                  >
                                    <PlayCircle className="h-4 w-4" />
                                    <span>{lesson.title}</span>
                                  </div>
                                ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {course.requirements.map((req, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Instructor */}
            {course.instructor && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Instructor</h2>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={course.instructor.avatar} />
                      <AvatarFallback>
                        {getInitials(course.instructor.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {course.instructor.fullName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {course.instructor.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Related Courses (Empty for now) */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Share this course</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
