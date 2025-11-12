import { API_ENDPOINT } from "@/constants/endpoint";
import api from "@/utils/api";

// Types from backend schema
export interface IQuizQuestion {
  id: string;
  text: string;
  options: string[]; // Array of strings, not objects
  correctAnswerIndex?: number; // Only for instructor/admin
  quizId: string;
}

export interface IQuiz {
  id: string;
  title: string;
  courseId: string;
  chapterId: string | null;
  timeLimitMinutes: number | null;
  passingScore: number;
  maxAttempts: number | null;
  availableFrom: string | null;
  availableTo: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IQuizDetail extends IQuiz {
  course: {
    id: string;
    title: string;
    instructorId: string;
  };
  chapter: {
    id: string;
    title: string;
  } | null;
  questions: IQuizQuestion[];
}

export interface IQuizForStudent extends IQuiz {
  course: {
    id: string;
    title: string;
  };
  chapter: {
    id: string;
    title: string;
  } | null;
  questions: Omit<IQuizQuestion, "correctAnswerIndex">[];
  remainingAttempts: number | null;
  myAttempts: number;
  canTakeQuiz: boolean;
  reason: string | null;
}

export interface IQuizAttempt {
  id: string;
  score: number;
  studentId: string;
  quizId: string;
  startedAt: string;
  submittedAt: string | null;
  timeSpentSeconds: number;
  isPassed: boolean;
  answers: {
    questionId: string;
    selectedAnswerIndex: number;
    isCorrect: boolean;
  }[];
}

export interface IQuizAttemptDetail extends IQuizAttempt {
  quiz: {
    id: string;
    title: string;
    showCorrectAnswers: boolean;
    passingScore: number;
    questions: IQuizQuestion[];
  };
}

// DTOs
export interface CreateQuizDto {
  title: string;
  courseId: string;
  chapterId?: string | null;
  timeLimitMinutes?: number | null;
  passingScore?: number;
  maxAttempts?: number | null;
  availableFrom?: string | null;
  availableTo?: string | null;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswers?: boolean;
  questions: {
    text: string;
    options: string[];
    correctAnswerIndex: number;
  }[];
}

export interface UpdateQuizDto {
  title?: string;
  timeLimitMinutes?: number | null;
  passingScore?: number;
  maxAttempts?: number | null;
  availableFrom?: string | null;
  availableTo?: string | null;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswers?: boolean;
  questions?: {
    id?: string;
    text: string;
    options: string[];
    correctAnswerIndex: number;
  }[];
}

export interface StartQuizDto {
  quizId: string;
}

export interface StartQuizResponse {
  attemptId: string;
  quiz: IQuizForStudent;
  startedAt: string;
  expiresAt: string | null;
  timeLimitSeconds: number | null;
}

export interface SubmitQuizDto {
  quizId: string;
  attemptId: string;
  answers: {
    questionId: string;
    selectedAnswerIndex: number;
  }[];
}

export interface SubmitQuizResponse {
  attemptId: string;
  score: number;
  isPassed: boolean;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  showCorrectAnswers: boolean;
  results: {
    questionId: string;
    questionText: string;
    selectedAnswerIndex: number;
    correctAnswerIndex?: number;
    isCorrect: boolean;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Calls
export const getAllQuizzes = async (params?: {
  courseId?: string;
  chapterId?: string;
}): Promise<{
  data: (IQuiz & {
    _count?: { questions: number; attempts: number };
    course?: {
      id: string;
      title: string;
      chapters: { id: string; title: string }[];
    };
  })[];
}> => {
  const response = await api.get(API_ENDPOINT.QUIZZES, { params });
  return response.data;
};

export const getQuizById = async (quizId: string): Promise<IQuizDetail> => {
  const response = await api.get<IQuizDetail>(
    `${API_ENDPOINT.QUIZZES}/${quizId}`
  );
  return response.data;
};

export const createQuiz = async (data: CreateQuizDto): Promise<IQuiz> => {
  const response = await api.post<IQuiz>(API_ENDPOINT.QUIZZES, data);
  return response.data;
};

export const updateQuiz = async (
  quizId: string,
  data: UpdateQuizDto
): Promise<IQuiz> => {
  const response = await api.put<IQuiz>(
    `${API_ENDPOINT.QUIZZES}/${quizId}`,
    data
  );
  return response.data;
};

export const deleteQuiz = async (
  quizId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`${API_ENDPOINT.QUIZZES}/${quizId}`);
  return response.data;
};

export const startQuiz = async (
  data: StartQuizDto
): Promise<StartQuizResponse> => {
  const response = await api.post<StartQuizResponse>(
    `${API_ENDPOINT.QUIZZES}/start`,
    data
  );
  return response.data;
};

export const submitQuiz = async (
  data: SubmitQuizDto
): Promise<SubmitQuizResponse> => {
  const response = await api.post<SubmitQuizResponse>(
    `${API_ENDPOINT.QUIZZES}/submit`,
    data
  );
  return response.data;
};

export const getQuizAttempts = async (params: {
  page?: number;
  limit?: number;
  quizId?: string;
}): Promise<
  PaginatedResponse<
    IQuizAttempt & {
      quiz: {
        id: string;
        title: string;
        course: {
          id: string;
          title: string;
        };
      };
      student: {
        id: string;
        fullName: string;
        email: string;
      };
    }
  >
> => {
  const response = await api.get(`${API_ENDPOINT.QUIZZES}/attempts`, {
    params,
  });
  return response.data;
};

export const getAttemptDetail = async (
  attemptId: string
): Promise<IQuizAttemptDetail> => {
  const response = await api.get<IQuizAttemptDetail>(
    `${API_ENDPOINT.QUIZZES}/attempt/${attemptId}`
  );
  return response.data;
};
