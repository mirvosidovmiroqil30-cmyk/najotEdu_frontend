"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CardGiftcardRounded from "@mui/icons-material/CardGiftcardRounded";
import { PageHeader } from "@/components/ui";

export default function GiftsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Sovg'alar" subtitle="Talabalar uchun sovg'alar tizimi" />
      <Paper className="flex flex-col items-center gap-4 p-16 text-center">
        <CardGiftcardRounded sx={{ fontSize: 72, color: "#D1D5DB" }} />
        <Box>
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            Sovg'alar tizimi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bu bo'lim tez orada ishga tushiriladi.
          </Typography>
        </Box>
      </Paper>
    </div>
  );
}
