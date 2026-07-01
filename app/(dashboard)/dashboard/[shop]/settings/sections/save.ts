/** Persist a section blob to shop_config[key]. Returns success. */
export async function saveConfig(shopSlug: string, key: string, value: unknown): Promise<boolean> {
  try {
    const res = await fetch(`/api/shops/${shopSlug}/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
