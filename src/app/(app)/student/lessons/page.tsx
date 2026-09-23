"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { apiGet } from "@/lib/api";
import { LoadingState, PageHeader } from "@/components/ui";
import type { Lesson, HomeworkAnswer } from "@/lib/types";

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [answers, setAnswers] = useState<HomeworkAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    Promise.all([
      apiGet<Lesson[]>("/lessons/my"),
      apiGet<HomeworkAnswer[]>("/homework-answers/my"),
    ])
      .then(([l, a]) => {
        setLessons(Array.isArray(l) ? l : []);
        setAnswers(Array.isArray(a) ? a : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const filtered = tab === 0 ? lessons : lessons.filter((l) => l.status === "ACTIVE");

  return (
    <div className="space-y-4">
      <PageHeader title="Darslarim" subtitle="Guruhlaringizga biriktirilgan darslar" />

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={`Barcha (${lessons.length})`} />
        <Tab label="Faol" />
      </Tabs>

      {filtered.length === 0 ? (
        <Typography color="text.secondary">Darslar topilmadi</Typography>
      ) : (
        <div className="space-y-2">
          {filtered.map((lesson) => {
            const myAnswers = answers.filter(
              (a) => a.homework && (a.homework as any).lessonId === lesson.id,
            );
            return (
              <Paper key={lesson.id} className="p-4">
                <Box className="flex items-start justify-between gap-4">
                  <Box>
                    <Typography fontWeight={600}>{lesson.topic}</Typography>
                    {lesson.description && (
                      <Typography variant="body2" color="text.secondary">
                        {lesson.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" className="mt-1">
                      {lesson.group?.name} ·{" "}
                      {lesson.teacher
                        ? `${lesson.teacher.firstName} ${lesson.teacher.lastName}`
                        : ""}
                    </Typography>
                  </Box>
                  <Chip
                    label={lesson.status}
                    size="small"
                    color={lesson.status === "ACTIVE" ? "success" : "default"}
                  />
                </Box>
              </Paper>
            );
          })}
        </div>
      )}
    </div>
  );
}
