export interface Promo {
  label: string;
  url: string | null;
}

export type ProfileRole = "member" | "verified_expert" | "admin";

export interface Post {
  id: string;
  title: string;
  body: string | null;
  author: string; // profiles.display_name, joined at read time
  authorId: string;
  authorRole: ProfileRole;
  authorExpertType: string | null;
  authorAvatarUrl: string | null;
  topicId: string;
  state: string | null;
  promo: Promo | null;
  imageUrl: string | null;
  videoUrl: string | null;
  score: number;
  views: number;
  createdAt: number;
  circleId: string | null;
  circleName: string | null;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  state: string | null;
  createdBy: string;
  pinnedPostId: string | null;
  memberCount: number;
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  author: string;
  authorId: string;
  authorRole: ProfileRole;
  authorExpertType: string | null;
  authorAvatarUrl: string | null;
  body: string;
  score: number;
  createdAt: number;
}

export type ReportTargetType = "post" | "comment" | "user";
export type ReportStatus = "pending" | "reviewed" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: number;
  reviewedBy: string | null;
  reviewedAt: number | null;
}

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: ProfileRole;
  expertType: string | null;
  createdAt: number;
}

export interface BlockedUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  blockedAt: number;
}

export interface AdminMember {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: ProfileRole;
  state: string | null;
  createdAt: number;
}

export interface AdminBlockRecord {
  blockerId: string;
  blockerName: string;
  blockedId: string;
  blockedName: string;
  createdAt: number;
}

export interface AdminStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalPosts: number;
  newPostsToday: number;
  newPostsThisWeek: number;
  totalComments: number;
  newCommentsToday: number;
  newCommentsThisWeek: number;
  pendingReports: number;
  pendingExpertApplications: number;
  usersByState: { state: string; count: number }[];
  postsByTopic: { topicId: string; count: number }[];
}

export type ExpertApplicationStatus = "pending" | "approved" | "rejected";

export interface ExpertApplication {
  id: string;
  applicantId: string;
  expertType: string;
  credentialInfo: string;
  filePath: string | null;
  status: ExpertApplicationStatus;
  submittedAt: number;
  reviewedBy: string | null;
  reviewedAt: number | null;
}

export type Role =
  | { role: "admin" }
  | { role: "verified_expert"; expertType: string };

export interface Tier {
  id: string;
  label: string;
  posts: number;
  comments: number;
}
