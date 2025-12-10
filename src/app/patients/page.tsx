"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  PatientForm,
  PatientsTable,
  DeletePatientDialog,
  PatientDetailsDialog,
} from "@/components/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from "@/hooks/use-patients";
import { useDebounce } from "@/hooks/use-debounce";
import type { Patient } from "@/types";
import type { CreatePatientFormData } from "@/schemas/patient";
import { Plus, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const debouncedSearch = useDebounce(search, 300);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, error } = usePatients({
    page,
    pageSize: 10,
    search: debouncedSearch || undefined,
  });

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const deleteMutation = useDeletePatient();

  const handleAddPatient = () => {
    setSelectedPatient(null);
    setFormMode("create");
    setIsFormOpen(true);
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailsOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: CreatePatientFormData) => {
    if (formMode === "create") {
      await createMutation.mutateAsync(formData);
    } else if (selectedPatient) {
      await updateMutation.mutateAsync({
        id: selectedPatient.id,
        data: formData,
      });
    }
    setIsFormOpen(false);
    setSelectedPatient(null);
  };

  const handleDeleteConfirm = async () => {
    if (selectedPatient) {
      await deleteMutation.mutateAsync(selectedPatient.id);
      setIsDeleteOpen(false);
      setSelectedPatient(null);
    }
  };

  const patients = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <DashboardLayout title="Patients">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={handleAddPatient}>
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive">Failed to load patients</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please check your connection and try again.
            </p>
          </div>
        ) : (
          <>
            <PatientsTable
              patients={patients}
              onView={handleViewPatient}
              onEdit={handleEditPatient}
              onDelete={handleDeletePatient}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({data?.total} total patients)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <PatientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        patient={selectedPatient}
        mode={formMode}
      />

      <PatientDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        patient={selectedPatient}
      />

      <DeletePatientDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDeleteConfirm}
        patient={selectedPatient}
        isLoading={deleteMutation.isPending}
      />
    </DashboardLayout>
  );
}
