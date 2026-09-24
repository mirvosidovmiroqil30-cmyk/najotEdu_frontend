"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import PersonAddRounded from "@mui/icons-material/PersonAddRounded";
import IosShareRounded from "@mui/icons-material/IosShareRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, DeleteButton, LoadingState, SideDrawer, SuccessSnackbar } from "@/components/ui";
import { getGroupScheduleDates, isPast, isToday, toDateStr } from "@/lib/schedule";
import AddRounded from "@mui/icons-material/AddRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import VideocamRounded from "@mui/icons-material/VideocamRounded";
import QuizRounded from "@mui/icons-material/QuizRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import type {
  Group,
  GroupStudent,
  Homework,
  Lesson,
  StudentStatus,
  TeacherGroupStatus,
  User,
  WeekDay,
} from "@/lib/types";

type TeacherRow = {
  id: number;
  teacherId: number;
  status: TeacherGroupStatus;
  teacher: { id: number; firstName: string; lastName: string };
};

type GroupDetail = Group & {
  course: { id: number; name: string; durationMonths?: number };
  room: { id: number; name: string; capacity: number };
  groupTeachers: TeacherRow[];
  studentGroups: GroupStudent[];
  _count?: { studentGroups: number };
};

// ===== GURUH DARSLIKLARI TAB =====
type SubTab = "homework" | "videos" | "exams" | "journal";
type HomeworkWithAnswers = Homework & {
  answers?: { id: number; studentId: number; status: string }[];
};
type ExamItem = {
  id: number; title: string; passingScore: number; dueDate?: string | null; createdAt: string;
  answers: { id: number; studentId: number; status: string }[];
};
type LessonWithVideos = Lesson & {
  lessonVideos?: { id: number; originalName: string; sizeMb: number }[];
};

