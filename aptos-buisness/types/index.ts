export interface Company {
  id: string;
  companyName: string;
  companyDescription: string;
  companyWebsite: string;
  numberOfQuestions: number;
  difficultyLevel: "easy" | "medium" | "hard";
}

export interface Question {
  question: string;
  options: string[];
  correctOption: number;
  companyId: string;
  companyName: string;
  createdAt?: Date;
}

export interface GenerateQuestionsRequest {
  companyName: string;
  companyDescription: string;
  companyWebsite: string;
  numberOfQuestions: number;
  difficultyLevel: "easy" | "medium" | "hard";
}

export interface SaveQuestionsRequest {
  questions: Question[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
