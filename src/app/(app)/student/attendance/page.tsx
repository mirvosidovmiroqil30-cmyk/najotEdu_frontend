"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CancelRounded from "@mui/icons-material/CancelRounded";
import { apiGet } from "@/lib/api";
import { LoadingState, PageHeader } from "@/components/ui";
import type { Attendance } from "@/lib/types";

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Attendance[]>("/attendance/my")
      .then((data) => setAttendance(Array.isArray(data) ? data : []))
      .catch(() => setAttendance([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const total = attendance.length;
  const present = attendance.filter((a) => a.isPresent).length;
  const absent = total - present;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Davomatim" subtitle="Darsga qatnashish tarixi" />

      {/* Umumiy statistika */}
      <div className="grid grid-cols-3 gap-4">
        <Paper className="p-4 text-center">
          <Typography variant="h4" fontWeight={700} color="success.main">{present}</Typography>
          <Typography variant="caption" color="text.secondary">Kelgan</Typography>
        </Paper>
        <Paper className="p-4 text-center">
          <Typography variant="h4" fontWeight={700} color="error.main">{absent}</Typography>
          <Typography variant="caption" color="text.secondary">Kelmagan</Typography>
        </Paper>
        <Paper className="p-4 text-center">
          <Typography variant="h4" fontWeight={700}>{rate}%</Typography>
          <Typography variant="caption" color="text.secondary">Davomat</Typography>
        </Paper>
      </div>

      {/* Progress bar */}
      <Paper className="p-4">
        <Box className="mb-2 flex justify-between">
          <Typography variant="body2" fontWeight={600}>Umumiy davomat</Typography>
          <Typography variant="body2" color="text.secondary">{present}/{total}</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={rate}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: "#FEE2E2",
            "& .MuiLinearProgress-bar": {
              bgcolor: rate >= 80 ? "#16a34a" : rate >= 60 ? "#F5C400" : "#ef4444",
              borderRadius: 5,
            },
          }}
        />
      </Paper>

      {/* Davomat ro'yxati */}
      <div className="space-y-2">
        {attendance.length === 0 ? (
          <Typography color="text.secondary">Davomat ma'lumotlari topilmadi</Typography>
        ) : (
          [...attendance]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((a) => (
              <Paper key={a.id} className="flex items-center justify-between p-3">
                <Box className="flex items-center gap-3">
                  {a.isPresent ? (
                    <CheckCircleRounded color="success" />
                  ) : (
                    <CancelRounded color="error" />
                  )}
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {a.group?.name ?? `Guruh #${a.groupId}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(a.createdAt).toLocaleDateString("uz-UZ", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={a.isPresent ? "Kelgan" : "Kelmagan"}
                  size="small"
                  color={a.isPresent ? "success" : "error"}
                />
              </Paper>
            ))
        )}
      </div>
    </div>
  );
}
