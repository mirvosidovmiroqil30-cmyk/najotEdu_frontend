"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CalendarTodayRounded from "@mui/icons-material/CalendarTodayRounded";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { LoadingState, SuccessSnackbar } from "@/components/ui";
import type { GroupStudent, Lesson } from "@/lib/types";

type AttendanceRecord = {
  id: number;
  studentId: number;
  isPresent: boolean;
  student: { id: number; firstName: string; lastName: string };
};

export default function TeacherLessonDetailPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = use(params);
  const groupId = Number(id);
  const lessonIdNum = Number(lessonId);
  const router = useRouter();
  const { user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0); // 0=Assistant, 1=Teacher

  // Yo'qlama va mavzu
  const [topicType, setTopicType] = useState<"plan" | "other">("plan");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [lessonData, studentsData, attendanceData] = await Promise.all([
          apiGet<Lesson>(`/lessons/${lessonIdNum}`),
          apiGet<GroupStudent[]>(`/groups/${groupId}/students`),
          apiGet<AttendanceRecord[]>(`/attendance?groupId=${groupId}`).catch(() => []),
        ]);
        setLesson(lessonData);
        setStudents(Array.isArray(studentsData) ? studentsData : []);

        // Mavjud yo'qlama
        const existing = Array.isArray(attendanceData) ? attendanceData : [];
        setExistingAttendance(existing);

        // Default mavzu
        setTopic(lessonData.topic ?? "");
        setDescription(lessonData.description ?? "");

        // Default — hammani present qilamiz
        const defaultAttendance: Record<number, boolean> = {};
        (Array.isArray(studentsData) ? studentsData : []).forEach((s) => {
          const rec = existing.find((a) => a.studentId === s.studentId);
          defaultAttendance[s.studentId] = rec ? rec.isPresent : true;
        });
        setAttendance(defaultAttendance);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [groupId, lessonIdNum]);

  async function save() {
    if (!topic.trim()) { setError("Mavzu kiritilishi shart"); return; }
    setError(""); setSaving(true);
    try {
      // Mavzuni yangilash
      await apiPatch(`/lessons/${lessonIdNum}`, {
        topic: topicType === "plan" ? lesson?.topic : topic,
        description: description || undefined,
      });

      // Yo'qlama saqlash
      await apiPost("/attendance", {
        groupId,
        students: students.map((s) => ({
          studentId: s.studentId,
          isPresent: attendance[s.studentId] ?? true,
        })),
      });

      setSuccessMsg("Dars va yo'qlama muvaffaqiyatli saqlandi!");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  const today = new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Box className="flex items-center gap-2">
        <Button startIcon={<ArrowBackRounded />} size="small"
          onClick={() => router.push(`/teacher/groups/${groupId}`)}>
          Orqaga
        </Button>
        <Typography variant="h6" fontWeight={700}>{lesson?.topic ?? "Dars"}</Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Assistant / Teacher tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Assistant" />
          <Tab label="Teacher" />
        </Tabs>
      </Box>

      {/* Ma'lumot bloki */}
      <Paper className="p-4">
        <Typography variant="subtitle2" fontWeight={700} className="mb-3">Ma'lumot</Typography>
        <Box className="flex items-center gap-3">
          <Avatar sx={{ width: 44, height: 44, bgcolor: "#F5C400", color: "#111827", fontSize: 16 }}>
            {user?.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {tab === 0 ? "Assistant" : "Teacher"}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Typography>
          </Box>
          <Box className="ml-auto text-right">
            <Box className="flex items-center gap-1">
              <CalendarTodayRounded fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">{today}</Typography>
            </Box>
            <Chip
              label={existingAttendance.length > 0 ? "Davomat belgilangan" : "Dars o'tilmagan"}
              size="small"
              color={existingAttendance.length > 0 ? "success" : "default"}
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Yo'qlama va mavzu kiritish */}
      <Paper className="p-4 space-y-4">
        <Typography variant="subtitle2" fontWeight={700}>Yo'qlama va mavzu kiritish</Typography>

        {/* Radio — O'tish reja bo'yicha / Boshqa */}
        <RadioGroup
          row
          value={topicType}
          onChange={(e) => setTopicType(e.target.value as "plan" | "other")}
        >
          <FormControlLabel
            value="plan"
            control={<Radio size="small" />}
            label="O'tish reja bo'yicha"
          />
          <FormControlLabel
            value="other"
            control={<Radio size="small" color="warning" />}
            label={<Typography variant="body2" color="warning.main">Boshqa</Typography>}
          />
        </RadioGroup>

        {/* Mavzu */}
        <TextField
          label="* Mavzu"
          value={topicType === "plan" ? (lesson?.topic ?? "") : topic}
          onChange={(e) => topicType === "other" && setTopic(e.target.value)}
          disabled={topicType === "plan"}
          fullWidth
        />

        {/* Tavsif */}
        <TextField
          label="Tavsif (ixtiyoriy)"
          placeholder="Dars haqida qo'shimcha ma'lumot..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={2}
        />

        {/* Yo'qlama jadvali */}
        <Box>
          <Box className="flex items-center justify-between mb-2">
            <Typography variant="subtitle2" fontWeight={600}>
              O'quvchilar ({presentCount}/{students.length} kelgan)
            </Typography>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold">#</TableCell>
                <TableCell className="!font-semibold">O'quvchi ismi</TableCell>
                <TableCell align="center" className="!font-semibold">Keldi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3, color: "text.secondary" }}>
                    Talabalar topilmadi
                  </TableCell>
                </TableRow>
              ) : students.map((s, i) => (
                <TableRow key={s.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-2">
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "#F5C400", color: "#111827" }}>
                        {s.student.firstName[0]}
                      </Avatar>
                      <Typography variant="body2">
                        {s.student.firstName} {s.student.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={attendance[s.studentId] ?? true}
                      onChange={(e) => setAttendance({ ...attendance, [s.studentId]: e.target.checked })}
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Saqlash */}
        <Box className="flex justify-end pt-2">
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            sx={{ minWidth: 120 }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </Box>
      </Paper>

      <SuccessSnackbar open={Boolean(successMsg)} message={successMsg} onClose={() => setSuccessMsg("")} />
    </div>
  );
}
