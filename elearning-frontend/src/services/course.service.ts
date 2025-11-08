import { API_ENDPOINT } from "@/constants/endpoint";
import api from "@/utils/api";

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export interface ICourse {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string | null;
  duration?: number;
  level: CourseLevel;
  status: CourseStatus;
  slug: string;
  category?: string;
  smallDescription?: string;
  requirements?: string[];
  whatYouWillLearn?: string[];
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  deletedById?: string | null;
}

export interface IInstructor {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

export interface ICourseRes extends ICourse {
  instructor: IInstructor;
  _count: {
    enrollments: number;
    chapters: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllCourses = async (
  page: number,
  limit: number
): Promise<PaginatedResponse<ICourseRes>> => {
  const response = await api.get<PaginatedResponse<ICourseRes>>(
    API_ENDPOINT.COURSES,
    {
      params: {
        page,
        limit,
      },
    }
  );
  return response.data;
};
