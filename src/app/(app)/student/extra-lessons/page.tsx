"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LibraryBooksRounded from "@mui/icons-material/LibraryBooksRounded";
import { PageHeader } from "@/components/ui";

export default function StudentExtraLessonsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Qo'shimcha darslar" subtitle="Mustaqil o'rganish uchun materiallar" />
      <Paper className="flex flex-col items-center gap-4 p-12 text-center">
        <LibraryBooksRounded sx={{ fontSize: 64, color: "#D1D5DB" }} />
        <Box>
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            Qo'shimcha darslar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bu bo'lim tez orada ishga tushiriladi.
          </Typography>
        </Box>
      </Paper>
    </div>
  );
}
