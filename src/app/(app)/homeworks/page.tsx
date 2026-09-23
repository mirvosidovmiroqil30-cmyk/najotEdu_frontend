"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { apiDelete, apiPost } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { DataTable, DeleteButton, LoadingState, PageHeader } from "@/components/ui";
import type { Group, Homework, Lesson } from "@/lib/types";

const empty = { lessonId: 0, groupId: 0, teacherId: 0, title: "", fileUrl: "" };

export default function HomeworksPage() {
  const { user, hasRole } = useAuth();
  const { data, loading, error, reload } = useApiList<Homework>("/homeworks");
  const { data: groups } = useApiList<Group>(hasRole("SUPERADMIN", "ADMIN", "TEACHER") ? "/groups" : null);
  const { data: lessons } = useApiList<Lesson>("/lessons");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const canManage = hasRole("SUPERADMIN", "ADMIN", "TEACHER");

  async function save() {
    setFormError("");
    try {
      await apiPost("/homeworks", {
        ...form,
        lessonId: Number(form.lessonId),
        groupId: Number(form.groupId),
        teacherId: Number(form.teacherId),
      });
      setOpen(false);
      await reload();
    } catch (err) {
      setFormError(formatApiError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Uy vazifalari"
        action={canManage ? (
          <Button variant="contained" onClick={() => {
            setForm({ ...empty, lessonId: lessons[0]?.id ?? 0, groupId: groups[0]?.id ?? 0, teacherId: user?.id ?? 0 });
            setOpen(true);
          }}>Yangi vazifa</Button>
        ) : null}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "title", label: "Sarlavha" },
            { key: "group", label: "Guruh", render: (h) => h.group?.name ?? h.groupId },
            { key: "lesson", label: "Dars", render: (h) => h.lesson?.topic ?? h.lessonId },
            { key: "fileUrl", label: "Fayl" },
          ]}
          actions={canManage ? (row) => (
            <DeleteButton onClick={async () => { await apiDelete(`/homeworks/${row.id}`); await reload(); }} />
          ) : undefined}
        />
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Yangi uy vazifasi</DialogTitle>
        <DialogContent className="flex flex-col gap-3 !pt-2">
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField select label="Guruh" value={form.groupId} onChange={(e) => setForm({ ...form, groupId: Number(e.target.value) })}>
            {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
          </TextField>
          <TextField select label="Dars" value={form.lessonId} onChange={(e) => setForm({ ...form, lessonId: Number(e.target.value) })}>
            {lessons.map((l) => <MenuItem key={l.id} value={l.id}>{l.topic}</MenuItem>)}
          </TextField>
          <TextField label="Sarlavha" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Fayl URL" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor</Button>
          <Button variant="contained" onClick={save}>Saqlash</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
