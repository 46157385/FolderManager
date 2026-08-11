import { readonly } from 'vue'

import type { LearningStatus, LearningStatusRecord } from '@/types/learning'
import { useSyncedStorageState } from './useSyncedStorageState'

type LearningStatusRecords = Record<string, LearningStatusRecord>

const records = useSyncedStorageState<LearningStatusRecords>({
  key: 'folder-manager:learning-status',
  fallback: {},
  cloudKey: 'learning',
  merge: mergeLearningStatusRecords,
})

export function useLearningStatus() {
  function getLearningStatus(materialId: string): LearningStatus {
    return records.value[materialId]?.status ?? 'not_started'
  }

  function setLearningStatus(materialId: string, status: LearningStatus) {
    records.value = {
      ...records.value,
      [materialId]: {
        materialId,
        status,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  function startLearning(materialId: string) {
    setLearningStatus(materialId, 'in_progress')
  }

  function completeLearning(materialId: string) {
    setLearningStatus(materialId, 'completed')
  }

  function resetLearning(materialId: string) {
    setLearningStatus(materialId, 'not_started')
  }

  return {
    records: readonly(records),
    getLearningStatus,
    setLearningStatus,
    startLearning,
    completeLearning,
    resetLearning,
  }
}

function mergeLearningStatusRecords(
  localValue: LearningStatusRecords,
  remoteValue: LearningStatusRecords,
) {
  const materialIds = new Set([...Object.keys(remoteValue), ...Object.keys(localValue)])
  const mergedRecords: LearningStatusRecords = {}

  for (const materialId of materialIds) {
    const localRecord = localValue[materialId]
    const remoteRecord = remoteValue[materialId]

    if (!localRecord || !remoteRecord) {
      mergedRecords[materialId] = localRecord ?? remoteRecord
      continue
    }

    mergedRecords[materialId] = selectLatestRecord(localRecord, remoteRecord)
  }

  return mergedRecords
}

function selectLatestRecord(
  localRecord: LearningStatusRecord,
  remoteRecord: LearningStatusRecord,
) {
  const updatedAtComparison = localRecord.updatedAt.localeCompare(remoteRecord.updatedAt)

  if (updatedAtComparison !== 0) {
    return updatedAtComparison > 0 ? localRecord : remoteRecord
  }

  return localRecord.status.localeCompare(remoteRecord.status) >= 0
    ? localRecord
    : remoteRecord
}
