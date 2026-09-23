"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import PlayCircleOutlineRounded from "@mui/icons-material/PlayCircleOutlineRounded";
import QuizRounded from "@mui/icons-material/QuizRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { apiGet } from "@/lib/api";
import { LoadingState, PageHeader } from "@/components/ui";
import type { Lesson, HomeworkAnswer, LessonVideo } from "@/lib/types";

type LessonWithExtras = Lesson & {
  homeworks: {
    id: number;
    title: string;
    answers: HomeworkAnswer[];
  }[];
  lessonVideos: LessonVideo[];
};

type HomeworkFilter = "Barchasi" | "Topshirilmagan" | "Topshirilgan" | "Qabul qilindi" | "Rad etildi";

// status: dars uchun uy vazifa yo'q | bor lekin topshirilmagan | topshirilgan holatlari
type HwDisplayStatus =
  | "Vazifa yo'q"
  | "Topshirilmagan"
  | "Topshirilgan"
  | "Tekshirildi"
  | "Qabul qilindi"
  | "Rad etildi";

const HW_STATUS_COLOR: Record<HwDisplayStatus, { bg: string; color: string }> = {
  "Vazifa yo'q":    { bg: "#F3F4F6", color: "#6B7280" },
  "Topshirilmagan": { bg: "#FEF3C7", color: "#D97706" },
  "Topshirilgan":   { bg: "#DBEAFE", color: "#2563eb" },
  "Tekshirildi":    { bg: "#EDE9FE", color: "#7C3AED" },
  "Qabul qilindi":  { bg: "#D1FAE5", color: "#16a34a" },
  "Rad etildi":     { bg: "#FEE2E2", color: "#ef4444" },
};

