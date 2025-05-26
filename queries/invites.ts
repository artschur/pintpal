import { supabase } from "@/config/supabase";

function generateToken(): string {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

export async function createInviteLink(groupId: string): Promise<string> {
	const { data: group } = await supabase
		.from("groups")
		.select("invite_token")
		.eq("id", groupId)
		.single();

	let token = group?.invite_token;

	if (!token) {
		token = generateToken();

		await supabase
			.from("groups")
			.update({ invite_token: token })
			.eq("id", groupId);
	}

	return `https://beerbros.com/invite/${token}`;
}

export async function getGroupByToken(token: string) {
	const { data, error } = await supabase
		.from("groups")
		.select(
			`
      id,
      name,
      description,
      invite_active,
      member_limit,
      group_members(count)

    `,
		)
		.eq("invite_token", token)
		.single();

	if (error || !data) {
		throw new Error("Grupo não encontrado");
	}

	if (!data.invite_active) {
		throw new Error("Convites desabilitados para este grupo");
	}

	const memberCount = data.group_members[0]?.count || 0;
	if (memberCount >= data.member_limit) {
		throw new Error("Grupo está cheio (máximo 20 membros)");
	}

	return {
		...data,
		memberCount,
	};
}

export async function joinGroupViaInvite(token: string, userId: string) {
	const group = await getGroupByToken(token);

	const { data: existingMember } = await supabase
		.from("group_members")
		.select("id")
		.eq("group_id", group.id)
		.eq("profile_id", userId)
		.single();

	if (existingMember) {
		throw new Error("Você já é membro deste grupo");
	}

	// Add user to group
	const { error } = await supabase.from("group_members").insert({
		group_id: group.id,
		profile_id: userId,
		role: "member",
		points: 0,
	});

	if (error) throw error;

	return group;
}

export async function toggleGroupInvite(groupId: string, active: boolean) {
	const { error } = await supabase
		.from("groups")
		.update({ invite_active: active })
		.eq("id", groupId);

	if (error) throw error;
}
