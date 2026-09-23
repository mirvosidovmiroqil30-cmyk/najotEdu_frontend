"use client";

import { memo, use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import AddRounded from "@mui/icons-material/AddRounded";
import BarChartRounded from "@mui/icons-material/BarChartRounded";
import { apiGet, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { LoadingState, SideDrawer, SuccessSnackbar } from "@/components/ui";
import TextField from "@mui/material/TextField";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import VideocamRounded from "@mui/icons-material/VideocamRounded";
import QuizRounded from "@mui/icons-material/QuizRounded";
import MenuBookRounded from "@mui/icons-material/MenuBookRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { getGroupScheduleDates, isPast, isToday, toDateStr } from "@/lib/schedule";
import type { Group, GroupStudent, Homework, Lesson, User, WeekDay } from "@/lib/types";

// ===== SANALAR KALENDARI KOMPONENTI =====
const MONTHS_UZ = [
  "Yan", "Fev", "Mar", "Apr", "May", "Iyn",
  "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek",
];

const DatesCalendar = memo(function DatesCalendar({
  groupId,
  startDate,
  durationMonths,
  weekDays,
  lessons,
  router,
}: {
  groupId: number;
  startDate: string;
  durationMonths: number;
  weekDays: WeekDay[];
  lessons: Lesson[];
  router: ReturnType<typeof useRouter>;
}) {
  const allDates = useMemo(
    () => getGroupScheduleDates(startDate, durationMonths, weekDays),
    [startDate, durationMonths, weekDays],
  );

  const lessonDateSet = useMemo(
    () => new Set(lessons.map((l) => l.createdAt?.slice(0, 10) ?? "")),
    [lessons],
  );

  const byMonth = useMemo<Record<string, Date[]>>(() => {
    const months: Record<string, Date[]> = {};
    allDates.forEach((d) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!months[key]) months[key] = [];
      months[key].push(d);
    });
    return months;
  }, [allDates]);

  const monthKeys = Object.keys(byMonth);
  const [monthIdx, setMonthIdx] = useState(
    Math.max(0, monthKeys.findIndex((k) => {
      const today = new Date();
      const [y, m] = k.split("-").map(Number);
      return y === today.getFullYear() && m === today.getMonth();
    }))
  );

  const currentKey = monthKeys[monthIdx];
  const currentDates = byMonth[currentKey] ?? [];

  if (!currentKey) return null;
  const [year, month] = currentKey.split("-").map(Number);

  const [showAll, setShowAll] = useState(false);
  const visible = useMemo(
    () => (showAll ? currentDates : currentDates.slice(0, 8)),
    [showAll, currentDates],
  );

  return (
    <Box sx={{ mt: 3, borderTop: "1px solid #E5E7EB", pt: 3 }}>
      {/* Oy navigatsiyasi */}
      <Box className="flex items-center gap-2 mb-3">
        <Button
          size="small"
          onClick={() => { setMonthIdx((i) => Math.max(0, i - 1)); setShowAll(false); }}
          disabled={monthIdx === 0}
          sx={{ minWidth: 0, p: 0.5 }}
        >
          <ChevronLeftRounded fontSize="small" />
        </Button>
        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 80, textAlign: "center" }}>
          {MONTHS_UZ[month]} {year}
        </Typography>
        <Button
          size="small"
          onClick={() => { setMonthIdx((i) => Math.min(monthKeys.length - 1, i + 1)); setShowAll(false); }}
          disabled={monthIdx === monthKeys.length - 1}
          sx={{ minWidth: 0, p: 0.5 }}
        >
          <ChevronRightRounded fontSize="small" />
        </Button>
      </Box>

      {/* Sanalar */}
      <Box className="flex flex-wrap gap-2">
        {visible.map((date) => {
          const dateStr = toDateStr(date);
          const past = isPast(date);
          const today = isToday(date);
          const hasLesson = lessonDateSet.has(dateStr);
          const canClick = past; // faqat o'tgan va bugungi sanalar bosiladi

          return (
            <Box
              key={dateStr}
              onClick={() => canClick && router.push(`/teacher/groups/${groupId}/lesson/${dateStr}`)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 52,
                py: 1,
                px: 0.5,
                borderRadius: 2,
                border: today ? "2px solid #F5C400" : "1px solid #E5E7EB",
                bgcolor: hasLesson ? "#FFFBEB" : today ? "#FEF9C3" : "#fff",
                cursor: canClick ? "pointer" : "default",
                opacity: !past ? 0.4 : 1,
                transition: "all 0.15s",
                "&:hover": canClick ? { bgcolor: "#FEF3C7", borderColor: "#F5C400" } : {},
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {MONTHS_UZ[date.getMonth()]}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={today || hasLesson ? 700 : 400}
                sx={{ color: today ? "#D97706" : hasLesson ? "#92400E" : "text.primary" }}
              >
                {date.getDate()}
              </Typography>
              {hasLesson && (
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#F5C400", mt: 0.3 }} />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Barchasi ko'rish */}
      {currentDates.length > 8 && (
        <Button size="small" sx={{ mt: 1 }} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Yig'ish" : `Barchasini ko'rish (${currentDates.length})`}
        </Button>
      )}
    </Box>
  );
});

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

const GroupDarsliklariTab = memo(function GroupDarsliklariTab({
  groupId,
  lessons,
  reloadLessons,
  onCreateLesson,
  router,
}: {
  groupId: number;
  lessons: Lesson[];
  reloadLessons: () => Promise<void>;
  onCreateLesson: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [subTab, setSubTab] = useState<SubTab>("homework");
  const { data: homeworks } = useApiList<HomeworkWithAnswers>(
    subTab === "homework" ? `/homeworks?groupId=${groupId}` : null,
  );
  const { data: lessonsWithVideos } = useApiList<LessonWithVideos>(
    subTab === "videos" ? `/lessons?groupId=${groupId}` : null,
  );
  const { data: exams } = useApiList<ExamItem>(
    subTab === "exams" ? `/exams?groupId=${groupId}` : null,
  );

  const videoRows = useMemo(() => {
    const rows: Array<{ id: number; lessonTopic: string; originalName: string; sizeMb: number; createdAt: string | null }> = [];
    lessonsWithVideos.forEach((lesson) => {
      (lesson.lessonVideos ?? []).forEach((video) => {
        rows.push({
          id: video.id,
          lessonTopic: lesson.topic,
          originalName: video.originalName,
          sizeMb: video.sizeMb,
          createdAt: lesson.createdAt ?? null,
        });
      });
    });
    return rows;
  }, [lessonsWithVideos]);

  const subTabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: "homework", label: "Uyga vazifa", icon: <AssignmentRounded fontSize="small" /> },
    { key: "videos", label: "Videolar", icon: <VideocamRounded fontSize="small" /> },
    { key: "exams", label: "Imtihonlar", icon: <QuizRounded fontSize="small" /> },
    { key: "journal", label: "Jurnal", icon: <MenuBookRounded fontSize="small" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Subtab header */}
      <Box className="flex items-center justify-between">
        <Box className="flex gap-1">
          {subTabs.map((st) => (
            <Button
              key={st.key}
              size="small"
              variant={subTab === st.key ? "contained" : "text"}
              startIcon={st.icon}
              onClick={() => setSubTab(st.key)}
              sx={{
                borderRadius: 2,
                bgcolor: subTab === st.key ? "#F5C400" : "transparent",
                color: subTab === st.key ? "#111827" : "text.secondary",
                "&:hover": { bgcolor: subTab === st.key ? "#e6b800" : "#F3F4F6" },
              }}
            >
              {st.label}
            </Button>
          ))}
        </Box>
        <Box className="flex gap-2">
          {subTab === "homework" && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRounded />}
              onClick={() => router.push(`/teacher/groups/${groupId}/homework/create`)}
              sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
            >
              Qo'shish
            </Button>
          )}
          {subTab === "videos" && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRounded />}
              onClick={() => router.push(`/teacher/groups/${groupId}/video/create`)}
              sx={{ bgcolor: "#F5C400", color: "#111827", "&:hover": { bgcolor: "#e6b800" } }}
            >
              Video yuklash
            </Button>
          )}
          {subTab === "exams" && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRounded />}
              onClick={() => router.push(`/teacher/groups/${groupId}/exam/create`)}
              sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
            >
              Imtihon yaratish
            </Button>
          )}
          {subTab === "journal" && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddRounded />}
              onClick={onCreateLesson}
            >
              Yangi dars
            </Button>
          )}
        </Box>
      </Box>

      {/* ===== UY VAZIFALAR ===== */}
      {subTab === "homework" && (
        <Paper className="overflow-hidden">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold" width={40}>#</TableCell>
                <TableCell className="!font-semibold">Mavzu</TableCell>
                <TableCell align="center" className="!font-semibold" width={60}>
                  <PeopleAltRounded fontSize="small" color="action" />
                </TableCell>
                <TableCell align="center" className="!font-semibold" width={60}>
                  <AssignmentRounded fontSize="small" sx={{ color: "#ef4444" }} />
                </TableCell>
                <TableCell align="center" className="!font-semibold" width={60}>
                  <AssignmentRounded fontSize="small" sx={{ color: "#16a34a" }} />
                </TableCell>
                <TableCell className="!font-semibold">Berilgan vaqt</TableCell>
                <TableCell className="!font-semibold">Tugash vaqti</TableCell>
                <TableCell className="!font-semibold">Dars sanasi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {homeworks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    Uyga vazifalar topilmadi
                  </TableCell>
                </TableRow>
              ) : homeworks.map((hw, i) => {
                const total = hw.answers?.length ?? 0;
                const accepted = hw.answers?.filter((a) => a.status === "ACCEPTED").length ?? 0;
                const rejected = hw.answers?.filter((a) => a.status === "REJECTED").length ?? 0;
                return (
                  <TableRow key={hw.id} hover sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/teacher/groups/${groupId}/homework/${hw.id}`)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color="primary">
                        {hw.title}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{total}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="error.main">{rejected}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" color="success.main">{accepted}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatUzDate(hw.createdAt ?? undefined)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {hw.lesson?.topic ?? "—"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ===== VIDEOLAR ===== */}
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
              {videoRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    Videolar topilmadi
                  </TableCell>
                </TableRow>
              ) : videoRows.map((video, index) => (
                <TableRow
                  key={video.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => router.push(`/teacher/groups/${groupId}/video/${video.id}`)}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} color="primary">
                      {video.lessonTopic}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      <VideocamRounded fontSize="small" sx={{ color: "#F5C400" }} />
                      <Typography variant="body2">{video.originalName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {video.sizeMb} MB
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {video.createdAt
                        ? new Date(video.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ===== IMTIHONLAR ===== */}
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
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    Imtihonlar topilmadi
                  </TableCell>
                </TableRow>
              ) : exams.map((exam, i) => {
                const total    = exam.answers?.length ?? 0;
                const accepted = exam.answers?.filter(a => a.status === "ACCEPTED").length ?? 0;
                const rejected = exam.answers?.filter(a => a.status === "REJECTED").length ?? 0;
                return (
                  <TableRow key={exam.id} hover sx={{ cursor: "pointer" }}
                    onClick={() => router.push(`/teacher/groups/${groupId}/exam/${exam.id}`)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} color="primary">{exam.title}</Typography>
                    </TableCell>
                    <TableCell align="center"><Typography variant="body2">{total}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="success.main">{accepted}</Typography></TableCell>
                    <TableCell align="center"><Typography variant="body2" color="error.main">{rejected}</Typography></TableCell>
                    <TableCell>
                      <Chip label={`${exam.passingScore} ball`} size="small" sx={{ bgcolor: "#FEF3C7", color: "#D97706", fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatUzDate(exam.dueDate ?? undefined)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatUzDate(exam.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ===== JURNAL (darslar) ===== */}
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
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    Darslar topilmadi
                  </TableCell>
                </TableRow>
              ) : lessons.map((lesson, i) => (
                <TableRow key={lesson.id} hover sx={{ cursor: "pointer" }}
                  onClick={() => router.push(`/teacher/groups/${groupId}/lessons/${lesson.id}`)}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500} color="primary">{lesson.topic}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatUzDate(lesson.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={lesson.status} size="small"
                      color={lesson.status === "ACTIVE" ? "success" : "default"} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button size="small" variant="outlined"
                      onClick={() => router.push(`/teacher/groups/${groupId}/lessons/${lesson.id}`)}>
                      Yo'qlama
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
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type TeacherRow = {
  id: number;
  teacherId: number;
  status: string;
  teacher: { id: number; firstName: string; lastName: string; photo?: string | null };
};

type GroupDetail = Group & {
  course: { id: number; name: string; durationMonths?: number };
  room: { id: number; name: string; capacity: number };
  groupTeachers: TeacherRow[];
  _count?: { studentGroups: number };
};

const WEEK_DAYS_UZ: Record<string, string> = {
  MONDAY: "Du", TUESDAY: "Se", WEDNESDAY: "Ch",
  THURSDAY: "Pa", FRIDAY: "Ju", SATURDAY: "Sha", SUNDAY: "Ya",
};

const formatUzDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const GroupTeachersCard = memo(function GroupTeachersCard({
  teachers,
  apiUrl,
}: {
  teachers: TeacherRow[];
  apiUrl: string;
}) {
  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={{ bgcolor: "#F5C400", px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" fontWeight={700} color="#111827">
          Guruh mentorlari
        </Typography>
        <Box sx={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => {}}>
          <Typography variant="caption" color="white" sx={{ lineHeight: 1 }}>×</Typography>
        </Box>
      </Box>
      <Box sx={{ p: 3 }}>
        {teachers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Mentor biriktirilmagan</Typography>
        ) : (
          <Box className="flex flex-wrap gap-4">
            {teachers.map((t) => (
              <Box key={t.id} className="flex flex-col items-center gap-1">
                <Avatar
                  src={t.teacher.photo ? `${apiUrl}${t.teacher.photo}` : undefined}
                  sx={{ width: 64, height: 64, bgcolor: "#F5C400", color: "#111827", fontSize: 22 }}
                >
                  {t.teacher.firstName[0]}
                </Avatar>
                <Typography variant="caption" color="text.secondary">Teacher</Typography>
                <Typography variant="body2" fontWeight={600}>{t.teacher.firstName}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
});

const GroupSummaryCard = memo(function GroupSummaryCard({
  group,
  studentsCount,
  lessonsCount,
}: {
  group: GroupDetail;
  studentsCount: number;
  lessonsCount: number;
}) {
  const items = useMemo(
    () => [
      { label: "Kurs", value: group.course?.name ?? "—" },
      { label: "O'rta yosh", value: "—" },
      { label: "O'quvchilar sig'imi", value: group.maxStudents },
      { label: "Mavjud o'quvchilar", value: studentsCount },
      { label: "O'quv reytagi darslar soni", value: lessonsCount },
      { label: "Kurs davomiyligi (oy)", value: group.course?.durationMonths ?? "—" },
      { label: "Jam darslar soni", value: lessonsCount },
    ],
    [group, studentsCount, lessonsCount],
  );

  return (
    <Paper sx={{ p: 0, overflow: "hidden" }}>
      <Box sx={{ bgcolor: "#F5C400", px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" fontWeight={700} color="#111827">
          Parametrlar
        </Typography>
        <Box sx={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="caption" color="white" sx={{ lineHeight: 1 }}>×</Typography>
        </Box>
      </Box>
      <Box sx={{ p: 2 }}>
        {items.map((item) => (
          <Box key={item.label} className="flex items-center justify-between py-1">
            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
            <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
});

const GroupOverviewTab = memo(function GroupOverviewTab({
  group,
  groupId,
  teachers,
  studentsCount,
  lessonsCount,
  lessons,
  router,
}: {
  group: GroupDetail;
  groupId: number;
  teachers: TeacherRow[];
  studentsCount: number;
  lessonsCount: number;
  lessons: Lesson[];
  router: ReturnType<typeof useRouter>;
}) {
  const scheduleRows = useMemo(
    () => teachers.map((teacher) => ({
      id: teacher.id,
      label: `${teacher.teacher.firstName} ${teacher.teacher.lastName}`,
      days: group.weekDays,
      time: group.startTime,
      startDate: group.startDate,
      roomName: group.room?.name ?? "—",
    })),
    [group.room?.name, group.startDate, group.startTime, group.weekDays, teachers],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GroupTeachersCard teachers={teachers} apiUrl={API_URL} />
        <GroupSummaryCard
          group={group}
          studentsCount={studentsCount}
          lessonsCount={lessonsCount}
        />
      </div>

      <Paper className="p-4">
        <Typography variant="subtitle2" fontWeight={700} className="mb-3">Dars jadvali</Typography>
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
            {scheduleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  Dars jadvali mavjud emas
                </TableCell>
              </TableRow>
            ) : scheduleRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Typography variant="body2" color="primary" fontWeight={500}>
                    {row.label}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box className="flex flex-wrap gap-1">
                    {row.days.map((d) => (
                      <Chip key={d} label={WEEK_DAYS_UZ[d] ?? d} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.time}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(row.startDate).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.roomName}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {group.course?.durationMonths && (
          <DatesCalendar
            groupId={groupId}
            startDate={group.startDate}
            durationMonths={group.course.durationMonths}
            weekDays={group.weekDays}
            lessons={lessons}
            router={router}
          />
        )}
      </Paper>
    </div>
  );
});

const GroupAttendanceTab = memo(function GroupAttendanceTab({
  students,
  lessons,
}: {
  students: GroupStudent[];
  lessons: Lesson[];
}) {
  const lessonHeaders = useMemo(
    () => lessons.map((lesson) => ({
      key: lesson.id,
      label: lesson.createdAt
        ? new Date(lesson.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })
        : `#${lesson.id}`,
    })),
    [lessons],
  );

  return (
    <Paper className="overflow-hidden">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#F9FAFB" }}>
            <TableCell className="!font-semibold">Talaba</TableCell>
            {lessonHeaders.map((header) => (
              <TableCell key={header.key} align="center" sx={{ fontSize: 11 }}>
                {header.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={lessonHeaders.length + 1} align="center" sx={{ py: 4, color: "text.secondary" }}>
                Talabalar topilmadi
              </TableCell>
            </TableRow>
          ) : students.map((s) => (
            <TableRow key={s.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {s.student.firstName} {s.student.lastName}
                </Typography>
              </TableCell>
              {lessons.map((l) => (
                <TableCell key={l.id} align="center">
                  <Typography variant="caption" color="text.secondary">—</Typography>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
});

export default function TeacherGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const groupId = Number(id);
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState(0);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState("");

  const { data: students } = useApiList<GroupStudent>(`/groups/${groupId}/students`);
  const { data: lessons, reload: reloadLessons } = useApiList<Lesson>(`/lessons?groupId=${groupId}`);
  const teachers = useMemo(() => group?.groupTeachers ?? [], [group?.groupTeachers]);
  const summaryItems = useMemo(
    () => ({
      studentsCount: students.length,
      lessonsCount: lessons.length,
    }),
    [students.length, lessons.length],
  );

  // Dars yaratish drawer
  const [lessonDrawer, setLessonDrawer] = useState(false);
  const [lessonForm, setLessonForm] = useState({ topic: "", description: "" });
  const [lessonError, setLessonError] = useState("");
  const [lessonSaving, setLessonSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    apiGet<GroupDetail>(`/groups/${groupId}`)
      .then(setGroup)
      .catch((err) => setGroupError(formatApiError(err)))
      .finally(() => setGroupLoading(false));
  }, [groupId]);

  const createLesson = useCallback(async () => {
    if (!lessonForm.topic.trim()) { setLessonError("Mavzu kiritilishi shart"); return; }
    setLessonError(""); setLessonSaving(true);
    try {
      await apiPost("/lessons", {
        groupId,
        teacherId: user?.id,
        topic: lessonForm.topic,
        description: lessonForm.description || undefined,
      });
      setSuccessMsg("Dars muvaffaqiyatli yaratildi!");
      setLessonDrawer(false);
      setLessonForm({ topic: "", description: "" });
      await reloadLessons();
    } catch (err) {
      setLessonError(formatApiError(err));
    } finally {
      setLessonSaving(false);
    }
  }, [groupId, lessonForm.description, lessonForm.topic, reloadLessons, user?.id]);

  if (groupLoading) return <LoadingState />;
  if (groupError) return <Alert severity="error">{groupError}</Alert>;
  if (!group) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <Button startIcon={<ArrowBackRounded />} size="small" onClick={() => router.push("/teacher/groups")}>
            Orqaga
          </Button>
          <Typography variant="h5" fontWeight={700}>{group.name}</Typography>
          <Chip label={group.status} size="small"
            color={group.status === "ACTIVE" ? "success" : group.status === "PLANNED" ? "warning" : "default"} />
        </Box>
        <Button variant="outlined" startIcon={<BarChartRounded />} size="small">
          Statistika
        </Button>
      </Box>

      {/* Tablar */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Ma'lumotlar" />
          <Tab label="Guruh darsliklari" />
          <Tab label="Akademik davomat" />
        </Tabs>
      </Box>

      {/* ===== TAB 0: MA'LUMOTLAR ===== */}
      {tab === 0 && (
        <GroupOverviewTab
          group={group}
          groupId={groupId}
          teachers={teachers}
          studentsCount={summaryItems.studentsCount}
          lessonsCount={summaryItems.lessonsCount}
          lessons={lessons}
          router={router}
        />
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

      {/* ===== TAB 2: AKADEMIK DAVOMAT ===== */}
      {tab === 2 && <GroupAttendanceTab students={students} lessons={lessons} />}

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
        <TextField
          label="Mavzu *"
          value={lessonForm.topic}
          onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
          fullWidth
        />
        <TextField
          label="Tavsif (ixtiyoriy)"
          placeholder="Dars haqida qo'shimcha ma'lumot..."
          value={lessonForm.description}
          onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
          fullWidth
          multiline
          rows={3}
        />
      </SideDrawer>

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />
    </div>
  );
}
