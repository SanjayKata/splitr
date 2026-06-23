import * as profilesRepo from "@/repositories/profiles.repository";
import type { Profile } from "@/types/database";

export function getMyProfile(): Promise<Profile | null> {
  return profilesRepo.selectMyProfile();
}

export function updateMyProfile(input: {
  displayName: string;
  defaultCurrency: string;
}): Promise<Profile> {
  return profilesRepo.updateMyProfile({
    display_name: input.displayName.trim(),
    default_currency: input.defaultCurrency,
  });
}
