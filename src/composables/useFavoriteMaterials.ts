import { computed } from "vue";

import { useSyncedStorageState } from "./useSyncedStorageState";

const favoriteIds = useSyncedStorageState<string[]>({
  key: "folder-manager:favorites",
  fallback: [],
  cloudKey: "favorites",
  merge: mergeFavoriteIds,
});

export function useFavoriteMaterials() {
  const favoriteIdSet = computed(() => new Set(favoriteIds.value));

  function isFavorite(materialId: string) {
    return favoriteIdSet.value.has(materialId);
  }

  function toggleFavorite(materialId: string) {
    if (isFavorite(materialId)) {
      favoriteIds.value = favoriteIds.value.filter((id) => id !== materialId);
      return;
    }

    favoriteIds.value = [...favoriteIds.value, materialId];
  }

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
  };
}

function mergeFavoriteIds(localValue: string[], remoteValue: string[]) {
  return Array.from(new Set([...remoteValue, ...localValue]));
}
