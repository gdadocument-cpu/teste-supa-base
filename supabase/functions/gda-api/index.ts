import "jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

const GRADES = [
  "Lieutenant-Colonel", "Commandant", "Vice-Commandant", "Capitaine",
  "Lieutenant", "Sous-Lieutenant", "Aspirant", "Major", "Adjudant-Chef",
  "Adjudant", "Sergent-Chef", "Sergent", "Caporal-Chef", "Caporal", "Ancien GDA",
]
const SANCTIONS = ["Mise à pied", "Clean", "Averto", "Pénalité", "Blâme 1", "Blâme 2"]
const SPECIALISATIONS = [
  "Gérant GDA", "CO-Gérant GDA", "Responsable MDC", "CO-Responsable MDC",
  "Responsable INST", "CO-Responsable INST", "Instructeur en chef", "Instructeur",
  "Médecin", "Instructeur et Médecin",
]

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: corsHeaders })

const texte = (value: unknown) => String(value ?? "").trim()
const nombre = (value: unknown) => Number(value || 0) || 0
const bool = (value: unknown) => value === true || ["1", "true", "oui"].includes(texte(value).toLowerCase())
const normalise = (value: unknown) => texte(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
const isoDate = (value: unknown) => {
  const input = texte(value)
  if (!input) return null
  const fr = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return fr ? `${fr[3]}-${fr[2]}-${fr[1]}` : input.slice(0, 10)
}
const dateFr = (value: unknown) => {
  const input = texte(value)
  if (!input) return ""
  const date = new Date(input.length === 10 ? `${input}T12:00:00Z` : input)
  return Number.isNaN(date.getTime()) ? input : new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(date)
}
const dateHeureFr = (value: unknown) => {
  const input = texte(value)
  if (!input) return ""
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? input : new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "medium",
  }).format(date)
}
const aujourdHui = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date())
const joursRestants = (fin: unknown) => {
  const cible = isoDate(fin)
  if (!cible) return 0
  return Math.max(0, Math.ceil((new Date(`${cible}T12:00:00Z`).getTime() - new Date(`${aujourdHui()}T12:00:00Z`).getTime()) / 86400000))
}
const idExterne = () => crypto.randomUUID()

