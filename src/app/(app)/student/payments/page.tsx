"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import PaymentRounded from "@mui/icons-material/PaymentRounded";
import { PageHeader } from "@/components/ui";

export default function StudentPaymentsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="To'lovlarim" subtitle="To'lov tarixi va ma'lumotlar" />
      <Paper className="flex flex-col items-center gap-4 p-12 text-center">
        <PaymentRounded sx={{ fontSize: 64, color: "#D1D5DB" }} />
        <Box>
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            To'lov tizimi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bu bo'lim tez orada ishga tushiriladi.
          </Typography>
        </Box>
      </Paper>
    </div>
  );
}
