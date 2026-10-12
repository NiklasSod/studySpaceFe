export interface ImagePoint {
  x: number
  y: number
  text: string
  audioUrl: string
}

export type UserResourceProgressStatus =
  'Current' | 'CheckLater' | 'Done' | 'Archived'

export interface Resource {
  id: number
  creatorId: string
  displayName: string
  url: string
  description?: string
  audioUrls?: string[]
  isInteractiveImage: boolean
  points: ImagePoint[]
  isStudentSubmitted: boolean
  lastEditDate: string
  uploadDate: string
  courseId: number | null
  activityId: number | null
  moduleId: number | null
}

export interface MyResource extends Resource {
  userProgressStatus: UserResourceProgressStatus
  isFavorite: boolean
}

export interface UpdateResourceProgressRequest {
  userProgressStatus?: UserResourceProgressStatus
  isFavorite?: boolean
}

export interface ResourceProgressUpdate {
  resourceId: number
  userProgressStatus: UserResourceProgressStatus
  isFavorite: boolean
}

export interface CreateResourceRequest {
  displayName: string
  url: string
  description?: string
  audioUrls?: string[]
  isInteractiveImage?: boolean
  points?: ImagePoint[]
  courseId?: number
  activityId?: number
  moduleId?: number
}

export interface UpdateResourceRequest {
  displayName?: string
  url?: string
  description?: string
  audioUrls?: string[]
  isInteractiveImage?: boolean
  points?: ImagePoint[]
}
