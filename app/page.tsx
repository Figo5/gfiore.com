import Portfolio from "./Portfolio";
import { readProfile } from "./profile-store";
import { chatGPTSignInPath } from "./chatgpt-auth";
import { readGitHubSnapshot } from "./github-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ profile, canEdit }, github] = await Promise.all([readProfile(), readGitHubSnapshot()]);
  return <Portfolio initialProfile={profile} canEdit={canEdit} signInPath={chatGPTSignInPath("/#favorites-title")} github={github} />;
}
