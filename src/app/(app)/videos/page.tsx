"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { apiDelete, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, DeleteButton, LoadingState, PageHeader } from "@/components/ui";
import type { Lesson, LessonVideo } from "@/lib/types";

const empty = { lessonId: 0, originalName: "", videoUrl: "", sizeMb: 0 };

export default function VideosPage() {
  const { hasRole } = useAuth();
  const { data, loading, error, reload } = useApiList<LessonVideo>("/lesson-videos");
  const { data: lessons } = useApiList<Lesson>("/lessons");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const canManage = hasRole("SUPERADMIN", "ADMIN", "TEACHER");

  async function save() {
    setFormError("");
    try {
      await apiPost("/lesson-videos", { ...form, lessonId: Number(form.lessonId), sizeMb: Number(form.sizeMb) });
      setOpen(false);
      await reload();
    } catch (err) {
      setFormError(formatApiError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Dars videolari"
        action={canManage ? (
          <Button variant="contained" onClick={() => { setForm({ ...empty, lessonId: lessons[0]?.id ?? 0 }); setOpen(true); }}>
            Video qo‘shish
          </Button>
        ) : null}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "originalName", label: "Fayl" },
            { key: "lesson", label: "Dars", render: (v) => v.lesson?.topic ?? v.lessonId },
            { key: "sizeMb", label: "MB" },
            { key: "url", label: "Havola", render: (v) => <Link href={v.videoUrl} target="_blank">Ochish</Link> },
          ]}
          actions={canManage ? (row) => (
            <DeleteButton onClick={async () => { await apiDelete(`/lesson-videos/${row.id}`); await reload(); }} />
          ) : undefined}
        />
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Yangi video</DialogTitle>
        <DialogContent className="flex flex-col gap-3 !pt-2">
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField select label="Dars" value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: Number(e.target.value) })}>
            {lessons.map((l) => <MenuItem key={l.id} value={l.id}>{l.topic}</MenuItem>)}
          </TextField>
          <TextField label="Fayl nomi" value={form.originalName} onChange={(e) => setForm({ ...form, originalName: e.target.value })} />
          <TextField label="Video URL" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
          <TextField type="number" label="Hajmi (MB)" value={form.sizeMb} onChange={(e) => setForm({ ...form, sizeMb: Number(e.target.value) })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor</Button>
          <Button variant="contained" onClick={save}>Saqlash</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
