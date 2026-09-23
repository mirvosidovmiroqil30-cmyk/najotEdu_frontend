"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import RestoreRounded from "@mui/icons-material/RestoreRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { apiDelete, apiPatch } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, DeleteButton, LoadingState, PageHeader, SuccessSnackbar } from "@/components/ui";
import type { Attendance, Course, Group, Homework, Lesson, Room, User } from "@/lib/types";

const TABS = [
  { key: "users",       label: "Foydalanuvchilar", path: "/archive/users" },
  { key: "courses",     label: "Kurslar",           path: "/archive/courses" },
  { key: "rooms",       label: "Xonalar",           path: "/archive/rooms" },
  { key: "groups",      label: "Guruhlar",          path: "/archive/groups" },
  { key: "lessons",     label: "Darslar",           path: "/archive/lessons" },
  { key: "homeworks",   label: "Uy vazifalari",     path: "/archive/homeworks" },
  { key: "attendances", label: "Yo'qlamalar",       path: "/archive/attendances" },
] as const;

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("uz-UZ");
}

type ArchiveRow = { id: number } & Record<string, unknown>;

export default function ArchivePage() {
  const { hasRole } = useAuth();
  const canAccess = hasRole("SUPERADMIN", "ADMIN");
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Restore confirm dialog
  const [restoreTarget, setRestoreTarget] = useState<ArchiveRow | null>(null);

  const current = TABS[tab];
  const { data, loading, error: listError, reload } = useApiList<ArchiveRow>(
    canAccess ? current.path : null,
  );

  const columns = useMemo(() => {
    switch (current.key) {
      case "users":
        return [
          { key: "name", label: "F.I.Sh", render: (r: ArchiveRow) => `${(r as User).firstName} ${(r as User).lastName}` },
          { key: "role", label: "Rol" },
          { key: "phone", label: "Telefon" },
          { key: "deletedAt", label: "Arxivga o'tgan", render: (r: ArchiveRow) => formatDate((r as User).deletedAt) },
        ];
      case "courses":
        return [
          { key: "name", label: "Nomi" },
          { key: "price", label: "Narx" },
          { key: "status", label: "Holat" },
          { key: "deletedAt", label: "Arxivga o'tgan", render: (r: ArchiveRow) => formatDate((r as Course).deletedAt) },
        ];
      case "rooms":
        return [
          { key: "name", label: "Nomi" },
          { key: "capacity", label: "Sig'im" },
          { key: "deletedAt", label: "Arxivga o'tgan", render: (r: ArchiveRow) => formatDate((r as Room).deletedAt) },
        ];
      case "groups":
        return [
          { key: "name", label: "Nomi" },
          { key: "course", label: "Kurs", render: (r: ArchiveRow) => (r as Group).course?.name ?? (r as Group).courseId },
          { key: "room", label: "Xona", render: (r: ArchiveRow) => (r as Group).room?.name ?? (r as Group).roomId },
          { key: "deletedAt", label: "Arxivga o'tgan", render: (r: ArchiveRow) => formatDate((r as Group).deletedAt) },
        ];
      case "lessons":
        return [
          { key: "topic", label: "Mavzu" },
          { key: "group", label: "Guruh", render: (r: ArchiveRow) => (r as Lesson).group?.name ?? (r as Lesson).groupId },
          { key: "teacher", label: "O'qituvchi", render: (r: ArchiveRow) => {
            const l = r as Lesson;
            return l.teacher ? `${l.teacher.firstName} ${l.teacher.lastName}` : l.teacherId;
          }},
          { key: "deletedAt", label: "Arxivga o'tgan", render: (r: ArchiveRow) => formatDate((r as Lesson).deletedAt) },
        ];
      case "homeworks":
        return [
          { key: "title", label: "Sarlavha" },
          { key: "group", label: "Guruh", render: (r: ArchiveRow) => (r as Homework).group?.name ?? (r as Homework).groupId },
          { key: "lesson", label: "Dars", render: (r: ArchiveRow) => (r as Homework).lesson?.topic ?? (r as Homework).lessonId },
          { key: "deletedAt", label: "Arxivga o'tgan", render: (r: ArchiveRow) => formatDate((r as Homework).deletedAt) },
        ];
      default:
        return [
          { key: "group", label: "Guruh", render: (r: ArchiveRow) => (r as Attendance).group?.name ?? (r as Attendance).groupId },
          { key: "student", label: "Talaba", render: (r: ArchiveRow) => {
            const a = r as Attendance;
            return a.student ? `${a.student.firstName} ${a.student.lastName}` : a.studentId;
          }},
          { key: "isPresent", label: "Holat", render: (r: ArchiveRow) => ((r as Attendance).isPresent ? "Bor" : "Yo'q") },
          { key: "deletedAt", label: "Arxivga o'tgan", render: (r: ArchiveRow) => formatDate((r as Attendance).deletedAt) },
        ];
    }
  }, [current.key]);

  async function permanentlyDelete(id: number) {
    setError("");
    try {
      await apiDelete(`${current.path}/${id}`);
      setSuccessMsg("Ma'lumot arxivdan butunlay o'chirildi");
      await reload();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function restore(id: number) {
    setError("");
    try {
      await apiPatch(`${current.path}/${id}/restore`, {});
      setRestoreTarget(null);
      setSuccessMsg("Ma'lumot muvaffaqiyatli tiklandi!");
      await reload();
    } catch (err) {
      setError(formatApiError(err));
      setRestoreTarget(null);
    }
  }

  if (!canAccess) {
    return <Alert severity="error">Arxivga faqat Superadmin va Admin kirishi mumkin</Alert>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Arxiv"
        subtitle="O'chirilgan ma'lumotlarni ko'rish, tiklash yoki butunlay o'chirish"
      />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(_, v: number) => { setTab(v); setError(""); }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((item) => (
            <Tab key={item.key} label={item.label} />
          ))}
        </Tabs>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {listError ? <Alert severity="error">{listError}</Alert> : null}

      {loading ? (
        <LoadingState />
      ) : (
        <DataTable
          rows={data}
          columns={columns}
          actions={(row) => (
            <Box className="flex items-center gap-1">
              {/* Tiklash tugmasi */}
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<RestoreRounded fontSize="small" />}
                onClick={() => setRestoreTarget(row)}
              >
                Tiklash
              </Button>

              {/* Butunlay o'chirish */}
              <DeleteButton
                message="Bu ma'lumot arxivdan butunlay o'chiriladi va qayta tiklab bo'lmaydi. Davom etasizmi?"
                onClick={() => permanentlyDelete(row.id)}
              />
            </Box>
          )}
        />
      )}

      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />

      {/* Tiklash confirm dialogi */}
      <Dialog
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="flex items-center gap-2">
          <RestoreRounded color="success" />
          Tiklashni tasdiqlash
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bu ma'lumotni arxivdan tiklashni tasdiqlaysizmi? Tiklangandan so'ng u yana faol bo'ladi.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreTarget(null)}>Bekor qilish</Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => restoreTarget && restore(restoreTarget.id)}
          >
            Ha, tiklash
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
