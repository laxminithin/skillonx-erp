# Live QA seed (production / staging)

Idempotent bootstrap for portal QA on `survey.skillonx.net` when the full demo snapshot was never restored.

## Why `seed:student-lms-e2e` failed

That script expects college **code `VVIET`** plus Anita and CSE masters. Production often has neither (and never guaranteed `id=4`).

## Run on the VPS

```bash
cd /var/www/vhosts/skillonx.net/survey.skillonx.net

# In .env (temporary):
# ALLOW_TEST_SEED=true
# MOBILE_E2E_STUDENT_PASSWORD=Student@123

git pull   # get seed:live-qa
npm install
npm run migrate
ALLOW_TEST_SEED=true MOBILE_E2E_STUDENT_PASSWORD='Student@123' npm run seed:live-qa
```

Then **remove `ALLOW_TEST_SEED`** from production `.env`.

## Credentials after seed

| Portal | Login | Password | Path |
|--------|-------|----------|------|
| Super Admin / Platform | `admin@skillonx.com` | `Password123` | `/platform` |
| College Admin | `collegeadmin@vviet.edu.in` | `Password123` | `/admin` |
| Faculty | `anita@vviet.edu.in` | `Password123` | `/dashboard` |
| Substitute faculty | `ravi@vviet.edu.in` | `Password123` | `/dashboard` |
| Management | `qa.management@vviet.edu.in` | `Password123` | `/management` |
| HOD | `qa.hod.cse@vviet.edu.in` | `Password123` | `/hod` |
| Principal | `qa.principal@vviet.edu.in` | `Password123` | `/principal` |
| Student LMS | `e2e.approved@student.skillonx.test` / USN `4VV24CS001` | `Student@123` | `/lms/login` |

Join URL for the E2E class is printed by the seed (`SX-E2E-CSE-3A`).

## Safety

- Does **not** wipe tables (unlike `npm run seed` / `ALLOW_PRODUCTION_SEED=1`).
- Upserts VVIET + known QA users and resets their passwords to the values above.
- Student LMS pack is scoped to the VVIET college resolved by **code**, not hardcoded PK.
