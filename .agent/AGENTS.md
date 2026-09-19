# Agents Master Instructions

> Read all project agent documentation before modifying code.

**Mandatory Reading Order:**
1. `AGENTS.md`
2. `PROJECT.md`
3. `MEMORY.md`
4. `ARCHITECTURE.md`
5. `DATABASE.md`
6. `SUPABASE.md`
7. `SECURITY.md`
8. `STYLE.md`
9. `UI_UX.md`
10. `CODING_STANDARDS.md`
11. `PHASES.md`

## Core Rules
- **UI Design Workflow:** You must use the connected **Stitch MCP Server** for all UI design and screen generation tasks.
- **Never make destructive changes without justification.**
- **Never delete working functionality to solve an unrelated problem.**
- **Never redesign working UI without instruction.**
- **Never change database schema casually.**
- **Never expose secrets.**
- **Never put service-role credentials into frontend code.**
- **Never invent employee data.** (Use only approved test records).
- **Never modify production databases unless explicitly instructed.**
- **Investigate existing implementation before changing it.**
- **Preserve previous working functionality.**
- **Verify changes after implementation.**
- **Update documentation when architecture changes.**
- **Record important decisions in `DECISIONS.md`.**
- **Update `MEMORY.md` when permanent requirements are established.**
- **Update `CHANGELOG.md` after meaningful implementation work.**

### Important Project Constraints
- **Do not overbuild:** This project is deliberately small. Do not transform it into an HRMS, employee attendance system, CRM, enterprise visitor-management platform, access-control hardware system, biometric system, or security surveillance platform unless requested later.
- **Do not assume:** Never assume Supabase credentials, table names, organisation departments, employee names, WhatsApp API credentials, production URL, or admin credentials. Ask or inspect before implementation.
- **Protect existing systems:** Do not connect to or modify the existing production Supabase/HRMS database during this project unless explicitly authorised.
