"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { apiGet } from "@/lib/api";
import { LoadingState, PageHeader } from "@/components/ui";
import type { HomeworkAnswer, Attendance } from "@/lib/types";

export default function StudentResultsPage() {
  const [answers, setAnswers] = useState<HomeworkAnswer[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<HomeworkAnswer[]>("/homework-answers/my"),
      apiGet<Attendance[]>("/attendance/my"),
    ])
      .then(([a, att]) => {
        setAnswers(Array.isArray(a) ? a : []);
        setAttendance(Array.isArray(att) ? att : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const totalHw = answers.length;
  const accepted = answers.filter((a) => a.status === "ACCEPTED").length;
  const rejected = answers.filter((a) => a.status === "REJECTED").length;
  const pending = answers.filter((a) => a.status === "PENDING").length;

  const totalAtt = attendance.length;
  const present = attendance.filter((a) => a.isPresent).length;
  const attRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0;

  const xp = present * 10 + accepted * 50;
  const level = Math.floor(xp / 500) + 1;

  const statCards = [
    { label: "Davomat", value: `${attRate}%`, sub: `${present}/${totalAtt}`, color: "#2563eb" },
    { label: "Qabul qilingan", value: accepted, sub: "uy vazifasi", color: "#16a34a" },
    { label: "Rad etilgan", value: rejected, sub: "uy vazifasi", color: "#ef4444" },
    { label: "Kutilmoqda", value: pending, sub: "uy vazifasi", color: "#F5C400" },
    { label: "XP", value: xp, sub: `${level}-bosqich`, color: "#7c3aed" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Ko'rsatgichlarim" subtitle="O'quv jarayonidagi natijalaringiz" />

      {/* Statistika kartalar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((c) => (
          <Paper key={c.label} className="p-4 text-center">
            <Typography variant="h4" fontWeight={700} sx={{ color: c.color }}>
              {c.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {c.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {c.sub}
            </Typography>
          </Paper>
        ))}
      </div>

      {/* Progresslar */}
      <Paper className="space-y-4 p-4">
        <Typography variant="subtitle1" fontWeight={700}>Batafsil ko'rsatgichlar</Typography>

        <Box>
          <Box className="mb-1 flex justify-between">
            <Typography variant="body2">Davomat</Typography>
            <Typography variant="body2" fontWeight={600}>{attRate}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate" value={attRate}
            sx={{ height: 8, borderRadius: 4, bgcolor: "#E5E7EB", "& .MuiLinearProgress-bar": { bgcolor: "#2563eb", borderRadius: 4 } }}
          />
        </Box>

        <Box>
          <Box className="mb-1 flex justify-between">
            <Typography variant="body2">Uy vazifalari (qabul qilingan)</Typography>
            <Typography variant="body2" fontWeight={600}>{totalHw > 0 ? Math.round((accepted / totalHw) * 100) : 0}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate" value={totalHw > 0 ? (accepted / totalHw) * 100 : 0}
            sx={{ height: 8, borderRadius: 4, bgcolor: "#E5E7EB", "& .MuiLinearProgress-bar": { bgcolor: "#16a34a", borderRadius: 4 } }}
          />
        </Box>

        <Box>
          <Box className="mb-1 flex justify-between">
            <Typography variant="body2">XP progressi (bosqich {level})</Typography>
            <Typography variant="body2" fontWeight={600}>{xp % 500}/500</Typography>
          </Box>
          <LinearProgress
            variant="determinate" value={((xp % 500) / 500) * 100}
            sx={{ height: 8, borderRadius: 4, bgcolor: "#E5E7EB", "& .MuiLinearProgress-bar": { bgcolor: "#7c3aed", borderRadius: 4 } }}
          />
        </Box>
      </Paper>

      {/* Uy vazifalari natijalari */}
      <Paper className="p-4">
        <Typography variant="subtitle1" fontWeight={700} className="mb-3">
          Uy vazifalari natijalari
        </Typography>
        {answers.length === 0 ? (
          <Typography color="text.secondary" variant="body2">Hali topshirilgan uy vazifasi yo'q</Typography>
        ) : (
          <div className="space-y-2">
            {answers.map((a) => (
              <Box key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <Box>
                  <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {a.homework?.title ?? `Vazifa #${a.homeworkId}`}
                  </Typography>
                  {a.result && (
                    <Typography variant="caption" color="success.main" display="block">
                      Baho: {a.result.grade}/100
                    </Typography>
                  )}
                </Box>
                <Chip
                  label={a.status === "ACCEPTED" ? "Qabul" : a.status === "REJECTED" ? "Rad" : a.status === "CHECKED" ? "Tekshirildi" : "Kutilmoqda"}
                  size="small"
                  color={a.status === "ACCEPTED" ? "success" : a.status === "REJECTED" ? "error" : "warning"}
                />
              </Box>
            ))}
          </div>
        )}
      </Paper>
    </div>
  );
}
