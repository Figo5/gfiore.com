import { readProfile } from "../../profile-store";

export async function GET() {
  return Response.json(await readProfile());
}

export async function PUT() {
  return Response.json({ error: "Edit content/favorites.json in GitHub to update favorites." }, {
    status: 405,
    headers: { Allow: "GET", "Cache-Control": "no-store" },
  });
}
