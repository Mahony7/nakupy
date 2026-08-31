---
name: Shared household settings
description: Household names and copy must be stored server-side so all devices show the same values.
---

Household identity settings are shared data, not device preferences; the API/database is the source of truth, while browser storage is only a migration cache for values saved before shared persistence existed.

**Why:** Local-only settings caused names edited on one device to remain unchanged on another device.

**How to apply:** Keep server settings loading ahead of local values; migrate legacy local settings once when the server has not been configured yet.