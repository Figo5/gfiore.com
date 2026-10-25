import Portfolio from "./Portfolio";
import { readProfile } from "./profile-store";
import { readGitHubSnapshot } from "./github-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ profile }, github] = await Promise.all([readProfile(), readGitHubSnapshot()]);
  return <Portfolio initialProfile={profile} github={github} />;
}
