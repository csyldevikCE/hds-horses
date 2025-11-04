# Vaccination Management System

## Overview

Complete FEI-compliant vaccination tracking system for horses, built with comprehensive record-keeping and compliance monitoring features.

## Features Implemented

### 1. Database Schema (`030_create_vaccinations_table.sql`)

**Vaccinations Table:**
- Horse and organization scoping with foreign keys
- Vaccine details: type, brand name, dose number
- Date tracking: administered date, next due date
- Veterinarian information: name and license
- Traceability: batch/lot numbers
- FEI compliance: passport and FEI App recording flags
- Full audit trail with created_at/updated_at timestamps

**RLS Policies:**
- Users can view vaccinations for horses in their organization
- Admins can create/update/delete vaccination records
- Read-only users have view-only access

**Helper Function:**
- `get_fei_influenza_compliance_status()` - Checks FEI compliance status for equine influenza vaccinations
- Returns: compliant, due_soon, overdue, incomplete_primary, not_applicable

### 2. Vaccination Service (`src/services/vaccinationService.ts`)

**Core Functions:**
- `getVaccinations()` - Get all vaccinations for a horse
- `getVaccinationsByType()` - Filter by vaccine type
- `createVaccination()` - Record new vaccination
- `updateVaccination()` - Update existing record
- `deleteVaccination()` - Remove vaccination record
- `getFEIInfluenzaComplianceStatus()` - Get FEI compliance status with detailed message

**FEI Logic:**
- `calculateFEINextDueDate()` - Auto-calculates next due dates based on FEI protocol
  - V1 → V2: 30 days (middle of 21-60 day range)
  - V2 → V3: 6 months + 21 days
  - V3/Boosters: 6 months + 21 days (competition eligibility)
- `getVaccinationStatus()` - Returns compliant/due_soon/overdue/unknown

**Vaccine Types:**
- Equine Influenza (with FEI protocol support)
- Tetanus
- EHV (Equine Herpesvirus)
- Rabies
- West Nile Virus
- Eastern/Western Equine Encephalomyelitis
- Strangles
- Potomac Horse Fever
- Botulism
- Custom

### 3. Vaccination Manager Component (`src/components/VaccinationManager.tsx`)

**Features:**
- Dialog-based form for adding vaccinations
- FEI-specific dose number options (V1, V2, V3, Booster)
- Auto-calculation of next due dates for FEI Influenza
- Manual override for custom due dates
- Veterinarian information capture
- Batch/lot number tracking for traceability
- Notes field for reactions or additional info
- FEI compliance checkboxes (passport, FEI App)
- FEI requirements banner with educational information
- Form validation (required fields: vaccine type, administered date)

### 4. Vaccination Log Component (`src/components/VaccinationLog.tsx`)

**Features:**
- Grouped display by vaccine type
- FEI Equine Influenza compliance status card
- Individual vaccination records with:
  - Dose number and vaccine brand badges
  - Administered date
  - Next due date with status indicator (Current, Due Soon, Overdue)
  - Veterinarian name and license
  - Batch number
  - Notes in styled container
  - FEI compliance badges (In Passport, In FEI App)
- Delete functionality for admins with confirmation dialog
- Empty state with helpful messaging
- Real-time status calculations
- Color-coded badges (green/amber/red)

### 5. Health Tab Integration (`src/pages/HorseDetail.tsx`)

**Layout:**
1. Basic Health Status card (Coggins, Last Vet Check)
2. **Vaccination Records card** (NEW)
   - Add Vaccination button (admin only)
   - Vaccination log display
3. X-Ray Records card

## FEI Compliance Rules (2024+)

### Primary Course (Starting from January 1, 2024)
1. **V1**: Day 0
2. **V2**: Between 21-60 days after V1
3. **V3** (First Booster): Within 6 months + 21 days after V2

### Subsequent Boosters
- Must be given within **12 months** of previous booster
- For **competition eligibility**: Last booster must be within **6 months + 21 days** before arrival

### Important Restrictions
- ⚠️ Vaccination must **NOT** be administered within **7 days** before event arrival
- 📋 Must be recorded in horse passport
- 📱 From **February 1, 2025**: Must also be recorded in **FEI HorseApp** by veterinarian

### Compliance Statuses
- **Compliant**: All requirements met, next booster not due for >30 days
- **Due Soon**: Next booster due within 30 days
- **Overdue**: Next booster past due date
- **Incomplete Primary**: Missing V1, V2, or V3
- **Not Applicable**: No influenza vaccinations recorded

## User Experience

### Admin Flow
1. Navigate to horse detail page → Health tab
2. Click "Add Vaccination" button
3. Fill in vaccination details:
   - Select vaccine type (auto-shows FEI info for Equine Influenza)
   - Select dose number (FEI-specific options for Influenza)
   - Enter administered date
   - Next due date auto-calculates (can override)
   - Optional: Veterinarian info, batch number, notes
   - For FEI Influenza: Check passport/FEI App recording
4. Click "Record Vaccination"
5. View vaccination log with real-time compliance status

### Read-Only User Flow
1. Navigate to horse detail page → Health tab
2. View vaccination records (cannot add/delete)
3. See FEI compliance status
4. Review historical vaccination records

## Database Migration Instructions

Run this migration in your Supabase SQL Editor:

```sql
-- Execute the entire contents of:
database/migrations/030_create_vaccinations_table.sql
```

This creates:
- `vaccinations` table with all fields
- Indexes for performance
- RLS policies for security
- Update trigger for timestamps
- FEI compliance helper function

## Files Created/Modified

### New Files
- `database/migrations/030_create_vaccinations_table.sql` - Database schema
- `src/services/vaccinationService.ts` - Service layer (298 lines)
- `src/components/VaccinationManager.tsx` - Add vaccination dialog (391 lines)
- `src/components/VaccinationLog.tsx` - Display vaccination history (310 lines)
- `docs/VACCINATION_SYSTEM.md` - This documentation

### Modified Files
- `src/lib/supabase.ts` - Added Vaccination database types
- `src/pages/HorseDetail.tsx` - Integrated vaccination components into Health tab

## Future Enhancements

1. **Email Reminders**: Send notifications when boosters are due soon
2. **Export to PDF**: Generate vaccination certificates
3. **Bulk Import**: Import vaccination records from CSV
4. **Vaccine Protocol Templates**: Pre-defined schedules for common vaccines
5. **Multi-Horse Vaccination Sessions**: Record vaccinations for multiple horses at once
6. **Geolocation Support**: Track where vaccinations were administered
7. **Photo Upload**: Attach photos of vaccination certificates/batch labels
8. **Integration with FEI HorseApp API**: Direct sync with FEI systems (if API becomes available)

## References

- [FEI Official Vaccination Rules](https://inside.fei.org/fei/your-role/veterinarians/biosecurity-movements/vaccinations)
- [BSPS FEI Requirements](https://bsps.com/fei-equine-influenza-vaccination-requirements-1-1-24)
- [FEI Veterinary Regulations 2024](https://araujoequinevet.com/ficheiros/FEI-Veterinary-Regulations-2024.pdf)

---

**Version**: 1.0
**Date**: 2024
**Status**: Ready for Production
