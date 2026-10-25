import { DEFAULT_PROFILE } from "./profile-types";

// All personal content is versioned in GitHub. Production has no write endpoint.
export async function readProfile() {
  return { profile: structuredClone(DEFAULT_PROFILE), canEdit: false };
}
