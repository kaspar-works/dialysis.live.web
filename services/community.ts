import { authFetch } from './auth';

// ========================
// Types
// ========================

export type HCPBadgeType =
  | 'nephrologist'
  | 'nurse'
  | 'dietitian'
  | 'social_worker'
  | 'pharmacist'
  | 'technician'
  | 'other';

export type ForumPostStatus = 'active' | 'hidden' | 'flagged';
export type ForumReplyStatus = 'active' | 'hidden' | 'flagged';
export type StoryStatus = 'pending' | 'published' | 'hidden' | 'rejected';
export type HCPVerificationStatus = 'pending' | 'approved' | 'rejected' | 'more_info_needed';
export type MilestoneType =
  | 'dialysis_anniversary'
  | 'transplant'
  | 'health_improvement'
  | 'lifestyle_achievement'
  | 'personal_goal'
  | 'other';
export type ReportReason = 'spam' | 'harassment' | 'misinformation' | 'inappropriate' | 'personal_info' | 'other';

export interface CommunityProfile {
  _id: string;
  userId?: string;
  displayName: string;
  displayNameSlug: string;
  bio?: string;
  avatarUrl?: string;
  isHCP: boolean;
  hcpVerified: boolean;
  hcpBadgeType?: HCPBadgeType;
  totalPosts: number;
  totalReplies: number;
  totalHelpful: number;
  joinedCommunityAt: string;
  lastActiveAt: string;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  isHCPOnly: boolean;
  postCount: number;
  lastPostAt?: string;
}

