import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetHouseholdSettingsResponse,
  UpdateHouseholdSettingsBody,
  UpdateHouseholdSettingsResponse,
} from "@workspace/api-zod";
import { db, householdSettingsTable } from "@workspace/db";

const router: IRouter = Router();

const defaults = {
  configured: false,
  myName: "Ja",
  partnerName: "Manželka",
  togetherSince: "2024",
  headline: "Peniaze bez ťažkých slov.",
  description: "Malý priestor pre naše veľké aj každodenné spoločné rozhodnutia.",
};

async function getOrCreateSettings() {
  const [existing] = await db
    .select()
    .from(householdSettingsTable)
    .where(eq(householdSettingsTable.id, 1));

  if (existing) return existing;

  const [created] = await db
    .insert(householdSettingsTable)
    .values({ id: 1, ...defaults })
    .returning();
  return created;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(GetHouseholdSettingsResponse.parse(settings));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateHouseholdSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid household settings");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const settings = await getOrCreateSettings();
  const [updated] = await db
    .update(householdSettingsTable)
    .set({ ...parsed.data, configured: true })
    .where(eq(householdSettingsTable.id, settings.id))
    .returning();

  res.json(UpdateHouseholdSettingsResponse.parse(updated));
});

export default router;