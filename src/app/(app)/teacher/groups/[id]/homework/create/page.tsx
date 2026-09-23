"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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

export default function CreateHomeworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const groupId = Number(id);
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: lessons, loading: lessonsLoading } = useApiList<Lesson>(
    `/lessons?groupId=${groupId}`,
  );

  const [form, setForm] = useState({
    lessonId: "",
    title: "",
    description: "",
  });
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    if (!file) return;
    // Fayl hajmi tekshiruvi — 20MB
    if (file.size > 20 * 1024 * 1024) {
      setError("Fayl hajmi 20MB dan oshmasligi kerak");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ url: string; originalName: string; size: number }>(
        "/upload/image",
        fd,
      );
      setUploadedFile({ url: res.url, name: file.name, size: file.size });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function submit() {
    if (!form.title.trim()) { setError("Mavzu kiritilishi shart"); return; }
    setError(""); setSaving(true);
    try {
      await apiPost("/homeworks", {
        groupId,
        teacherId: user?.id,
        ...(form.lessonId ? { lessonId: Number(form.lessonId) } : {}),
        title: form.title,
        description: form.description || undefined,
        fileUrl: uploadedFile?.url || undefined,
      });
      router.push(`/teacher/groups/${groupId}?tab=1`);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  }

  if (lessonsLoading) return <LoadingState />;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <Box className="flex items-center gap-2">
        <Button
          startIcon={<ArrowBackRounded />}
          size="small"
          onClick={() => router.push(`/teacher/groups/${groupId}?tab=1`)}
        >
          Orqaga
        </Button>
        <Typography variant="h5" fontWeight={700}>
          Yangi uyga vazifa yaratish
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper className="p-6 space-y-5">
        {/* Mavzu — darslardan tanlash */}
        <Box>
          <Typography variant="body2" fontWeight={600} className="mb-1">
            * Mavzu
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.lessonId}
            onChange={(e) => {
              const val = e.target.value;
              setForm({
                ...form,
                lessonId: val,
                title: val
                  ? lessons.find((l) => String(l.id) === val)?.topic ?? ""
                  : "",
              });
            }}
            displayEmpty={true}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value="">
              <Typography color="text.secondary">Mavzulardan birini tanlang</Typography>
            </MenuItem>
            {lessons.map((l) => (
              <MenuItem key={l.id} value={String(l.id)}>
                {l.topic}
              </MenuItem>
            ))}
          </TextField>
          {/* Yoki qo'lda kiriting */}
          {!form.lessonId && (
            <TextField
              fullWidth
              size="small"
              placeholder="Yoki mavzuni qo'lda kiriting..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Izoh — textarea */}
        <Box>
          <Typography variant="body2" fontWeight={600} className="mb-1">
            * Izoh
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={5}
            placeholder="Vazifa haqida batafsil yozing..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Box>

        {/* Fayl yuklash */}
        <Box>
          {!uploadedFile ? (
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${dragOver ? "#F5C400" : "#D1D5DB"}`,
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: dragOver ? "#FEF3C7" : "#FAFAFA",
                transition: "all 0.2s",
                "&:hover": { borderColor: "#F5C400", bgcolor: "#FEF3C7" },
              }}
            >
              <CloudUploadRounded
                sx={{ fontSize: 40, color: dragOver ? "#F5C400" : "#9CA3AF", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {uploading
                  ? "Yuklanmoqda..."
                  : "Faylni tortib olib keling yoki shu yerga tashlang"}
              </Typography>
              <Typography variant="caption" color="text.disabled" display="block">
                Maksimal hajm: 20MB
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: 2,
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                bgcolor: "#F9FAFB",
              }}
            >
              <InsertDriveFileRounded sx={{ color: "#F5C400", fontSize: 32 }} />
              <Box className="flex-1">
                <Typography variant="body2" fontWeight={600}>
                  {uploadedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
              <Chip
                label="Yuklandi"
                size="small"
                color="success"
                variant="outlined"
              />
              <Button
                size="small"
                color="error"
                onClick={() => setUploadedFile(null)}
                sx={{ minWidth: 0, p: 0.5 }}
              >
                <CloseRounded fontSize="small" />
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Footer tugmalar */}
      <Box className="flex justify-end gap-3">
        <Button
          variant="outlined"
          onClick={() => router.push(`/teacher/groups/${groupId}?tab=1`)}
          disabled={saving}
        >
          Bekor qilish
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving || uploading}
          sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, minWidth: 120 }}
        >
          {saving ? "Saqlanmoqda..." : "E'lon qilish"}
        </Button>
      </Box>
    </div>
  );
}
