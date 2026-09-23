"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CancelRounded from "@mui/icons-material/CancelRounded";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { formatApiError } from "@/lib/auth-context";
import { LoadingState } from "@/components/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type ExamData = {
  id: number; title: string; description?: string | null;
  fileUrl?: string | null; passingScore: number; dueDate?: string | null; createdAt: string;
  group: { id: number; name: string };
};

type MyAnswer = {
  id: number; status: string; fileUrl?: string | null; comment?: string | null; createdAt: string;
  result?: { grade: number; feedback?: string | null; status: string; isPassed: boolean; bonusPoints: number } | null;
};

const STATUS_CFG: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  PENDING:  { label: "Tekshirilmoqda", color: "warning" },
  ACCEPTED: { label: "Qabul qilindi",  color: "success" },
  REJECTED: { label: "Rad etildi",     color: "error"   },
};

export default function StudentExamPage({ params }: { params: Promise<{ id: string; examId: string }> }) {
  const { id, examId } = use(params);
  const groupId = Number(id);
  const router = useRouter();

  const [exam, setExam] = useState<ExamData | null>(null);
  const [myAnswer, setMyAnswer] = useState<MyAnswer | null>(null);
  const [loading, setLoading] = useState(true);

  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadData() {
    try {
      const [examData, answers] = await Promise.all([
        apiGet<ExamData>(`/exams/${examId}`),
        apiGet<MyAnswer[]>(`/exam-answers?examId=${examId}`),
      ]);
      setExam(examData);
      setMyAnswer(Array.isArray(answers) && answers.length > 0 ? answers[0] : null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, [examId]);

  async function submit() {
    if (!submitFile) { setFormError("Fayl yuklash majburiy!"); return; }
    setFormError(""); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", submitFile);
      const res = await apiUpload<{ url: string }>("/upload", fd);
      await apiPost("/exam-answers", { examId: Number(examId), comment: comment || undefined, fileUrl: res.url });
      setSubmitFile(null); setComment("");
      await loadData();
    } catch (err) { setFormError(formatApiError(err)); }
    finally { setSubmitting(false); }
  }

  if (loading) return <LoadingState />;
  if (!exam) return <Alert severity="error">Imtihon topilmadi</Alert>;

  return (
    <div className="space-y-4">
      <Box className="flex items-center gap-2">
        <Button startIcon={<ArrowBackRounded />} size="small" onClick={() => router.push(`/student/groups/${groupId}`)}>Orqaga</Button>
        <Typography variant="h5" fontWeight={700}>Imtihon</Typography>
      </Box>

      {/* Imtihon ma'lumoti */}
      <Paper className="p-4 space-y-3">
        <Box className="flex items-start justify-between gap-3">
          <Box>
            <Typography variant="h6" fontWeight={700}>{exam.title}</Typography>
            {exam.description && <Typography variant="body2" color="text.secondary" className="mt-1">{exam.description}</Typography>}
            <Box className="flex flex-wrap gap-2 mt-2">
              <Chip label={`O'tish bali: ${exam.passingScore}`} size="small" sx={{ bgcolor: "#FEF3C7", color: "#D97706", fontWeight: 700 }} />
              {exam.dueDate && (
                <Chip label={`Muddat: ${new Date(exam.dueDate).toLocaleDateString("uz-UZ")}`} size="small" color="default" />
              )}
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {new Date(exam.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" })}
          </Typography>
        </Box>

        {/* Imtihon topshirig'i fayli */}
        {exam.fileUrl && (
          <Box component="a" href={`${API_URL}${exam.fileUrl}`} target="_blank"
            className="flex items-center gap-2 w-fit rounded-lg border p-2"
            sx={{ color: "#2563eb", textDecoration: "none", "&:hover": { bgcolor: "#F0F9FF" } }}>
            <InsertDriveFileRounded sx={{ color: "#F5C400" }} />
            <Typography variant="body2" fontWeight={500}>Imtihon topshirig'ini yuklab oling</Typography>
          </Box>
        )}
      </Paper>

      {/* Mening javobim */}
      <Paper className="overflow-hidden">
        <Box className="px-4 py-3 border-b flex items-center justify-between">
          <Typography variant="subtitle2" fontWeight={700}>Mening javobim</Typography>
          {myAnswer?.result && (
            <Typography variant="body2" color="text.secondary">
              Ball: <strong style={{ color: myAnswer.result.isPassed ? "#16a34a" : "#ef4444" }}>{myAnswer.result.grade}</strong>
            </Typography>
          )}
        </Box>

        <Box className="p-4">
          {myAnswer ? (
            <Box className="space-y-3">
              {/* Status */}
              <Chip
                label={STATUS_CFG[myAnswer.status]?.label ?? myAnswer.status}
                color={STATUS_CFG[myAnswer.status]?.color ?? "default"}
                size="small" />

              {/* Fayl */}
              {myAnswer.fileUrl && (
                <Box component="a" href={`${API_URL}${myAnswer.fileUrl}`} target="_blank"
                  className="flex items-center gap-2 w-fit rounded-lg border p-2"
                  sx={{ color: "#2563eb", textDecoration: "none", "&:hover": { bgcolor: "#F0F9FF" } }}>
                  <InsertDriveFileRounded fontSize="small" sx={{ color: "#F5C400" }} />
                  <Typography variant="body2">{myAnswer.fileUrl.split("/").pop()}</Typography>
                </Box>
              )}

              {/* Izoh */}
              {myAnswer.comment && (
                <Box sx={{ bgcolor: "#F9FAFB", borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary" className="block mb-1">Izohim:</Typography>
                  <Typography variant="body2">{myAnswer.comment}</Typography>
                </Box>
              )}

              {/* Natija */}
              {myAnswer.result && (
                <Box sx={{ bgcolor: myAnswer.result.isPassed ? "#F0FDF4" : "#FEF2F2", borderRadius: 2, p: 3 }}>
                  <Box className="flex items-center gap-2 mb-2">
                    {myAnswer.result.isPassed
                      ? <CheckCircleRounded sx={{ color: "#16a34a" }} />
                      : <CancelRounded sx={{ color: "#ef4444" }} />}
                    <Typography variant="subtitle2" fontWeight={700}
                      sx={{ color: myAnswer.result.isPassed ? "#16a34a" : "#ef4444" }}>
                      {myAnswer.result.isPassed ? "Imtihondan o'tdingiz!" : "Imtihondan o'ta olmadingiz"}
                    </Typography>
                  </Box>

                  <Typography variant="h4" fontWeight={800}
                    sx={{ color: myAnswer.result.isPassed ? "#16a34a" : "#ef4444" }}>
                    {myAnswer.result.grade} / 100
                  </Typography>

                  {myAnswer.result.isPassed && (
                    <Box className="flex items-center gap-2 mt-2">
                      <EmojiEventsRounded sx={{ color: "#F5C400" }} />
                      <Typography variant="body2" fontWeight={600} sx={{ color: "#D97706" }}>
                        +{myAnswer.result.bonusPoints} bonus ball!
                      </Typography>
                    </Box>
                  )}

                  {myAnswer.result.feedback && (
                    <Box className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <Typography variant="caption" color="text.secondary" className="block mb-1">O'qituvchi izohi:</Typography>
                      <Typography variant="body2">{myAnswer.result.feedback}</Typography>
                    </Box>
                  )}
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                Topshirilgan: {new Date(myAnswer.createdAt).toLocaleString("uz-UZ")}
              </Typography>
            </Box>
          ) : (
            /* Topshirish formasi */
            <Box className="space-y-3">
              {formError && <Alert severity="error">{formError}</Alert>}

              <textarea
                placeholder="Izoh (ixtiyoriy)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px", border: "1px solid #D1D5DB",
                  borderRadius: 8, fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none",
                }}
              />

              {/* Fayl yuklash */}
              {!submitFile ? (
                <Box onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setSubmitFile(f); }}
                  sx={{
                    border: `2px dashed ${dragOver ? "#F5C400" : "#D1D5DB"}`, borderRadius: 2, p: 3,
                    textAlign: "center", cursor: "pointer", bgcolor: dragOver ? "#FEF3C7" : "#FAFAFA",
                    transition: "all 0.2s", "&:hover": { borderColor: "#F5C400", bgcolor: "#FEF3C7" },
                  }}>
                  <CloudUploadRounded sx={{ fontSize: 32, color: dragOver ? "#F5C400" : "#9CA3AF", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" className="mb-1">
                    Faylni bu yerga tashlang yoki
                  </Typography>
                  <Button variant="outlined" component="label" size="small">
                    Faylni tanlang *
                    <input type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setSubmitFile(f); }} />
                  </Button>
                </Box>
              ) : (
                <Box sx={{ border: "2px solid #F5C400", borderRadius: 2, p: 2, bgcolor: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box className="flex items-center gap-2">
                    <InsertDriveFileRounded sx={{ color: "#F5C400" }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{submitFile.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{(submitFile.size / 1024).toFixed(1)} KB</Typography>
                    </Box>
                  </Box>
                  <Button size="small" color="error" startIcon={<DeleteOutlineRounded />} onClick={() => setSubmitFile(null)}>O'chirish</Button>
                </Box>
              )}

              <Button variant="contained" disabled={!submitFile || submitting} onClick={submit}
                sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}>
                {submitting ? "Yuborilmoqda..." : "Topshirish"}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </div>
  );
}
