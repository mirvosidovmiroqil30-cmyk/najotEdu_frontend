"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SendRounded from "@mui/icons-material/SendRounded";
import { apiPost } from "@/lib/api";
import { formatApiError } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { LoadingState, PageHeader } from "@/components/ui";
import type { Homework, HomeworkAnswer } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Kutilmoqda",
  CHECKED: "Tekshirildi",
  ACCEPTED: "Qabul qilindi",
  REJECTED: "Rad etildi",
};

const STATUS_COLOR: Record<string, "default" | "warning" | "success" | "error"> = {
  PENDING: "warning",
  CHECKED: "default",
  ACCEPTED: "success",
  REJECTED: "error",
};

export default function StudentHomeworksPage() {
  const { data: homeworks, loading: hwLoading } = useApiList<Homework>("/homeworks/my");
  const { data: answers, loading: ansLoading, reload } = useApiList<HomeworkAnswer>("/homework-answers/my");
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedHw, setSelectedHw] = useState<Homework | null>(null);
  const [form, setForm] = useState({ title: "", fileUrl: "" });
  const [error, setError] = useState("");

  const loading = hwLoading || ansLoading;

  const answeredIds = new Set(answers.map((a) => a.homeworkId));
  const pending = homeworks.filter((h) => !answeredIds.has(h.id));
  const submitted = homeworks.filter((h) => answeredIds.has(h.id));

  async function submit() {
    if (!selectedHw) return;
    setError("");
    try {
      await apiPost("/homework-answers", {
        homeworkId: selectedHw.id,
        title: form.title,
        fileUrl: form.fileUrl || undefined,
      });
      setOpen(false);
      setForm({ title: "", fileUrl: "" });
      await reload();
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  if (loading) return <LoadingState />;

  const displayed = tab === 0 ? pending : submitted;

  return (
    <div className="space-y-4">
      <PageHeader title="Uy vazifalari" />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={`Bajarilmagan (${pending.length})`} />
        <Tab label={`Topshirilgan (${submitted.length})`} />
      </Tabs>

      {displayed.length === 0 ? (
        <Typography color="text.secondary">
          {tab === 0 ? "Barcha vazifalar bajarilgan! 🎉" : "Hali topshirilmagan"}
        </Typography>
      ) : (
        <div className="space-y-2">
          {displayed.map((hw) => {
            const answer = answers.find((a) => a.homeworkId === hw.id);
            return (
              <Paper key={hw.id} className="p-4">
                <Box className="flex items-start justify-between gap-4">
                  <Box className="flex-1">
                    <Typography fontWeight={600}>{hw.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {hw.group?.name} · {hw.lesson?.topic}
                    </Typography>
                    {answer && (
                      <Box className="mt-2">
                        <Typography variant="body2" color="text.secondary">
                          Javob: {answer.title}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box className="flex flex-col items-end gap-2">
                    {answer ? (
                      <Chip
                        label={STATUS_LABEL[answer.status] ?? answer.status}
                        size="small"
                        color={STATUS_COLOR[answer.status] ?? "default"}
                      />
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<SendRounded />}
                        onClick={() => {
                          setSelectedHw(hw);
                          setForm({ title: "", fileUrl: "" });
                          setError("");
                          setOpen(true);
                        }}
                      >
                        Topshirish
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Vazifa topshirish: {selectedHw?.title}</DialogTitle>
        <DialogContent className="flex flex-col gap-3 !pt-2">
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Javob sarlavhasi"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            fullWidth
          />
          <TextField
            label="Fayl URL (ixtiyoriy)"
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Bekor</Button>
          <Button variant="contained" onClick={submit} disabled={!form.title}>
            Yuborish
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
