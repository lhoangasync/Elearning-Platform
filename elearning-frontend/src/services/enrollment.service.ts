import { API_ENDPOINT } from "@/constants/endpoint";
import api from "@/utils/api";

// Types
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface IEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string; // ISO date string from API
}

export interface IStudent {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
}

export interface IInstructor {
  id: string;
  fullName: string;
  avatar?: string | null;
  email?: string;
}

export interface ICourseInEnrollment {
  id: string;
  title: string;
  thumbnail: string | null;
  level: CourseLevel;
  instructor: IInstructor;
}

export interface IEnrollmentWithDetails extends IEnrollment {
  student: IStudent;
  course: ICourseInEnrollment;
}

export interface IMyCourseEnrollment extends IEnrollment {
  course: {
    id: string;
    title: string;
    thumbnail: string | null;
    level: CourseLevel;
    slug: string;
    instructor: IInstructor;
    _count?: {
      chapters: number;
    };
  };
}

export interface ILesson {
  id: string;
  title: string;
  position: number;
  videoUrl: string | null;
  documentUrl: string | null;
}

export interface IChapter {
  id: string;
  title: string;
  position: number;
  lessons: ILesson[];
}

export interface IEnrollmentDetail extends IEnrollment {
  student: IStudent;
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    level: CourseLevel;
    status: CourseStatus;
    instructor: {
      id: string;
      fullName: string;
      email: string;
    };
    chapters: IChapter[];
  };
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

// DTOs
export interface EnrollCourseDto {
  courseId: string;
}

export interface GetEnrollmentsParams {
  page?: number;
  limit?: number;
  courseId?: string;
  studentId?: string;
}

// API Calls

/**
 * Get all enrollments (with filters)
 * - Admin: can see all enrollments
 * - Instructor: must provide courseId, can only see enrollments of their courses
 * - Student: can only see their own enrollments
 */
export const getAllEnrollments = async (
  params?: GetEnrollmentsParams
): Promise<PaginatedResponse<IEnrollmentWithDetails>> => {
  const response = await api.get<PaginatedResponse<IEnrollmentWithDetails>>(
    API_ENDPOINT.ENROLLMENTS,
    { params }
  );
  return response.data;
};

/**
 * Get my enrolled courses (for students)
 */
export const getMyEnrollments = async (params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<IMyCourseEnrollment>> => {
  const response = await api.get<PaginatedResponse<IMyCourseEnrollment>>(
    `${API_ENDPOINT.ENROLLMENTS}/my-courses`,
    { params }
  );
  return response.data;
};

/**
 * Get enrollment detail by ID
 */
export const getEnrollmentById = async (
  enrollmentId: string
): Promise<IEnrollmentDetail> => {
  const response = await api.get<IEnrollmentDetail>(
    `${API_ENDPOINT.ENROLLMENTS}/${enrollmentId}`
  );
  return response.data;
};

/**
 * Enroll in a course (for students)
 */
export const enrollCourse = async (
  data: EnrollCourseDto
): Promise<IEnrollment> => {
  const response = await api.post<IEnrollment>(
    `${API_ENDPOINT.ENROLLMENTS}/enroll`,
    data
  );
  return response.data;
};

/**
 * Unenroll from a course (for students)
 */
export const unenrollCourse = async (
  courseId: string
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `${API_ENDPOINT.ENROLLMENTS}/unenroll/${courseId}`
  );
  return response.data;
};

/**
 * Delete enrollment by ID (for admin or student owner)
 */
export const deleteEnrollment = async (
  enrollmentId: string
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `${API_ENDPOINT.ENROLLMENTS}/${enrollmentId}`
  );
  return response.data;
};

/**
 * Check if user is enrolled in a course
 */
export const checkEnrollment = async (
  courseId: string
): Promise<{ isEnrolled: boolean; enrollmentId: string }> => {
  try {
    const response = await getMyEnrollments({ page: 1, limit: 100 });
    return {
      isEnrolled: response.data.some(
        (enrollment) => enrollment.course.id === courseId
      ),
      enrollmentId:
        response.data.find((enrollment) => enrollment.course.id === courseId)
          ?.id || "",
    };
  } catch (error) {
    console.error("Error checking enrollment:", error);
    return {
      isEnrolled: false,
      enrollmentId: "",
    };
  }
};
