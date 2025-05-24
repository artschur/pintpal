import { supabase } from "@/config/supabase";

export interface GroupInvite {
	id: string;
	group_id: string;
	invited_by: string;
	invited_user_id?: string;
	invited_username?: string;
	status: "pending" | "accepted" | "declined" | "expired";
	invited_at: string;
	expires_at: string;
}

export async function sendGroupInviteByUsername(
	groupId: string,
	username: string,
	invitedBy: string,
): Promise<GroupInvite> {
	// First, find the user by username
	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("id")
		.eq("username", username)
		.single();

	if (profileError || !profile) {
		throw new Error("Usuário não encontrado");
	}

	// Check if user is already a member
	const { data: existingMember } = await supabase
		.from("group_members")
		.select("id")
		.eq("group_id", groupId)
		.eq("profile_id", profile.id)
		.single();

	if (existingMember) {
		throw new Error("Usuário já é membro do grupo");
	}

	// Check if invite already exists
	const { data: existingInvite } = await supabase
		.from("group_invites")
		.select("id")
		.eq("group_id", groupId)
		.eq("invited_user_id", profile.id)
		.eq("status", "pending")
		.single();

	if (existingInvite) {
		throw new Error("Convite já enviado para este usuário");
	}

	// Create the invite
	const { data, error } = await supabase
		.from("group_invites")
		.insert({
			group_id: groupId,
			invited_by: invitedBy,
			invited_user_id: profile.id,
			invited_username: username,
			status: "pending",
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
		})
		.select()
		.single();

	if (error) throw error;
	return data;
}

export async function createInviteLink(groupId: string): Promise<string> {
	// Generate a shareable link - you might want to create a unique token
	// For now, using a simple approach
	const baseUrl = "https://your-app.com"; // Replace with your app's deep link
	return `${baseUrl}/join-group/${groupId}`;
}

export async function getPendingInvites(
	profileId: string,
): Promise<GroupInvite[]> {
	const { data, error } = await supabase
		.from("group_invites")
		.select(
			`
			*,
			groups (
				id,
				name,
				description
			),
			inviter:profiles!invited_by (
				id,
				username,
				avatar_url
			)
		`,
		)
		.eq("invited_user_id", profileId)
		.eq("status", "pending")
		.gt("expires_at", new Date().toISOString());

	if (error) throw error;
	return data;
}

export async function respondToInvite(
	inviteId: string,
	status: "accepted" | "declined",
	profileId: string,
): Promise<void> {
	const { data: invite, error: inviteError } = await supabase
		.from("group_invites")
		.update({
			status,
			responded_at: new Date().toISOString(),
		})
		.eq("id", inviteId)
		.eq("invited_user_id", profileId)
		.select()
		.single();

	if (inviteError) throw inviteError;

	// If accepted, add user to group_members
	if (status === "accepted") {
		const { error: memberError } = await supabase.from("group_members").insert({
			group_id: invite.group_id,
			profile_id: profileId,
			role: "member",
			points: 0,
		});

		if (memberError) throw memberError;
	}
}