function GroupDarsliklariTab({
  groupId, lessons, reloadLessons, onCreateLesson, router,
}: {
  groupId: number; lessons: LessonWithVideos[];
  reloadLessons: () => Promise<void>;
  onCreateLesson: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [subTab, setSubTab] = useState<SubTab>("homework");
  const { data: homeworks } = useApiList<HomeworkWithAnswers>(subTab === "homework" ? `/homeworks?groupId=${groupId}` : null);
  const { data: exams } = useApiList<ExamItem>(subTab === "exams" ? `/exams?groupId=${groupId}` : null);
  // parent'dan kelgan lessons qayta fetch qilinmaydi
  const lessonsWithVideos = lessons;

  const subTabs = [
    { key: "homework" as SubTab, label: "Uyga vazifa", icon: <AssignmentRounded fontSize="small" /> },
    { key: "videos"  as SubTab, label: "Videolar",    icon: <VideocamRounded fontSize="small" /> },
    { key: "exams"   as SubTab, label: "Imtihonlar",  icon: <QuizRounded fontSize="small" /> },
    { key: "journal" as SubTab, label: "Jurnal",      icon: <MenuBookRounded fontSize="small" /> },
  ];

  return (
    <div className="space-y-3">
      <Box className="flex items-center justify-between">
        <Box className="flex gap-1">
          {subTabs.map((st) => (
            <Button key={st.key} size="small"
              variant={subTab === st.key ? "contained" : "text"}
              startIcon={st.icon} onClick={() => setSubTab(st.key)}
              sx={{ borderRadius: 2,
                bgcolor: subTab === st.key ? "#F5C400" : "transparent",
                color: subTab === st.key ? "#111827" : "text.secondary",
                "&:hover": { bgcolor: subTab === st.key ? "#e6b800" : "#F3F4F6" } }}>
              {st.label}
            </Button>
          ))}
        </Box>
        <Box className="flex gap-2">
          {subTab === "homework" && (
            <Button variant="contained" size="small" startIcon={<AddRounded />}
              onClick={() => router.push(`/groups/${groupId}/homework/create`)}
              sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}>
              Qo'shish
            </Button>
          )}
          {subTab === "videos" && (
            <Button variant="contained" size="small" startIcon={<AddRounded />}
              onClick={() => router.push(`/groups/${groupId}/video/create`)}
              sx={{ bgcolor: "#F5C400", color: "#111827", "&:hover": { bgcolor: "#e6b800" } }}>
              Video yuklash
            </Button>
          )}
          {subTab === "exams" && (
            <Button variant="contained" size="small" startIcon={<AddRounded />}
              onClick={() => router.push(`/groups/${groupId}/exam/create`)}
              sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
              Imtihon yaratish
            </Button>
          )}
          {subTab === "journal" && (
            <Button variant="contained" size="small" startIcon={<AddRounded />} onClick={onCreateLesson}>
              Yangi dars
            </Button>
          )}
        </Box>
      </Box>

      {/* UY VAZIFALAR */}
      {subTab === "homework" && (
        <Paper className="overflow-hidden">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold" width={40}>#</TableCell>
                <TableCell className="!font-semibold">Mavzu</TableCell>
                <TableCell align="center" className="!font-semibold" width={60}><PeopleAltRounded fontSize="small" color="action" /></TableCell>
                <TableCell align="center" className="!font-semibold" width={60}><AssignmentRounded fontSize="small" sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center" className="!font-semibold" width={60}><AssignmentRounded fontSize="small" sx={{ color: "#16a34a" }} /></TableCell>
                <TableCell className="!font-semibold">Berilgan vaqt</TableCell>
                <TableCell className="!font-semibold">Tugash vaqti</TableCell>
                <TableCell className="!font-semibold">Dars sanasi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {homeworks.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>Uyga vazifalar topilmadi</TableCell></TableRow>
              ) : homeworks.map((hw, i) => {
                const total    = hw.answers?.length ?? 0;
                const accepted = hw.answers?.filter(a => a.status === "ACCEPTED").length ?? 0;
                const rejected = hw.answers?.filter(a => a.status === "REJECTED").length ?? 0;
                return (
                  <TableRow key={hw.id} hover sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/groups/${groupId}/homework/${hw.id}`)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={500} color="primary">{hw.title}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2">{total}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="error.main">{rejected}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="success.main">{accepted}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{new Date(hw.createdAt ?? "").toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">—</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{hw.lesson?.topic ?? "—"}</Typography></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* VIDEOLAR */}
      {subTab === "videos" && (
        <Paper className="overflow-hidden">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold" width={40}>#</TableCell>
                <TableCell className="!font-semibold">Dars mavzusi</TableCell>
                <TableCell className="!font-semibold">Video nomi</TableCell>
                <TableCell className="!font-semibold">Hajmi</TableCell>
                <TableCell className="!font-semibold">Yuklangan sana</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lessonsWithVideos.filter(l => l.lessonVideos && l.lessonVideos.length > 0).length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>Videolar topilmadi</TableCell></TableRow>
              ) : (() => {
                let idx = 0;
                return lessonsWithVideos.flatMap(lesson =>
                  (lesson.lessonVideos ?? []).map(video => {
                    idx++;
                    return (
                      <TableRow key={video.id} hover sx={{ cursor: "pointer" }}
                        onClick={() => router.push(`/groups/${groupId}/video/${video.id}`)}>
                        <TableCell>{idx}</TableCell>
                        <TableCell><Typography variant="body2" fontWeight={500} color="primary">{lesson.topic}</Typography></TableCell>
                        <TableCell>
                          <Box className="flex items-center gap-2">
                            <VideocamRounded fontSize="small" sx={{ color: "#F5C400" }} />
                            <Typography variant="body2">{video.originalName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{video.sizeMb} MB</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Typography></TableCell>
                      </TableRow>
                    );
                  })
                );
              })()}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* IMTIHONLAR */}
      {subTab === "exams" && (
        <Paper className="overflow-hidden">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold" width={40}>#</TableCell>
                <TableCell className="!font-semibold">Mavzu</TableCell>
                <TableCell align="center" className="!font-semibold">Topshirgan</TableCell>
                <TableCell align="center" className="!font-semibold">Qabul</TableCell>
                <TableCell align="center" className="!font-semibold">Rad</TableCell>
                <TableCell className="!font-semibold">O'tish bali</TableCell>
                <TableCell className="!font-semibold">Muddat</TableCell>
                <TableCell className="!font-semibold">Yaratilgan</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>Imtihonlar topilmadi</TableCell></TableRow>
              ) : exams.map((exam, i) => {
                const total    = exam.answers?.length ?? 0;
                const accepted = exam.answers?.filter(a => a.status === "ACCEPTED").length ?? 0;
                const rejected = exam.answers?.filter(a => a.status === "REJECTED").length ?? 0;
                return (
                  <TableRow key={exam.id} hover sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/groups/${groupId}/exam/${exam.id}`)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Typography variant="body2" fontWeight={500} color="primary">{exam.title}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2">{total}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="success.main">{accepted}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="error.main">{rejected}</Typography></TableCell>
                    <TableCell><Chip label={`${exam.passingScore} ball`} size="small" sx={{ bgcolor: "#FEF3C7", color: "#D97706", fontWeight: 700 }} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{exam.dueDate ? new Date(exam.dueDate).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{new Date(exam.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })}</Typography></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* JURNAL */}
      {subTab === "journal" && (
        <Paper className="overflow-hidden">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold">#</TableCell>
                <TableCell className="!font-semibold">Mavzu</TableCell>
                <TableCell className="!font-semibold">Sana</TableCell>
                <TableCell className="!font-semibold">Holat</TableCell>
                <TableCell className="!font-semibold">Amallar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lessons.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>Darslar topilmadi</TableCell></TableRow>
              ) : lessons.map((lesson, i) => (
                <TableRow key={lesson.id} hover sx={{ cursor: "pointer" }}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell><Typography variant="body2" fontWeight={500} color="primary">{lesson.topic}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell><Chip label={lesson.status} size="small" color={lesson.status === "ACTIVE" ? "success" : "default"} /></TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined"
                      onClick={() => router.push(`/groups/${groupId}/lessons/${lesson.id}`)}>
                      Ko'rish
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </div>
  );
}

// ===== SANALAR KALENDARI =====
const MONTHS_UZ = ["Yan","Fev","Mar","Apr","May","Iyn","Iyl","Avg","Sen","Okt","Noy","Dek"];

function DatesCalendar({
  startDate, durationMonths, weekDays, lessons, groupId, router,
}: {
  startDate: string; durationMonths: number; weekDays: WeekDay[];
  lessons: Lesson[]; groupId: number; router: ReturnType<typeof useRouter>;
}) {
  const allDates = getGroupScheduleDates(startDate, durationMonths, weekDays);
  const lessonDateSet = new Set(lessons.map((l) => l.createdAt?.slice(0, 10) ?? ""));

  const byMonth: Record<string, Date[]> = {};
  allDates.forEach((d) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(d);
  });

  const monthKeys = Object.keys(byMonth);
  const [monthIdx, setMonthIdx] = useState(
    Math.max(0, monthKeys.findIndex((k) => {
      const today = new Date();
      const [y, m] = k.split("-").map(Number);
      return y === today.getFullYear() && m === today.getMonth();
    }))
  );
  const [showAll, setShowAll] = useState(false);

  const currentKey = monthKeys[monthIdx];
  if (!currentKey) return null;
  const [year, month] = currentKey.split("-").map(Number);
  const currentDates = byMonth[currentKey] ?? [];
  const visible = showAll ? currentDates : currentDates.slice(0, 8);

  return (
    <Box sx={{ mt: 3, borderTop: "1px solid #E5E7EB", pt: 3 }}>
      <Box className="flex items-center gap-2 mb-3">
        <Button size="small" disabled={monthIdx === 0} sx={{ minWidth: 0, p: 0.5 }}
          onClick={() => { setMonthIdx((i) => Math.max(0, i - 1)); setShowAll(false); }}>
          <ChevronLeftRounded fontSize="small" />
        </Button>
        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 80, textAlign: "center" }}>
          {MONTHS_UZ[month]} {year}
        </Typography>
        <Button size="small" disabled={monthIdx === monthKeys.length - 1} sx={{ minWidth: 0, p: 0.5 }}
          onClick={() => { setMonthIdx((i) => Math.min(monthKeys.length - 1, i + 1)); setShowAll(false); }}>
          <ChevronRightRounded fontSize="small" />
        </Button>
      </Box>

      <Box className="flex flex-wrap gap-2">
        {visible.map((date) => {
          const dateStr = toDateStr(date);
          const past = isPast(date);
          const today = isToday(date);
          const hasLesson = lessonDateSet.has(dateStr);
          const canClick = past;
          return (
            <Box key={dateStr}
              onClick={() => canClick && router.push(`/groups/${groupId}/lesson/${dateStr}`)}
              sx={{
                display: "flex", flexDirection: "column", alignItems: "center",
                width: 52, py: 1, px: 0.5, borderRadius: 2,
                border: today ? "2px solid #F5C400" : "1px solid #E5E7EB",
                bgcolor: hasLesson ? "#FFFBEB" : today ? "#FEF9C3" : "#fff",
                cursor: canClick ? "pointer" : "default",
                opacity: !past ? 0.4 : 1,
                transition: "all 0.15s",
                "&:hover": canClick ? { bgcolor: "#FEF3C7", borderColor: "#F5C400" } : {},
              }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {MONTHS_UZ[date.getMonth()]}
              </Typography>
              <Typography variant="body2" fontWeight={today || hasLesson ? 700 : 400}
                sx={{ color: today ? "#D97706" : hasLesson ? "#92400E" : "text.primary" }}>
                {date.getDate()}
              </Typography>
              {hasLesson && (
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#F5C400", mt: 0.3 }} />
              )}
            </Box>
          );
        })}
      </Box>

      {currentDates.length > 8 && (
        <Button size="small" sx={{ mt: 1 }} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Yig'ish" : `Barchasini ko'rish (${currentDates.length})`}
        </Button>
      )}
    </Box>
  );
}

const WEEK_DAYS_UZ: Record<string, string> = {
  MONDAY: "Du", TUESDAY: "Se", WEDNESDAY: "Ch",
  THURSDAY: "Pa", FRIDAY: "Ju", SATURDAY: "Sha", SUNDAY: "Ya",
};

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  ACTIVE: "success", PLANNED: "warning", COMPLETED: "default", INACTIVE: "error",
};

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const groupId = Number(id);
  const router = useRouter();
  const { hasRole } = useAuth();
  const canManage = hasRole("SUPERADMIN", "ADMIN");

  const [tab, setTab] = useState(0);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState("");

  const { data: students, loading: studentsLoading, reload: reloadStudents } =
    useApiList<GroupStudent>(`/groups/${groupId}/students`);
  const { data: lessons, reload: reloadLessons } =
    useApiList<LessonWithVideos>(`/lessons?groupId=${groupId}`);
  const { data: allUsers, reload: reloadUsers } = useApiList<User>(canManage ? "/users" : null, { immediate: false });

  // Dars yaratish drawer
  const [lessonDrawer, setLessonDrawer] = useState(false);
  const [lessonForm, setLessonForm] = useState({ topic: "", description: "" });
  const [lessonError, setLessonError] = useState("");
  const [lessonSaving, setLessonSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  async function createLesson() {
    if (!lessonForm.topic.trim()) { setLessonError("Mavzu kiritilishi shart"); return; }
    setLessonError(""); setLessonSaving(true);
    try {
      await apiPost("/lessons", { groupId, teacherId: group?.groupTeachers?.[0]?.teacherId, topic: lessonForm.topic, description: lessonForm.description || undefined });
      setSuccessMsg("Dars yaratildi!"); setLessonDrawer(false); setLessonForm({ topic: "", description: "" });
      await reloadLessons();
    } catch (err) { setLessonError(formatApiError(err)); }
    finally { setLessonSaving(false); }
  }

  // Dialoglar
  const [teacherDialog, setTeacherDialog] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ teacherId: 0, status: "ACTIVE" as TeacherGroupStatus });
  const [teacherError, setTeacherError] = useState("");

  const [studentDialog, setStudentDialog] = useState(false);
  const [studentForm, setStudentForm] = useState({ studentId: 0, status: "ACTIVE" as StudentStatus });
  const [studentError, setStudentError] = useState("");

  const [statusDialog, setStatusDialog] = useState(false);
  const [statusTarget, setStatusTarget] = useState<GroupStudent | null>(null);
  const [newStatus, setNewStatus] = useState<StudentStatus>("ACTIVE");

  async function reloadGroup() {
    const updated = await apiGet<GroupDetail>(`/groups/${groupId}`);
    setGroup(updated);
  }

  useEffect(() => {
    apiGet<GroupDetail>(`/groups/${groupId}`)
      .then(setGroup)
      .catch((err) => setGroupError(formatApiError(err)))
      .finally(() => setGroupLoading(false));
  }, [groupId]);

  async function assignTeacher() {
    setTeacherError("");
    try {
      await apiPost(`/groups/${groupId}/teachers`, {
        teacherId: Number(teacherForm.teacherId),
        status: teacherForm.status,
      });
      setTeacherDialog(false);
      await reloadGroup();
    } catch (err) { setTeacherError(formatApiError(err)); }
  }

  async function removeTeacher(teacherId: number) {
    try {
      await apiDelete(`/groups/${groupId}/teachers/${teacherId}`);
      await reloadGroup();
    } catch { /* silent */ }
  }

  async function assignStudent() {
    setStudentError("");
    try {
      await apiPost(`/groups/${groupId}/students`, {
        studentId: Number(studentForm.studentId),
        status: studentForm.status,
      });
      setStudentDialog(false);
      await reloadStudents();
    } catch (err) { setStudentError(formatApiError(err)); }
  }

  async function removeStudent(studentId: number) {
    try {
      await apiDelete(`/groups/${groupId}/students/${studentId}`);
      await reloadStudents();
    } catch { /* silent */ }
  }

  async function updateStudentStatus() {
    if (!statusTarget) return;
    try {
      await apiPatch(`/groups/${groupId}/students/${statusTarget.studentId}/status`, { status: newStatus });
      setStatusDialog(false);
      await reloadStudents();
    } catch { /* silent */ }
  }

  if (groupLoading) return <LoadingState />;
  if (groupError) return <Alert severity="error">{groupError}</Alert>;
  if (!group) return null;

  const teachers: TeacherRow[] = group.groupTeachers ?? [];
  const teachers_users = allUsers ? allUsers.filter((u) => u.role === "TEACHER") : [];
  const student_users = allUsers ? allUsers.filter((u) => u.role === "STUDENT") : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-3">
          <Button
            startIcon={<ArrowBackRounded />}
            onClick={() => router.push("/groups")}
            size="small"
          >
            Orqaga
          </Button>
          <Typography variant="h5" fontWeight={700}>{group.name}</Typography>
          <Chip
            label={group.status}
            size="small"
            color={STATUS_COLOR[group.status] ?? "default"}
          />
        </Box>
        <Button variant="outlined" startIcon={<IosShareRounded />} size="small">
          Statistika
        </Button>
      </Box>

      {/* Tablar */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Ma'lumotlar" />
          <Tab label="Guruh darsliklari" />
          <Tab label="O'quvchilar" />
          <Tab label="Akademik davomat" />
        </Tabs>
      </Box>

      {/* ===== TAB 0: MA'LUMOTLAR ===== */}
      {tab === 0 && (
        <div className="space-y-4">
          {/* Mentorlar + Parametrlar */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Guruh mentorlari */}
            <Paper className="p-4">
              <Box className="mb-3 flex items-center justify-between">
                <Typography variant="subtitle2" fontWeight={700}>
                  Guruh mentorlari
                </Typography>
                {canManage && (
                  <Button
                    size="small"
                    startIcon={<PersonAddRounded />}
                    onClick={async () => {
                      if (!allUsers || allUsers.length === 0) await reloadUsers();
                      setTeacherForm({ teacherId: teachers_users[0]?.id ?? 0, status: "ACTIVE" });
                      setTeacherDialog(true);
                    }}
                  >
                    Qo'shish
                  </Button>
                )}
              </Box>
              {teachers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Mentor biriktirilmagan
                </Typography>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {teachers.map((t) => (
                    <Box key={t.id} className="flex flex-col items-center gap-2">
                      <Avatar
                        sx={{
                          width: 64, height: 64,
                          bgcolor: "#F5C400", color: "#111827",
                          fontSize: 24, fontWeight: 700,
                        }}
                      >
                        {t.teacher.firstName[0]}
                      </Avatar>
                      <Box className="text-center">
                        <Typography variant="caption" color="text.secondary" display="block">
                          Teacher
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {t.teacher.firstName}
                        </Typography>
                      </Box>
                      {canManage && (
                        <DeleteButton
                          message="Haqiqatan ham bu o'qituvchini guruhdan olib tashlaysizmi?"
                          onClick={() => removeTeacher(t.teacherId)}
                        />
                      )}
                    </Box>
                  ))}
                </div>
              )}
            </Paper>

            {/* Parametrlar */}
            <Paper className="p-4">
              <Typography variant="subtitle2" fontWeight={700} className="mb-3">
                Parametrlar
              </Typography>
              <div className="space-y-2">
                {[
                  { label: "Kurs", value: group.course?.name ?? "—" },
                  { label: "O'rta yosh", value: "—" },
                  { label: "O'quvchilar sig'imi", value: group.maxStudents },
                  { label: "Mavjud o'quvchilar", value: students.length },
                  { label: "O'quv reytagi darslar soni", value: lessons.length },
                  { label: "Kurs davomiyligi (oy)", value: group.course ? "—" : "—" },
                  { label: "Jam darslar soni", value: lessons.length },
                ].map((item) => (
                  <Box key={item.label} className="flex items-center justify-between">
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </div>
            </Paper>
          </div>

          {/* Dars jadvali */}
          <Paper className="p-4">
            <Typography variant="subtitle2" fontWeight={700} className="mb-3">
              Dars jadvali
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                  <TableCell className="!font-semibold">O'qituvchi</TableCell>
                  <TableCell className="!font-semibold">Kunlar</TableCell>
                  <TableCell className="!font-semibold">Vaqt</TableCell>
                  <TableCell className="!font-semibold">Sana</TableCell>
                  <TableCell className="!font-semibold">Xona</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      Dars jadvali mavjud emas
                    </TableCell>
                  </TableRow>
                ) : (
                  teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Typography variant="body2" color="primary" fontWeight={500}>
                          {t.teacher.firstName} {t.teacher.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box className="flex flex-wrap gap-1">
                          {group.weekDays.map((d) => (
                            <Chip key={d} label={WEEK_DAYS_UZ[d] ?? d} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{group.startTime}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(group.startDate).toLocaleDateString("uz-UZ", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{group.room?.name ?? "—"}</Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Sanalar kalendari */}
            {group.course?.durationMonths && (
              <DatesCalendar
                startDate={group.startDate}
                durationMonths={group.course.durationMonths}
                weekDays={group.weekDays}
                lessons={lessons}
                groupId={groupId}
                router={router}
              />
            )}
          </Paper>
        </div>
      )}

      {/* ===== TAB 1: GURUH DARSLIKLARI ===== */}
      {tab === 1 && (
        <GroupDarsliklariTab
          groupId={groupId}
          lessons={lessons}
          reloadLessons={reloadLessons}
          onCreateLesson={() => { setLessonForm({ topic: "", description: "" }); setLessonError(""); setLessonDrawer(true); }}
          router={router}
        />
      )}

      {/* TAB 2: O'QUVCHILAR */}
      {tab === 2 && (
        <div className="space-y-3">
          <Paper className="p-4">
            <Box className="mb-3 flex items-center justify-between">
              <Typography variant="subtitle2" fontWeight={700}>O'quvchilar ({students.length})</Typography>
              {canManage && (
                <Button variant="contained" size="small" startIcon={<PersonAddRounded />}
                  onClick={async () => {
                    if (!allUsers || allUsers.length === 0) await reloadUsers();
                    setStudentForm({ studentId: student_users[0]?.id ?? 0, status: "ACTIVE" });
                    setStudentDialog(true);
                  }}>
                  Talaba qo'shish
                </Button>
              )}
            </Box>
            {studentsLoading ? <LoadingState /> : (
              <DataTable rows={students}
                columns={[
                  { key: "name", label: "F.I.Sh", render: (s) => `${s.student.firstName} ${s.student.lastName}` },
                  { key: "phone", label: "Telefon", render: (s) => s.student.phone },
                  { key: "status", label: "Holat", render: (s) => <Chip label={s.status} size="small" color={s.status === "ACTIVE" ? "success" : s.status === "GRADUATED" ? "default" : "error"} /> },
                ]}
                actions={canManage ? (row) => (
                  <>
                    <Button size="small" onClick={() => { setStatusTarget(row); setNewStatus(row.status); setStatusDialog(true); }}>Status</Button>
                    <DeleteButton message="Bu talabani guruhdan olib tashlaysizmi?" onClick={() => removeStudent(row.studentId)} />
                  </>
                ) : undefined}
              />
            )}
          </Paper>
        </div>
      )}
      {tab === 3 && (
        <Paper className="p-4">
          <Typography variant="subtitle2" fontWeight={700} className="mb-3">
            Akademik davomat
          </Typography>
          <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                  <TableCell className="!font-semibold">#</TableCell>
                  <TableCell className="!font-semibold">Mavzu</TableCell>
                  <TableCell className="!font-semibold">Sana</TableCell>
                  <TableCell className="!font-semibold">Holat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lessons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      Darslar topilmadi
                    </TableCell>
                  </TableRow>
                ) : (
                  lessons.map((lesson, i) => (
                    <TableRow key={lesson.id} hover>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{lesson.topic}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {lesson.createdAt
                            ? new Date(lesson.createdAt).toLocaleDateString("uz-UZ", {
                                day: "numeric", month: "short", year: "numeric",
                              })
                            : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lesson.status}
                          size="small"
                          color={lesson.status === "ACTIVE" ? "success" : "default"}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </Paper>
      )}

      {/* O'qituvchi biriktirish dialogi */}
      <Dialog open={teacherDialog} onClose={() => setTeacherDialog(false)} fullWidth>
        <DialogTitle>O'qituvchi biriktirish</DialogTitle>
        <DialogContent className="flex flex-col gap-3 !pt-2">
          {teacherError && <Alert severity="error">{teacherError}</Alert>}
          <TextField
            select label="O'qituvchi" value={teacherForm.teacherId}
            onChange={(e) => setTeacherForm({ ...teacherForm, teacherId: Number(e.target.value) })}
            disabled={!allUsers || allUsers.length === 0}
          >
            {teachers_users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Holat" value={teacherForm.status}
            onChange={(e) => setTeacherForm({ ...teacherForm, status: e.target.value as TeacherGroupStatus })}
          >
            {["ACTIVE", "INACTIVE", "PLANNED", "COMPLETED"].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeacherDialog(false)}>Bekor</Button>
          <Button variant="contained" onClick={assignTeacher}>Biriktirish</Button>
        </DialogActions>
      </Dialog>

      {/* Talaba biriktirish dialogi */}
      <Dialog open={studentDialog} onClose={() => setStudentDialog(false)} fullWidth>
        <DialogTitle>Talaba qo'shish</DialogTitle>
        <DialogContent className="flex flex-col gap-3 !pt-2">
          {studentError && <Alert severity="error">{studentError}</Alert>}
          <TextField
            select label="Talaba" value={studentForm.studentId}
            onChange={(e) => setStudentForm({ ...studentForm, studentId: Number(e.target.value) })}
            disabled={!allUsers || allUsers.length === 0}
          >
            {student_users.map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.firstName} {u.lastName} · {u.phone}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select label="Holat" value={studentForm.status}
            onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value as StudentStatus })}
          >
            {["ACTIVE", "INACTIVE", "FREEZE", "GRADUATED"].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDialog(false)}>Bekor</Button>
          <Button variant="contained" onClick={assignStudent}>Qo'shish</Button>
        </DialogActions>
      </Dialog>

      {/* Status o'zgartirish dialogi */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle>Status o'zgartirish</DialogTitle>
        <DialogContent className="!pt-2">
          <TextField
            select fullWidth label="Yangi holat" value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as StudentStatus)}
          >
            {["ACTIVE", "INACTIVE", "FREEZE", "GRADUATED"].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Bekor</Button>
          <Button variant="contained" onClick={updateStudentStatus}>Saqlash</Button>
        </DialogActions>
      </Dialog>

      {/* Dars yaratish drawer */}
      <SideDrawer
        open={lessonDrawer}
        onClose={() => setLessonDrawer(false)}
        title="Yangi dars"
        subtitle="Guruh uchun yangi dars mavzusini kiriting."
        onSave={createLesson}
        saving={lessonSaving}
        saveLabel="Saqlash"
      >
        {lessonError && <Alert severity="error">{lessonError}</Alert>}
        <TextField label="Mavzu *" value={lessonForm.topic}
          onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })} fullWidth />
        <TextField label="Tavsif (ixtiyoriy)" value={lessonForm.description}
          onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
          fullWidth multiline rows={3} />
      </SideDrawer>

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />
    </div>
  );
}
