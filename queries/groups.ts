import { supabase } from "@/config/supabase";

type Group = {
	id: string;
	name: string;
	description?: string;
	created_by: string;
	created_at?: string;
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
	group: Omit<Group, "id" | "created_at">,
): Promise<Group> {
	const { data, error } = await supabase
		.from("groups")
		.insert(group)
		.select()
		.single();

	if (error) throw error;
	return data;
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
