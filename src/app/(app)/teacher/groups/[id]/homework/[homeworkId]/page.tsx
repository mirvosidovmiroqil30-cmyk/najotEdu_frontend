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
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import AssignmentRounded from "@mui/icons-material/AssignmentRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CancelRounded from "@mui/icons-material/CancelRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import PendingRounded from "@mui/icons-material/PendingRounded";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { LoadingState, SideDrawer, SuccessSnackbar } from "@/components/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type Homework = {
  id: number;
  groupId: number;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  createdAt: string;
  lesson?: { id: number; topic: string } | null;
  group: { id: number; name: string };
};

type HomeworkAnswer = {
  id: number;
  homeworkId: number;
  studentId: number;
  title: string;
  fileUrl?: string | null;
  status: "PENDING" | "CHECKED" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  student: { id: number; firstName: string; lastName: string };
  result?: {
    id: number;
    grade: number;
    feedback?: string | null;
    status: string;
    teacherId: number;
  } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:  { label: "Kutilmoqda", color: "#D97706", bg: "#FEF3C7", icon: <PendingRounded fontSize="small" /> },
  CHECKED:  { label: "Tekshirildi", color: "#2563eb", bg: "#EFF6FF", icon: <AssignmentRounded fontSize="small" /> },
  ACCEPTED: { label: "Qabul qilindi", color: "#16a34a", bg: "#F0FDF4", icon: <CheckCircleRounded fontSize="small" /> },
  REJECTED: { label: "Rad etildi",   color: "#ef4444", bg: "#FEF2F2", icon: <CancelRounded fontSize="small" /> },
};

