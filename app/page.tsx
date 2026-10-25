import Portfolio from "./Portfolio";
import { readProfile } from "./profile-store";
import { chatGPTSignInPath } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { profile, canEdit } = await readProfile();
  return <Portfolio initialProfile={profile} canEdit={canEdit} signInPath={chatGPTSignInPath("/#favorites-title")} />;
}
