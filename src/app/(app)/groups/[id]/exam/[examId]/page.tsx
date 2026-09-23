"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CancelRounded from "@mui/icons-material/CancelRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { LoadingState, SideDrawer, SuccessSnackbar } from "@/components/ui";
import type { User } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type ExamDetail = {
  id: number; groupId: number; title: string; description?: string | null;
  fileUrl?: string | null; passingScore: number; dueDate?: string | null; createdAt: string;
  group: { id: number; name: string };
  lesson?: { id: number; topic: string } | null;
  answers: ExamAnswer[];
};

type ExamAnswer = {
  id: number; examId: number; studentId: number; comment?: string | null;
  fileUrl?: string | null; status: string; createdAt: string;
  student: { id: number; firstName: string; lastName: string };
  result?: { id: number; grade: number; feedback?: string | null; status: string; isPassed: boolean; bonusPoints: number; teacherId: number } | null;
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: "Kutilmoqda", color: "#D97706", bg: "#FEF3C7" },
  ACCEPTED: { label: "Qabul qilindi", color: "#16a34a", bg: "#F0FDF4" },
  REJECTED: { label: "Rad etildi",   color: "#ef4444", bg: "#FEF2F2" },
};

export default function TeacherExamDetailPage({ params }: { params: Promise<{ id: string; examId: string }> }) {
  const { id, examId } = use(params);
  const groupId = Number(id);
  const router = useRouter();

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const [passingScoreDialog, setPassingScoreDialog] = useState(false);
  const [newPassingScore, setNewPassingScore] = useState<number>(60);
  const [psaving, setPsaving] = useState(false);
  const [selected, setSelected] = useState<ExamAnswer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [grade, setGrade] = useState<number | "">("");
  const [feedback, setFeedback] = useState("");
  const [verdict, setVerdict] = useState<"ACCEPTED" | "REJECTED">("ACCEPTED");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await apiGet<ExamDetail>(`/exams/${examId}`);
      setExam(data);
    } catch (err) { setError(formatApiError(err)); }
    finally { setLoading(false); }
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  function openDrawer(ans: ExamAnswer) {
    setSelected(ans); setIsEditing(!!ans.result); setFormError("");
    if (ans.result) { setGrade(ans.result.grade); setFeedback(ans.result.feedback ?? ""); setVerdict(ans.result.status === "ACCEPTED" ? "ACCEPTED" : "REJECTED"); }
    else { setGrade(""); setFeedback(""); setVerdict("ACCEPTED"); }
    setDrawerOpen(true);
  }

  async function handleUpdatePassingScore() {
    setPsaving(true);
    try {
      await apiPatch(`/exams/${examId}/passing-score`, { passingScore: newPassingScore });
      setSuccessMsg("O'tish bali yangilandi!");
      setPassingScoreDialog(false);
      await load();
    } catch (err) { setFormError(formatApiError(err)); }
    finally { setPsaving(false); }
  }

  async function handleSave() {    if (grade === "" || Number(grade) < 0 || Number(grade) > 100) { setFormError("Ball 0–100 oraliqda bo'lishi kerak"); return; }
    if (!selected) return;
    setFormError(""); setSaving(true);
    try {
      if (isEditing && selected.result) {
        await apiPatch(`/exam-results/${selected.result.id}`, { grade: Number(grade), feedback: feedback || undefined, status: verdict });
        setSuccessMsg("Baho yangilandi!");
      } else {
        await apiPost("/exam-results", { examAnswerId: selected.id, grade: Number(grade), feedback: feedback || undefined, status: verdict });
        setSuccessMsg("Baho qo'yildi!");
      }
      setDrawerOpen(false); await load();
    } catch (err) { setFormError(formatApiError(err)); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingState />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!exam) return <Alert severity="error">Imtihon topilmadi</Alert>;

  const total    = exam.answers.length;
  const pending  = exam.answers.filter(a => a.status === "PENDING").length;
  const accepted = exam.answers.filter(a => a.status === "ACCEPTED").length;
  const rejected = exam.answers.filter(a => a.status === "REJECTED").length;
  const passed   = exam.answers.filter(a => a.result?.isPassed).length;

  return (
    <div className="space-y-4">
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <Button startIcon={<ArrowBackRounded />} size="small" onClick={() => router.push(`/groups/${groupId}`)}>Orqaga</Button>
          <Typography variant="h5" fontWeight={700}>{exam.title}</Typography>
        </Box>
        <Box className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outlined" size="small" onClick={() => { setNewPassingScore(exam.passingScore); setPassingScoreDialog(true); }}>
              O'tish balini o'zgartirish
            </Button>
          )}
          <Chip label={`O'tish bali: ${exam.passingScore}`} sx={{ bgcolor: "#FEF3C7", color: "#D97706", fontWeight: 700 }} />
        </Box>
      </Box>

      {/* Imtihon ma'lumoti */}
      <Paper className="p-4">
        <Box className="flex flex-wrap gap-4 justify-between">
          <Box>
            {exam.description && <Typography variant="body2" color="text.secondary">{exam.description}</Typography>}
            {exam.lesson && <Typography variant="body2" className="mt-1">Dars: <strong>{exam.lesson.topic}</strong></Typography>}
            {exam.dueDate && (
              <Typography variant="body2" color="text.secondary" className="mt-1">
                Muddat: {new Date(exam.dueDate).toLocaleString("uz-UZ")}
              </Typography>
            )}
            {exam.fileUrl && (
              <Box component="a" href={`${API_URL}${exam.fileUrl}`} target="_blank"
                className="mt-2 flex items-center gap-2 w-fit"
                sx={{ color: "#2563eb", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                <InsertDriveFileRounded fontSize="small" sx={{ color: "#F5C400" }} />
                <Typography variant="body2">Imtihon fayli</Typography>
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {new Date(exam.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}
          </Typography>
        </Box>

        <Divider className="my-3" />
        <Box className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Jami",        value: total,    bg: "#F9FAFB", color: "#111827" },
            { label: "Kutilmoqda",  value: pending,  bg: "#FEF3C7", color: "#D97706" },
            { label: "Qabul",       value: accepted, bg: "#F0FDF4", color: "#16a34a" },
            { label: "Rad",         value: rejected, bg: "#FEF2F2", color: "#ef4444" },
            { label: "O'tdi",       value: passed,   bg: "#EFF6FF", color: "#2563eb" },
          ].map(s => (
            <Box key={s.label} sx={{ bgcolor: s.bg, borderRadius: 2, p: 2, textAlign: "center" }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Javoblar jadvali */}
      <Paper className="overflow-hidden">
        <Box className="px-4 py-3 border-b">
          <Typography variant="subtitle1" fontWeight={700}>Talabalar javoblari</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
              <TableCell className="!font-semibold" width={40}>#</TableCell>
              <TableCell className="!font-semibold">Talaba</TableCell>
              <TableCell className="!font-semibold">Fayl</TableCell>
              <TableCell className="!font-semibold">Izoh</TableCell>
              <TableCell className="!font-semibold">Holat</TableCell>
              <TableCell align="center" className="!font-semibold">Ball</TableCell>
              <TableCell className="!font-semibold">Bonus</TableCell>
              <TableCell className="!font-semibold">Topshirilgan</TableCell>
              <TableCell width={140}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exam.answers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  Hali hech kim topshirmagan
                </TableCell>
              </TableRow>
            ) : exam.answers.map((ans, i) => {
              const cfg = STATUS_CFG[ans.status] ?? STATUS_CFG.PENDING;
              return (
                <TableRow key={ans.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#F5C400", color: "#111827", fontSize: 13, fontWeight: 700 }}>
                        {ans.student.firstName[0]}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {ans.student.firstName} {ans.student.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {ans.fileUrl ? (
                      <Box component="a" href={`${API_URL}${ans.fileUrl}`} target="_blank"
                        className="flex items-center gap-1"
                        sx={{ color: "#2563eb", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                        <InsertDriveFileRounded fontSize="small" />
                        <Typography variant="caption">{ans.fileUrl.split("/").pop()}</Typography>
                      </Box>
                    ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ans.comment || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={cfg.label} size="small"
                      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: 12 }} />
                  </TableCell>
                  <TableCell align="center">
                    {ans.result
                      ? <Typography variant="body2" fontWeight={700} sx={{ color: ans.result.isPassed ? "#16a34a" : "#ef4444" }}>{ans.result.grade}</Typography>
                      : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </TableCell>
                  <TableCell>
                    {ans.result?.isPassed
                      ? <Box className="flex items-center gap-1"><EmojiEventsRounded fontSize="small" sx={{ color: "#F5C400" }} /><Typography variant="caption" fontWeight={700}>+{ans.result.bonusPoints}</Typography></Box>
                      : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(ans.createdAt).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant={ans.result ? "outlined" : "contained"}
                      startIcon={ans.result ? <EditRounded fontSize="small" /> : <CheckCircleRounded fontSize="small" />}
                      onClick={() => openDrawer(ans)}
                      sx={ans.result ? {} : { bgcolor: "#F5C400", color: "#111827", "&:hover": { bgcolor: "#e6b800" } }}>
                      {ans.result ? "Tahrirlash" : "Baholash"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Baholash Drawer */}
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={isEditing ? "Bahoni tahrirlash" : "Imtihonni baholash"}
        subtitle={selected ? `${selected.student.firstName} ${selected.student.lastName}` : ""}
        onSave={handleSave} saving={saving} saveLabel={isEditing ? "Yangilash" : "Saqlash"}>
        {formError && <Alert severity="error">{formError}</Alert>}

        {selected && (
          <Box sx={{ bgcolor: "#F9FAFB", borderRadius: 2, p: 2 }}>
            <Typography variant="caption" color="text.secondary" className="block mb-1">Topshirilgan fayl</Typography>
            {selected.fileUrl ? (
              <Box component="a" href={`${API_URL}${selected.fileUrl}`} target="_blank"
                className="flex items-center gap-2"
                sx={{ color: "#2563eb", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
                <InsertDriveFileRounded sx={{ color: "#F5C400" }} />
                <Typography variant="body2" fontWeight={500}>{selected.fileUrl.split("/").pop()}</Typography>
              </Box>
            ) : <Typography variant="body2" color="text.secondary">Fayl yuklanmagan</Typography>}
            {selected.comment && (
              <>
                <Typography variant="caption" color="text.secondary" className="block mt-2 mb-1">Izoh</Typography>
                <Typography variant="body2">{selected.comment}</Typography>
              </>
            )}
          </Box>
        )}

        <Box sx={{ bgcolor: "#EFF6FF", borderRadius: 2, p: 2 }}>
          <Typography variant="caption" color="#2563eb" fontWeight={600}>
            O'tish bali: {exam.passingScore} — {Number(grade) >= exam.passingScore ? "✅ O'tadi" : "❌ O'tmaydi"}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight={600} className="mb-2">Qaror *</Typography>
          <ToggleButtonGroup value={verdict} exclusive onChange={(_, val) => val && setVerdict(val)} fullWidth size="small">
            <ToggleButton value="ACCEPTED" sx={{ "&.Mui-selected": { bgcolor: "#F0FDF4", color: "#16a34a", borderColor: "#16a34a" } }}>
              <CheckCircleRounded fontSize="small" className="mr-1" />Qabul qilish
            </ToggleButton>
            <ToggleButton value="REJECTED" sx={{ "&.Mui-selected": { bgcolor: "#FEF2F2", color: "#ef4444", borderColor: "#ef4444" } }}>
              <CancelRounded fontSize="small" className="mr-1" />Qaytarish
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField label="Ball (0–100) *" type="number" value={grade}
          onChange={(e) => setGrade(e.target.value === "" ? "" : Math.min(100, Math.max(0, Number(e.target.value))))}
          fullWidth inputProps={{ min: 0, max: 100 }} />

        <TextField label="Izoh (ixtiyoriy)" value={feedback} onChange={(e) => setFeedback(e.target.value)}
          fullWidth multiline rows={3} placeholder="Talabaga izoh..." />
      </SideDrawer>

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />

      {/* O'tish bali dialog */}
      {passingScoreDialog && (
        <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.4)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setPassingScoreDialog(false)}>
          <Paper sx={{ p: 4, width: 360, borderRadius: 3 }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" fontWeight={700} className="mb-4">O'tish balini belgilash</Typography>
            {formError && <Alert severity="error" className="mb-3">{formError}</Alert>}
            <TextField label="O'tish bali (0–100)" type="number" fullWidth value={newPassingScore}
              onChange={e => setNewPassingScore(Math.min(100, Math.max(0, Number(e.target.value))))}
              inputProps={{ min: 0, max: 100 }} />
            <Box className="flex justify-end gap-2 mt-4">
              <Button variant="outlined" onClick={() => setPassingScoreDialog(false)}>Bekor qilish</Button>
              <Button variant="contained" disabled={psaving} onClick={handleUpdatePassingScore}
                sx={{ bgcolor: "#F5C400", color: "#111827", "&:hover": { bgcolor: "#e6b800" } }}>
                {psaving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </div>
  );
}
