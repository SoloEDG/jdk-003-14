import type { BranchId, CardInstance } from "@/shared/domain";
import { createCard, createBranchedCard } from "@/shared/branches";

export function starter(): CardInstance[] {
  return [
    "strike",
    "strike",
    "strike",
    "guard",
    "guard",
    "venom",
    "focus",
    "shelter",
  ].map((key) => createCard(key));
}

export { createCard, createBranchedCard };

export function makeCard(key: string, branch: BranchId | null): CardInstance {
  return createBranchedCard(key, branch);
}

export function canRemove(size: number) {
  return size > 5;
}
