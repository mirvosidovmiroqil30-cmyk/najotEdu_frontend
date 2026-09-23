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
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { LoadingState, SuccessSnackbar } from "@/components/ui";
import type { GroupStudent, Lesson } from "@/lib/types";

type DateInfo = {
  date: string;
  lesson: Lesson | null;
  hasAttendance: boolean;
  attendanceCount: number;
};

export default function TeacherLessonDatePage({
  params,
}: {
  params: Promise<{ id: string; date: string }>;
}) {
  const { id, date } = use(params);
  const groupId = Number(id);
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState(0);
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Form
  const [topicType, setTopicType] = useState<"plan" | "other">("other");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const [info, studentsData] = await Promise.all([
          apiGet<DateInfo>(`/lessons/by-date?groupId=${groupId}&date=${date}`),
          apiGet<GroupStudent[]>(`/groups/${groupId}/students`),
        ]);

        setDateInfo(info);
        const studs = Array.isArray(studentsData) ? studentsData : [];
        setStudents(studs);

        // Agar dars mavjud bo'lsa mavzuni to'ldirish
        if (info.lesson) {
          setTopic(info.lesson.topic);
          setDescription(info.lesson.description ?? "");
          setTopicType("plan");
        }

        // Default attendance — hammasi present
        const def: Record<number, boolean> = {};
        studs.forEach((s) => { def[s.studentId] = true; });
        setAttendance(def);
      } catch (err) {
        setError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [groupId, date]);

  async function save() {
    if (dateInfo?.hasAttendance) return; // Yo'qlama allaqachon saqlangan — bloklash
    if (!topic.trim()) { setError("Mavzu kiritilishi shart"); return; }
    setError(""); setSaving(true);
    try {
      if (dateInfo?.lesson) {
        // Mavjud darsni yangilash
        await apiPatch(`/lessons/${dateInfo.lesson.id}`, { topic, description: description || undefined });
      } else {
        // Yangi dars yaratish
        await apiPost("/lessons", {
          groupId,
          teacherId: user?.id,
          topic,
          description: description || undefined,
        });
      }

      // Yo'qlama saqlash — faqat bir marta (hasAttendance bo'lmasa)
      if (!dateInfo?.hasAttendance) {
        await apiPost("/attendance", {
          groupId,
          students: students.map((s) => ({
            studentId: s.studentId,
            isPresent: attendance[s.studentId] ?? true,
          })),
        });
      }

      setSuccessMsg("Dars va yo'qlama muvaffaqiyatli saqlandi!");
      // DateInfo ni yangilash
      const updated = await apiGet<DateInfo>(`/lessons/by-date?groupId=${groupId}&date=${date}`);
      setDateInfo(updated);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  const displayDate = new Date(date).toLocaleDateString("uz-UZ", {
    day: "numeric", month: "long", year: "numeric",
  });

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const alreadySaved = dateInfo?.hasAttendance;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Box className="flex items-center gap-2">
        <Button
          startIcon={<ArrowBackRounded />}
          size="small"
          onClick={() => router.push(`/teacher/groups/${groupId}`)}
        >
          Orqaga
        </Button>
        <Typography variant="h6" fontWeight={700}>
          {displayDate}
        </Typography>
        {alreadySaved && (
          <Chip
            icon={<CheckCircleRounded fontSize="small" />}
            label="Yo'qlama belgilangan"
            size="small"
            color="success"
            variant="outlined"
          />
        )}
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
        <Typography variant="subtitle2" fontWeight={700} className="mb-3">
          Ma'lumot
        </Typography>
        <Box className="flex items-center gap-3">
          <Avatar
            sx={{ width: 44, height: 44, bgcolor: "#F5C400", color: "#111827", fontSize: 16 }}
          >
            {user?.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Teacher
            </Typography>
          </Box>
          <Box className="ml-auto flex flex-col items-end gap-1">
            <Box className="flex items-center gap-1">
              <CalendarTodayRounded fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {displayDate}
              </Typography>
            </Box>
            <Chip
              label={alreadySaved ? "Davomat belgilangan" : "Dars o'tilmagan"}
              size="small"
              color={alreadySaved ? "success" : "default"}
            />
          </Box>
        </Box>
      </Paper>

      {/* Yo'qlama va mavzu */}
      <Paper className="p-4 space-y-4">
        <Typography variant="subtitle2" fontWeight={700}>
          Yo'qlama va mavzu kiritish
        </Typography>

        {/* Radio */}
        <RadioGroup
          row
          value={topicType}
          onChange={(e) => setTopicType(e.target.value as "plan" | "other")}
        >
          <FormControlLabel
            value="plan"
            control={<Radio size="small" />}
            label="O'tish reja bo'yicha"
            disabled={alreadySaved}
          />
          <FormControlLabel
            value="other"
            control={<Radio size="small" color="warning" />}
            label={
              <Typography variant="body2" color="warning.main">
                Boshqa
              </Typography>
            }
            disabled={alreadySaved}
          />
        </RadioGroup>

        {/* Mavzu */}
        <TextField
          label="* Mavzu"
          placeholder="Mavzuni kiriting..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={alreadySaved}
          fullWidth
        />

        {/* Tavsif */}
        <TextField
          label="Tavsif (ixtiyoriy)"
          placeholder="Dars haqida qo'shimcha ma'lumot..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={alreadySaved}
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
            {alreadySaved && (
              <Typography variant="caption" color="success.main" fontWeight={600}>
                ✓ Yo'qlama saqlangan
              </Typography>
            )}
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                <TableCell className="!font-semibold" width={40}>#</TableCell>
                <TableCell className="!font-semibold">O'quvchi ismi</TableCell>
                <TableCell align="right" className="!font-semibold">Keldi</TableCell>
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
                      <Avatar
                        sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "#F5C400", color: "#111827" }}
                      >
                        {s.student.firstName[0]}
                      </Avatar>
                      <Typography variant="body2">
                        {s.student.firstName} {s.student.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Checkbox
                      size="small"
                      checked={attendance[s.studentId] ?? true}
                      onChange={(e) =>
                        !alreadySaved &&
                        setAttendance({ ...attendance, [s.studentId]: e.target.checked })
                      }
                      disabled={alreadySaved}
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Saqlash */}
        {!alreadySaved && (
          <Box className="flex justify-end pt-2">
            <Button
              variant="contained"
              onClick={save}
              disabled={saving}
              sx={{ minWidth: 120, bgcolor: "#F5C400", "&:hover": { bgcolor: "#e6b800" } }}
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </Box>
        )}
      </Paper>

      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
    </div>
  );
}
