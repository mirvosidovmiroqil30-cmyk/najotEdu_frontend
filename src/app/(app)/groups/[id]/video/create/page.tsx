"use client";

import { use, useState } from "react";
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
import VideocamRounded from "@mui/icons-material/VideocamRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { apiPost } from "@/lib/api";
import { formatApiError } from "@/lib/auth-context";
import { useApiList } from "@/lib/use-api-list";
import { LoadingState, SuccessSnackbar } from "@/components/ui";
import type { Lesson } from "@/lib/types";
import { getToken } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function CreateVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const groupId = Number(id);
  const router = useRouter();

  const [lessonId, setLessonId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data: lessons, loading: lessonsLoading } = useApiList<Lesson>(`/lessons?groupId=${groupId}`);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const videoFiles = files.filter((f) =>
      f.type.startsWith("video/") || f.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)
    );
    if (videoFiles.length > 0) {
      setVideoFile(videoFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setVideoFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!lessonId) {
      setError("Darsni tanlang");
      return;
    }
    if (!videoFile) {
      setError("Video faylini yuklang");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", videoFile);
      formData.append("lessonId", lessonId);

      const response = await fetch(`${API_URL}/lesson-videos/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Yuklashda xatolik");
      }

      setSuccessMsg("Video muvaffaqiyatli yuklandi!");
      setTimeout(() => {
        router.push(`/groups/${groupId}`);
      }, 1500);
    } catch (err: any) {
      setError(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  if (lessonsLoading) return <LoadingState />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2">
          <Button
            startIcon={<ArrowBackRounded />}
            size="small"
            onClick={() => router.push(`/groups/${groupId}`)}
          >
            Orqaga
          </Button>
          <Typography variant="h5" fontWeight={700}>
            Video yuklash
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper className="p-6 space-y-4">
        {/* Dars tanlash */}
        <TextField
          select
          label="Darsni tanlang *"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          fullWidth
        >
          {lessons.length === 0 ? (
            <MenuItem disabled>Darslar topilmadi</MenuItem>
          ) : (
            lessons.map((lesson) => (
              <MenuItem key={lesson.id} value={lesson.id}>
                {lesson.topic}
              </MenuItem>
            ))
          )}
        </TextField>

        {/* Video yuklash */}
        <Box>
          <Typography variant="body2" fontWeight={600} className="mb-2">
            Video fayl *
          </Typography>

          {!videoFile ? (
            <Box
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              sx={{
                border: `2px dashed ${dragOver ? "#F5C400" : "#D1D5DB"}`,
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                bgcolor: dragOver ? "#FEF3C7" : "#FAFAFA",
                transition: "all 0.2s",
                "&:hover": { borderColor: "#F5C400", bgcolor: "#FEF3C7" },
              }}
            >
              <CloudUploadRounded
                sx={{ fontSize: 40, color: dragOver ? "#F5C400" : "#9CA3AF", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary" className="mb-1">
                Video faylini bu yerga torting yoki
              </Typography>
              <Button
                variant="outlined"
                component="label"
                size="small"
                sx={{ textTransform: "none" }}
              >
                Faylni tanlang
                <input
                  type="file"
                  accept="video/*,.mp4,.avi,.mov,.mkv,.webm"
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" className="block mt-2">
                MP4, AVI, MOV, MKV, WEBM (Maksimal: 500MB)
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                border: "2px solid #F5C400",
                borderRadius: 2,
                p: 3,
                bgcolor: "#FFFBEB",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box className="flex items-center gap-3">
                <VideocamRounded sx={{ color: "#F5C400", fontSize: 32 }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {videoFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                </Box>
              </Box>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineRounded />}
                onClick={() => setVideoFile(null)}
              >
                O'chirish
              </Button>
            </Box>
          )}
        </Box>

        {/* Tugmalar */}
        <Box className="flex gap-2 justify-end pt-4">
          <Button
            variant="outlined"
            onClick={() => router.push(`/groups/${groupId}`)}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || !lessonId || !videoFile}
            sx={{ bgcolor: "#F5C400", color: "#111827", "&:hover": { bgcolor: "#e6b800" } }}
          >
            {uploading ? "Yuklanmoqda..." : "Yuklash"}
          </Button>
        </Box>
      </Paper>

      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
    </div>
  );
}
