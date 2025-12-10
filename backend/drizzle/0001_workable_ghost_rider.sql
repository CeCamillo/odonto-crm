CREATE INDEX "appointments_patient_id_idx" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointments_start_time_idx" ON "appointments" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_start_end_idx" ON "appointments" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "patients_name_idx" ON "patients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "patients_email_idx" ON "patients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "patients_created_at_idx" ON "patients" USING btree ("created_at");