export default function StudentGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const groupId = Number(id);
  const router = useRouter();

  const [lessons, setLessons] = useState<LessonWithExtras[]>([]);
  const [myAnswers, setMyAnswers] = useState<HomeworkAnswer[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HomeworkFilter>("Barchasi");
  const [myExamAnswers, setMyExamAnswers] = useState<{ examId: number; status: string }[]>([]);
  const [exams, setExams] = useState<{ id: number; lessonId?: number | null; title: string; passingScore: number }[]>([]);

  async function loadData() {
    try {
      const [lessonsData, answersData, groupData, examAnswersData, examsData] = await Promise.all([
        apiGet<LessonWithExtras[]>(`/lessons?groupId=${groupId}`),
        apiGet<HomeworkAnswer[]>("/homework-answers/my"),
        apiGet<{ name: string }>(`/groups/${groupId}`),
        apiGet<{ examId: number; status: string }[]>("/exam-answers/my"),
        apiGet<{ id: number; lessonId?: number | null; title: string; passingScore: number }[]>(`/exams?groupId=${groupId}`),
      ]);
      setLessons(Array.isArray(lessonsData) ? lessonsData : []);
      setMyAnswers(Array.isArray(answersData) ? answersData : []);
      setGroupName(groupData?.name ?? "");
      setMyExamAnswers(Array.isArray(examAnswersData) ? examAnswersData : []);
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (err) {
      console.error("Ma'lumotlarni yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [groupId]);

  if (loading) return <LoadingState />;

  // Har bir dars uchun uy vazifasi holatini aniqlaymiz
  type LessonRow = {
    lesson: LessonWithExtras;
    hwStatus: HwDisplayStatus;
    homeworkId: number | null;
    videoCount: number;
    exam: { id: number; title: string; passingScore: number } | null;
    examStatus: "yo'q" | "topshirilmagan" | "kutilmoqda" | "qabul" | "rad";
  };

  const rows: LessonRow[] = lessons.map((lesson) => {
    const hw = lesson.homeworks?.[0] ?? null;
    const videoCount = lesson.lessonVideos?.length ?? 0;
    // Shu darsga tegishli imtihon
    const exam = exams.find(e => e.lessonId === lesson.id) ?? null;
    const examAnswer = exam ? myExamAnswers.find(a => a.examId === exam.id) ?? null : null;

    let examStatus: "yo'q" | "topshirilmagan" | "kutilmoqda" | "qabul" | "rad" = "yo'q";
    if (exam) {
      if (!examAnswer) examStatus = "topshirilmagan";
      else if (examAnswer.status === "ACCEPTED") examStatus = "qabul";
      else if (examAnswer.status === "REJECTED") examStatus = "rad";
      else examStatus = "kutilmoqda";
    }

    if (!hw) return { lesson, hwStatus: "Vazifa yo'q", homeworkId: null, videoCount, exam, examStatus };

    const answer = myAnswers.find((a) => a.homeworkId === hw.id);
    if (!answer) return { lesson, hwStatus: "Topshirilmagan", homeworkId: hw.id, videoCount, exam, examStatus };

    const statusMap: Record<string, HwDisplayStatus> = {
      PENDING: "Topshirilgan", CHECKED: "Tekshirildi", ACCEPTED: "Qabul qilindi", REJECTED: "Rad etildi",
    };
    return { lesson, hwStatus: statusMap[answer.status] ?? "Topshirilgan", homeworkId: hw.id, videoCount, exam, examStatus };
  });

  // Filter
  const filtered = rows.filter((r) => {
    if (filter === "Barchasi") return true;
    if (filter === "Topshirilmagan") return r.hwStatus === "Topshirilmagan";
    if (filter === "Topshirilgan")   return r.hwStatus === "Topshirilgan" || r.hwStatus === "Tekshirildi";
    if (filter === "Qabul qilindi")  return r.hwStatus === "Qabul qilindi";
    if (filter === "Rad etildi")     return r.hwStatus === "Rad etildi";
    return true;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title={groupName || "Guruh"}
        action={
          <Box className="flex gap-2">
            <Button
              startIcon={<RefreshRounded />}
              onClick={() => {
                setLoading(true);
                loadData();
              }}
              size="small"
              variant="outlined"
            >
              Yangilash
            </Button>
            <Button
              startIcon={<ArrowBackRounded />}
              onClick={() => history.back()}
            >
              Orqaga
            </Button>
          </Box>
        }
      />

      {/* Filter */}
      <Box className="flex items-center gap-3">
        <Typography variant="body2" color="text.secondary">
          Uy vazifasi statusi
        </Typography>
        <Select
          size="small"
          value={filter}
          onChange={(e) => setFilter(e.target.value as HomeworkFilter)}
          sx={{ minWidth: 160 }}
        >
          {(["Barchasi", "Topshirilmagan", "Topshirilgan", "Qabul qilindi", "Rad etildi"] as HomeworkFilter[]).map(
            (f) => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ),
          )}
        </Select>
      </Box>

      {/* Jadval */}
      <Paper className="overflow-hidden">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
              <TableCell className="!font-semibold">Mavzular</TableCell>
              <TableCell className="!font-semibold" width={80} align="center">Video</TableCell>
              <TableCell className="!font-semibold" width={160}>Uy vazifa</TableCell>
              <TableCell className="!font-semibold" width={160}>Imtihon</TableCell>
              <TableCell className="!font-semibold" width={140}>Dars sanasi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  {filter === "Barchasi" 
                    ? `Bu guruhda hali darslar yo'q (Jami: ${lessons.length})`
                    : `"${filter}" statusidagi darslar topilmadi`
                  }
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ lesson, hwStatus, homeworkId, videoCount, exam, examStatus }) => {
                const style = HW_STATUS_COLOR[hwStatus];
                const examChipCfg = {
                  "yo'q":          { label: "—",              bg: "transparent", color: "#9CA3AF" },
                  topshirilmagan:  { label: "Topshirilmagan", bg: "#FEF3C7",     color: "#D97706" },
                  kutilmoqda:      { label: "Tekshirilmoqda", bg: "#DBEAFE",     color: "#2563eb" },
                  qabul:           { label: "Qabul qilindi",  bg: "#D1FAE5",     color: "#16a34a" },
                  rad:             { label: "Rad etildi",     bg: "#FEE2E2",     color: "#ef4444" },
                }[examStatus];
                return (
                  <TableRow key={lesson.id} hover onClick={() => router.push(`/student/groups/${groupId}/lessons/${lesson.id}`)} sx={{ cursor: "pointer" }}>
                    <TableCell>
                      <Typography variant="body2" color="primary" fontWeight={500}>{lesson.topic}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box className="flex items-center justify-center gap-1">
                        <PlayCircleOutlineRounded fontSize="small" sx={{ color: videoCount > 0 ? "#2563eb" : "#9CA3AF" }} />
                        <Typography variant="caption" component="span" sx={{
                          width: 20, height: 20, borderRadius: "50%", border: "1.5px solid",
                          borderColor: videoCount > 0 ? "#2563eb" : "#9CA3AF",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: videoCount > 0 ? "#2563eb" : "#9CA3AF", fontSize: 11,
                        }}>{videoCount}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={hwStatus} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: 12, borderRadius: "6px" }} />
                    </TableCell>
                    <TableCell onClick={(e) => { if (exam) { e.stopPropagation(); router.push(`/student/groups/${groupId}/exam/${exam.id}`); } }}>
                      {exam ? (
                        <Chip label={examChipCfg.label} size="small" icon={<QuizRounded style={{ fontSize: 14 }} />}
                          sx={{ bgcolor: examChipCfg.bg, color: examChipCfg.color, fontWeight: 600, fontSize: 12, borderRadius: "6px", cursor: "pointer" }} />
                      ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(lesson.createdAt ?? "").toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}
