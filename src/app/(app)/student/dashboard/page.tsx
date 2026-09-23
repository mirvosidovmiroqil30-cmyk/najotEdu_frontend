"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import DiamondRounded from "@mui/icons-material/DiamondRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import TrendingUpRounded from "@mui/icons-material/TrendingUpRounded";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import PublicRounded from "@mui/icons-material/PublicRounded";
import { useAuth } from "@/lib/auth-context";
import { apiGet } from "@/lib/api";
import { LoadingState } from "@/components/ui";
import type { Group, Attendance, HomeworkAnswer } from "@/lib/types";

type StudentGroup = {
  id: number;
  groupId: number;
  status: string;
  group: Group & {
    course: { id: number; name: string };
    room: { id: number; name: string };
  };
};

const WEEK_DAYS_UZ: Record<string, string> = {
  MONDAY: "Du",
  TUESDAY: "Se",
  WEDNESDAY: "Ch",
  THURSDAY: "Pa",
  FRIDAY: "Ju",
  SATURDAY: "Sha",
  SUNDAY: "Ya",
};

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [answers, setAnswers] = useState<HomeworkAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [g, att, ans] = await Promise.all([
          apiGet<StudentGroup[]>("/groups/my"),
          apiGet<Attendance[]>("/attendance/my"),
          apiGet<HomeworkAnswer[]>("/homework-answers/my"),
        ]);
        setGroups(Array.isArray(g) ? g : []);
        setAttendance(Array.isArray(att) ? att : []);
        setAnswers(Array.isArray(ans) ? ans : []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingState />;

  // Statistika hisoblash
  const totalAttendance = attendance.length;
  const presentCount = attendance.filter((a) => a.isPresent).length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  const totalHomeworks = answers.length;
  const acceptedHomeworks = answers.filter((a) => a.status === "ACCEPTED").length;

  // XP hisoblash (har bir davomat +10, har bir qabul qilingan vazifa +50)
  const xp = presentCount * 10 + acceptedHomeworks * 50;

  // Bosqich (har 500 XP = 1 bosqich)
  const level = Math.floor(xp / 500) + 1;
  const levelProgress = xp % 500;
  const levelMax = 500;

  // Kumushlar (har davomat +5, har javob +20)
  const coins = presentCount * 5 + acceptedHomeworks * 20;

  return (
    <div className="space-y-6">
      {/* Salomlashuv */}
      <Typography variant="h5" fontWeight={700}>
        Assalomu alaykum, {user?.firstName}! 👋
      </Typography>

      {/* Kumushlar va XP kartasi */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <Box className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
              <DiamondRounded sx={{ color: "#F5C400" }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Kumushlar</Typography>
              <Typography variant="h5" fontWeight={700}>{coins}</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <Box className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <TrendingUpRounded sx={{ color: "#16a34a" }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Bosqich</Typography>
              <Typography variant="h5" fontWeight={700}>{level}</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <Box className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <PublicRounded sx={{ color: "#2563eb" }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">XP</Typography>
              <Typography variant="h5" fontWeight={700}>{xp}</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3">
            <Box className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <EmojiEventsRounded sx={{ color: "#7c3aed" }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Davomat</Typography>
              <Typography variant="h5" fontWeight={700}>{attendanceRate}%</Typography>
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* Bosqich progressi */}
      <Paper className="p-4">
        <Box className="mb-2 flex items-center justify-between">
          <Typography variant="subtitle2" fontWeight={600}>
            Bosqich {level} progressi
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {levelProgress} / {levelMax} XP
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(levelProgress / levelMax) * 100}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: "#E5E7EB",
            "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 5 },
          }}
        />
      </Paper>

      {/* Guruhlar va dars jadvali */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Guruhlarim */}
        <Paper className="p-4">
          <Typography variant="subtitle1" fontWeight={700} className="mb-3">
            Guruhlarim
          </Typography>
          {groups.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              Hech qanday guruhga biriktirilmagan
            </Typography>
          ) : (
            <div className="space-y-3">
              {groups.map((sg) => (
                <Box key={sg.id} className="rounded-xl border border-gray-100 p-3">
                  <Box className="mb-1 flex items-center justify-between">
                    <Typography fontWeight={600}>{sg.group.name}</Typography>
                    <Chip
                      label={sg.status}
                      size="small"
                      color={sg.status === "ACTIVE" ? "success" : "default"}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {sg.group.course?.name} · {sg.group.room?.name}
                  </Typography>
                  <Box className="mt-2 flex flex-wrap gap-1">
                    {sg.group.weekDays?.map((d) => (
                      <Chip key={d} label={WEEK_DAYS_UZ[d] ?? d} size="small" variant="outlined" />
                    ))}
                    {sg.group.startTime && (
                      <Chip
                        icon={<AccessTimeRounded fontSize="small" />}
                        label={sg.group.startTime}
                        size="small"
                        sx={{ bgcolor: "#f0fdf4", color: "#16a34a" }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </div>
          )}
        </Paper>

        {/* Statistika */}
        <Paper className="p-4">
          <Typography variant="subtitle1" fontWeight={700} className="mb-3">
            Statistika
          </Typography>
          <div className="space-y-4">
            <Box>
              <Box className="mb-1 flex justify-between">
                <Typography variant="body2">Davomat</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {presentCount}/{totalAttendance}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={attendanceRate}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "#E5E7EB",
                  "& .MuiLinearProgress-bar": { bgcolor: "#2563eb", borderRadius: 4 },
                }}
              />
            </Box>
            <Box>
              <Box className="mb-1 flex justify-between">
                <Typography variant="body2">Uy vazifalari</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {acceptedHomeworks}/{totalHomeworks}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={totalHomeworks > 0 ? (acceptedHomeworks / totalHomeworks) * 100 : 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: "#E5E7EB",
                  "& .MuiLinearProgress-bar": { bgcolor: "#F5C400", borderRadius: 4 },
                }}
              />
            </Box>
          </div>
        </Paper>
      </div>
    </div>
  );
}
