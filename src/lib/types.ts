export type Role = "SUPERADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
export type Status = "ACTIVE" | "INACTIVE" | "FREEZE";
export type StudentStatus = "ACTIVE" | "INACTIVE" | "FREEZE" | "GRADUATED";
export type GroupStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "INACTIVE";
export type HomeworkStatus = "PENDING" | "CHECKED" | "ACCEPTED" | "REJECTED";
export type TeacherGroupStatus = "ACTIVE" | "INACTIVE" | "PLANNED" | "COMPLETED";
export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: Role;
  status: Status;
  address?: string | null;
  photo?: string | null;
  createdAt?: string;
  deletedAt?: string | null;
};

export type Course = {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  durationHours: number;
  durationMonths: number;
  status: Status;
  deletedAt?: string | null;
};

export type Room = {
  id: number;
  name: string;
  capacity: number;
  status: Status;
  deletedAt?: string | null;
};

export type Group = {
  id: number;
  name: string;
  description?: string | null;
  courseId: number;
  roomId: number;
  startDate: string;
  startTime: string;
  maxStudents: number;
  weekDays: WeekDay[];
  status: GroupStatus;
  course?: { id: number; name: string };
  room?: { id: number; name: string; capacity?: number };
  groupTeachers?: {
    teacherId: number;
    status: TeacherGroupStatus;
    teacher: { id: number; firstName: string; lastName: string };
  }[];
  _count?: { studentGroups: number };
  deletedAt?: string | null;
};

export type GroupStudent = {
  id: number;
  studentId: number;
  status: StudentStatus;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
};

export type Lesson = {
  id: number;
  groupId: number;
  teacherId: number;
  topic: string;
  description?: string | null;
  status: Status;
  createdAt?: string;
  group?: { id: number; name: string };
  teacher?: { id: number; firstName: string; lastName: string };
  deletedAt?: string | null;
};

export type LessonVideo = {
  id: number;
  lessonId: number;
  originalName: string;
  videoUrl: string;
  sizeMb: number;
  lesson?: { id: number; topic: string };
};

export type Homework = {
  id: number;
  lessonId: number;
  groupId: number;
  teacherId: number;
  title: string;
  fileUrl?: string | null;
  lesson?: { id: number; topic: string };
  group?: { id: number; name: string };
  deletedAt?: string | null;
};

export type HomeworkAnswer = {
  id: number;
  homeworkId: number;
  studentId: number;
  title: string;
  fileUrl?: string | null;
  status: HomeworkStatus;
  createdAt?: string;
  homework?: { id: number; title: string };
  student?: { id: number; firstName: string; lastName: string };
  result?: { id: number; grade: number } | null;
};

export type HomeworkResult = {
  id: number;
  homeworkAnswerId: number;
  teacherId: number;
  grade: number;
  feedback?: string | null;
  status: HomeworkStatus;
  homeworkAnswer?: {
    id: number;
    title: string;
    student?: { firstName: string; lastName: string };
  };
};

export type Attendance = {
  id: number;
  groupId: number;
  studentId: number;
  isPresent: boolean;
  createdAt: string;
  deletedAt?: string | null;
  student?: { id: number; firstName: string; lastName: string };
  group?: { id: number; name: string };
};
