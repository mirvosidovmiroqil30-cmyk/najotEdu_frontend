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
import type { Homework, HomeworkAnswer } from "@/lib/types";

const empty = { homeworkId: 0, title: "", fileUrl: "" };

export default function AnswersPage() {
  const { hasRole } = useAuth();
  const { data, loading, error, reload } = useApiList<HomeworkAnswer>("/homework-answers");
  const { data: homeworks } = useApiList<Homework>("/homeworks");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const canSubmit = hasRole("STUDENT", "ADMIN", "SUPERADMIN");

  async function save() {
    setFormError("");
    try {
      await apiPost("/homework-answers", { ...form, homeworkId: Number(form.homeworkId) });
      setOpen(false);
      await reload();
    } catch (err) {
      setFormError(formatApiError(err));
    }
  }

  return (
    <div>
      <PageHeader
        title="Uy vazifasi javoblari"
        action={canSubmit ? (
          <Button variant="contained" onClick={() => { setForm({ ...empty, homeworkId: homeworks[0]?.id ?? 0 }); setOpen(true); }}>
            Javob yuborish
          </Button>
        ) : null}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "title", label: "Sarlavha" },
            { key: "homework", label: "Vazifa", render: (a) => a.homework?.title ?? a.homeworkId },
            { key: "student", label: "Talaba", render: (a) => a.student ? `${a.student.firstName} ${a.student.lastName}` : a.studentId },
            { key: "status", label: "Holat" },
            { key: "fileUrl", label: "Fayl" },
          ]}
          actions={canSubmit ? (row) => (
            <DeleteButton onClick={async () => { await apiDelete(`/homework-answers/${row.id}`); await reload(); }} />
          ) : undefined}
        />
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Javob yuborish</DialogTitle>
        <DialogContent className="flex flex-col gap-3 !pt-2">
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField select label="Vazifa" value={form.homeworkId} onChange={(e) => setForm({ ...form, homeworkId: Number(e.target.value) })}>
            {homeworks.map((h) => <MenuItem key={h.id} value={h.id}>{h.title}</MenuItem>)}
          </TextField>
          <TextField label="Sarlavha" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <TextField label="Fayl URL" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor</Button>
          <Button variant="contained" onClick={save}>Yuborish</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
