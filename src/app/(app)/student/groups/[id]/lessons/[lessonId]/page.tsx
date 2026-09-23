"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import VideocamOffRounded from "@mui/icons-material/VideocamOffRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { formatApiError } from "@/lib/auth-context";
import { LoadingState } from "@/components/ui";
import type { Lesson, LessonVideo, HomeworkAnswer } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type HomeworkDetail = {
  id: number;
  title: string;
  fileUrl?: string | null;
  createdAt?: string;
};

type LessonDetail = Lesson & {
  lessonVideos: LessonVideo[];
  homeworks: HomeworkDetail[];
};

type HomeworkResultDetail = {
  id: number;
  grade: number;
  feedback?: string | null;
  status: string;
  createdAt?: string;
  teacher?: { firstName: string; lastName: string };
};

type AnswerDetail = HomeworkAnswer & {
  result?: HomeworkResultDetail | null;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Topshirilgan",
  CHECKED: "Tekshirildi",
  ACCEPTED: "Vazifa qabul qilindi",
  REJECTED: "Rad etildi",
};

const STATUS_COLOR: Record<string, "success" | "error" | "warning" | "default"> = {
  PENDING: "warning",
  CHECKED: "default",
  ACCEPTED: "success",
  REJECTED: "error",
};

export default function StudentLessonDetailPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = use(params);
  const groupId = Number(id);
  const lessonIdNum = Number(lessonId);
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [answer, setAnswer] = useState<AnswerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadData() {
    try {
      const [lessonData, answersData] = await Promise.all([
        apiGet<LessonDetail>(`/lessons/${lessonIdNum}`),
        apiGet<AnswerDetail[]>("/homework-answers/my"),
      ]);
      setLesson(lessonData);

      // Shu darsning uy vazifasiga tegishli javobni topamiz
      const hw = lessonData.homeworks?.[0];
      if (hw) {
        const found = answersData.find((a) => a.homeworkId === hw.id) ?? null;
        setAnswer(found);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [lessonIdNum]);

  async function submitAnswer() {
    if (!lesson?.homeworks?.[0]) return;
    
    if (!submitFile) {
      setFormError("Fayl yuklash majburiy!");
      return;
    }
    
    setFormError("");
    setSubmitting(true);
    
    try {
      let fileUrl: string | undefined;
      
      // Agar fayl yuklangan bo'lsa, avval uni yuklash
      if (submitFile) {
        const formData = new FormData();
        formData.append("file", submitFile);
        
        const uploadRes = await apiUpload<{ url: string }>("/upload", formData);
        fileUrl = uploadRes.url;
      }
      
      await apiPost("/homework-answers", {
        homeworkId: lesson.homeworks[0].id,
        title: submitTitle || "Topshirildi",
        fileUrl,
      });
      
      setSubmitTitle("");
      setSubmitFile(null);
      await loadData();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSubmitFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSubmitFile(files[0]);
    }
  };

  if (loading) return <LoadingState />;
  if (!lesson) return <Alert severity="error">Dars topilmadi</Alert>;

  const homework = lesson.homeworks?.[0] ?? null;
  const videos = lesson.lessonVideos ?? [];

  return (
    <div className="space-y-4">
      {/* Orqaga */}
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => history.back()}
        sx={{ mb: 1 }}
      >
        Orqaga
      </Button>

      {/* Video qismi */}
      <Paper className="overflow-hidden">
        {videos.length > 0 ? (
          <Box>
            <Box 
              sx={{ position: "relative", cursor: "pointer" }}
              onClick={() => router.push(`/student/groups/${groupId}/video/${videos[0].id}`)}
            >
              <video
                controls
                className="w-full"
                style={{ maxHeight: 360, background: "#000" }}
                src={`${API_URL}${videos[0].videoUrl}`}
                onClick={(e) => e.stopPropagation()}
              />
            </Box>
            {videos.length > 1 && (
              <Box className="flex gap-2 overflow-x-auto p-2">
                {videos.slice(1).map((v) => (
                  <Box
                    key={v.id}
                    className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border p-2 hover:bg-gray-50"
                    onClick={() => router.push(`/student/groups/${groupId}/video/${v.id}`)}
                  >
                    <InsertDriveFileRounded fontSize="small" color="action" />
                    <Typography variant="caption">{v.originalName}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <Box className="flex flex-col items-center gap-3 py-12">
            <VideocamOffRounded sx={{ fontSize: 64, color: "#D1D5DB" }} />
            <Typography color="text.secondary" fontWeight={600}>
              Video mavjud emas
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Dars mavzusi */}
      <Paper className="p-4">
        <Typography variant="subtitle1" fontWeight={700}>
          {lesson.topic}
        </Typography>
        {lesson.description && (
          <Typography variant="body2" color="text.secondary" className="mt-1">
            {lesson.description}
          </Typography>
        )}
      </Paper>

      {/* Uy vazifasi va javob */}
      {homework && (
        <Paper className="overflow-hidden">
          {/* Vazifalar tab header */}
          <Box className="flex items-center justify-between border-b px-4 py-3">
            <Typography variant="subtitle2" fontWeight={700}>
              Vazifalar
            </Typography>
            {answer?.result && (
              <Typography variant="body2" color="text.secondary">
                Ball: <strong>{answer.result.grade}</strong>
              </Typography>
            )}
          </Box>

          <Box className="divide-y">
            {/* Uy vazifasi bloki */}
            <Box className="p-4">
              <Box className="mb-2 flex items-start justify-between gap-3">
                <Typography variant="subtitle2" fontWeight={700}>
                  Uyga vazifa
                </Typography>
                {/* Muddati — hozircha statik, keyinchalik backend dan keladi */}
                <Chip
                  icon={<AccessTimeRounded fontSize="small" />}
                  label="Muddat belgilanmagan"
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Box>

              {homework.fileUrl ? (
                <Typography
                  variant="body2"
                  color="primary"
                  component="a"
                  href={homework.fileUrl}
                  target="_blank"
                  className="break-all"
                >
                  {homework.fileUrl}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {homework.title}
                </Typography>
              )}

              <Typography variant="caption" color="text.secondary" className="mt-2 block">
                {homework.createdAt
                  ? new Date(homework.createdAt).toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) +
                    " " +
                    new Date(homework.createdAt).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : ""}
              </Typography>
            </Box>

            {/* Mening jo'natmalarim */}
            <Box className="p-4">
              <Box className="mb-3 flex items-center justify-between">
                <Typography variant="subtitle2" fontWeight={700}>
                  Mening jo'natmalarim
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fayllar soni: {answer ? 1 : 0}
                </Typography>
              </Box>

              {answer ? (
                <Box>
                  <Box className="mb-2">
                    {answer.title && answer.title !== "Topshirildi" && (
                      <Box className="mb-2 rounded-lg bg-gray-50 p-3">
                        <Typography variant="caption" color="text.secondary" className="block mb-1">
                          Izoh:
                        </Typography>
                        <Typography variant="body2">
                          {answer.title}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  {answer.fileUrl ? (
                    <Box className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                      <InsertDriveFileRounded fontSize="small" color="action" />
                      <Typography
                        variant="body2"
                        component="a"
                        href={answer.fileUrl}
                        target="_blank"
                        color="primary"
                      >
                        {answer.fileUrl.split("/").pop() ?? answer.fileUrl}
                      </Typography>
                    </Box>
                  ) : answer.title === "Topshirildi" ? (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Fayl yuklanmagan
                    </Typography>
                  ) : null}
                  
                  <Typography variant="caption" color="text.secondary" className="mt-2 block">
                    {answer.createdAt
                      ? new Date(answer.createdAt as string).toLocaleTimeString("uz-UZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) +
                        " " +
                        new Date(answer.createdAt as string).toLocaleDateString("uz-UZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </Typography>
                </Box>
              ) : (
                /* Topshirish formasi */
                <Box className="flex flex-col gap-3">
                  {formError && <Alert severity="error">{formError}</Alert>}
                  
                  <TextField
                    label="Izoh (ixtiyoriy)"
                    size="small"
                    value={submitTitle}
                    onChange={(e) => setSubmitTitle(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Vazifa bo'yicha izoh yoki qo'shimcha ma'lumot..."
                  />

                  {/* Fayl yuklash */}
                  <Box>
                    <Typography variant="body2" fontWeight={600} className="mb-2">
                      Fayl yuklash *
                    </Typography>

                    {!submitFile ? (
                      <Box
                        onDrop={handleDrop}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        sx={{
                          border: `2px dashed ${dragOver ? "#F5C400" : "#D1D5DB"}`,
                          borderRadius: 2,
                          p: 3,
                          textAlign: "center",
                          bgcolor: dragOver ? "#FEF3C7" : "#FAFAFA",
                          transition: "all 0.2s",
                          "&:hover": { borderColor: "#F5C400", bgcolor: "#FEF3C7" },
                        }}
                      >
                        <CloudUploadRounded
                          sx={{ fontSize: 32, color: dragOver ? "#F5C400" : "#9CA3AF", mb: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" className="mb-1">
                          Faylni bu yerga torting yoki
                        </Typography>
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          Faylni tanlang
                          <input
                            type="file"
                            hidden
                            onChange={handleFileSelect}
                          />
                        </Button>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          border: "2px solid #F5C400",
                          borderRadius: 2,
                          p: 2,
                          bgcolor: "#FFFBEB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box className="flex items-center gap-2">
                          <InsertDriveFileRounded sx={{ color: "#F5C400" }} />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {submitFile?.name ?? "Fayl"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {submitFile ? (submitFile.size / 1024).toFixed(2) : "0"} KB
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineRounded />}
                          onClick={() => setSubmitFile(null)}
                        >
                          O'chirish
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Button
                    variant="contained"
                    disabled={!submitFile || submitting}
                    onClick={submitAnswer}
                    sx={{ alignSelf: "flex-start", bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
                  >
                    {submitting ? "Yuborilmoqda..." : "Topshirish"}
                  </Button>
                </Box>
              )}
            </Box>

            {/* O'qituvchi izohi */}
            {answer?.result && (
              <Box className="p-4">
                <Box className="mb-2 flex items-center justify-between">
                  <Typography variant="subtitle2" fontWeight={700}>
                    O'qituvchi izohi
                  </Typography>
                  <Chip
                    label={STATUS_LABEL[answer.result.status] ?? answer.result.status}
                    size="small"
                    color={STATUS_COLOR[answer.result.status] ?? "default"}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {answer.result.feedback ?? "—"}
                </Typography>

                {answer.result.teacher && (
                  <Typography variant="caption" color="text.secondary" className="mt-2 block">
                    Tekshiruvchi: {answer.result.teacher.firstName}{" "}
                    {answer.result.teacher.lastName}
                  </Typography>
                )}

                {answer.result.createdAt && (
                  <Typography variant="caption" color="text.secondary" className="block">
                    {new Date(answer.result.createdAt).toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {new Date(answer.result.createdAt).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Typography>
                )}
              </Box>
            )}

            {/* Qayta topshirish imkoniyati */}
            {answer && !answer.result && (
              <Box className="p-4 text-center">
                <Typography variant="caption" color="text.secondary">
                  Qayta topshirish imkoniyati berilmagan
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      )}

      {/* Uy vazifasi yo'q */}
      {!homework && (
        <Paper className="p-6 text-center">
          <Typography color="text.secondary">Bu dars uchun uy vazifasi berilmagan</Typography>
        </Paper>
      )}
    </div>
  );
}
