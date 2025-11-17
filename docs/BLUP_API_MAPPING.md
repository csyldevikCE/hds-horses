# BLUP API Field Mapping Analysis

## API Response Example
```json
{
  "name": "My Hawk's Quaterheat (SWB)",
  "sex": "S",
  "born_year": 2020,
  "regno": "04201515",
  "stud_book_no": "",
  "color": "fux",
  "chip_number": "752098100989304",
  "life_no": "752004042001515",
  "foreign_no": "",
  "owner": "My's Stuteri och Kennel AB",
  "breeder": "My's Stuteri och Kennel AB och Ilse Ekenborn",
  "wffs": 1,
  "rating_text": null,
  "url": "https://blup.staging.standoutapp.se/horses/328945-my-hawks-quaterheat-swb",
  "genealogy": {
    "father": { /* 4-generation tree */ },
    "mother": { /* 4-generation tree */ }
  }
}
```

## Field Mapping: BLUP API → HDS Horses Database

### ✅ **Directly Mapped Fields**

| BLUP API Field | HDS Database Field | Transformation | Status |
|----------------|-------------------|----------------|---------|
| `name` | `horses.name` | Direct copy | ✅ Implemented |
| `born_year` | `horses.birth_year` | Direct copy | ✅ Implemented |
| `color` | `horses.color` | Direct copy | ✅ Implemented |
| `sex` | `horses.gender` | S→Stallion, M→Mare, G→Gelding | ✅ Implemented |
| `name` (parsed) | `horses.breed` | Extract from "(SWB)" suffix | ✅ Implemented |

### 🔧 **Partially Mapped Fields**

| BLUP API Field | HDS Database Field | Current Implementation | Notes |
|----------------|-------------------|----------------------|-------|
| `genealogy.father` | `horses.pedigree_sire` | ✅ Mapped | Full 4-gen tree |
| `genealogy.mother` | `horses.pedigree_dam` | ✅ Mapped | Full 4-gen tree |
| `genealogy.father.father` | `horses.pedigree_sire_sire` | ✅ Mapped | Generation 3 |
| `genealogy.father.mother` | `horses.pedigree_sire_dam` | ✅ Mapped | Generation 3 |
| `genealogy.mother.father` | `horses.pedigree_dam_sire` | ✅ Mapped | Generation 3 |
| `genealogy.mother.mother` | `horses.pedigree_dam_dam` | ✅ Mapped | Generation 3 |
| `genealogy.*.*.*` | `horses.pedigree_*_*_*` | ✅ Mapped | Generation 4 (8 fields) |

### ❌ **Unmapped BLUP Fields (Available but Not Stored)**

| BLUP API Field | Type | Suggested Use | Priority |
|----------------|------|---------------|----------|
| `regno` | string | Registration number | 🔴 HIGH - Should store |
| `stud_book_no` | string | Studbook number | 🟡 MEDIUM |
| `chip_number` | string | Microchip number | 🔴 HIGH - Health record |
| `life_no` | string | Life number | 🟡 MEDIUM |
| `foreign_no` | string | Foreign registration | 🟢 LOW |
| `owner` | string | Current owner name | 🟡 MEDIUM - May differ from org |
| `breeder` | string | Breeder name | 🟡 MEDIUM |
| `wffs` | number | WFFS status (genetic) | 🔴 HIGH - Health record |
| `rating_text` | string | Performance rating | 🟢 LOW |
| `url` | string | BLUP system URL | 🟢 LOW - Could link back |

### 📝 **Missing BLUP Fields (HDS Has, BLUP Doesn't)**

| HDS Database Field | Current Behavior | Notes |
|-------------------|------------------|-------|
| `horses.height` | Not in API response | User must enter manually |
| `horses.weight` | Not in API response | User must enter manually |
| `horses.price` | Not in API response | User must enter manually |
| `horses.status` | Not in API response | Defaults to "Available" |
| `horses.description` | Not in API response | User must enter manually |
| `horses.location` | Not in API response | User must enter manually |
| `horses.training_level` | Not in API response | User must enter manually |
| `horses.training_disciplines` | Not in API response | User must enter manually |
| `horses.health_*` | Not in API response | Separate health management |

