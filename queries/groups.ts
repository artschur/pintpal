import { supabase } from "@/config/supabase";

export type Group = {
	id: string;
	name: string;
	description?: string;
	created_by: string;
	created_at?: string;
	invite_token?: string;
	invite_active?: boolean;
	member_limit?: number;
};

export type GroupMember = {
	id: string;
	group_id: string;
	profile_id: string;
	joined_at?: string;
	role: "admin" | "member";
	points?: number;
};

interface Profile {
	id: string;
	username: string;
	avatar_url?: string;
}

export interface GroupWithMembers extends Group {
	members: (GroupMember & { profiles: Profile })[];
}

export interface GroupMemberWithProfile extends GroupMember {
	profiles: Profile;
}

export interface GroupUserPoints {
	total_points: number;
	profiles: Profile[];
}

interface LeaderboardEntry {
	points: number;
	profiles: {
		id: string;
		username: string;
		avatar_url?: string;
		user_points: number;
	};
}

export async function createGroup(
	group: Omit<
		Group,
		"id" | "created_at" | "invite_token" | "invite_active" | "member_limit"
	>,
	userId: string,
): Promise<Group> {
	const { data, error } = await supabase
		.from("groups")
		.insert({
			...group,
			invite_active: true,
			member_limit: 20,
		})
		.select()
		.single();

	const { data: memberData, error: memberError } = await supabase
		.from("group_members")
		.insert({
			group_id: data.id,
			profile_id: userId,
			role: "admin",
			points: 0,
		})
		.select()
		.single();

	if (error || memberError) {
		throw error || memberError;
	}

	return data;
}

export async function getAllGroupsWithMembers(options?: {
	limit?: number;
	offset?: number;
	onlyActiveInvites?: boolean;
	orderBy?: "created_at" | "name" | "member_count";
	ascending?: boolean;
}): Promise<{
	groups: GroupWithMembers[];
	hasMore: boolean;
	total: number;
}> {
	const {
		limit = 10,
		offset = 0,
		onlyActiveInvites = false,
		orderBy = "created_at",
		ascending = false,
	} = options || {};

	// First, get the total count for pagination info
	let countQuery = supabase
		.from("groups")
		.select("id", { count: "exact", head: true });

	if (onlyActiveInvites) {
		countQuery = countQuery.eq("invite_active", true);
	}

	const { count, error: countError } = await countQuery;
	if (countError) throw countError;

	// Then get the actual data
	let query = supabase
		.from("groups")
		.select(
			`
            id,
            name,
            description,
            created_by,
            created_at,
            invite_token,
            invite_active,
            member_limit,
            group_members (
                id,
                group_id,
                profile_id,
                joined_at,
                role,
                points,
                profiles:profiles (
                    id,
                    username,
                    avatar_url
                )
            )
        `,
		)
		.range(offset, offset + limit - 1);

	// Apply filters
	if (onlyActiveInvites) {
		query = query.eq("invite_active", true);
	}

	// Apply ordering
	if (orderBy === "member_count") {
		// For member count ordering, we'll sort in JavaScript after fetching
		query = query.order("created_at", { ascending });
	} else {
		query = query.order(orderBy, { ascending });
	}

	const { data, error } = await query;
	if (error) throw error;

	// Transform the data to match GroupWithMembers interface
	let transformedGroups: GroupWithMembers[] = data.map((group: any) => {
		// Type the group_members properly
		const members: (GroupMember & { profiles: Profile })[] =
			group.group_members.map((member: any) => ({
				id: member.id,
				group_id: member.group_id,
				profile_id: member.profile_id,
				joined_at: member.joined_at,
				role: member.role as "admin" | "member",
				points: member.points,
				profiles: {
					id: member.profiles.id,
					username: member.profiles.username,
					avatar_url: member.profiles.avatar_url,
				},
			}));

		// Deduplicate members by profile_id (in case of duplicates)
		const dedupedMembers = Array.from(
			new Map(members.map((member) => [member.profile_id, member])).values(),
		);

		return {
			id: group.id,
			name: group.name,
			description: group.description,
			created_by: group.created_by,
			created_at: group.created_at,
			invite_token: group.invite_token,
			invite_active: group.invite_active,
			member_limit: group.member_limit,
			members: dedupedMembers,
		} as GroupWithMembers;
	});

	// Sort by member count if requested (since we can't do this in SQL easily)
	if (orderBy === "member_count") {
		transformedGroups.sort((a, b) => {
			const comparison = a.members.length - b.members.length;
			return ascending ? comparison : -comparison;
		});
	}

	return {
		groups: transformedGroups,
		hasMore: offset + limit < (count || 0),
		total: count || 0,
	};
}

