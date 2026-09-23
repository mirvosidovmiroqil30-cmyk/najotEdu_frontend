"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import { apiGet } from "@/lib/api";
import { LoadingState, PageHeader } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { Attendance, HomeworkAnswer, User } from "@/lib/types";

type StudentStat = {
  user: User;
  xp: number;
  level: number;
  coins: number;
};

export default function StudentRatingPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [users, allAttendance, allAnswers] = await Promise.all([
          apiGet<User[]>("/users"),
          apiGet<Attendance[]>("/attendance"),
          apiGet<HomeworkAnswer[]>("/homework-answers"),
        ]);

        const students = users.filter((u) => u.role === "STUDENT");
        const result: StudentStat[] = students.map((s) => {
          const att = allAttendance.filter((a) => a.studentId === s.id);
          const ans = allAnswers.filter((a) => a.studentId === s.id);
          const present = att.filter((a) => a.isPresent).length;
          const accepted = ans.filter((a) => a.status === "ACCEPTED").length;
          const xp = present * 10 + accepted * 50;
          return {
            user: s,
            xp,
            level: Math.floor(xp / 500) + 1,
            coins: present * 5 + accepted * 20,
          };
        });

        result.sort((a, b) => b.xp - a.xp);
        setStats(result);
      } catch {
        setStats([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingState />;

  const myRank = stats.findIndex((s) => s.user.id === user?.id) + 1;
  const myStat = stats.find((s) => s.user.id === user?.id);

  const medalColor = ["#F5C400", "#9CA3AF", "#CD7F32"];

  return (
    <div className="space-y-4">
      <PageHeader title="Reyting" subtitle="Eng faol talabalar" />

      {/* Mening o'rnim */}
      {myStat && (
        <Paper className="flex items-center gap-4 p-4" sx={{ bgcolor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <EmojiEventsRounded sx={{ color: "#16a34a", fontSize: 36 }} />
          <Box>
            <Typography fontWeight={700}>Mening o'rnim: #{myRank}</Typography>
            <Typography variant="body2" color="text.secondary">
              XP: {myStat.xp} · Bosqich: {myStat.level} · Kumushlar: {myStat.coins}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Reyting jadvali */}
      <div className="space-y-2">
        {stats.map((s, i) => {
          const isMe = s.user.id === user?.id;
          return (
            <Paper
              key={s.user.id}
              className="flex items-center gap-4 p-3"
              sx={isMe ? { bgcolor: "#FFFBEB", border: "1px solid #FDE68A" } : {}}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  width: 36,
                  textAlign: "center",
                  color: i < 3 ? medalColor[i] : "text.secondary",
                }}
              >
                {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
              </Typography>
              <Avatar sx={{ bgcolor: "#F5C400", color: "#111827", width: 36, height: 36 }}>
                {s.user.firstName[0]}
              </Avatar>
              <Box className="flex-1">
                <Typography fontWeight={isMe ? 700 : 400}>
                  {s.user.firstName} {s.user.lastName} {isMe && "(Men)"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Bosqich {s.level} · {s.coins} kumush
                </Typography>
              </Box>
              <Box className="text-right">
                <Typography fontWeight={700} color="primary">{s.xp}</Typography>
                <Typography variant="caption" color="text.secondary">XP</Typography>
              </Box>
            </Paper>
          );
        })}
      </div>
    </div>
  );
}
