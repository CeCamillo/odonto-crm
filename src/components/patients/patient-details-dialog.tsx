"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Patient } from "@/types";
import { Mail, Phone, MapPin, Calendar, FileText } from "lucide-react";

interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

export function PatientDetailsDialog({
  open,
  onOpenChange,
  patient,
}: PatientDetailsDialogProps) {
  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{patient.name}</DialogTitle>
          <DialogDescription>Patient Information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{patient.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{patient.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium">
                {format(new Date(patient.dateOfBirth), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {patient.address && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            </div>
          )}

          {patient.medicalHistory && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Medical History</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {patient.medicalHistory}
                  </p>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Added: {format(new Date(patient.createdAt), "MMM d, yyyy")}
            </span>
            <span>
              Updated: {format(new Date(patient.updatedAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
