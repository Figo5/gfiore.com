import { readGitHubSnapshot } from "../../github-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await readGitHubSnapshot();
  return Response.json(snapshot, {
    status: snapshot.fetchedAt ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
