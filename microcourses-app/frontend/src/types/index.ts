export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'learner' | 'creator' | 'admin';
  isApproved: boolean;
  avatar?: string;
  creatorApplication?: {
    bio: string;
    expertise: string[];
    portfolio?: string;
    appliedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
  };
  createdAt: Date;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  category: string;
  tags: string[];
  creator: User;
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  isPublished: boolean;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  enrollmentCount: number;
  rating: {
    average: number;
    count: number;
  };
  lessons?: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  course: string;
  order: number;
  videoUrl: string;
  videoDuration: number;
  transcript: string;
  isTranscriptGenerated: boolean;
  materials: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  _id: string;
  user: string;
  course: Course;
  enrolledAt: Date;
  completedLessons: Array<{
    lesson: Lesson;
    completedAt: Date;
    watchTime: number;
  }>;
  progress: number;
  isCompleted: boolean;
  completedAt?: Date;
  certificateIssued: boolean;
  certificateIssuedAt?: Date;
  rating?: {
    score: number;
    review?: string;
    ratedAt: Date;
  };
  lastAccessedAt: Date;
}

export interface Certificate {
  _id: string;
  user: User;
  course: Course;
  serialNumber: string;
  serialHash: string;
  issuedAt: Date;
  completionDate: Date;
  grade: string;
  validUntil: Date;
  metadata: {
    courseTitle: string;
    courseDuration: number;
    completionTime: number;
    userName: string;
    creatorName: string;
  };
  isRevoked: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  token?: string;
  user?: User;
}