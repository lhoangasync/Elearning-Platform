"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkEnrollment } from "@/services/enrollment.service";
import { EnrollButton } from "./EnrollButton";
import { Skeleton } from "@/components/ui/skeleton";

interface EnrollmentStatusButtonProps {
  courseId: string;
}

export function EnrollmentStatusButton({
  courseId,
}: EnrollmentStatusButtonProps) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkEnrollment(courseId);
        setIsEnrolled(result.isEnrolled);
        setEnrollmentId(result.enrollmentId);
      } catch (error) {
        console.error("Error checking enrollment:", error);
        setIsEnrolled(false);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [courseId]);

  if (loading) {
    return <Skeleton className="h-11 w-full rounded-md" />;
  }

  if (isEnrolled) {
    return (
      <Link href={`/dashboard/learning/${enrollmentId}`} className="block">
        <Button size="lg" className="w-full">
          Continue Learning
        </Button>
      </Link>
    );
  }

  return <EnrollButton courseId={courseId} size="lg" />;
}
