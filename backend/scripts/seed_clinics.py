import csv
import os
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

# Load connection string from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

INCLUDED_TYPES = {
    'Clinic',
    'Community Health Centre',
    'District Hospital',
    'Regional Hospital'
}

def clean_name(name):
    """Strip the 2-3 character prefix from OU names.
    e.g. 'ec Afsondering Clinic' -> 'Afsondering Clinic'
    """
    if not name:
        return name
    parts = name.split(' ', 1)
    if len(parts[0]) <= 3:
        return parts[1] if len(parts) > 1 else name
    return name

def parse_date(date_str):
    """Parse a date string in YYYY-MM-DD format, returning None if empty."""
    if not date_str or date_str.strip() == '':
        return None
    try:
        return datetime.strptime(date_str.strip(), '%Y-%m-%d').date()
    except ValueError:
        return None

def seed_clinics():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    seen_ou5 = set()
    inserted = 0
    skipped_duplicate = 0
    skipped_closed = 0
    skipped_type = 0

    with open('backend/data/health_facilities.csv', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            ou5_uid    = row['OU5uid'].strip()
            closed_date = parse_date(row['closeddate'])
            org_unit_type = row['OrgUnitType'].strip()

            # Skip closed facilities
            if closed_date is not None:
                skipped_closed += 1
                continue

            # Skip excluded facility types
            if org_unit_type not in INCLUDED_TYPES:
                skipped_type += 1
                continue

            # Skip if we've already inserted this OU5 (deduplicate)
            if ou5_uid in seen_ou5:
                skipped_duplicate += 1
                continue

            seen_ou5.add(ou5_uid)

            name               = clean_name(row['OU5name'])
            province           = clean_name(row['OU2name'])
            district           = clean_name(row['OU3name'])
            municipality       = clean_name(row['OU4name'])
            service_point_type = row['ServicePointType'].strip()
            rural_urban        = row['OrgUnitRuralUrban'].strip()

            cur.execute("""
                INSERT INTO clinic (
                    clinic_name,
                    province,
                    district,
                    municipality,
                    org_unit_type,
                    service_point_type,
                    rural_urban,
                    closed_date
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                name,
                province,
                district,
                municipality,
                org_unit_type,
                service_point_type,
                rural_urban,
                closed_date
            ))

            inserted += 1

    conn.commit()
    cur.close()
    conn.close()

    print(f"Seeding complete!")
    print(f"  Inserted:           {inserted}")
    print(f"  Skipped duplicates: {skipped_duplicate}")
    print(f"  Skipped closed:     {skipped_closed}")
    print(f"  Skipped by type:    {skipped_type}")

if __name__ == '__main__':
    seed_clinics()
