// D1 schema is managed by the ordered SQL files in migrations/.
export const TABLES = [
  'trips', 'users', 'quest_themes', 'quest_variants', 'quest_assignments',
  'group_quest_assignments', 'votes', 'group_votes', 'final_quest_candidates',
  'final_quest_assignments', 'reports', 'report_approvals', 'penalties',
  'face_enrollments', 'photos', 'photo_tags', 'photo_jobs', 'gallery_events',
] as const
