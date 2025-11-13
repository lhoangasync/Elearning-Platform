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

export interface ICourseRes extends ICourse {
  instructor: IInstructor;
  _count: {
    enrollments: number;
    chapters: number;
  };
}

export interface ICourseDetailRes extends ICourse {
  instructor?: IInstructor | null;
  chapters?: IChapter[] | null;
  _count?: {
    enrollments: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Update Course DTO
export interface UpdateCourseDto {
  title?: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  level?: CourseLevel;
  status?: CourseStatus;
  slug?: string;
  category?: string;
  smallDescription?: string;
  requirements?: string[];
  whatYouWillLearn?: string[];
}

// Create Course DTO
export interface CreateCourseDto {
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  level: CourseLevel;
  status?: CourseStatus;
  slug?: string;
  category?: string;
  smallDescription?: string;
  requirements?: string[];
  whatYouWillLearn?: string[];
  instructorId?: string;
}

// Chapter DTOs
export interface CreateChapterDto {
  title: string;
  courseId: string;
}

export interface UpdateChapterDto {
  title?: string;
  position?: number;
}

export interface ReorderChaptersDto {
  courseId: string;
  chapters: { id: string; position: number }[];
}

// Lesson DTOs
export interface CreateLessonDto {
  title: string;
  chapterId: string;
}

export interface UpdateLessonDto {
  title?: string;
  position?: number;
  videoUrl?: string;
  documentUrl?: string;
}

export interface ReorderLessonsDto {
  chapterId: string;
  lessons: { id: string; position: number }[];
}

// Get All Courses with Pagination
export const getAllCourses = async (
  page: number,
  limit: number,
  status?: string,
  level?: string,
  search?: string
): Promise<PaginatedResponse<ICourseRes>> => {
  const response = await api.get<PaginatedResponse<ICourseRes>>(
    API_ENDPOINT.COURSES,
    {
      params: {
        page,
        limit,
        ...(status ? { status } : {}),
        ...(level ? { level } : {}),
        ...(search ? { search } : {}),
      },
    }
  );
  return response.data;
};

export const getAllCoursesBaseRole = async (
  page: number,
  limit: number,
  level?: string,
  status?: string,
  search?: string
): Promise<PaginatedResponse<ICourseRes>> => {
  const response = await api.get<PaginatedResponse<ICourseRes>>(
    API_ENDPOINT.COURSES + "/manage",
    {
      params: {
        page,
        limit,
        ...(level ? { level } : {}),
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      },
    }
  );
  return response.data;
};

// Get Course by ID
export const getCourseById = async (
  courseId: string
): Promise<ICourseDetailRes> => {
  const response = await api.get<ICourseDetailRes>(
    `${API_ENDPOINT.COURSES}/${courseId}`
  );
  return response.data;
};

// Course Creation
export const createCourse = async (data: CreateCourseDto): Promise<ICourse> => {
  const response = await api.post<ICourse>(API_ENDPOINT.COURSES, data);
  return response.data;
};

// Course Update
export const updateCourse = async (
  courseId: string,
  data: UpdateCourseDto
): Promise<ICourse> => {
  const response = await api.put<ICourse>(
    `${API_ENDPOINT.COURSES}/${courseId}`,
    data
  );
  return response.data;
};

// ============= CHAPTER APIs =============
export const createChapter = async (
  data: CreateChapterDto
): Promise<IChapter> => {
  const response = await api.post<IChapter>(`${API_ENDPOINT.CHAPTERS}`, data);
  return response.data;
};

export const updateChapter = async (
  chapterId: string,
  data: UpdateChapterDto
): Promise<IChapter> => {
  const response = await api.put<IChapter>(
    `${API_ENDPOINT.CHAPTERS}/${chapterId}`,
    data
  );
  return response.data;
};

export const deleteChapter = async (chapterId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINT.CHAPTERS}/${chapterId}`);
};

export const reorderChapters = async (
  data: ReorderChaptersDto
): Promise<void> => {
  await api.put(`${API_ENDPOINT.CHAPTERS}/reorder`, data);
};

// ============= LESSON APIs =============
export const createLesson = async (data: CreateLessonDto): Promise<ILesson> => {
  const response = await api.post<ILesson>(`${API_ENDPOINT.LESSONS}`, data);
  return response.data;
};

export const updateLesson = async (
  lessonId: string,
  data: UpdateLessonDto
): Promise<ILesson> => {
  const response = await api.put<ILesson>(
    `${API_ENDPOINT.LESSONS}/${lessonId}`,
    data
  );
  return response.data;
};

export const deleteLesson = async (lessonId: string): Promise<void> => {
  await api.delete(`${API_ENDPOINT.LESSONS}/${lessonId}`);
};

export const reorderLessons = async (
  data: ReorderLessonsDto
): Promise<void> => {
  await api.put(`${API_ENDPOINT.LESSONS}/reorder`, data);
};
