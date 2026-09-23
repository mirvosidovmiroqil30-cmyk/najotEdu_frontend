"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import InsertDriveFileRounded from "@mui/icons-material/InsertDriveFileRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { apiPost, apiUpload } from "@/lib/api";
import { formatApiError, useAuth } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { LoadingState } from "@/components/ui";
import type { Lesson } from "@/lib/types";

export default function CreateExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const groupId = Number(id);
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: lessons, loading: lessonsLoading } = useApiList<Lesson>(`/lessons?groupId=${groupId}`);

  const [form, setForm] = useState({ lessonId: "", title: "", description: "", passingScore: "60", dueDate: "" });
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    if (file.size > 20 * 1024 * 1024) { setError("Fayl 20MB dan oshmasligi kerak"); return; }
    setError(""); setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ url: string; originalName: string; size: number }>("/upload", fd);
      setUploadedFile({ url: res.url, name: file.name, size: file.size });
    } catch (err) { setError(formatApiError(err)); }
    finally { setUploading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function submit() {
    if (!form.title.trim()) { setError("Mavzu kiritilishi shart"); return; }
    setError(""); setSaving(true);
    try {
      await apiPost("/exams", {
        groupId,
        teacherId: user?.id,
        ...(form.lessonId ? { lessonId: Number(form.lessonId) } : {}),
        title: form.title,
        description: form.description || undefined,
        fileUrl: uploadedFile?.url || undefined,
        passingScore: Number(form.passingScore) || 60,
        dueDate: form.dueDate || undefined,
      });
      router.push(`/teacher/groups/${groupId}?tab=1`);
    } catch (err) { setError(formatApiError(err)); }
    finally { setSaving(false); }
  }

  if (lessonsLoading) return <LoadingState />;

  return (
    <div className="max-w-3xl space-y-6">
      <Box className="flex items-center gap-2">
        <Button startIcon={<ArrowBackRounded />} size="small" onClick={() => router.push(`/teacher/groups/${groupId}?tab=1`)}>
          Orqaga
        </Button>
        <Typography variant="h5" fontWeight={700}>Yangi imtihon yaratish</Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper className="p-6 space-y-5">
        {/* Mavzu */}
        <Box>
          <Typography variant="body2" fontWeight={600} className="mb-1">* Mavzu</Typography>
          <TextField
            select fullWidth size="small" value={form.lessonId}
            onChange={(e) => {
              const val = e.target.value;
              setForm({ ...form, lessonId: val, title: val ? lessons.find((l) => String(l.id) === val)?.topic ?? "" : "" });
            }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value=""><Typography color="text.secondary">Mavzulardan birini tanlang</Typography></MenuItem>
            {lessons.map((l) => <MenuItem key={l.id} value={String(l.id)}>{l.topic}</MenuItem>)}
          </TextField>
          {!form.lessonId && (
            <TextField fullWidth size="small" placeholder="Yoki mavzuni qo'lda kiriting..."
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} sx={{ mt: 1 }} />
          )}
        </Box>

        {/* Izoh */}
        <Box>
          <Typography variant="body2" fontWeight={600} className="mb-1">Izoh</Typography>
          <TextField fullWidth multiline rows={4} placeholder="Imtihon haqida batafsil..."
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Box>

        {/* O'tish bali va muddat */}
        <Box className="grid grid-cols-2 gap-4">
          <Box>
            <Typography variant="body2" fontWeight={600} className="mb-1">O'tish bali (0–100)</Typography>
            <TextField fullWidth size="small" type="number" value={form.passingScore}
              onChange={(e) => setForm({ ...form, passingScore: e.target.value })}
              inputProps={{ min: 0, max: 100 }} />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} className="mb-1">Muddat (ixtiyoriy)</Typography>
            <TextField fullWidth size="small" type="datetime-local" value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Box>
        </Box>

        {/* Fayl yuklash */}
        <Box>
          <Typography variant="body2" fontWeight={600} className="mb-1">Imtihon topshirig'i (fayl)</Typography>
          {!uploadedFile ? (
            <Box onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${dragOver ? "#F5C400" : "#D1D5DB"}`, borderRadius: 3, p: 4,
                textAlign: "center", cursor: "pointer", bgcolor: dragOver ? "#FEF3C7" : "#FAFAFA",
                transition: "all 0.2s", "&:hover": { borderColor: "#F5C400", bgcolor: "#FEF3C7" },
              }}>
              <CloudUploadRounded sx={{ fontSize: 40, color: dragOver ? "#F5C400" : "#9CA3AF", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {uploading ? "Yuklanmoqda..." : "Faylni tortib olib keling yoki shu yerga tashlang"}
              </Typography>
              <Typography variant="caption" color="text.disabled" display="block">Maksimal: 20MB</Typography>
              <input ref={fileInputRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </Box>
          ) : (
            <Box sx={{ border: "1px solid #E5E7EB", borderRadius: 2, p: 2, display: "flex", alignItems: "center", gap: 2, bgcolor: "#F9FAFB" }}>
              <InsertDriveFileRounded sx={{ color: "#F5C400", fontSize: 32 }} />
              <Box className="flex-1">
                <Typography variant="body2" fontWeight={600}>{uploadedFile.name}</Typography>
                <Typography variant="caption" color="text.secondary">{(uploadedFile.size / 1024).toFixed(1)} KB</Typography>
              </Box>
              <Button size="small" color="error" startIcon={<CloseRounded />} onClick={() => setUploadedFile(null)}>O'chirish</Button>
            </Box>
          )}
        </Box>

        <Box className="flex justify-end gap-2 pt-2">
          <Button variant="outlined" onClick={() => router.push(`/teacher/groups/${groupId}?tab=1`)}>Bekor qilish</Button>
          <Button variant="contained" onClick={submit} disabled={saving || uploading}
            sx={{ bgcolor: "#F5C400", color: "#111827", "&:hover": { bgcolor: "#e6b800" } }}>
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}