## Recommendations

### 🔴 **HIGH PRIORITY - Immediate Action**

1. **Add Regno Field to Database**
   - Add `horses.regno` (TEXT, UNIQUE, INDEXED)
   - Store BLUP registration number for future lookups
   - Enable "Refresh from BLUP" functionality

2. **Add Chip Number to Database**
   - Add `horses.chip_number` (TEXT)
   - Microchip is critical for identification

3. **Add WFFS Status to Database**
   - Add `horses.wffs_status` (INTEGER or BOOLEAN)
   - Warmblood Fragile Foal Syndrome is critical genetic info

### 🟡 **MEDIUM PRIORITY - Near Future**

4. **Add Studbook Fields**
   - Add `horses.stud_book_no` (TEXT)
   - Add `horses.life_no` (TEXT)
   - Important for breeding records

5. **Add Breeder/Owner Fields**
   - Add `horses.breeder` (TEXT)
   - Add `horses.original_owner` (TEXT)
   - Historical record keeping

### 🟢 **LOW PRIORITY - Nice to Have**

6. **Add BLUP Reference**
   - Add `horses.blup_url` (TEXT)
   - Link back to BLUP system
   - Add `horses.last_blup_sync` (TIMESTAMP)

7. **Add Foreign Registration**
   - Add `horses.foreign_regno` (TEXT)
   - For internationally registered horses

## Current Implementation Status

### ✅ **What Works Now**
- ✅ Name import with breed extraction
- ✅ Birth year import
- ✅ Color import
- ✅ Gender mapping (S/M/G → Stallion/Mare/Gelding)
- ✅ Complete 4-generation pedigree import (14 fields)
- ✅ Error handling and validation
- ✅ User feedback (success/error messages)
- ✅ Available in both Create and Edit forms

### ⚠️ **Current Limitations**
- ⚠️ Regno/chip_number/wffs data fetched but not stored
- ⚠️ No way to "refresh" existing horse data from BLUP
- ⚠️ No tracking of when data was last synced
- ⚠️ Breed extraction is simple (may fail on complex names)

### 🚀 **Future Enhancements**
1. Add regno field → enable "Refresh from BLUP" button on horse detail pages
2. Store chip_number → display in health records
3. Store WFFS status → display in pedigree/breeding info
4. Add last_sync timestamp → show data freshness
5. Improve breed extraction logic
6. Add option to link/unlink from BLUP system

## Database Migration Needed

```sql
-- Migration: Add BLUP integration fields
ALTER TABLE horses
  ADD COLUMN regno TEXT UNIQUE,
  ADD COLUMN chip_number TEXT,
  ADD COLUMN wffs_status INTEGER DEFAULT NULL,
  ADD COLUMN stud_book_no TEXT,
  ADD COLUMN life_no TEXT,
  ADD COLUMN breeder TEXT,
  ADD COLUMN original_owner TEXT,
  ADD COLUMN blup_url TEXT,
  ADD COLUMN last_blup_sync TIMESTAMP DEFAULT NULL;

-- Create index for quick lookup by regno
CREATE INDEX idx_horses_regno ON horses(regno) WHERE regno IS NOT NULL;

-- Create index for chip number lookup
CREATE INDEX idx_horses_chip_number ON horses(chip_number) WHERE chip_number IS NOT NULL;
```

## blupService.ts Updates Needed

```typescript
export interface BlupHorseData {
  // ... existing fields ...

  // ADD THESE:
  regno: string;
  chipNumber?: string;
  wffsStatus?: number;
  studBookNo?: string;
  lifeNo?: string;
  breeder?: string;
  owner?: string;
  blupUrl?: string;
}
```

## Form Updates Needed

After database migration, update forms to:
1. Display regno (read-only) if imported from BLUP
2. Display chip_number in health section
3. Display WFFS status with explanation
4. Store all fetched data in database

---

**Last Updated**: November 17, 2025
**Status**: Implementation complete, database enhancement recommended