export interface ForumPost {
  _id: string;
  categoryId: string | ForumCategory;
  authorId: string | CommunityProfile;
  title: string;
  slug: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  isHidden: boolean;
  viewCount: number;
  replyCount: number;
  helpfulCount: number;
  lastReplyAt?: string;
  status: ForumPostStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  _id: string;
  postId: string;
  authorId: string | CommunityProfile;
  parentReplyId?: string;
  content: string;
  isHCPResponse: boolean;
  isAcceptedAnswer: boolean;
  helpfulCount: number;
  isHidden: boolean;
  isEdited: boolean;
  editedAt?: string;
  status: ForumReplyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SuccessStory {
  _id: string;
  authorId: string | CommunityProfile;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  photoUrls: string[];
  tags: string[];
  milestoneType?: MilestoneType;
  dialysisDuration?: string;
  status: StoryStatus;
  submittedAt: string;
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HCPVerificationRequest {
  _id: string;
  status: HCPVerificationStatus;
  badgeType: HCPBadgeType;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

// ========================
// Community Profile API
// ========================

export async function getCommunityProfile(): Promise<{ profile: CommunityProfile | null; hasProfile: boolean }> {
  const result = await authFetch('/community/profile');
  return result.data;
}

export async function createCommunityProfile(data: {
  displayName: string;
  bio?: string;
}): Promise<CommunityProfile> {
  const result = await authFetch('/community/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.profile;
}

export async function updateCommunityProfile(data: {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<CommunityProfile> {
  const result = await authFetch('/community/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.profile;
}

export async function getPublicProfile(slug: string): Promise<CommunityProfile> {
  const result = await authFetch(`/community/profile/${slug}`);
  return result.data.profile;
}

export async function checkDisplayNameAvailability(
  displayName: string
): Promise<{ available: boolean; slug: string; reason?: string }> {
  const result = await authFetch('/community/profile/check-name', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });
  return result.data;
}

// ========================
// Forum API
// ========================

export async function getForumCategories(): Promise<ForumCategory[]> {
  const result = await authFetch('/forums/categories');
  return result.data.categories;
}

export async function getForumCategory(
  slug: string,
  params?: { limit?: number; offset?: number; sort?: 'latest' | 'activity' | 'popular' }
): Promise<{ category: ForumCategory; posts: ForumPost[]; pagination: { total: number; limit: number; offset: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  if (params?.sort) searchParams.append('sort', params.sort);
  const query = searchParams.toString();
  const result = await authFetch(`/forums/categories/${slug}${query ? `?${query}` : ''}`);
  return result.data;
}

export async function getForumPosts(params?: {
  categoryId?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  sort?: 'latest' | 'activity' | 'popular';
}): Promise<{ posts: ForumPost[]; pagination: { total: number; limit: number; offset: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.categoryId) searchParams.append('categoryId', params.categoryId);
  if (params?.tag) searchParams.append('tag', params.tag);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  if (params?.sort) searchParams.append('sort', params.sort);
  const query = searchParams.toString();
  const result = await authFetch(`/forums/posts${query ? `?${query}` : ''}`);
  return result.data;
}

export async function getForumPost(slug: string): Promise<{ post: ForumPost; replies: ForumReply[] }> {
  const result = await authFetch(`/forums/posts/${slug}`);
  return result.data;
}

export async function createForumPost(data: {
  categoryId: string;
  title: string;
  content: string;
  tags?: string[];
}): Promise<ForumPost> {
  const result = await authFetch('/forums/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.post;
}

export async function updateForumPost(
  postId: string,
  data: { title?: string; content?: string; tags?: string[] }
): Promise<ForumPost> {
  const result = await authFetch(`/forums/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.post;
}

export async function createForumReply(
  postId: string,
  data: { content: string; parentReplyId?: string }
): Promise<ForumReply> {
  const result = await authFetch(`/forums/posts/${postId}/replies`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.reply;
}

export async function updateForumReply(replyId: string, content: string): Promise<ForumReply> {
  const result = await authFetch(`/forums/replies/${replyId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
  return result.data.reply;
}

export async function markAsHelpful(type: 'post' | 'reply', id: string): Promise<void> {
  await authFetch('/forums/helpful', {
    method: 'POST',
    body: JSON.stringify({ type, id }),
  });
}

export async function acceptAnswer(replyId: string): Promise<ForumReply> {
  const result = await authFetch(`/forums/replies/${replyId}/accept`, {
    method: 'POST',
  });
  return result.data.reply;
}

export async function reportContent(data: {
  contentType: 'forum_post' | 'forum_reply';
  contentId: string;
  reason: ReportReason;
  description?: string;
}): Promise<void> {
  await authFetch('/forums/report', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ========================
// Success Stories API
// ========================

export async function getSuccessStories(params?: {
  milestoneType?: MilestoneType;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<{ stories: SuccessStory[]; pagination: { total: number; limit: number; offset: number } }> {
  const searchParams = new URLSearchParams();
  if (params?.milestoneType) searchParams.append('milestoneType', params.milestoneType);
  if (params?.tag) searchParams.append('tag', params.tag);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  const query = searchParams.toString();
  const result = await authFetch(`/success-stories${query ? `?${query}` : ''}`);
  return result.data;
}

export async function getFeaturedStories(): Promise<SuccessStory[]> {
  const result = await authFetch('/success-stories/featured');
  return result.data.stories;
}

export async function getSuccessStory(slug: string): Promise<SuccessStory> {
  const result = await authFetch(`/success-stories/${slug}`);
  return result.data.story;
}

export async function submitSuccessStory(data: {
  title: string;
  content: string;
  photoUrls?: string[];
  tags?: string[];
  milestoneType?: MilestoneType;
  dialysisDuration?: string;
}): Promise<SuccessStory> {
  const result = await authFetch('/success-stories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.story;
}

export async function updateSuccessStory(
  storyId: string,
  data: {
    title?: string;
    content?: string;
    photoUrls?: string[];
    tags?: string[];
    milestoneType?: MilestoneType;
    dialysisDuration?: string;
  }
): Promise<SuccessStory> {
  const result = await authFetch(`/success-stories/${storyId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.story;
}

export async function withdrawSuccessStory(storyId: string): Promise<void> {
  await authFetch(`/success-stories/${storyId}`, {
    method: 'DELETE',
  });
}

export async function getMyStories(): Promise<SuccessStory[]> {
  const result = await authFetch('/success-stories/my-stories');
  return result.data.stories;
}

export async function likeSuccessStory(storyId: string): Promise<void> {
  await authFetch(`/success-stories/${storyId}/like`, {
    method: 'POST',
  });
}

// ========================
// HCP Verification API
// ========================

export async function submitHCPVerification(data: {
  fullName: string;
  professionalTitle: string;
  badgeType: HCPBadgeType;
  licenseNumber?: string;
  licenseState?: string;
  employer?: string;
  specialization?: string;
  yearsExperience?: number;
  documentUrls?: string[];
  additionalNotes?: string;
}): Promise<HCPVerificationRequest> {
  const result = await authFetch('/hcp/apply', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data.request;
}

export async function getHCPVerificationStatus(): Promise<{
  hasProfile: boolean;
  isVerified: boolean;
  badgeType?: HCPBadgeType;
  verifiedAt?: string;
  request?: HCPVerificationRequest | null;
}> {
  const result = await authFetch('/hcp/status');
  return result.data;
}

export async function updateHCPVerificationRequest(
  requestId: string,
  data: { documentUrls?: string[]; additionalNotes?: string }
): Promise<HCPVerificationRequest> {
  const result = await authFetch(`/hcp/apply/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data.request;
}

// ========================
// Config Constants
// ========================

export const HCP_BADGE_CONFIG: Record<HCPBadgeType, { label: string; color: string; bgColor: string }> = {
  nephrologist: { label: 'Nephrologist', color: '#3b82f6', bgColor: '#dbeafe' },
  nurse: { label: 'Nurse', color: '#10b981', bgColor: '#d1fae5' },
  dietitian: { label: 'Dietitian', color: '#f59e0b', bgColor: '#fef3c7' },
  social_worker: { label: 'Social Worker', color: '#8b5cf6', bgColor: '#ede9fe' },
  pharmacist: { label: 'Pharmacist', color: '#ec4899', bgColor: '#fce7f3' },
  technician: { label: 'Technician', color: '#6366f1', bgColor: '#e0e7ff' },
  other: { label: 'Healthcare Professional', color: '#64748b', bgColor: '#f1f5f9' },
};

export const MILESTONE_CONFIG: Record<MilestoneType, { label: string; icon: string; color: string }> = {
  dialysis_anniversary: { label: 'Dialysis Anniversary', icon: '🎉', color: '#6366f1' },
  transplant: { label: 'Transplant', icon: '💝', color: '#10b981' },
  health_improvement: { label: 'Health Improvement', icon: '📈', color: '#3b82f6' },
  lifestyle_achievement: { label: 'Lifestyle Achievement', icon: '🏆', color: '#f59e0b' },
  personal_goal: { label: 'Personal Goal', icon: '🎯', color: '#ec4899' },
  other: { label: 'Other', icon: '⭐', color: '#64748b' },
};

export const REPORT_REASON_CONFIG: Record<ReportReason, { label: string; description: string }> = {
  spam: { label: 'Spam', description: 'Unwanted promotional content or repetitive posts' },
  harassment: { label: 'Harassment', description: 'Bullying, threats, or targeted attacks' },
  misinformation: { label: 'Misinformation', description: 'False or misleading health information' },
  inappropriate: { label: 'Inappropriate', description: 'Offensive language or content' },
  personal_info: { label: 'Personal Info', description: 'Sharing private information without consent' },
  other: { label: 'Other', description: 'Other violation not listed above' },
};
