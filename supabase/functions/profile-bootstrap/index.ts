import "jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: corsHeaders })

const authenticated = async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const authorization = req.headers.get("Authorization") ?? ""
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  const { data: authData, error: authError } = await userClient.auth.getUser()
  if (authError || !authData.user) return json({ success: false, error: "Session invalide." }, 401)

  const discordIdentity = authData.user.identities?.find((identity) => identity.provider === "discord")
  const identityData = discordIdentity?.identity_data as Record<string, unknown> | undefined
  const discordId = String(discordIdentity?.provider_id ?? identityData?.sub ?? "").trim()
  if (!/^\d{15,22}$/.test(discordId)) {
    return json({ success: false, error: "Le compte Discord n’est pas vérifiable." }, 403)
  }

  const { data: existing, error: profileError } = await admin
    .from("profiles")
    .select("id,auth_user_id,member_id,display_name,discord_id,access_level,active")
    .eq("discord_id", discordId)
    .maybeSingle()
  if (profileError) return json({ success: false, error: "Impossible de charger le profil." }, 500)

  let profile = existing
  if (!profile) {
    const { data: allowed, error: whitelistError } = await admin
      .from("whitelist")
      .select("login_identifier,discord_id")
      .eq("discord_id", discordId)
      .eq("active", true)
      .maybeSingle()
    if (whitelistError) return json({ success: false, error: "Impossible de vérifier la liste blanche." }, 500)
    if (!allowed) return json({ success: false, error: "Compte absent de la liste blanche." }, 403)

    const { data: created, error: createError } = await admin
      .from("profiles")
      .insert({
        auth_user_id: authData.user.id,
        display_name: allowed.login_identifier,
        discord_id: discordId,
        access_level: "visitor",
        last_login_at: new Date().toISOString(),
      })
      .select("id,auth_user_id,member_id,display_name,discord_id,access_level,active")
      .single()
    if (createError) return json({ success: false, error: "Impossible de créer le profil." }, 500)
    profile = created
  } else {
    if (!profile.active) return json({ success: false, error: "Ce compte est désactivé." }, 403)
    if (profile.auth_user_id && profile.auth_user_id !== authData.user.id) {
      return json({ success: false, error: "Ce profil est déjà lié à un autre compte Discord." }, 409)
    }
    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({ auth_user_id: authData.user.id, last_login_at: new Date().toISOString() })
      .eq("id", profile.id)
      .select("id,auth_user_id,member_id,display_name,discord_id,access_level,active")
      .single()
    if (updateError) return json({ success: false, error: "Impossible de lier le profil." }, 500)
    profile = updated
  }

  const [{ data: grants }, { data: allPermissions }, { data: rosterMember }, { data: defcon }] = await Promise.all([
    admin.from("profile_permissions").select("permission_code").eq("profile_id", profile.id),
    admin.from("permissions").select("code"),
    admin.from("current_gda_roster").select("matricule,grade,steam_id,discord_id,sanction,specializations").eq("discord_id", discordId).maybeSingle(),
    admin.from("defcon_state").select("level").eq("singleton", true).maybeSingle(),
  ])

  const accessLevel = String(rosterMember?.matricule ?? profile.display_name).toUpperCase() === "MILO"
    ? "owner"
    : profile.access_level
  const grantedCodes = grants?.map((grant) => grant.permission_code) ?? []
  const permissionCodes = accessLevel === "owner"
    ? (allPermissions?.map((permission) => permission.code) ?? grantedCodes)
    : grantedCodes

  return json({
    success: true,
    profile: {
      id: profile.id,
      matricule: rosterMember?.matricule ?? profile.display_name,
      grade: rosterMember?.grade ?? "Visiteur",
      discordId,
      steamId: rosterMember?.steam_id ?? null,
      sanction: rosterMember?.sanction || "Clean",
      specialisations: rosterMember?.specializations ?? [],
      accessLevel,
      coproprietaire: accessLevel !== "owner" && permissionCodes.includes("role_staff_total"),
      permissions: permissionCodes,
    },
    defcon: {
      niveau: Math.max(0, Math.min(4, Number(defcon?.level) || 0)),
      modifiePar: "",
      modifieLe: "",
    },
  })
}

export default {
  fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    return authenticated(req)
  },
}