export async function getGroupsPaginated(
	page: number = 1,
	pageSize: number = 10,
): Promise<{
	groups: GroupWithMembers[];
	currentPage: number;
	totalPages: number;
	total: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}> {
	const offset = (page - 1) * pageSize;

	const result = await getAllGroupsWithMembers({
		limit: pageSize,
		offset: offset,
	});

	const totalPages = Math.ceil(result.total / pageSize);

	return {
		groups: result.groups,
		currentPage: page,
		totalPages,
		total: result.total,
		hasNextPage: page < totalPages,
		hasPreviousPage: page > 1,
	};
}

export async function addUserToGroup(
	member: Omit<GroupMember, "id" | "joined_at">,
): Promise<GroupMember> {
	const { data, error } = await supabase
		.from("group_members")
		.insert(member)
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function getUserGroups(profileId: string): Promise<any> {
	const { data, error } = await supabase
		.from("group_members")
		.select(
			`
            group_id,
            groups (
                id,
                name,
                description,
                created_by,
                created_at
            )
        `,
		)
		.eq("profile_id", profileId);

	if (error) throw error;

	return data.map((gm) => gm.groups);
}

export async function getUserGroupsWithMembers(
	profileId: string,
): Promise<GroupWithMembers[]> {
	const { data, error } = await supabase
		.from("group_members")
		.select(
			`
            groups:groups (
                id,
                name,
                description,
                created_by,
                created_at,
                group_members (
                    id,
                    group_id,
                    profile_id,
                    joined_at,
                    role,
                    points,
                    profiles:profiles (
                        id,
                        username,
                        avatar_url
                    )
                )
            )
        `,
		)
		.eq("profile_id", profileId);

	if (error) throw error;
	// For each group, deduplicate the group_members by profile_id
	return data.map((row: any) => {
		const group = row.groups;
		const dedupedMembers = Array.from(
			new Map(
				group.group_members.map((member: any) => [member.profile_id, member]),
			).values(),
		);

		return {
			...group,
			members: dedupedMembers,
		};
	});
}

export async function getGroupWithMemberCount(
	groupId: string,
): Promise<Group & { memberCount: number }> {
	const { data, error } = await supabase
		.from("groups")
		.select(
			`
			*,
			group_members(count)
		`,
		)
		.eq("id", groupId)
		.single();

	if (error) throw error;

	return {
		...data,
		memberCount: data.group_members[0]?.count || 0,
	};
}

export async function getGroupMembers(
	groupId: string,
): Promise<GroupMemberWithProfile[]> {
	const { data, error } = await supabase
		.from("group_members")
		.select(
			`
			*,
			profiles (
				id,
				username,
				avatar_url
			)
		`,
		)
		.eq("group_id", groupId);

	if (error) throw error;
	return data;
}

export async function getGroupUserPointsUsingJson(
	groupId: string,
): Promise<GroupUserPoints> {
	const { data, error } = await supabase.rpc("get_group_user_points", {
		group_id_input: groupId,
	});

	if (error) throw error;
	return data;
}

export async function addPointsToUser(
	groupId: string,
	profileId: string,
	pointsToAdd: number,
): Promise<number> {
	const { data, error } = await supabase.rpc("increment_group_points", {
		group_id_input: groupId,
		profile_id_input: profileId,
		increment_by: pointsToAdd,
	});

	if (error) throw error;
	return data;
}

export async function getGroupById(groupId: string) {
	const { data, error } = await supabase
		.from("groups")
		.select("*")
		.eq("id", groupId)
		.single();

	if (error) throw error;
	return data;
}
