"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import SendRounded from "@mui/icons-material/SendRounded";
import { PageHeader } from "@/components/ui";

export default function MessagesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Xabar Yuborish" subtitle="Foydalanuvchilarga xabar yuborish" />
      <Paper className="flex flex-col items-center gap-4 p-16 text-center">
        <SendRounded sx={{ fontSize: 72, color: "#D1D5DB" }} />
        <Box>
          <Typography variant="h6" fontWeight={700} color="text.secondary">Xabar tizimi</Typography>
          <Typography variant="body2" color="text.secondary">Bu bo'lim tez orada ishga tushiriladi.</Typography>
        </Box>
      </Paper>
    </div>
  );
}