export default function TeacherHomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string; homeworkId: string }>;
}) {
  const { id, homeworkId } = use(params);
  const groupId = Number(id);
  const hwId = Number(homeworkId);
  const router = useRouter();
  const { user } = useAuth();

  const [homework, setHomework] = useState<Homework | null>(null);
  const [answers, setAnswers] = useState<HomeworkAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Drawer holati
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<HomeworkAnswer | null>(null);
  const [isEditing, setIsEditing] = useState(false); // yangi baholash yoki tahrirlash

  // Forma
  const [grade, setGrade] = useState<number | "">("");
  const [feedback, setFeedback] = useState("");
  const [verdict, setVerdict] = useState<"ACCEPTED" | "REJECTED">("ACCEPTED");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [hwData, answersData] = await Promise.all([
        apiGet<Homework>(`/homeworks/${hwId}`),
        apiGet<HomeworkAnswer[]>(`/homework-answers?homeworkId=${hwId}`),
      ]);
      setHomework(hwData);
      setAnswers(Array.isArray(answersData) ? answersData : []);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [hwId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openGradeDrawer(answer: HomeworkAnswer) {
    setSelected(answer);
    setIsEditing(!!answer.result);

    if (answer.result) {
      setGrade(answer.result.grade);
      setFeedback(answer.result.feedback ?? "");
      setVerdict(answer.result.status === "ACCEPTED" ? "ACCEPTED" : "REJECTED");
    } else {
      setGrade("");
      setFeedback("");
      setVerdict("ACCEPTED");
    }

    setFormError("");
    setDrawerOpen(true);
  }

  async function handleSave() {
    if (grade === "" || Number(grade) < 0 || Number(grade) > 100) {
      setFormError("Ball 0 dan 100 gacha bo'lishi kerak");
      return;
    }
    if (!selected) return;

    setFormError("");
    setSaving(true);

    try {
      if (isEditing && selected.result) {
        // Tahrirlash — PATCH
        await apiPatch(`/homework-results/${selected.result.id}`, {
          grade: Number(grade),
          feedback: feedback || undefined,
          status: verdict,
        });
        setSuccessMsg("Baho yangilandi!");
      } else {
        // Yangi baholash — POST
        await apiPost("/homework-results", {
          homeworkAnswerId: selected.id,
          grade: Number(grade),
          feedback: feedback || undefined,
          status: verdict,
        });
        setSuccessMsg("Baho qo'yildi!");
      }

      setDrawerOpen(false);
      await loadData();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!homework) return <Alert severity="error">Uyga vazifa topilmadi</Alert>;

  // Statistika
  const total    = answers.length;
  const pending  = answers.filter((a) => a.status === "PENDING").length;
  const accepted = answers.filter((a) => a.status === "ACCEPTED").length;
  const rejected = answers.filter((a) => a.status === "REJECTED").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <Button
            startIcon={<ArrowBackRounded />}
            size="small"
            onClick={() => router.push(`/teacher/groups/${groupId}`)}
          >
            Orqaga
          </Button>
          <Typography variant="h5" fontWeight={700}>
            {homework.title}
          </Typography>
        </Box>
      </Box>

      {/* Uy vazifasi ma'lumotlari */}
      <Paper className="p-4">
        <Box className="flex flex-wrap items-start justify-between gap-3">
          <Box className="flex-1">
            <Typography variant="subtitle2" color="text.secondary">
              Guruh
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {homework.group?.name ?? "—"}
            </Typography>

            {homework.lesson && (
              <>
                <Typography variant="subtitle2" color="text.secondary" className="mt-2">
                  Dars
                </Typography>
                <Typography variant="body2">{homework.lesson.topic}</Typography>
              </>
            )}

            {homework.description && (
              <>
                <Typography variant="subtitle2" color="text.secondary" className="mt-2">
                  Tavsif
                </Typography>
                <Typography variant="body2">{homework.description}</Typography>
              </>
            )}

            {homework.fileUrl && (
              <Box className="mt-3 flex items-center gap-2 rounded-lg border p-2" sx={{ width: "fit-content" }}>
                <InsertDriveFileRounded sx={{ color: "#F5C400" }} />
                <Typography
                  variant="body2"
                  component="a"
                  href={`${API_URL}${homework.fileUrl}`}
                  target="_blank"
                  color="primary"
                >
                  {homework.fileUrl.split("/").pop()}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography variant="caption" color="text.secondary">
            {new Date(homework.createdAt).toLocaleDateString("uz-UZ", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </Typography>
        </Box>

        {/* Statistika kartochkalari */}
        <Divider className="my-4" />
        <Box className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Jami topshirgan", value: total,    bg: "#F9FAFB",  color: "#111827" },
            { label: "Kutilmoqda",      value: pending,  bg: "#FEF3C7",  color: "#D97706" },
            { label: "Qabul qilindi",   value: accepted, bg: "#F0FDF4",  color: "#16a34a" },
            { label: "Rad etildi",      value: rejected, bg: "#FEF2F2",  color: "#ef4444" },
          ].map((s) => (
            <Box
              key={s.label}
              sx={{ bgcolor: s.bg, borderRadius: 2, p: 2, textAlign: "center" }}
            >
              <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Javoblar jadvali */}
      <Paper className="overflow-hidden">
        <Box className="px-4 py-3 border-b">
          <Typography variant="subtitle1" fontWeight={700}>
            Talabalar javoblari
          </Typography>
        </Box>

        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#F9FAFB" }}>
              <TableCell className="!font-semibold" width={40}>#</TableCell>
              <TableCell className="!font-semibold">Talaba</TableCell>
              <TableCell className="!font-semibold">Fayl</TableCell>
              <TableCell className="!font-semibold">Izoh</TableCell>
              <TableCell className="!font-semibold">Holat</TableCell>
              <TableCell className="!font-semibold" align="center">Ball</TableCell>
              <TableCell className="!font-semibold">Topshirilgan</TableCell>
              <TableCell className="!font-semibold" width={140}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {answers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  <AssignmentRounded sx={{ fontSize: 40, color: "#E5E7EB", mb: 1, display: "block", mx: "auto" }} />
                  Hali hech kim topshirmagan
                </TableCell>
              </TableRow>
            ) : answers.map((ans, i) => {
              const cfg = STATUS_CONFIG[ans.status] ?? STATUS_CONFIG.PENDING;
              return (
                <TableRow key={ans.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: "#F5C400", color: "#111827", fontSize: 13, fontWeight: 700 }}>
                        {ans.student.firstName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {ans.student.firstName} {ans.student.lastName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {ans.fileUrl ? (
                      <Box
                        component="a"
                        href={`${API_URL}${ans.fileUrl}`}
                        target="_blank"
                        className="flex items-center gap-1"
                        sx={{ color: "#2563eb", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                      >
                        <InsertDriveFileRounded fontSize="small" />
                        <Typography variant="caption">
                          {ans.fileUrl.split("/").pop()}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={ans.title !== "Topshirildi" ? ans.title : ""}
                    >
                      {ans.title !== "Topshirildi" ? ans.title : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={cfg.icon as any}
                      label={cfg.label}
                      size="small"
                      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: 12 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {ans.result ? (
                      <Typography variant="body2" fontWeight={700} sx={{ color: ans.result.grade >= 60 ? "#16a34a" : "#ef4444" }}>
                        {ans.result.grade}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(ans.createdAt).toLocaleDateString("uz-UZ", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant={ans.result ? "outlined" : "contained"}
                      startIcon={ans.result ? <EditRounded fontSize="small" /> : <CheckCircleRounded fontSize="small" />}
                      onClick={() => openGradeDrawer(ans)}
                      sx={ans.result ? {} : {
                        bgcolor: "#F5C400", color: "#111827",
                        "&:hover": { bgcolor: "#e6b800" },
                      }}
                    >
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
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={isEditing ? "Bahoni tahrirlash" : "Vazifani baholash"}
        subtitle={
          selected
            ? `${selected.student.firstName} ${selected.student.lastName}`
            : ""
        }
        onSave={handleSave}
        saving={saving}
        saveLabel={isEditing ? "Yangilash" : "Saqlash"}
      >
        {formError && <Alert severity="error">{formError}</Alert>}

        {/* Talabaning javobi */}
        {selected && (
          <Box sx={{ bgcolor: "#F9FAFB", borderRadius: 2, p: 2 }}>
            <Typography variant="caption" color="text.secondary" className="block mb-1">
              Topshirgan fayl
            </Typography>
            {selected.fileUrl ? (
              <Box
                component="a"
                href={`${API_URL}${selected.fileUrl}`}
                target="_blank"
                className="flex items-center gap-2"
                sx={{ color: "#2563eb", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
              >
                <InsertDriveFileRounded sx={{ color: "#F5C400" }} />
                <Typography variant="body2" fontWeight={500}>
                  {selected.fileUrl.split("/").pop()}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">Fayl yuklanmagan</Typography>
            )}

            {selected.title && selected.title !== "Topshirildi" && (
              <>
                <Typography variant="caption" color="text.secondary" className="block mt-2 mb-1">
                  Izoh
                </Typography>
                <Typography variant="body2">{selected.title}</Typography>
              </>
            )}
          </Box>
        )}

        {/* Qaror: qabul / rad */}
        <Box>
          <Typography variant="body2" fontWeight={600} className="mb-2">
            Qaror *
          </Typography>
          <ToggleButtonGroup
            value={verdict}
            exclusive
            onChange={(_, val) => val && setVerdict(val)}
            fullWidth
            size="small"
          >
            <ToggleButton
              value="ACCEPTED"
              sx={{
                "&.Mui-selected": { bgcolor: "#F0FDF4", color: "#16a34a", borderColor: "#16a34a" },
              }}
            >
              <CheckCircleRounded fontSize="small" className="mr-1" />
              Qabul qilish
            </ToggleButton>
            <ToggleButton
              value="REJECTED"
              sx={{
                "&.Mui-selected": { bgcolor: "#FEF2F2", color: "#ef4444", borderColor: "#ef4444" },
              }}
            >
              <CancelRounded fontSize="small" className="mr-1" />
              Qaytarish
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Ball */}
        <TextField
          label="Ball (0–100) *"
          type="number"
          value={grade}
          onChange={(e) => {
            const v = e.target.value;
            setGrade(v === "" ? "" : Math.min(100, Math.max(0, Number(v))));
          }}
          fullWidth
          inputProps={{ min: 0, max: 100 }}
        />

        {/* Izoh */}
        <TextField
          label="Izoh (ixtiyoriy)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder="Talabaga izoh yozing..."
        />
      </SideDrawer>

      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
    </div>
  );
}
