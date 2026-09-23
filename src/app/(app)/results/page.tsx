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
import type { HomeworkAnswer, HomeworkResult, HomeworkStatus } from "@/lib/types";

const empty = { homeworkAnswerId: 0, grade: 80, feedback: "", status: "CHECKED" as HomeworkStatus };

export default function ResultsPage() {
  const { hasRole } = useAuth();
  const { data, loading, error, reload } = useApiList<HomeworkResult>("/homework-results");
  const { data: answers } = useApiList<HomeworkAnswer>("/homework-answers");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState("");
  const canGrade = hasRole("TEACHER", "ADMIN", "SUPERADMIN");

  async function save() {
    setFormError("");
    try {
      await apiPost("/homework-results", {
        ...form,
        homeworkAnswerId: Number(form.homeworkAnswerId),
        grade: Number(form.grade),
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
        title="Baholar"
        action={canGrade ? (
          <Button variant="contained" onClick={() => { setForm({ ...empty, homeworkAnswerId: answers[0]?.id ?? 0 }); setOpen(true); }}>
            Baholash
          </Button>
        ) : null}
      />
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <LoadingState /> : (
        <DataTable
          rows={data}
          columns={[
            { key: "answer", label: "Javob", render: (r) => r.homeworkAnswer?.title ?? r.homeworkAnswerId },
            { key: "grade", label: "Baho" },
            { key: "status", label: "Holat" },
            { key: "feedback", label: "Izoh" },
          ]}
          actions={canGrade ? (row) => (
            <DeleteButton onClick={async () => { await apiDelete(`/homework-results/${row.id}`); await reload(); }} />
          ) : undefined}
        />
      )}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Vazifani baholash</DialogTitle>
        <DialogContent className="flex flex-col gap-3 !pt-2">
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField select label="Javob" value={form.homeworkAnswerId} onChange={(e) => setForm({ ...form, homeworkAnswerId: Number(e.target.value) })}>
            {answers.map((a) => <MenuItem key={a.id} value={a.id}>{a.title} #{a.id}</MenuItem>)}
          </TextField>
          <TextField type="number" label="Baho (0-100)" value={form.grade} onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })} />
          <TextField label="Izoh" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
          <TextField select label="Holat" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as HomeworkStatus })}>
            {["CHECKED", "ACCEPTED", "REJECTED"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor</Button>
          <Button variant="contained" onClick={save}>Saqlash</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
