"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import {
  DataTable,
  DeleteButton,
  LoadingState,
  PageHeader,
  SideDrawer,
  SuccessSnackbar,
} from "@/components/ui";
import type { Course, Group, GroupStatus, Room, User, WeekDay } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const WEEK_DAYS: WeekDay[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY",
  "FRIDAY", "SATURDAY", "SUNDAY",
];

const WEEK_DAYS_UZ: Record<WeekDay, string> = {
  MONDAY: "Dushanba", TUESDAY: "Seshanba", WEDNESDAY: "Chorshanba",
  THURSDAY: "Payshanba", FRIDAY: "Juma", SATURDAY: "Shanba", SUNDAY: "Yakshanba",
};

const empty = {
  name: "", description: "", courseId: 0, roomId: 0,
  startDate: "", startTime: "18:30", maxStudents: 15,
  weekDays: ["MONDAY", "WEDNESDAY", "FRIDAY"] as WeekDay[],
  status: "PLANNED" as GroupStatus,
  teacherIds: [] as number[],
};

export default function GroupsPage() {
  const { hasRole } = useAuth();
  const { data, loading, error, reload } = useApiList<Group>("/groups");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState(empty);

  // Drawer ochilganda yuklanadi
  const { data: courses } = useApiList<Course>(open ? "/courses" : null);
  const { data: rooms } = useApiList<Room>(open ? "/rooms" : null);
  const { data: teachers } = useApiList<User>(open ? "/users?role=TEACHER" : null);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [roomWarning, setRoomWarning] = useState("");
  const [checkingRoom, setCheckingRoom] = useState(false);
  const canManage = hasRole("SUPERADMIN", "ADMIN");

  function openCreate() {
    setEditing(null);
    setForm({ ...empty, courseId: courses?.[0]?.id ?? 0, roomId: rooms?.[0]?.id ?? 0 });
    setFormError("");
    setRoomWarning("");
    setOpen(true);
  }

  function openEdit(row: Group) {
    setEditing(row);
    setForm({
      name: row.name,
      description: row.description ?? "",
      courseId: row.courseId,
      roomId: row.roomId,
      startDate: row.startDate.slice(0, 10),
      startTime: row.startTime,
      maxStudents: row.maxStudents,
      weekDays: row.weekDays,
      status: row.status,
      teacherIds: [],
    });
    setFormError("");
    setRoomWarning("");
    setOpen(true);
  }

  function toggleTeacher(id: number) {
    setForm((prev) => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(id)
        ? prev.teacherIds.filter((t) => t !== id)
        : [...prev.teacherIds, id],
    }));
  }

  async function checkRoomAvailability(
    roomId: number,
    startDate: string,
    startTime: string,
    weekDays: string[],
  ) {
    if (!roomId || !startTime || !weekDays.length) return;
    setCheckingRoom(true);
    setRoomWarning("");
    try {
      const params = new URLSearchParams({
        startDate: startDate || new Date().toISOString(),
        startTime,
        weekDays: weekDays.join(","),
        ...(editing ? { excludeGroupId: String(editing.id) } : {}),
      });
      const res = await apiGet<{
        available: boolean;
        room: { name: string };
        conflicts: { name: string; startTime: string }[];
      }>(`/rooms/${roomId}/availability?${params}`);

      if (!res.available) {
        const names = res.conflicts.map((c) => c.name).join(", ");
        setRoomWarning(
          `⚠️ "${res.room.name}" xonasi bu vaqtda band! Ziddiyatli guruhlar: ${names}`,
        );
      }
    } catch {
      // silent
    } finally {
      setCheckingRoom(false);
    }
  }

  async function save() {
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        courseId: Number(form.courseId),
        roomId: Number(form.roomId),
        maxStudents: Number(form.maxStudents),
        startDate: new Date(form.startDate).toISOString(),
        teacherIds: form.teacherIds.length > 0 ? form.teacherIds : undefined,
      };

      if (editing) {
        const { teacherIds, ...editPayload } = payload;
        await apiPatch(`/groups/${editing.id}`, editPayload);
      } else {
        await apiPost("/groups", payload);
      }

      setSuccessMsg(editing ? "Guruh muvaffaqiyatli yangilandi!" : "Guruh muvaffaqiyatli yaratildi!");
      setOpen(false);
      await reload();
    } catch (err) {
      setFormError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Guruhlar"
        action={
          canManage ? (
            <Button variant="contained" onClick={openCreate}>
              Yangi guruh
            </Button>
          ) : null
        }
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? (
        <LoadingState />
      ) : (
        <DataTable
          rows={data}
          columns={[
            { key: "name", label: "Nomi" },
            { key: "course", label: "Kurs", render: (g) => g.course?.name ?? g.courseId },
            { key: "room", label: "Xona", render: (g) => g.room?.name ?? g.roomId },
            {
              key: "teachers", label: "O'qituvchi",
              render: (g) => {
                const ts = g.groupTeachers ?? [];
                if (!ts.length) return <Typography variant="caption" color="text.secondary">—</Typography>;
                return (
                  <Box className="flex gap-1">
                    {ts.slice(0, 2).map((gt) => (
                      <Avatar
                        key={gt.teacherId}
                        src={gt.teacher?.photo ? `${API_URL}${gt.teacher.photo}` : undefined}
                        sx={{ width: 26, height: 26, fontSize: 11, bgcolor: "#F5C400", color: "#111827" }}
                      >
                        {gt.teacher?.firstName?.[0]}
                      </Avatar>
                    ))}
                    {ts.length > 2 && (
                      <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                        +{ts.length - 2}
                      </Typography>
                    )}
                  </Box>
                );
              },
            },
            { key: "startTime", label: "Vaqt" },
            { key: "status", label: "Holat" },
            { key: "students", label: "Talabalar", render: (g) => g._count?.studentGroups ?? 0 },
          ]}
          actions={(row) => (
            <>
              <Button size="small" component={Link} href={`/groups/${row.id}`}>
                Ochish
              </Button>
              {canManage && (
                <>
                  <Button size="small" onClick={() => openEdit(row)}>
                    Tahrirlash
                  </Button>
                  <DeleteButton
                    message="Haqiqatan ham bu guruhni o'chirmoqchimisiz?"
                    onClick={async () => {
                      await apiDelete(`/groups/${row.id}`);
                      await reload();
                    }}
                  />
                </>
              )}
            </>
          )}
        />
      )}

      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Guruhni tahrirlash" : "Yangi guruh"}
        subtitle="Bu yerda guruh ma'lumotlarini kiriting."
        onSave={save}
        saving={saving}
      >
        {formError ? <Alert severity="error">{formError}</Alert> : null}

        <TextField
          label="Nomi"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          fullWidth
        />
        <TextField
          label="Tavsif"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          fullWidth
        />
        <TextField
          select label="Kurs" value={form.courseId}
          onChange={(e) => setForm({ ...form, courseId: Number(e.target.value) })}
          fullWidth
        >
          {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField
          select label="Xona" value={form.roomId}
          onChange={(e) => {
            const roomId = Number(e.target.value);
            setForm({ ...form, roomId });
            setRoomWarning("");
            if (roomId && form.startTime && form.weekDays.length) {
              checkRoomAvailability(roomId, form.startDate, form.startTime, form.weekDays);
            }
          }}
          fullWidth
        >
          {rooms.map((r) => <MenuItem key={r.id} value={r.id}>{r.name} (sig'im: {r.capacity})</MenuItem>)}
        </TextField>

        {/* Xona bandlik ogohlantirishi */}
        {checkingRoom && (
          <Typography variant="caption" color="text.secondary">
            Xona bandligi tekshirilmoqda...
          </Typography>
        )}
        {roomWarning && (
          <Alert severity="warning" icon={<WarningAmberRounded />}>
            {roomWarning}
          </Alert>
        )}
        <TextField
          type="date" label="Boshlanish sanasi"
          slotProps={{ inputLabel: { shrink: true } }}
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          fullWidth
        />
        <TextField
          label="Vaqt (HH:mm)" value={form.startTime}
          onChange={(e) => {
            const startTime = e.target.value;
            setForm({ ...form, startTime });
            setRoomWarning("");
            if (form.roomId && startTime && form.weekDays.length) {
              checkRoomAvailability(form.roomId, form.startDate, startTime, form.weekDays);
            }
          }}
          fullWidth
        />
        <TextField
          type="number" label="Maks. talabalar" value={form.maxStudents}
          onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })}
          fullWidth
        />

        {/* Hafta kunlari */}
        <Box>
          <FormLabel sx={{ fontWeight: 600, color: "text.primary", mb: 0.5, display: "block" }}>
            Dars kunlari
          </FormLabel>
          <div className="grid grid-cols-2">
            {WEEK_DAYS.map((day) => (
              <FormControlLabel
                key={day}
                control={
                  <Checkbox
                    size="small"
                    checked={form.weekDays.includes(day)}
                    onChange={(e) => {
                      const newDays = e.target.checked
                        ? [...form.weekDays, day]
                        : form.weekDays.filter((d) => d !== day);
                      setForm({ ...form, weekDays: newDays });
                      setRoomWarning("");
                      if (form.roomId && form.startTime && newDays.length) {
                        checkRoomAvailability(form.roomId, form.startDate, form.startTime, newDays);
                      }
                    }}
                  />
                }
                label={<Typography variant="body2">{WEEK_DAYS_UZ[day]}</Typography>}
              />
            ))}
          </div>
        </Box>

        <TextField
          select label="Holat" value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as GroupStatus })}
          fullWidth
        >
          {["PLANNED", "ACTIVE", "COMPLETED", "INACTIVE"].map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </TextField>

        {/* O'qituvchi biriktirish — faqat yangi yaratishda */}
        {!editing && teachers && teachers.length > 0 && (
          <Box>
            <FormLabel sx={{ fontWeight: 600, color: "text.primary", mb: 1, display: "block" }}>
              O'qituvchilarni biriktirish (ixtiyoriy)
            </FormLabel>
            <FormGroup>
              {teachers.map((t) => (
                <FormControlLabel
                  key={t.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.teacherIds.includes(t.id)}
                      onChange={() => toggleTeacher(t.id)}
                    />
                  }
                  label={
                    <Box className="flex items-center gap-2">
                      <Avatar
                        src={t.photo ? `${API_URL}${t.photo}` : undefined}
                        sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "#F5C400", color: "#111827" }}
                      >
                        {t.firstName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {t.firstName} {t.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.phone}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        )}
      </SideDrawer>
    </div>
  );
}
