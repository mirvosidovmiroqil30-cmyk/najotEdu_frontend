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
import { apiGet } from "@/lib/api";
import { formatApiError } from "@/lib/auth-context";
import { LoadingState } from "@/components/ui";

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

export default function StudentVideoPage({
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

  useEffect(() => {
    apiGet<LessonVideo>(`/lesson-videos/${videoId}`)
      .then(setVideo)
      .catch((err) => setError(formatApiError(err)))
      .finally(() => setLoading(false));
  }, [videoId]);

  if (loading) return <LoadingState />;
  if (error && !video) return <Alert severity="error">{error}</Alert>;
  if (!video) return <Alert severity="error">Video topilmadi</Alert>;

  const videoSrc = `${API_URL}${video.videoUrl}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Box className="flex items-center gap-2">
        <Button
          startIcon={<ArrowBackRounded />}
          size="small"
          onClick={() => router.push(`/student/groups/${groupId}`)}
        >
          Orqaga
        </Button>
        <Typography variant="h5" fontWeight={700}>
          Video dars
        </Typography>
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
              Hajmi: {video.sizeMb} MB
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
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
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
        </Box>
      </Paper>
    </div>
  );
}
