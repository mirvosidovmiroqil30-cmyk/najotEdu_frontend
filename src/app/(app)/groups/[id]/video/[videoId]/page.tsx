"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import VideocamRounded from "@mui/icons-material/VideocamRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { apiGet, apiDelete } from "@/lib/api";
import { formatApiError } from "@/lib/auth-context";
import { LoadingState, SuccessSnackbar } from "@/components/ui";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

type LessonVideo = {
  id: number;
  lessonId: number;
  originalName: string;
  videoUrl: string;
  sizeMb: number;
  createdAt: string;
  lesson: {
    id: number;
    topic: string;
    groupId: number;
  };
};

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string; videoId: string }>;
}) {
  const { id, videoId } = use(params);
  const groupId = Number(id);
  const router = useRouter();

  const [video, setVideo] = useState<LessonVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    apiGet<LessonVideo>(`/lesson-videos/${videoId}`)
      .then(setVideo)
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  }, [videoId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiDelete(`/lesson-videos/${videoId}`);
      setSuccessMsg("Video muvaffaqiyatli o'chirildi!");
      setTimeout(() => {
        router.push(`/groups/${groupId}`);
      }, 1500);
    } catch (err: any) {
      setError(formatApiError(err));
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error && !video) return <Alert severity="error">{error}</Alert>;
  if (!video) return <Alert severity="error">Video topilmadi</Alert>;

  const videoSrc = `${API_URL}${video.videoUrl}`;

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
            Video ko'rish
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteOutlineRounded />}
          onClick={() => setDeleteDialog(true)}
        >
          O'chirish
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Video Player */}
      <Paper className="p-6 space-y-4">
        <Box className="flex items-start gap-3">
          <VideocamRounded sx={{ color: "#F5C400", fontSize: 32 }} />
          <Box className="flex-1">
            <Typography variant="h6" fontWeight={600} className="mb-1">
              {video.originalName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dars: {video.lesson.topic}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hajmi: {video.sizeMb} MB • Yuklangan: {new Date(video.createdAt).toLocaleDateString("uz-UZ", { 
                day: "numeric", 
                month: "long", 
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </Typography>
          </Box>
        </Box>

        {/* Video player */}
        <Box
          sx={{
            width: "100%",
            maxWidth: "900px",
            mx: "auto",
            bgcolor: "#000",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <video
            controls
            controlsList="nodownload"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "600px",
              display: "block",
            }}
            preload="metadata"
          >
            <source src={videoSrc} type="video/mp4" />
            <source src={videoSrc} type="video/webm" />
            <source src={videoSrc} type="video/ogg" />
            Brauzeringiz video ni qo'llab-quvvatlamaydi.
          </video>
        </Box>

        {/* Ma'lumotlar */}
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <Box>
            <Typography variant="caption" color="text.secondary">
              Dars mavzusi
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {video.lesson.topic}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Fayl hajmi
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {video.sizeMb} MB
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Yuklangan vaqt
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {new Date(video.createdAt).toLocaleDateString("uz-UZ", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* O'chirish dialogi */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Videoni o'chirish</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Haqiqatan ham bu videoni o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Bekor qilish</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <SuccessSnackbar
        open={Boolean(successMsg)}
        message={successMsg}
        onClose={() => setSuccessMsg("")}
      />
    </div>
  );
}