const authenticated = async (req: Request) => {
  try {
    const url = new URL(req.url)
    const payload: Record<string, unknown> = Object.fromEntries(url.searchParams)
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") ?? ""
      const body = contentType.includes("application/json")
        ? await req.json()
        : Object.fromEntries((await req.formData()).entries())
      Object.assign(payload, body)
    }

    const action = texte(payload.action)
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
    if (authError || !authData.user) return json({ success: false, message: "Session Discord invalide." }, 401)

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,member_id,display_name,discord_id,access_level,active")
      .eq("auth_user_id", authData.user.id)
      .eq("active", true)
      .maybeSingle()
    if (profileError || !profile) return json({ success: false, message: "Profil GDA non autorisé." }, 403)

    const [{ data: grants }, { data: members }, { data: delayed }, { data: defcon }] = await Promise.all([
      admin.from("profile_permissions").select("permission_code").eq("profile_id", profile.id),
      admin.from("members").select("*").eq("active", true),
      admin.from("current_gda_roster").select("*"),
      admin.from("defcon_state").select("level,updated_at").eq("singleton", true).maybeSingle(),
    ])

    const permissions = new Set((grants ?? []).map((grant: any) => grant.permission_code))
    const owner = normalise(profile.display_name) === "MILO" || profile.access_level === "owner"
    const officer = owner || profile.access_level === "officer"
    const has = (permission: string) => owner || permissions.has("role_staff_total") || permissions.has(permission)
    const requireOfficer = () => { if (!officer) throw new Error("Accès réservé aux officiers.") }
    const requirePermission = (permission: string) => { if (!has(permission)) throw new Error("Permission insuffisante.") }
    const memberById = new Map((members ?? []).map((member: any) => [member.id, member]))
    const delayedById = new Map((delayed ?? []).filter((member: any) => member.member_id).map((member: any) => [member.member_id, member]))
    const delayedByName = new Map((delayed ?? []).map((member: any) => [normalise(member.matricule), member]))
    const ownMember = profile.member_id ? memberById.get(profile.member_id) : null
    const ownDelayed = profile.member_id ? delayedById.get(profile.member_id) : delayedByName.get(normalise(profile.display_name))
    const actorName = ownDelayed?.matricule ?? ownMember?.matricule ?? profile.display_name
    const actorGrade = ownDelayed?.grade ?? ownMember?.grade ?? "Visiteur"

    const audit = async (libelle: string, cible = "", details = "") => {
      await admin.from("audit_logs").insert({
        actor_profile_id: profile.id,
        actor_name_snapshot: actorName,
        actor_grade_snapshot: actorGrade,
        action: libelle,
        target: cible || null,
        details: details || null,
        source: "SUPABASE",
      })
    }

    const membreClient = (member: any, publicOnly = false) => {
      const roster = delayedById.get(member.id) ?? delayedByName.get(normalise(member.matricule))
      const gradeGda = roster?.grade ?? member.grade
      const base = publicOnly ? (roster ?? member) : member
      return {
        nom: base.matricule,
        grade: publicOnly ? gradeGda : gradeGda,
        gradeEffectifGDA: gradeGda,
        gradeEffectifOfficier: member.grade,
        steamId: base.steam_id ?? "",
        discordId: base.discord_id ?? "",
        dateEntree: dateFr(base.joined_on),
        datePromotionRetro: dateFr(base.promotion_changed_on),
        presence: base.presence || "Présent",
        specialisation: (base.specializations ?? []).join("; "),
        nombreRapports: nombre(base.reports_count),
        sanction: base.sanction || "Clean",
        medaille: (base.medals ?? []).join("; "),
        recommandation: nombre(base.recommendation),
        observation: nombre(base.observation),
        notes: base.notes || "",
      }
    }

    const membresClient = (members ?? []).map((member: any) => membreClient(member))
    const membresPublic = (delayed ?? []).map((roster: any) => {
      const member = roster.member_id ? memberById.get(roster.member_id) : null
      return membreClient(member ?? {
        id: roster.member_id, matricule: roster.matricule, grade: roster.grade,
        steam_id: roster.steam_id, discord_id: roster.discord_id,
      }, true)
    })

    const profilsParId = async (ids: Array<number | null | undefined>) => {
      const uniques = [...new Set(ids.filter(Boolean))] as number[]
      if (!uniques.length) return new Map<number, string>()
      const { data } = await admin.from("profiles").select("id,display_name").in("id", uniques)
      return new Map((data ?? []).map((item: any) => [item.id, item.display_name]))
    }

    const rapportsClient = async (onlyOwn = false) => {
      let query = admin.from("reports").select("*").order("submitted_at", { ascending: false }).limit(1000)
      if (onlyOwn && profile.member_id) query = query.eq("member_id", profile.member_id)
      const { data, error } = await query
      if (error) throw error
      const noms = await profilsParId((data ?? []).map((row: any) => row.processed_by_profile_id))
      return (data ?? []).map((row: any) => ({
        ligne: row.id,
        id: row.external_id,
        nom: row.matricule_snapshot,
        grade: row.grade_snapshot,
        dateRapport: dateFr(row.report_on),
        rapport: row.body,
        commentaire: row.comment || "",
        conclusion: row.conclusion || "",
        dateEnvoi: dateHeureFr(row.submitted_at),
        statut: row.status === "LU" ? "LU" : row.status === "ARCHIVE" ? "ARCHIVE" : "EN ATTENTE",
        traitePar: noms.get(row.processed_by_profile_id) || "",
        dateTraitement: dateHeureFr(row.processed_at),
        source: row.source,
        discordUrl: row.discord_url || "",
        modifiable: row.status === "EN_ATTENTE",
      }))
    }

    const absencesClient = async () => {
      const { data, error } = await admin.from("absences").select("*,profiles!absences_declared_by_profile_id_fkey(display_name)").order("starts_on", { ascending: false })
      if (error) throw error
      const today = aujourdHui()
      return (data ?? []).map((row: any) => {
        const actif = row.active && row.starts_on <= today && row.ends_on >= today
        return {
          ligne: row.id,
          nom: row.matricule_snapshot,
          grade: row.grade_snapshot,
          dateDebut: dateFr(row.starts_on),
          dateFin: dateFr(row.ends_on),
          raison: row.reason,
          statut: actif ? "ACTIF" : "TERMINE",
          auteur: row.profiles?.display_name || "",
          joursRestants: actif ? joursRestants(row.ends_on) : 0,
        }
      })
    }

    const demandesClient = async (onlyOwn = false) => {
      let query = admin.from("absence_requests").select("*,profiles!absence_requests_decided_by_profile_id_fkey(display_name)").order("created_at", { ascending: false })
      if (onlyOwn && profile.member_id) query = query.eq("member_id", profile.member_id)
      const { data, error } = await query
      if (error) throw error
      const today = aujourdHui()
      return (data ?? []).map((row: any) => {
        const base = row.status
        const statut = base === "EN_ATTENTE" ? "EN ATTENTE" : base === "VALIDEE" && row.ends_on < today ? "TERMINEE" : base
        return {
          id: row.external_id,
          nom: row.matricule_snapshot,
          grade: row.grade_snapshot,
          dateCreation: dateHeureFr(row.created_at),
          dateModification: dateHeureFr(row.updated_at),
          dateDebut: dateFr(row.starts_on),
          dateFin: dateFr(row.ends_on),
          raison: row.reason,
          statut,
          statutBase: base,
          decidePar: row.profiles?.display_name || "",
          dateDecision: dateHeureFr(row.decided_at),
          motifRefus: row.refusal_reason || "",
          modifiable: base === "EN_ATTENTE",
          supprimableHistorique: base === "REFUSEE" || statut === "TERMINEE",
          peutTerminer: base === "VALIDEE" && row.starts_on <= today && row.ends_on >= today,
        }
      })
    }

    const disponibilites = async (message = "") => {
      const [absences, demandes] = await Promise.all([absencesClient(), demandesClient(false)])
      return {
        success: true, message,
        membres: membresPublic.map((member: any) => ({ nom: member.nom, grade: member.grade })),
        actives: absences.filter((absence: any) => absence.statut === "ACTIF"),
        historiques: absences.filter((absence: any) => absence.statut !== "ACTIF"),
        demandesEnAttente: demandes.filter((demande: any) => demande.statutBase === "EN_ATTENTE"),
        peutGerer: has("absences_gerer"),
        peutModifier: officer,
        peutSupprimer: has("disponibilites_modifier_supprimer"),
      }
    }

    const rapportParPayload = async () => {
      let query = admin.from("reports").select("*")
      if (texte(payload.rapportId)) query = query.eq("external_id", texte(payload.rapportId))
      else query = query.eq("id", nombre(payload.ligne))
      const { data, error } = await query.maybeSingle()
      if (error || !data) throw new Error("Rapport introuvable.")
      return data
    }

    switch (action) {
      case "recupererVersionDonnees":
        return json({ success: true, revision: Date.now(), action: "supabase", defcon: defcon?.level ?? 0 })
      case "presenceEnLigne":
        return json({ success: true, utilisateurs: [{ nom: actorName, grade: actorGrade }], defcon: defcon?.level ?? 0 })
      case "recupererEffectif":
        return json({
          success: true,
          membres: membresClient,
          peutModifier: has("effectif_modifier"),
          peutAjouter: owner || ["LIEUTENANT-COLONEL", "COMMANDANT", "VICE-COMMANDANT"].includes(normalise(ownMember?.grade)),
          grades: GRADES, sanctions: SANCTIONS, medailles: [], specialisations: SPECIALISATIONS,
        })
      case "recupererEffectifPublic":
        return json({ success: true, membres: membresPublic, actualiseLe: dateHeureFr(new Date()), prochaineActualisation: Date.now() + 86400000, peutActualiser: has("effectif_public_actualiser"), actualisationForcee: false })
      case "actualiserEffectifPublic": { // publication volontaire de l'instantané retardé
        requirePermission("effectif_public_actualiser")
        const { data: version, error: versionError } = await admin.from("gda_roster_versions").insert({ published_by_profile_id: profile.id, note: "Actualisation depuis le site Supabase" }).select("id").single()
        if (versionError) throw versionError
        const rows = (members ?? []).map((member: any) => ({
          version_id: version.id, member_id: member.id, matricule: member.matricule,
          grade: member.grade, steam_id: member.steam_id, discord_id: member.discord_id,
          presence: member.presence, reports_count: member.reports_count, observation: member.observation,
          promotion_changed_on: member.promotion_changed_on, joined_on: member.joined_on,
          sanction: member.sanction || "Clean", recommendation: member.recommendation, notes: member.notes,
          specializations: member.specializations ?? [], medals: member.medals ?? [],
        }))
        const { error } = await admin.from("gda_roster_members").insert(rows)
        if (error) throw error
        await audit("Effectif GDA actualisé")
        return json({ success: true, membres: rows.map((row: any) => ({ ...membreClient(memberById.get(row.member_id), true), grade: row.grade })), actualiseLe: dateHeureFr(new Date()), prochaineActualisation: Date.now() + 86400000, peutActualiser: true, actualisationForcee: true })
      }
      case "enregistrerNote":
      case "modifierMembreEffectif": { // effectif officier instantané uniquement
        requirePermission("effectif_modifier")
        const cible = texte(payload.nom || payload.matricule)
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(cible))
        if (!member) throw new Error("Membre introuvable.")
        const patch: Record<string, unknown> = {}
        if (action === "enregistrerNote") patch.notes = texte(payload.note || payload.notes)
        else {
          const fields: Record<string, string> = {
            grade: "grade", steamId: "steam_id", discordId: "discord_id", presence: "presence",
            nombreRapports: "reports_count", observation: "observation", datePromotionRetro: "promotion_changed_on",
            dateEntree: "joined_on", sanction: "sanction", recommandation: "recommendation", notes: "notes",
          }
          for (const [source, target] of Object.entries(fields)) if (payload[source] !== undefined) patch[target] = ["promotion_changed_on", "joined_on"].includes(target) ? isoDate(payload[source]) : payload[source]
          if (payload.specialisation !== undefined) patch.specializations = texte(payload.specialisation).split(/[;,]/).map(texte).filter(Boolean)
          if (payload.medaille !== undefined) patch.medals = texte(payload.medaille).split(";").map(texte).filter(Boolean)
        }
        const { error } = await admin.from("members").update(patch).eq("id", member.id)
        if (error) throw error
        await audit(action === "enregistrerNote" ? "Note modifiée" : "Effectif officier modifié", member.matricule)
        return json({ success: true, message: "Modification enregistrée dans l’effectif officier." })
      }
      case "ajouterMembreEffectif": {
        if (!owner) throw new Error("Ajout réservé au propriétaire.")
        const matricule = texte(payload.nom || payload.matricule)
        const { error } = await admin.from("members").insert({
          matricule, grade: texte(payload.grade) || "Caporal", steam_id: texte(payload.steamId) || null,
          discord_id: texte(payload.discordId) || null, joined_on: isoDate(payload.dateEntree),
          sanction: texte(payload.sanction) || "Clean",
        })
        if (error) throw error
        await audit("Membre ajouté", matricule)
        return json({ success: true, message: "Membre ajouté dans l’effectif officier." })
      }
      case "recupererRapports":
        requireOfficer()
        return json({ success: true, membres: membresPublic.map((m: any) => ({ nom: m.nom, grade: m.grade, gradeEffectifOfficier: m.gradeEffectifOfficier })), rapports: await rapportsClient(), peutValider: officer, peutArchiver: has("rapports_gerer"), peutSupprimer: has("rapports_supprimer") })
      case "recupererMesRapports":
        return json({ success: true, message: "", nom: actorName, grade: actorGrade, rapports: await rapportsClient(true) })
      case "ajouterMonRapport":
      case "ajouterRapport": { // le grade est figé depuis l'effectif GDA retardé
        const memberId = action === "ajouterMonRapport" ? profile.member_id : ((members ?? []).find((item: any) => normalise(item.matricule) === normalise(payload.nom))?.id ?? null)
        const member = memberId ? memberById.get(memberId) : null
        const roster = memberId ? delayedById.get(memberId) : delayedByName.get(normalise(payload.nom))
        const matricule = action === "ajouterMonRapport" ? actorName : (roster?.matricule ?? member?.matricule ?? texte(payload.nom))
        const grade = action === "ajouterMonRapport" ? actorGrade : (roster?.grade ?? texte(payload.grade))
        const { error } = await admin.from("reports").insert({
          external_id: idExterne(), member_id: memberId, matricule_snapshot: matricule,
          grade_snapshot: grade, report_on: isoDate(payload.dateRapport) ?? aujourdHui(),
          body: texte(payload.rapport), comment: texte(payload.commentaire) || null,
          conclusion: texte(payload.conclusion) || null, submitted_at: new Date().toISOString(), status: "EN_ATTENTE",
        })
        if (error) throw error
        await audit("Rapport ajouté", matricule)
        return action === "ajouterMonRapport"
          ? json({ success: true, message: "Rapport envoyé aux Officiers.", nom: actorName, grade: actorGrade, rapports: await rapportsClient(true) })
          : json({ success: true, message: "Rapport ajouté.", rapports: await rapportsClient() })
      }
      case "ajouterRapportDiscord": {
        requireOfficer()
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(payload.nom))
        const roster = member ? delayedById.get(member.id) : delayedByName.get(normalise(payload.nom))
        const { error } = await admin.from("reports").insert({
          external_id: idExterne(), member_id: member?.id ?? null,
          matricule_snapshot: roster?.matricule ?? member?.matricule ?? texte(payload.nom),
          grade_snapshot: roster?.grade ?? member?.grade ?? "Non renseigné",
          report_on: aujourdHui(), body: "Rapport Discord", submitted_at: new Date().toISOString(),
          status: "LU", source: "DISCORD", discord_url: texte(payload.lien || payload.url),
          processed_by_profile_id: profile.id, processed_at: new Date().toISOString(),
        })
        if (error) throw error
        await audit("Rapport Discord ajouté", roster?.matricule ?? member?.matricule ?? texte(payload.nom))
        return json({ success: true, message: "Rapport Discord ajouté dans « Lus et validés ».", rapports: await rapportsClient() })
      }
      case "modifierMonRapport": {
        const row = await rapportParPayload()
        if (row.member_id !== profile.member_id || row.status !== "EN_ATTENTE") throw new Error("Ce rapport n’est plus modifiable.")
        const { error } = await admin.from("reports").update({ report_on: isoDate(payload.dateRapport), body: texte(payload.rapport), comment: texte(payload.commentaire) || null, conclusion: texte(payload.conclusion) || null }).eq("id", row.id)
        if (error) throw error
        return json({ success: true, message: "Rapport modifié.", nom: actorName, grade: actorGrade, rapports: await rapportsClient(true) })
      }
      case "supprimerMonRapport": {
        const row = await rapportParPayload()
        if (row.member_id !== profile.member_id || row.status !== "EN_ATTENTE") throw new Error("Ce rapport n’est plus supprimable.")
        const { error } = await admin.from("reports").delete().eq("id", row.id)
        if (error) throw error
        return json({ success: true, message: "Rapport supprimé.", nom: actorName, grade: actorGrade, rapports: await rapportsClient(true) })
      }
      case "changerStatutRapport": {
        requireOfficer()
        const row = await rapportParPayload()
        const demande = normalise(payload.statut)
        const status = demande.includes("ARCH") ? "ARCHIVE" : demande === "LU" || demande.includes("VALID") ? "LU" : "EN_ATTENTE"
        const { error } = await admin.from("reports").update({ status, processed_by_profile_id: profile.id, processed_at: new Date().toISOString() }).eq("id", row.id)
        if (error) throw error
        await admin.from("report_status_history").insert({ report_id: row.id, matricule_snapshot: row.matricule_snapshot, grade_snapshot: row.grade_snapshot, previous_status: row.status, new_status: status, changed_by_profile_id: profile.id, report_on: row.report_on })
        await audit("Statut rapport modifié", row.matricule_snapshot, status)
        return json({ success: true, message: "Statut du rapport modifié.", rapports: await rapportsClient() })
      }
      case "archiverTousRapportsLus":
        requirePermission("rapports_gerer")
        await admin.from("reports").update({ status: "ARCHIVE", processed_by_profile_id: profile.id, processed_at: new Date().toISOString() }).eq("status", "LU")
        await audit("Rapports lus archivés")
        return json({ success: true, message: "Tous les rapports lus ont été archivés.", rapports: await rapportsClient() })
      case "supprimerRapport": {
        requirePermission("rapports_supprimer")
        const row = await rapportParPayload()
        const { error } = await admin.from("reports").delete().eq("id", row.id)
        if (error) throw error
        await audit("Rapport supprimé", row.matricule_snapshot)
        return json({ success: true, message: "Rapport supprimé définitivement.", rapports: await rapportsClient() })
      }
      case "recupererMesDemandesAbsence":
        return json({ success: true, message: "", nom: actorName, grade: actorGrade, demandes: await demandesClient(true) })
      case "ajouterDemandeAbsence": {
        const debut = isoDate(payload.dateDebut), fin = isoDate(payload.dateFin)
        if (!debut || !fin || fin < debut) throw new Error("Dates d’absence invalides.")
        const { error } = await admin.from("absence_requests").insert({ external_id: idExterne(), member_id: profile.member_id, matricule_snapshot: actorName, grade_snapshot: actorGrade, starts_on: debut, ends_on: fin, reason: texte(payload.raison), status: "EN_ATTENTE" })
        if (error) throw error
        await audit("Demande d’absence ajoutée", actorName)
        return json({ success: true, message: "Demande d’absence envoyée.", nom: actorName, grade: actorGrade, demandes: await demandesClient(true) })
      }
      case "modifierDemandeAbsence":
      case "supprimerDemandeAbsence":
      case "terminerDemandeAbsence": {
        const { data: row, error: findError } = await admin.from("absence_requests").select("*").eq("external_id", texte(payload.demandeId)).eq("member_id", profile.member_id).maybeSingle()
        if (findError || !row) throw new Error("Demande d’absence introuvable.")
        if (action === "modifierDemandeAbsence") {
          if (row.status !== "EN_ATTENTE") throw new Error("Cette demande n’est plus modifiable.")
          const debut = isoDate(payload.dateDebut), fin = isoDate(payload.dateFin)
          if (!debut || !fin || fin < debut) throw new Error("Dates d’absence invalides.")
          await admin.from("absence_requests").update({ starts_on: debut, ends_on: fin, reason: texte(payload.raison) }).eq("id", row.id)
        } else if (action === "supprimerDemandeAbsence") {
          if (!['EN_ATTENTE', 'REFUSEE', 'TERMINEE'].includes(row.status)) throw new Error("Cette absence validée est encore active.")
          await admin.from("absence_requests").delete().eq("id", row.id)
        } else {
          if (row.status !== "VALIDEE") throw new Error("Seule une absence validée peut être terminée.")
          const today = aujourdHui()
          await admin.from("absence_requests").update({ status: "TERMINEE", ends_on: today }).eq("id", row.id)
          if (row.absence_id) await admin.from("absences").update({ ends_on: today, active: false }).eq("id", row.absence_id)
        }
        await audit(action, actorName)
        return json({ success: true, message: "Demande mise à jour.", nom: actorName, grade: actorGrade, demandes: await demandesClient(true) })
      }
      case "recupererDisponibilites":
        requireOfficer()
        return json(await disponibilites())
      case "traiterDemandeAbsence": {
        requirePermission("absences_gerer")
        const { data: row, error: findError } = await admin.from("absence_requests").select("*").eq("external_id", texte(payload.demandeId)).maybeSingle()
        if (findError || !row || row.status !== "EN_ATTENTE") throw new Error("Demande déjà traitée ou introuvable.")
        const accepter = normalise(payload.decision) === "ACCEPTER"
        let absenceId = null
        if (accepter) {
          const { data: absence, error } = await admin.from("absences").insert({ external_id: idExterne(), member_id: row.member_id, matricule_snapshot: row.matricule_snapshot, grade_snapshot: row.grade_snapshot, starts_on: row.starts_on, ends_on: row.ends_on, reason: row.reason, active: true, declared_by_profile_id: profile.id }).select("id").single()
          if (error) throw error
          absenceId = absence.id
        }
        await admin.from("absence_requests").update({ status: accepter ? "VALIDEE" : "REFUSEE", decided_by_profile_id: profile.id, decided_at: new Date().toISOString(), refusal_reason: accepter ? null : texte(payload.motifRefus), absence_id: absenceId, notification_read: false, notification_deleted: false }).eq("id", row.id)
        await audit(accepter ? "Demande d’absence acceptée" : "Demande d’absence refusée", row.matricule_snapshot)
        return json(await disponibilites(accepter ? "Demande d’absence acceptée." : "Demande d’absence refusée."))
      }
      case "ajouterAbsence": {
        requirePermission("absences_gerer")
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(payload.nom))
        const roster = member ? delayedById.get(member.id) : delayedByName.get(normalise(payload.nom))
        const debut = isoDate(payload.dateDebut), fin = isoDate(payload.dateFin)
        if (!debut || !fin || fin < debut) throw new Error("Dates d’absence invalides.")
        const { error } = await admin.from("absences").insert({ external_id: idExterne(), member_id: member?.id ?? null, matricule_snapshot: roster?.matricule ?? member?.matricule ?? texte(payload.nom), grade_snapshot: roster?.grade ?? member?.grade ?? "Non renseigné", starts_on: debut, ends_on: fin, reason: texte(payload.raison), active: true, declared_by_profile_id: profile.id })
        if (error) throw error
        await audit("Absence ajoutée", roster?.matricule ?? member?.matricule ?? texte(payload.nom))
        return json(await disponibilites("Absence ajoutée."))
      }
      case "modifierAbsence":
      case "retourAnticipe":
      case "supprimerAbsence": {
        if (action === "supprimerAbsence") requirePermission("disponibilites_modifier_supprimer")
        else requirePermission("absences_gerer")
        const id = nombre(payload.ligne)
        if (action === "supprimerAbsence") await admin.from("absences").delete().eq("id", id)
        else if (action === "retourAnticipe") await admin.from("absences").update({ ends_on: aujourdHui(), active: false }).eq("id", id)
        else {
          const debut = isoDate(payload.dateDebut), fin = isoDate(payload.dateFin)
          if (!debut || !fin || fin < debut) throw new Error("Dates d’absence invalides.")
          await admin.from("absences").update({ starts_on: debut, ends_on: fin, reason: texte(payload.raison), active: fin >= aujourdHui() }).eq("id", id)
        }
        await audit(action)
        return json(await disponibilites("Absence mise à jour."))
      }
      case "recupererNotifications": {
        const demandes = await demandesClient(true)
        const notifications = demandes.filter((item: any) => ["VALIDEE", "REFUSEE"].includes(item.statutBase)).map((item: any) => ({ id: item.id, titre: item.statutBase === "VALIDEE" ? "Demande d’absence acceptée" : "Demande d’absence refusée", message: item.statutBase === "VALIDEE" ? `Votre demande du ${item.dateDebut} au ${item.dateFin} a été acceptée.` : `Votre demande a été refusée : ${item.motifRefus || "motif non renseigné"}`, date: item.dateDecision, lue: false, type: item.statutBase === "VALIDEE" ? "succes" : "refus" }))
        return json({ success: true, notifications, nonLues: notifications.length })
      }
      case "marquerNotificationsLues":
        await admin.from("absence_requests").update({ notification_read: true }).eq("member_id", profile.member_id)
        return json({ success: true, notifications: [], nonLues: 0 })
      case "effacerNotifications":
        await admin.from("absence_requests").update({ notification_deleted: true }).eq("member_id", profile.member_id)
        return json({ success: true, notifications: [], nonLues: 0 })
      case "recupererDeparts": {
        requireOfficer()
        const { data, error } = await admin.from("departures").select("*,profiles!departures_decided_by_profile_id_fkey(display_name)").order("starts_on", { ascending: false })
        if (error) throw error
        const entries = (data ?? []).map((row: any) => ({ ligne: row.id, id: row.external_id, nom: row.matricule_snapshot, grade: row.grade_snapshot, type: row.departure_type, steamId: row.steam_id_snapshot || "", discordId: row.discord_id_snapshot || "", dateDepart: dateHeureFr(row.starts_on), dateRetour: dateHeureFr(row.ends_on), raison: row.reason || "", peutRevenir: !!row.ends_on && row.ends_on < aujourdHui(), decision: row.profiles?.display_name || "", statut: row.status, permanent: row.status === "PERMANENT" || !row.ends_on, medailles: (row.medals_snapshot ?? []).join("; "), medaillesRestaureesLe: dateHeureFr(row.medals_restored_at), joursRestants: joursRestants(row.ends_on) }))
        return json({ success: true, membres: membresPublic.map((m: any) => ({ nom: m.nom, grade: m.grade })), departs: entries.filter((e: any) => normalise(e.type) === "DEPART"), licenciements: entries.filter((e: any) => normalise(e.type) === "LICENCIEMENT"), blacklists: entries.filter((e: any) => normalise(e.type) === "BLACKLIST"), peutGerer: has("departs_gerer") })
      }
      case "recupererRecommandationsObservations": {
        requireOfficer()
        const { data, error } = await admin.from("recommendations_observations").select("*,profiles!recommendations_observations_recorded_by_profile_id_fkey(display_name)").order("created_at", { ascending: false })
        if (error) throw error
        const historique = (data ?? []).map((row: any) => ({ id: row.external_id, date: dateFr(row.occurred_on), personne: row.matricule_snapshot, grade: row.grade_snapshot || "", type: row.entry_type, nature: row.nature || "", emetteur: row.transmitted_by || "", raison: row.reason || "", enregistrePar: row.profiles?.display_name || "", creeLe: dateHeureFr(row.created_at) }))
        return json({ success: true, membres: membresPublic.map((m: any) => ({ nom: m.nom, grade: m.grade, recommandations: m.recommandation, observations: m.observation })), historique, peutPurger: owner })
      }
      case "recupererGestionPersonnel": {
        requireOfficer()
        const { data, error } = await admin.from("personnel_history").select("*,profiles!personnel_history_performed_by_profile_id_fkey(display_name)").order("occurred_at", { ascending: false })
        if (error) throw error
        const historique = (data ?? []).map((row: any) => ({ ligne: row.id, date: dateHeureFr(row.occurred_at), personne: row.matricule_snapshot, grade: row.grade_snapshot || "", type: row.action_type, choix: row.choice || "", raison: row.reason || "", auteur: row.profiles?.display_name || "" }))
        return json({ success: true, membres: membresPublic.map((m: any) => ({ nom: m.nom, grade: m.grade })), historique, peutModifier: has("personnel_historique_modifier"), peutSupprimer: has("personnel_historique_supprimer") })
      }
      case "recupererListeBlanche": {
        requirePermission("administration_permissions")
        const { data, error } = await admin.from("whitelist").select("*").order("created_at", { ascending: false })
        if (error) throw error
        return json({ success: true, entrees: (data ?? []).map((row: any) => ({ id: row.external_id, identifiant: row.login_identifier, discordId: row.discord_id, actif: row.active, creeLe: dateHeureFr(row.created_at), modifieLe: dateHeureFr(row.updated_at) })), peutModifier: true })
      }
      case "recupererJournalActions": {
        requirePermission("administration_logs")
        const { data, error } = await admin.from("audit_logs").select("*").order("occurred_at", { ascending: false }).limit(1000)
        if (error) throw error
        return json({ success: true, logs: (data ?? []).map((row: any) => ({ ligne: row.id, date: dateHeureFr(row.occurred_at), auteur: row.actor_name_snapshot || "", grade: row.actor_grade_snapshot || "", action: row.action, cible: row.target || "", details: row.details || "" })), peutSupprimer: owner })
      }
      case "recupererAdministration": {
        requirePermission("administration_permissions")
        const { data: allProfiles } = await admin.from("profiles").select("id,display_name,discord_id,access_level,active")
        const { data: allGrants } = await admin.from("profile_permissions").select("profile_id,permission_code")
        return json({ success: true, auteurProprietaire: owner, auteurCoproprietaire: false, proprietaireNom: "Milo", permissions: [...permissions], membres: (allProfiles ?? []).map((item: any) => ({ id: item.id, nom: item.display_name, discordId: item.discord_id, niveauAcces: item.access_level, actif: item.active, proprietaire: normalise(item.display_name) === "MILO", coproprietaire: false, permissions: (allGrants ?? []).filter((grant: any) => grant.profile_id === item.id).map((grant: any) => grant.permission_code) })) })
      }
      case "recupererArchivesInstructeur": {
        const { data, error } = await admin.from("instructor_archives").select("*").order("created_at", { ascending: false })
        if (error) throw error
        return json({ success: true, archives: (data ?? []).map((row: any) => ({ ligne: row.id, id: row.external_id, matricule: row.matricule_snapshot, steamId: row.steam_id || "", discordId: row.discord_id || "", rapports: row.reports_count, prisesService: row.service_count, dateFin: dateFr(row.ended_on), instructeur: row.instructor_snapshot || "", gerant: row.manager_snapshot || "", commentaire: row.comment || "", sanction: row.sanction || "", resultat: row.result || "", raison: row.reason || "", importeLe: dateHeureFr(row.imported_at), source: row.source || "" })), peutSupprimer: owner })
      }
      case "recupererRapportsInstructeur": {
        const { data, error } = await admin.from("instructor_reports").select("*").order("submitted_at", { ascending: false })
        if (error) throw error
        return json({ success: true, rapports: (data ?? []).map((row: any) => ({ ligne: row.id, id: row.external_id, creeLe: dateHeureFr(row.submitted_at), auteur: row.instructor_snapshot, type: row.report_type, dateEvenement: dateFr(row.event_on), personneFormee: row.trainee_name, matriculeDefinitif: row.final_matricule || "", steamId: row.steam_id || "", discordId: row.discord_id || "", note: row.score, resultat: row.result || "", remarque: row.remark || "", commentaire: row.comment || "", dossierId: row.folder_external_id || "", actif: row.active })), peutModifier: true, peutSupprimer: owner })
      }
      case "recupererSuivisFormationInstructeur":
      case "recupererMesSuivisInstructeur": {
        let query = admin.from("training_followups").select("*").order("updated_at", { ascending: false })
        if (action === "recupererMesSuivisInstructeur") query = query.or(`instructor_profile_id.eq.${profile.id},manager_profile_id.eq.${profile.id}`)
        const { data, error } = await query
        if (error) throw error
        return json({ success: true, suivis: (data ?? []).map((row: any) => ({ ligne: row.id, id: row.external_id, matricule: row.matricule_snapshot, steamId: row.steam_id || "", discordId: row.discord_id || "", rapports: row.reports_count, prisesService: row.service_count, dateFin: dateFr(row.end_on), dateFinInitiale: dateFr(row.initial_end_on), dateFinApresAbsence: dateFr(row.end_after_absence_on), instructeur: row.instructor_snapshot || "", gerant: row.manager_snapshot || "", commentaire: row.comment || "", sanction: row.sanction || "Rien", statut: row.status, source: row.source || "", creeLe: dateHeureFr(row.created_at), modifieLe: dateHeureFr(row.updated_at) })), peutDeciderTous: has("suivis_decider_tous") })
      }
      case "definirDefcon":
        if (!owner) throw new Error("Modification DEFCON réservée au propriétaire.")
        await admin.from("defcon_state").update({ level: Math.max(0, Math.min(5, nombre(payload.niveau))), updated_by_profile_id: profile.id }).eq("singleton", true)
        await audit("DEFCON modifié", texte(payload.niveau))
        return json({ success: true, defcon: nombre(payload.niveau), message: "DEFCON mis à jour." })
      default:
        return json({ success: false, message: `Action Supabase non prise en charge : ${action || "vide"}.` }, 400)
    }
  } catch (error) {
    console.error(error)
    return json({ success: false, message: error instanceof Error ? error.message : "Erreur Supabase." }, 400)
  }
}

export default {
  fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    return authenticated(req)
  },
}
