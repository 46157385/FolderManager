export type LearningStatus = 'not_started' | 'in_progress' | 'completed'

export type LearningStatusFilter = 'all' | LearningStatus

export interface LearningStatusRecord {
  materialId: string
  status: LearningStatus
  updatedAt: string
}
