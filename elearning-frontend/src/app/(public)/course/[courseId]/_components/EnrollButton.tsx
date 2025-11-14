"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { enrollCourse } from "@/services/enrollment.service";
import { getErrorMessage } from "@/utils/error-message";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface EnrollButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  courseId: string;
}

export function EnrollButton({
  courseId,
  children = "Enroll Now",
  className,
  ...props
}: EnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const enroll = async () => {
    try {
      setIsLoading(true);
      const response = await enrollCourse({ courseId });
      console.log("Enrollment response:", response);
      router.push(`/dashboard/learning/${response.id}`);
      toast.success("Enrolled successfully!");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(`Enrollment failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      disabled={isLoading}
      className={cn("w-full", className)}
      onClick={enroll}
      {...props}
    >
      {isLoading && (
        <LoaderCircle className="size-5 animate-spin text-blue-500" />
      )}
      {children}
    </Button>
  );
}
