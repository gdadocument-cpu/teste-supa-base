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
const DUREES_BLACKLIST = [
  "1 semaine", "2 semaines", "3 semaines", "1 mois",
  "2 mois", "3 mois", "6 mois", "Permanent",
]
const MEDAILLES = [
  "🏅 | Croix de la Bravoure", "🏅 | Médaille du Mérite",
  "🏅 | Médaille de l'Activité", "🏅 | Médaille de l'Ancienneté",
  "🏅 | Médaille du Vétéran", "🏅 | Médaille de la Défense",
  "🏅 | Insigne Médecin", "🏅 | Insigne GSPR", "🏅 | Insigne Instructeur",
  "⚜️ | Ancien Gérant",
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
const typeDepartNormalise = (value: unknown) => {
  const type = normalise(value)
  if (type === "DEPART") return "DEPART"
  if (type === "LICENCIEMENT") return "LICENCIEMENT"
  if (type === "BLACKLIST" || type.includes("BLACKLIST") || /^BL(?:\s|-|$)/.test(type)) return "BLACKLIST"
  return ""
}
const finBlacklist = (debut: string, duree: unknown) => {
  const valeur = normalise(duree)
  if (valeur === "PERMANENT" || valeur.includes("PERM")) return null
  const quantite = Number.parseInt(valeur, 10)
  if (!quantite || (!valeur.includes("SEMAINE") && !valeur.includes("MOIS"))) {
    throw new Error("Durée de blacklist invalide.")
  }
  const date = new Date(`${debut}T12:00:00Z`)
  if (valeur.includes("SEMAINE")) date.setUTCDate(date.getUTCDate() + quantite * 7)
  else date.setUTCMonth(date.getUTCMonth() + quantite)
  return date.toISOString().slice(0, 10)
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
const partiesDateHeureParis = (date: Date) => {
  const parties = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const valeur = (type: string) => Number(parties.find((partie) => partie.type === type)?.value || 0)
  return {
    year: valeur("year"), month: valeur("month"), day: valeur("day"),
    hour: valeur("hour"), minute: valeur("minute"), second: valeur("second"),
  }
}
const instantParis = (year: number, month: number, day: number, hour: number) => {
  const cibleUtc = Date.UTC(year, month - 1, day, hour, 0, 0)
  let estimation = cibleUtc
  for (let tentative = 0; tentative < 3; tentative++) {
    const parties = partiesDateHeureParis(new Date(estimation))
    const representeUtc = Date.UTC(
      parties.year, parties.month - 1, parties.day,
      parties.hour, parties.minute, parties.second,
    )
    estimation += cibleUtc - representeUtc
  }
  return new Date(estimation)
}
const metadonneesEffectifGda = (dernierePublication: unknown, reference = new Date()) => {
  const parties = partiesDateHeureParis(reference)
  const echeanceAujourdhui = instantParis(parties.year, parties.month, parties.day, 20)
  const lendemainCivil = new Date(Date.UTC(parties.year, parties.month - 1, parties.day + 1, 12))
  const echeanceDemain = instantParis(
    lendemainCivil.getUTCFullYear(),
    lendemainCivil.getUTCMonth() + 1,
    lendemainCivil.getUTCDate(),
    20,
  )
  const publication = new Date(texte(dernierePublication))
  const publicationMs = Number.isNaN(publication.getTime()) ? 0 : publication.getTime()
  const actualisationDuJourEnAttente = reference >= echeanceAujourdhui && publicationMs < echeanceAujourdhui.getTime()
  const prochaine = reference < echeanceAujourdhui || actualisationDuJourEnAttente
    ? echeanceAujourdhui
    : echeanceDemain
  return {
    actualiseLe: publicationMs,
    prochaineActualisation: prochaine.getTime(),
  }
}
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

    const [{ data: grants }, { data: members }, { data: delayed }, { data: defcon }, { data: suivisProbatoires }, { data: absencesSuivis }, { data: derniereVersionEffectif }] = await Promise.all([
      admin.from("profile_permissions").select("permission_code").eq("profile_id", profile.id),
      admin.from("members").select("*").eq("active", true),
      admin.from("current_gda_roster").select("*"),
      admin.from("defcon_state").select("level,updated_at").eq("singleton", true).maybeSingle(),
      admin.from("training_followups").select("*").eq("status", "EN_ATTENTE"),
      admin.from("absences").select("member_id,matricule_snapshot,starts_on,ends_on"),
      admin.from("gda_roster_versions").select("published_at").order("published_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle(),
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
    const specialisationsAuteur = normalise((ownMember?.specializations ?? []).join("; "))
    const roleGestionInstructeur = specialisationsAuteur.includes("RESPONSABLE INST") ||
      specialisationsAuteur.includes("INSTRUCTEUR EN CHEF")
    const instructor = owner || (ownMember?.specializations ?? []).some((item: string) => normalise(item).includes("INSTRUCTEUR"))
    const peutAdministrerSuivis = owner || permissions.has("role_staff_total") || roleGestionInstructeur
    const requireInstructor = () => { if (!instructor) throw new Error("Accès réservé aux instructeurs.") }
    const requireTrainingManager = () => {
      if (!peutAdministrerSuivis) {
        throw new Error("Prise en charge réservée à la propriété et aux responsables Instructeur.")
      }
    }
    const actorName = ownDelayed?.matricule ?? ownMember?.matricule ?? profile.display_name
    const actorGrade = ownDelayed?.grade ?? ownMember?.grade ?? "Visiteur"
    const actorGradeNormalise = normalise(actorGrade).replace(/[^A-Z]/g, "")
    const rangGrade = (grade: unknown) => GRADES.findIndex((item) => normalise(item) === normalise(grade))
    const rangAuteurNotes = rangGrade(actorGrade)
    const peutNoterMembre = (member: any) => {
      const rangCible = rangGrade(member?.grade)
      return officer && rangAuteurNotes >= 0 && rangCible > rangAuteurNotes
    }
    const peutGererDefcon = owner || permissions.has("role_staff_total") || ["LIEUTENANTCOLONEL", "COMMANDANT", "VICECOMMANDANT"].includes(actorGradeNormalise)
    const suivisProbatoiresActifs = (suivisProbatoires ?? []).filter((suivi: any) => !!suivi.end_on)
    const probatoiresParMembre = new Set(suivisProbatoiresActifs.map((suivi: any) => suivi.member_id).filter(Boolean))
    const probatoiresParMatricule = new Set(suivisProbatoiresActifs.map((suivi: any) => normalise(suivi.matricule_snapshot)))
    const defconClient = {
      niveau: Math.max(0, Math.min(4, nombre(defcon?.level))),
      modifiePar: "",
      modifieLe: defcon?.updated_at ?? "",
    }

    const profilActifParMatricule = async (nom: unknown) => {
      const matricule = texte(nom)
      if (!matricule) return null
      const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(matricule))
      let query = admin.from("profiles").select("id,member_id,display_name").eq("active", true)
      query = member ? query.eq("member_id", member.id) : query.ilike("display_name", matricule)
      const { data, error } = await query.maybeSingle()
      if (error) throw error
      return data
    }

    const suiviAttribueAInstructeur = (row: any) => row.instructor_profile_id
      ? row.instructor_profile_id === profile.id
      : normalise(row.instructor_snapshot) === normalise(actorName)

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

    const synchroniserPresenceMembre = async (memberId: number | null | undefined) => {
      if (!memberId) return
      const today = aujourdHui()
      const { count, error: countError } = await admin
        .from("absences")
        .select("id", { count: "exact", head: true })
        .eq("member_id", memberId)
        .eq("active", true)
        .lte("starts_on", today)
        .gte("ends_on", today)
      if (countError) throw countError
      const { error: updateError } = await admin
        .from("members")
        .update({ presence: (count ?? 0) > 0 ? "Absent" : "Présent" })
        .eq("id", memberId)
      if (updateError) throw updateError
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
        medailles: base.medals ?? [],
        recommandation: nombre(base.recommendation),
        observation: nombre(base.observation),
        notes: base.notes || "",
        peutNoter: !publicOnly && peutNoterMembre(member),
        enPeriodeProbatoire: probatoiresParMembre.has(member?.id) || probatoiresParMatricule.has(normalise(base.matricule)),
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
        traitePar: noms.get(row.processed_by_profile_id) || row.processed_by_snapshot || "",
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
          dateDebut: isoDate(row.starts_on) || "",
          dateFin: isoDate(row.ends_on) || "",
          raison: row.reason,
          statut: actif ? "ACTIF" : "TERMINE",
          auteur: row.profiles?.display_name || row.declared_by_snapshot || "",
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
          dateCreation: row.created_at || "",
          dateModification: row.updated_at || "",
          dateDebut: isoDate(row.starts_on) || "",
          dateFin: isoDate(row.ends_on) || "",
          raison: row.reason,
          statut,
          statutBase: base,
          decidePar: row.profiles?.display_name || row.decided_by_snapshot || "",
          dateDecision: row.decided_at || "",
          motifRefus: row.refusal_reason || "",
          notificationLue: row.notification_read === true,
          notificationSupprimee: row.notification_deleted === true,
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
        peutModifier: has("absences_gerer") || has("disponibilites_modifier_supprimer"),
        peutSupprimer: has("disponibilites_modifier_supprimer"),
      }
    }

    const notificationsAbsenceClient = async () => {
      if (!profile.member_id) return { success: true, notifications: [], nonLues: 0 }
      const demandes = await demandesClient(true)
      const notifications = demandes
        .filter((item: any) => ["VALIDEE", "REFUSEE"].includes(item.statutBase) && !item.notificationSupprimee)
        .map((item: any) => ({
          id: item.id,
          titre: item.statutBase === "VALIDEE" ? "Demande d’absence acceptée" : "Demande d’absence refusée",
          message: item.statutBase === "VALIDEE"
            ? `Votre demande du ${item.dateDebut} au ${item.dateFin} a été acceptée.`
            : `Votre demande a été refusée : ${item.motifRefus || "motif non renseigné"}`,
          date: item.dateDecision,
          lue: item.notificationLue === true,
          type: item.statutBase === "VALIDEE" ? "succes" : "refus",
        }))
      return {
        success: true,
        notifications,
        nonLues: notifications.filter((notification: any) => !notification.lue).length,
      }
    }

    const departsDonnees = async (message = "") => {
      const { data, error } = await admin.from("departures").select("*,profiles!departures_decided_by_profile_id_fkey(display_name)").order("starts_on", { ascending: false })
      if (error) throw error
      const entries = (data ?? []).map((row: any) => {
        const typeNormalise = typeDepartNormalise(row.departure_type)
        return ({
        ligne: row.id, id: row.external_id, nom: row.matricule_snapshot, grade: row.grade_snapshot,
        type: typeNormalise === "DEPART" ? "Départ" : typeNormalise === "LICENCIEMENT" ? "Licenciement" : typeNormalise === "BLACKLIST" ? "Blacklist" : row.departure_type,
        steamId: row.steam_id_snapshot || "", discordId: row.discord_id_snapshot || "",
        dateDepart: dateFr(row.starts_on), dateRetour: dateFr(row.ends_on), raison: row.reason || "",
        peutRevenir: !!row.ends_on && row.ends_on <= aujourdHui(), decision: row.profiles?.display_name || row.decided_by_snapshot || "",
        statut: row.status, permanent: row.status === "PERMANENT" || (typeNormalise === "BLACKLIST" && (normalise(row.departure_type).includes("PERM") || !row.ends_on)),
        medailles: (row.medals_snapshot ?? []).join("; "), medaillesRestaureesLe: dateHeureFr(row.medals_restored_at),
        joursRestants: joursRestants(row.ends_on),
        typeNormalise,
      })})
      return {
        success: true, message,
        membres: membresPublic.map((m: any) => ({ nom: m.nom, grade: m.grade })),
        departs: entries.filter((e: any) => e.typeNormalise === "DEPART"),
        licenciements: entries.filter((e: any) => e.typeNormalise === "LICENCIEMENT"),
        blacklists: entries.filter((e: any) => e.typeNormalise === "BLACKLIST"),
        peutGerer: has("departs_gerer"),
      }
    }

    const gestionPersonnelDonnees = async (message = "") => {
      const { data, error } = await admin.from("personnel_history")
        .select("*,auteur:profiles!personnel_history_performed_by_profile_id_fkey(display_name)")
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
      if (error) throw error
      const logs = (data ?? []).map((row: any) => ({
        ligne: row.id, date: row.occurred_at, personne: row.matricule_snapshot,
        grade: row.grade_snapshot || "", type: row.action_type, choix: row.choice || "",
        raison: row.reason || "", auteur: row.auteur?.display_name || row.performed_by_snapshot || "",
      }))
      const specialisationsAuteur = normalise((ownMember?.specializations ?? []).join(";"))
      const privilegie = owner || permissions.has("role_staff_total")
      const rangAuteur = GRADES.findIndex((grade) => normalise(grade) === normalise(actorGrade))
      const rangCapitaine = GRADES.findIndex((grade) => normalise(grade) === "CAPITAINE")
      const modifiables = new Set(["Instructeur", "Médecin", "Instructeur et Médecin"])
      if (privilegie || (rangAuteur >= 0 && rangAuteur <= rangCapitaine)) {
        ["Responsable MDC", "CO-Responsable MDC", "Responsable INST", "CO-Responsable INST", "Instructeur en chef"].forEach((item) => modifiables.add(item))
      }
      if (specialisationsAuteur.includes("RESPONSABLE MDC")) modifiables.add("CO-Responsable MDC")
      if (specialisationsAuteur.includes("RESPONSABLE INST")) {
        modifiables.add("CO-Responsable INST")
        modifiables.add("Instructeur en chef")
      }
      if (specialisationsAuteur.includes("CO-RESPONSABLE INST")) modifiables.add("Instructeur en chef")
      if (specialisationsAuteur.includes("GERANT GDA")) modifiables.add("CO-Gérant GDA")
      if (privilegie) modifiables.add("Gérant GDA")
      return {
        success: true, message,
        membres: membresClient.map((membre: any) => ({
          ...membre,
          medailles: texte(membre.medaille).split(";").map(texte).filter(Boolean),
          specialisations: texte(membre.specialisation).split(";").map(texte).filter(Boolean),
        })),
        logs, grades: GRADES, sanctions: SANCTIONS, dureesBlacklist: DUREES_BLACKLIST,
        medailles: MEDAILLES, specialisations: SPECIALISATIONS,
        specialisationsModifiables: [...modifiables],
        peutModifierHistorique: has("personnel_historique_modifier"),
        peutSupprimerHistorique: has("personnel_historique_supprimer"),
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

    const rapportInstructeurClient = (row: any) => ({
      ligne: row.id,
      id: row.external_id,
      creeLe: dateHeureFr(row.submitted_at),
      dateEnvoi: dateHeureFr(row.submitted_at),
      auteur: row.instructor_snapshot,
      type: row.report_type,
      date: dateFr(row.event_on),
      dateEvenement: dateFr(row.event_on),
      personneFormee: row.trainee_name,
      matricule: row.final_matricule || "",
      matriculeDefinitif: row.final_matricule || "",
      steamId: row.steam_id || "",
      discordId: row.discord_id || "",
      note: row.score,
      resultat: row.result || "",
      remarque: row.remark || "",
      commentaire: row.comment || "",
      dossierId: row.folder_external_id || "",
      actif: row.active,
    })

    const matriculeDepuisLibelleGerant = (value: unknown) => texte(value)
      .replace(/^g[ée]rant\s*/i, "")
      .replace(/^(?:co[-\s]*resp(?:onsable)?|resp(?:onsable)?)\b\s*/i, "")
      .replace(/^(?:—|–|-|:|\|)\s*/, "")
      .trim()
    const estGerantSuivi = (row: any) =>
      row.manager_profile_id === profile.id ||
      normalise(matriculeDepuisLibelleGerant(row.manager_snapshot)) === normalise(actorName)
    const libelleGerantMembre = (member: any) => {
      const specialisations = normalise((member?.specializations ?? []).join("; "))
      if (specialisations.includes("CO-RESPONSABLE INST") || specialisations.includes("CO RESPONSABLE INST")) {
        return `Co-Resp ${member.matricule}`
      }
      if (specialisations.includes("RESPONSABLE INST")) return `Resp ${member.matricule}`
      return `Gérant — ${member?.matricule ?? ""}`
    }

    const ajouterJoursIso = (dateIso: unknown, jours: number) => {
      const valeur = isoDate(dateIso)
      if (!valeur) return null
      const date = new Date(`${valeur}T12:00:00Z`)
      date.setUTCDate(date.getUTCDate() + Math.trunc(jours || 0))
      return date.toISOString().slice(0, 10)
    }
    const joursSanctionSuivi = (sanction: unknown) => normalise(sanction) === "P1" ? 4 : normalise(sanction) === "P2" ? 6 : 0
    const ajustementsAbsenceSuivi = (row: any) => {
      if (!row.end_on) return { ecoules: 0, planifies: 0, absent: false, dateFinApresAbsence: null, dateFinCompteur: null }
      const aujourdHuiIso = aujourdHui()
      const aujourdHuiMs = new Date(`${aujourdHuiIso}T12:00:00Z`).getTime()
      const debutSuiviIso = ajouterJoursIso(row.initial_end_on || row.end_on, -7) || isoDate(row.created_at) || aujourdHuiIso
      const debutSuiviMs = new Date(`${debutSuiviIso}T12:00:00Z`).getTime()
      const planifies: Array<{ debut: number, fin: number }> = []
      const ecoules: Array<{ debut: number, fin: number }> = []
      let absent = false
      for (const absence of absencesSuivis ?? []) {
        const correspond = row.member_id && absence.member_id
          ? row.member_id === absence.member_id
          : normalise(row.matricule_snapshot) === normalise(absence.matricule_snapshot)
        if (!correspond) continue
        const debutIso = isoDate(absence.starts_on), finIso = isoDate(absence.ends_on)
        if (!debutIso || !finIso || debutIso > aujourdHuiIso) continue
        const debut = Math.max(debutSuiviMs, new Date(`${debutIso}T12:00:00Z`).getTime())
        const finInclusive = new Date(`${finIso}T12:00:00Z`).getTime()
        const fin = finInclusive + 86400000
        if (fin <= debut) continue
        planifies.push({ debut, fin })
        const borneEcoulee = Math.min(fin, aujourdHuiMs)
        if (borneEcoulee > debut) ecoules.push({ debut, fin: borneEcoulee })
        if (debutIso <= aujourdHuiIso && finIso >= aujourdHuiIso) absent = true
      }
      const totalJours = (intervalles: Array<{ debut: number, fin: number }>) => {
        if (!intervalles.length) return 0
        const tries = [...intervalles].sort((a, b) => a.debut - b.debut)
        let debut = tries[0].debut, fin = tries[0].fin, total = 0
        for (const intervalle of tries.slice(1)) {
          if (intervalle.debut <= fin) fin = Math.max(fin, intervalle.fin)
          else { total += Math.round((fin - debut) / 86400000); debut = intervalle.debut; fin = intervalle.fin }
        }
        return total + Math.round((fin - debut) / 86400000)
      }
      const joursEcoules = totalJours(ecoules)
      const joursPlanifies = totalJours(planifies)
      return {
        ecoules: joursEcoules,
        planifies: joursPlanifies,
        absent,
        dateFinApresAbsence: ajouterJoursIso(row.end_on, joursPlanifies),
        dateFinCompteur: ajouterJoursIso(row.end_on, joursEcoules),
      }
    }

    const suiviInstructeurClient = (row: any) => {
      const absence = ajustementsAbsenceSuivi(row)
      return {
      ligne: row.id,
      id: row.external_id,
      matricule: row.matricule_snapshot,
      steamId: row.steam_id || "",
      discordId: row.discord_id || "",
      nombreRapports: row.reports_count,
      rapports: row.reports_count,
      prisesService: row.service_count,
      dateFin: dateFr(row.end_on),
      dateFinInitiale: dateFr(row.initial_end_on),
      dateFinApresAbsence: dateFr(absence.dateFinApresAbsence),
      joursAbsencePlanifies: absence.planifies,
      joursRestants: joursRestants(absence.dateFinCompteur),
      absent: absence.absent,
      instructeur: row.instructor_snapshot || "",
      gerant: row.manager_snapshot || "",
      commentaire: row.comment || "",
      sanction: row.sanction || "Rien",
      statut: normalise(row.status) === "EN_ATTENTE" ? "" : row.status,
      source: row.source || "",
      creeLe: dateHeureFr(row.created_at),
      modifieLe: dateHeureFr(row.updated_at),
      peutDecider: has("suivis_decider_tous") || estGerantSuivi(row),
      peutTransferer: has("role_staff_total") || estGerantSuivi(row),
      }
    }

    switch (action) {
      case "recupererVersionDonnees":
        return json({ success: true, revision: Date.now(), action: "supabase", defcon: defconClient })
      case "presenceEnLigne": {
        const maintenant = new Date()
        const expiration = new Date(maintenant.getTime() - 45000).toISOString()
        const { error: presenceError } = await admin.from("online_presence").upsert({
          profile_id: profile.id,
          member_id: profile.member_id,
          name_snapshot: actorName,
          grade_snapshot: actorGrade,
          last_seen_at: maintenant.toISOString(),
        }, { onConflict: "profile_id" })
        if (presenceError) throw presenceError

        await admin.from("online_presence").delete().lt("last_seen_at", expiration)
        const { data: presences, error: lecturePresenceError } = await admin
          .from("online_presence")
          .select("profile_id,member_id,name_snapshot,grade_snapshot,last_seen_at")
          .gte("last_seen_at", expiration)
          .order("name_snapshot", { ascending: true })
        if (lecturePresenceError) throw lecturePresenceError

        const utilisateurs = (presences ?? []).map((presence: any) => {
          const roster = presence.member_id
            ? delayedById.get(presence.member_id)
            : delayedByName.get(normalise(presence.name_snapshot))
          return {
            nom: roster?.matricule ?? presence.name_snapshot,
            grade: roster?.grade ?? presence.grade_snapshot,
          }
        })
        return json({
          success: true,
          total: utilisateurs.length,
          permissions: [...permissions],
          proprietaire: owner,
          coproprietaire: !owner && permissions.has("role_staff_total"),
          peutGererDefcon,
          utilisateurs,
          defcon: defconClient,
        })
      }
      case "recupererEffectif":
        return json({
          success: true,
          membres: membresClient,
          peutModifier: has("effectif_modifier"),
          peutAjouter: owner || ["LIEUTENANT-COLONEL", "COMMANDANT", "VICE-COMMANDANT"].includes(normalise(ownMember?.grade)),
          grades: GRADES, sanctions: SANCTIONS, medailles: MEDAILLES, specialisations: SPECIALISATIONS,
        })
      case "recupererEffectifPublic":
        return json({ success: true, membres: membresPublic, ...metadonneesEffectifGda(derniereVersionEffectif?.published_at), peutActualiser: has("effectif_public_actualiser"), actualisationForcee: false })
      case "actualiserEffectifPublic": { // publication volontaire de l'instantané retardé
        requirePermission("effectif_public_actualiser")
        const { data: version, error: versionError } = await admin.from("gda_roster_versions").insert({ published_by_profile_id: profile.id, note: "Actualisation depuis le site Supabase" }).select("id,published_at").single()
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
        return json({ success: true, membres: rows.map((row: any) => ({ ...membreClient(memberById.get(row.member_id), true), grade: row.grade })), ...metadonneesEffectifGda(version.published_at), peutActualiser: true, actualisationForcee: true })
      }
      case "enregistrerNote":
      case "modifierMembreEffectif": { // effectif officier instantané uniquement
        if (action === "enregistrerNote") requireOfficer()
        else requirePermission("effectif_modifier")
        const cible = texte(payload.personne || payload.nom || payload.matricule)
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(cible))
        if (!member) throw new Error("Membre introuvable.")
        if (action === "enregistrerNote" && !peutNoterMembre(member)) {
          throw new Error("Vous pouvez ajouter une note uniquement à une personne strictement moins gradée que vous.")
        }
        const patch: Record<string, unknown> = {}
        if (action === "enregistrerNote") patch.notes = texte(payload.note || payload.notes)
        else {
          const nouveauMatricule = texte(payload.nom) || member.matricule
          const homonyme = (members ?? []).find((item: any) => item.id !== member.id && normalise(item.matricule) === normalise(nouveauMatricule))
          if (homonyme) throw new Error("Ce nom ou matricule est déjà utilisé.")
          patch.matricule = nouveauMatricule
          const fields: Record<string, string> = {
            grade: "grade", steamId: "steam_id", discordId: "discord_id", presence: "presence",
            nombreRapports: "reports_count", observation: "observation", datePromotionRetro: "promotion_changed_on",
            dateEntree: "joined_on", sanction: "sanction", recommandation: "recommendation", notes: "notes",
          }
          for (const [source, target] of Object.entries(fields)) if (payload[source] !== undefined) patch[target] = ["promotion_changed_on", "joined_on"].includes(target) ? isoDate(payload[source]) : payload[source]
          if (payload.specialisation !== undefined) patch.specializations = texte(payload.specialisation).split(/[;,]/).map(texte).filter(Boolean)
          if (payload.medaille !== undefined) patch.medals = texte(payload.medaille).split(";").map(texte).filter(Boolean)
        }
        const { data: updated, error } = await admin.from("members").update(patch).eq("id", member.id).select("*").single()
        if (error) throw error
        await audit(action === "enregistrerNote" ? "Note modifiée" : "Effectif officier modifié", updated.matricule)
        const auteurModifie = profile.member_id === member.id
        return json({
          success: true,
          message: "Modification enregistrée dans l’effectif officier.",
          membre: membreClient(updated),
          peutModifier: has("effectif_modifier"),
          gradeAuteur: auteurModifie ? actorGrade : "",
          specialisationAuteur: auteurModifie ? (updated.specializations ?? []).join("; ") : undefined,
          nouvelIdentifiantAuteur: auteurModifie && normalise(updated.matricule) !== normalise(member.matricule)
            ? updated.matricule
            : "",
        })
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
          processed_by_profile_id: profile.id, processed_by_snapshot: profile.display_name, processed_at: new Date().toISOString(),
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
        const { error } = await admin.from("reports").update({ status, processed_by_profile_id: profile.id, processed_by_snapshot: profile.display_name, processed_at: new Date().toISOString() }).eq("id", row.id)
        if (error) throw error
        await admin.from("report_status_history").insert({ report_id: row.id, matricule_snapshot: row.matricule_snapshot, grade_snapshot: row.grade_snapshot, previous_status: row.status, new_status: status, changed_by_profile_id: profile.id, changed_by_snapshot: profile.display_name, report_on: row.report_on })
        await audit("Statut rapport modifié", row.matricule_snapshot, status)
        return json({ success: true, message: "Statut du rapport modifié.", rapports: await rapportsClient() })
      }
      case "archiverTousRapportsLus":
        requirePermission("rapports_gerer")
        await admin.from("reports").update({ status: "ARCHIVE", processed_by_profile_id: profile.id, processed_by_snapshot: profile.display_name, processed_at: new Date().toISOString() }).eq("status", "LU")
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
          const { error } = await admin.from("absence_requests").update({ starts_on: debut, ends_on: fin, reason: texte(payload.raison) }).eq("id", row.id)
          if (error) throw error
        } else if (action === "supprimerDemandeAbsence") {
          if (!['EN_ATTENTE', 'REFUSEE', 'TERMINEE'].includes(row.status)) throw new Error("Cette absence validée est encore active.")
          const { error } = await admin.from("absence_requests").delete().eq("id", row.id)
          if (error) throw error
        } else {
          if (row.status !== "VALIDEE") throw new Error("Seule une absence validée peut être terminée.")
          const today = aujourdHui()
          const { error } = await admin.from("absence_requests").update({ status: "TERMINEE", ends_on: today }).eq("id", row.id)
          if (error) throw error
          if (row.absence_id) {
            const { error: absenceError } = await admin.from("absences").update({ ends_on: today, active: false }).eq("id", row.absence_id)
            if (absenceError) throw absenceError
          }
          await synchroniserPresenceMembre(row.member_id)
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
          const { data: absence, error } = await admin.from("absences").insert({ external_id: idExterne(), member_id: row.member_id, matricule_snapshot: row.matricule_snapshot, grade_snapshot: row.grade_snapshot, starts_on: row.starts_on, ends_on: row.ends_on, reason: row.reason, active: true, declared_by_profile_id: profile.id, declared_by_snapshot: profile.display_name }).select("id").single()
          if (error) throw error
          absenceId = absence.id
        }
        const { error: requestError } = await admin.from("absence_requests").update({ status: accepter ? "VALIDEE" : "REFUSEE", decided_by_profile_id: profile.id, decided_by_snapshot: profile.display_name, decided_at: new Date().toISOString(), refusal_reason: accepter ? null : texte(payload.motifRefus), absence_id: absenceId, notification_read: false, notification_deleted: false }).eq("id", row.id)
        if (requestError) throw requestError
        if (accepter) await synchroniserPresenceMembre(row.member_id)
        await audit(accepter ? "Demande d’absence acceptée" : "Demande d’absence refusée", row.matricule_snapshot)
        return json(await disponibilites(accepter ? "Demande d’absence acceptée." : "Demande d’absence refusée."))
      }
      case "ajouterAbsence": {
        requirePermission("absences_gerer")
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(payload.nom))
        const roster = member ? delayedById.get(member.id) : delayedByName.get(normalise(payload.nom))
        if (!member && !roster) throw new Error("Membre introuvable.")
        const debut = isoDate(payload.dateDebut), fin = isoDate(payload.dateFin)
        if (!debut || !fin || fin < debut) throw new Error("Dates d’absence invalides.")
        const { error } = await admin.from("absences").insert({ external_id: idExterne(), member_id: member?.id ?? null, matricule_snapshot: roster?.matricule ?? member?.matricule ?? texte(payload.nom), grade_snapshot: roster?.grade ?? member?.grade ?? "Non renseigné", starts_on: debut, ends_on: fin, reason: texte(payload.raison), active: true, declared_by_profile_id: profile.id, declared_by_snapshot: profile.display_name })
        if (error) throw error
        await synchroniserPresenceMembre(member?.id)
        await audit("Absence ajoutée", roster?.matricule ?? member?.matricule ?? texte(payload.nom))
        return json(await disponibilites("Absence ajoutée."))
      }
      case "modifierAbsence":
      case "retourAnticipe":
      case "supprimerAbsence": {
        if (action === "supprimerAbsence") requirePermission("disponibilites_modifier_supprimer")
        else requirePermission("absences_gerer")
        const id = nombre(payload.ligne)
        const { data: absence, error: findError } = await admin.from("absences").select("id,member_id").eq("id", id).maybeSingle()
        if (findError || !absence) throw new Error("Absence introuvable.")
        if (action === "supprimerAbsence") {
          const { error } = await admin.from("absences").delete().eq("id", id)
          if (error) throw error
        } else if (action === "retourAnticipe") {
          const { error } = await admin.from("absences").update({ ends_on: aujourdHui(), active: false }).eq("id", id)
          if (error) throw error
        } else {
          const debut = isoDate(payload.dateDebut), fin = isoDate(payload.dateFin)
          if (!debut || !fin || fin < debut) throw new Error("Dates d’absence invalides.")
          const { error } = await admin.from("absences").update({ starts_on: debut, ends_on: fin, reason: texte(payload.raison), active: fin >= aujourdHui() }).eq("id", id)
          if (error) throw error
        }
        await synchroniserPresenceMembre(absence.member_id)
        await audit(action)
        return json(await disponibilites("Absence mise à jour."))
      }
      case "recupererNotifications": {
        return json(await notificationsAbsenceClient())
      }
      case "marquerNotificationsLues": {
        if (profile.member_id) {
          const { error } = await admin.from("absence_requests")
            .update({ notification_read: true })
            .eq("member_id", profile.member_id)
            .in("status", ["VALIDEE", "REFUSEE"])
            .eq("notification_deleted", false)
          if (error) throw error
        }
        return json(await notificationsAbsenceClient())
      }
      case "effacerNotifications": {
        if (profile.member_id) {
          const { error } = await admin.from("absence_requests")
            .update({ notification_deleted: true })
            .eq("member_id", profile.member_id)
            .in("status", ["VALIDEE", "REFUSEE"])
          if (error) throw error
        }
        return json(await notificationsAbsenceClient())
      }
      case "recupererDeparts": {
        requireOfficer()
        return json(await departsDonnees())
      }
      case "ajouterDepart": {
        requirePermission("departs_gerer")
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(payload.nom))
        if (!member) throw new Error("Membre introuvable.")
        const type = typeDepartNormalise(payload.type) || "DEPART"
        const start = isoDate(payload.dateDepart) ?? aujourdHui()
        const end = type === "BLACKLIST" ? finBlacklist(start, payload.duree) : isoDate(payload.dateRetour)
        const { error } = await admin.from("departures").insert({
          external_id: idExterne(), member_id: member.id, matricule_snapshot: member.matricule,
          grade_snapshot: delayedById.get(member.id)?.grade ?? member.grade, steam_id_snapshot: member.steam_id,
          discord_id_snapshot: member.discord_id, departure_type: type, starts_on: start, ends_on: end,
          reason: texte(payload.raison) || null, status: end ? "TEMPORAIRE" : "PERMANENT",
          decided_by_profile_id: profile.id, decided_by_snapshot: profile.display_name, medals_snapshot: member.medals ?? [],
        })
        if (error) throw error
        await audit("Dossier de départ ajouté", member.matricule, type)
        return json(await departsDonnees("Dossier enregistré."))
      }
      case "modifierDepart":
      case "supprimerDepart": {
        requirePermission("departs_gerer")
        const id = nombre(payload.ligne)
        if (action === "supprimerDepart") {
          const { error } = await admin.from("departures").delete().eq("id", id)
          if (error) throw error
        } else {
          const { error } = await admin.from("departures").update({
            departure_type: typeDepartNormalise(payload.type) || normalise(payload.type), starts_on: isoDate(payload.dateDepart), ends_on: isoDate(payload.dateRetour),
            status: texte(payload.statut) || (isoDate(payload.dateRetour) ? "TEMPORAIRE" : "PERMANENT"), reason: texte(payload.raison) || null,
          }).eq("id", id)
          if (error) throw error
        }
        await audit(action === "supprimerDepart" ? "Dossier de départ supprimé" : "Dossier de départ modifié", String(id))
        return json(await departsDonnees(action === "supprimerDepart" ? "Dossier supprimé." : "Dossier modifié."))
      }
      case "recupererRecommandationsObservations": {
        requireOfficer()
        const { data, error } = await admin.from("recommendations_observations").select("*,profiles!recommendations_observations_recorded_by_profile_id_fkey(display_name)").order("created_at", { ascending: false })
        if (error) throw error
        const historique = (data ?? []).map((row: any) => ({ id: row.external_id, date: dateFr(row.occurred_on), personne: row.matricule_snapshot, grade: row.grade_snapshot || "", type: row.entry_type, nature: row.nature || "", emetteur: row.transmitted_by || "", raison: row.reason || "", enregistrePar: row.profiles?.display_name || row.recorded_by_snapshot || "", creeLe: dateHeureFr(row.created_at) }))
        return json({ success: true, membres: membresPublic.map((m: any) => ({ nom: m.nom, grade: m.grade, recommandations: m.recommandation, observations: m.observation })), historique, peutPurger: owner })
      }
      case "ajouterRecommandationObservation":
      case "modifierRecommandationObservation": {
        requireOfficer()
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(payload.personne))
        if (!member) throw new Error("Membre introuvable.")
        const type = normalise(payload.type) === "OBSERVATION" ? "OBSERVATION" : "RECOMMANDATION"
        const transmittedBy = normalise(payload.emetteur) === "AUTRE" ? texte(payload.emetteurAutre) : texte(payload.emetteur)
        const reason = normalise(payload.raisonType) === "AUTRE" || type === "OBSERVATION" ? texte(payload.raison) : texte(payload.raisonType)
        const values = {
          member_id: member.id, matricule_snapshot: member.matricule,
          grade_snapshot: delayedById.get(member.id)?.grade ?? member.grade,
          entry_type: type, nature: texte(payload.nature) || null,
          transmitted_by: transmittedBy || null, reason: reason || null,
          recorded_by_profile_id: profile.id, recorded_by_snapshot: profile.display_name, recorder_grade_snapshot: actorGrade,
          occurred_on: isoDate(payload.date) ?? aujourdHui(),
        }
        if (action === "ajouterRecommandationObservation") {
          const { error } = await admin.from("recommendations_observations").insert({ external_id: idExterne(), ...values })
          if (error) throw error
        } else {
          const { error } = await admin.from("recommendations_observations").update(values).eq("external_id", texte(payload.id))
          if (error) throw error
        }
        const [{ count: recs }, { count: obs }] = await Promise.all([
          admin.from("recommendations_observations").select("id", { count: "exact", head: true }).eq("member_id", member.id).eq("entry_type", "RECOMMANDATION"),
          admin.from("recommendations_observations").select("id", { count: "exact", head: true }).eq("member_id", member.id).eq("entry_type", "OBSERVATION"),
        ])
        await admin.from("members").update({ recommendation: String(recs ?? 0), observation: String(obs ?? 0) }).eq("id", member.id)
        await audit(type === "OBSERVATION" ? "Observation enregistrée" : "Recommandation enregistrée", member.matricule)
        return json({ success: true, message: "Élément enregistré." })
      }
      case "purgerRecommandationsObservations": {
        if (!owner) throw new Error("Purge réservée au propriétaire.")
        const { error } = await admin.from("recommendations_observations").delete().gt("id", 0)
        if (error) throw error
        await admin.from("members").update({ recommendation: "0", observation: "0" }).eq("active", true)
        await audit("Nouvelle semaine recommandations/observations")
        return json({ success: true, message: "Les compteurs ont été remis à zéro." })
      }
      case "recupererGestionPersonnel": {
        requireOfficer()
        return json(await gestionPersonnelDonnees())
      }
      case "appliquerGestionPersonnel": {
        requirePermission("personnel_historique_modifier")
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(payload.personne))
        if (!member) throw new Error("Membre introuvable.")
        const type = texte(payload.type)
        const choix = texte(payload.choix)
        const patch: Record<string, unknown> = {}
        const normalizedType = normalise(type)
        if (["PROMOTION", "RETROGRADATION"].includes(normalizedType)) {
          patch.grade = choix
          patch.promotion_changed_on = aujourdHui()
        } else if (normalizedType === "SANCTION") patch.sanction = choix || "Clean"
        else if (normalizedType === "SPECIALISATION") patch.specializations = choix.split(/[;,]/).map(texte).filter(Boolean)
        else if (normalizedType === "MEDAILLE") {
          const medals = new Set<string>(member.medals ?? [])
          if (normalise(choix).startsWith("RETIR")) medals.delete(choix.replace(/^Retir[^:]*:\s*/i, ""))
          else medals.add(choix.replace(/^Donn[^:]*:\s*/i, ""))
          patch.medals = [...medals].filter(Boolean)
        }
        if (Object.keys(patch).length) {
          const { error } = await admin.from("members").update(patch).eq("id", member.id)
          if (error) throw error
        }
        if (["DEPART", "LICENCIEMENT", "BLACKLIST"].includes(normalizedType)) {
          const startsOn = isoDate(payload.dateDepart) ?? aujourdHui()
          const endsOn = normalizedType === "BLACKLIST" ? finBlacklist(startsOn, choix) : isoDate(payload.dateRetour)
          const { error } = await admin.from("departures").insert({
            external_id: idExterne(), member_id: member.id, matricule_snapshot: member.matricule,
            grade_snapshot: delayedById.get(member.id)?.grade ?? member.grade, steam_id_snapshot: member.steam_id,
            discord_id_snapshot: member.discord_id, departure_type: normalizedType, starts_on: startsOn,
            ends_on: endsOn, reason: texte(payload.raison) || null,
            status: endsOn ? "TEMPORAIRE" : "PERMANENT", decided_by_profile_id: profile.id, decided_by_snapshot: profile.display_name,
            medals_snapshot: member.medals ?? [],
          })
          if (error) throw error
        }
        const { error: historyError } = await admin.from("personnel_history").insert({
          member_id: member.id, matricule_snapshot: member.matricule,
          grade_snapshot: delayedById.get(member.id)?.grade ?? member.grade,
          action_type: type, choice: choix || null, reason: texte(payload.raison) || null,
          performed_by_profile_id: profile.id, performed_by_snapshot: profile.display_name, occurred_at: new Date().toISOString(),
        })
        if (historyError) throw historyError
        await audit(type, member.matricule, choix)
        const gestion = await gestionPersonnelDonnees("Action enregistrée.")
        const departs = await departsDonnees()
        const { data: membresActualises, error: membresActualisesError } = await admin
          .from("members")
          .select("*")
          .eq("active", true)
          .order("id", { ascending: true })
        if (membresActualisesError) throw membresActualisesError
        const effectifActualise = (membresActualises ?? []).map((item: any) => membreClient(item))
        const membresGestionActualises = effectifActualise.map((membre: any) => ({
          ...membre,
          medailles: texte(membre.medaille).split(";").map(texte).filter(Boolean),
          specialisations: texte(membre.specialisation).split(";").map(texte).filter(Boolean),
        }))
        return json({
          ...departs,
          ...gestion,
          membres: membresGestionActualises,
          message: "Action enregistrée.",
          effectif: effectifActualise,
        })
      }
      case "modifierLogGestionPersonnel": {
        requirePermission("personnel_historique_modifier")
        const id = nombre(payload.ligne)
        const membre = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(payload.personne))
        const auteur = await profilActifParMatricule(payload.auteur)
        const dateDemandee = texte(payload.date)
        const date = dateDemandee ? new Date(dateDemandee) : null
        const { error } = await admin.from("personnel_history").update({
          member_id: membre?.id ?? null,
          matricule_snapshot: texte(payload.personne),
          grade_snapshot: texte(payload.grade) || null,
          action_type: texte(payload.type),
          choice: texte(payload.choix) || null,
          reason: texte(payload.raison) || null,
          performed_by_profile_id: auteur?.id ?? null,
          performed_by_snapshot: auteur?.display_name ?? (texte(payload.auteur) || null),
          occurred_at: date && !Number.isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString(),
        }).eq("id", id)
        if (error) throw error
        await audit("Historique du personnel modifié", String(id))
        return json(await gestionPersonnelDonnees("Historique mis à jour."))
      }
      case "supprimerLogGestionPersonnel": {
        requirePermission("personnel_historique_supprimer")
        const id = nombre(payload.ligne)
        const { error } = await admin.from("personnel_history").delete().eq("id", id)
        if (error) throw error
        await audit("Historique du personnel supprimé", String(id))
        return json(await gestionPersonnelDonnees("Ligne supprimée."))
      }
      case "recupererListeBlanche": {
        requirePermission("administration_permissions")
        const [{ data, error }, { data: permissionRows }, { data: profileRows }, { data: grantRows }] = await Promise.all([
          admin.from("whitelist").select("*").order("created_at", { ascending: false }),
          admin.from("permissions").select("code,label").order("code"),
          admin.from("profiles").select("id,discord_id,access_level,active"),
          admin.from("profile_permissions").select("profile_id,permission_code"),
        ])
        if (error) throw error
        const profileByDiscord = new Map((profileRows ?? []).map((item: any) => [item.discord_id, item]))
        const personnes = (data ?? []).map((row: any) => {
          const linked = profileByDiscord.get(row.discord_id)
          const assigned = linked ? (grantRows ?? []).filter((grant: any) => grant.profile_id === linked.id).map((grant: any) => grant.permission_code) : []
          return { id: row.external_id, identifiant: row.login_identifier, discordId: row.discord_id, actif: row.active, permissions: assigned, roleStaff: assigned.includes("role_staff_total"), roleVisiteur: assigned.includes("role_visiteur"), creeLe: dateHeureFr(row.created_at), modifieLe: dateHeureFr(row.updated_at) }
        })
        return json({ success: true, personnes, permissions: (permissionRows ?? []).map((item: any) => ({ cle: item.code, libelle: item.label })), peutModifier: true, peutSupprimer: owner })
      }
      case "ajouterListeBlanche":
      case "modifierListeBlanche":
      case "supprimerListeBlanche": {
        requirePermission("administration_permissions")
        const externalId = texte(payload.id)
        if (action === "supprimerListeBlanche") {
          const { data: row } = await admin.from("whitelist").select("discord_id,login_identifier").eq("external_id", externalId).maybeSingle()
          const { error } = await admin.from("whitelist").delete().eq("external_id", externalId)
          if (error) throw error
          if (row) await admin.from("profiles").update({ active: false }).eq("discord_id", row.discord_id)
          await audit("Accès liste blanche supprimé", row?.login_identifier || externalId)
          return json({ success: true, message: "Accès retiré de la liste blanche." })
        }
        const identifier = texte(payload.nouvelIdentifiant)
        const discordId = texte(payload.discordId)
        if (!identifier || !/^\d{15,22}$/.test(discordId)) throw new Error("Identifiant ou Discord ID invalide.")
        let ancienDiscordId = ""
        if (action === "ajouterListeBlanche") {
          const { error } = await admin.from("whitelist").insert({ external_id: idExterne(), login_identifier: identifier, discord_id: discordId, active: true })
          if (error) throw error
        } else {
          const { data: ancienneEntree, error: lectureError } = await admin.from("whitelist").select("discord_id").eq("external_id", externalId).maybeSingle()
          if (lectureError || !ancienneEntree) throw lectureError ?? new Error("Personne introuvable dans la liste blanche.")
          ancienDiscordId = texte(ancienneEntree.discord_id)
          const { error } = await admin.from("whitelist").update({ login_identifier: identifier, discord_id: discordId, active: true }).eq("external_id", externalId)
          if (error) throw error
        }
        const requested = texte(payload.permissions).split(",").map(texte).filter(Boolean)
        let { data: linked, error: profilError } = await admin.from("profiles").select("id,access_level").eq("discord_id", discordId).maybeSingle()
        if (profilError) throw profilError
        if (!linked && ancienDiscordId && ancienDiscordId !== discordId) {
          const resultatAncienProfil = await admin.from("profiles").select("id,access_level").eq("discord_id", ancienDiscordId).maybeSingle()
          if (resultatAncienProfil.error) throw resultatAncienProfil.error
          linked = resultatAncienProfil.data
        }
        if (!linked) {
          const resultatProfilNom = await admin.from("profiles").select("id,access_level").ilike("display_name", identifier).maybeSingle()
          if (resultatProfilNom.error) throw resultatProfilNom.error
          linked = resultatProfilNom.data
        }
        if (!linked) {
          const resultatCreation = await admin.from("profiles").insert({ display_name: identifier, discord_id: discordId, access_level: "visitor", active: true }).select("id,access_level").single()
          if (resultatCreation.error) throw resultatCreation.error
          linked = resultatCreation.data
        } else {
          const miseAJourProfil: Record<string, unknown> = { active: true }
          if (linked.access_level === "visitor") {
            miseAJourProfil.display_name = identifier
            miseAJourProfil.discord_id = discordId
          }
          const { error: miseAJourError } = await admin.from("profiles").update(miseAJourProfil).eq("id", linked.id)
          if (miseAJourError) throw miseAJourError
        }
        const { error: suppressionPermissionsError } = await admin.from("profile_permissions").delete().eq("profile_id", linked.id)
        if (suppressionPermissionsError) throw suppressionPermissionsError
        if (requested.length) {
          const { error: ajoutPermissionsError } = await admin.from("profile_permissions").insert(requested.map((code) => ({ profile_id: linked.id, permission_code: code, granted_by_profile_id: profile.id })))
          if (ajoutPermissionsError) throw ajoutPermissionsError
        }
        await audit(action === "ajouterListeBlanche" ? "Accès liste blanche ajouté" : "Accès liste blanche modifié", identifier)
        return json({ success: true, message: action === "ajouterListeBlanche" ? "Personne ajoutée à la liste blanche." : "Liste blanche et permissions modifiées.", permissions: requested })
      }
      case "recupererJournalActions": {
        requirePermission("administration_logs")
        const { data, error } = await admin.from("audit_logs").select("*").order("occurred_at", { ascending: false }).limit(1000)
        if (error) throw error
        return json({ success: true, logs: (data ?? []).map((row: any) => ({ ligne: row.id, date: dateHeureFr(row.occurred_at), auteur: row.actor_name_snapshot || "", grade: row.actor_grade_snapshot || "", action: row.action, cible: row.target || "", details: row.details || "" })), peutSupprimer: owner })
      }
      case "supprimerJournalAction":
      case "viderJournalActions": {
        if (!owner) throw new Error("Suppression des logs réservée au propriétaire.")
        const { error } = action === "viderJournalActions"
          ? await admin.from("audit_logs").delete().gt("id", 0)
          : await admin.from("audit_logs").delete().eq("id", nombre(payload.ligne))
        if (error) throw error
        return json({ success: true, message: action === "viderJournalActions" ? "Journal vidé." : "Ligne supprimée." })
      }
      case "recupererAdministration": {
        requirePermission("administration_permissions")
        const [{ data: allProfiles }, { data: allGrants }, { data: allPermissions }] = await Promise.all([
          admin.from("profiles").select("id,member_id,display_name,discord_id,access_level,active"),
          admin.from("profile_permissions").select("profile_id,permission_code"),
          admin.from("permissions").select("code,label").order("code"),
        ])
        return json({
          success: true, auteurProprietaire: owner, auteurCoproprietaire: !owner && permissions.has("role_staff_total"), proprietaireNom: (allProfiles ?? []).find((item: any) => item.access_level === "owner")?.display_name || "Milo",
          permissions: (allPermissions ?? []).map((item: any) => ({ cle: item.code, libelle: item.label })),
          utilisateurs: (allProfiles ?? []).map((item: any) => ({
            id: item.id, nom: item.display_name, grade: delayedById.get(item.member_id)?.grade ?? memberById.get(item.member_id)?.grade ?? "Visiteur",
            discordId: item.discord_id, niveauAcces: item.access_level, actif: item.active,
            proprietaire: item.access_level === "owner" || normalise(item.display_name) === "MILO", coproprietaire: item.access_level !== "owner" && (allGrants ?? []).some((grant: any) => grant.profile_id === item.id && grant.permission_code === "role_staff_total"),
            permissions: (allGrants ?? []).filter((grant: any) => grant.profile_id === item.id).map((grant: any) => grant.permission_code),
          })),
        })
      }
      case "enregistrerPermissions":
      case "definirCoproprietaire":
      case "transfererPropriete": {
        if (!owner && !permissions.has("role_staff_total")) throw new Error("Action réservée à la propriété.")
        const { data: target, error } = await admin.from("profiles").select("id,display_name,access_level").ilike("display_name", texte(payload.personne)).maybeSingle()
        if (error || !target) throw new Error("Utilisateur introuvable.")
        if (action === "enregistrerPermissions") {
          const requested = texte(payload.permissions).split(",").map(texte).filter(Boolean)
          await admin.from("profile_permissions").delete().eq("profile_id", target.id)
          if (requested.length) {
            const { error: grantError } = await admin.from("profile_permissions").insert(requested.map((code) => ({ profile_id: target.id, permission_code: code, granted_by_profile_id: profile.id })))
            if (grantError) throw grantError
          }
          await audit("Permissions modifiées", target.display_name, requested.join(", "))
          return json({ success: true, message: "Permissions enregistrées.", permissions: requested })
        }
        if (action === "definirCoproprietaire") {
          const active = bool(payload.actif)
          if (active) {
            await admin.from("profile_permissions").upsert({ profile_id: target.id, permission_code: "role_staff_total", granted_by_profile_id: profile.id })
          } else {
            await admin.from("profile_permissions").delete().eq("profile_id", target.id).eq("permission_code", "role_staff_total")
          }
          return json({ success: true, message: active ? "Co-propriétaire nommé." : "Co-propriétaire retiré.", coproprietaire: active, permissions: [] })
        }
        if (!owner) throw new Error("Transfert réservé au propriétaire.")
        await admin.from("profiles").update({ access_level: "officer" }).eq("id", profile.id)
        await admin.from("profiles").update({ access_level: "owner" }).eq("id", target.id)
        return json({ success: true, message: `Propriété transférée à ${target.display_name}.`, permissionsAuteur: [...permissions] })
      }
      case "recupererArchivesInstructeur": {
        const { data, error } = await admin.from("instructor_archives").select("*").order("created_at", { ascending: false })
        if (error) throw error
        return json({ success: true, archives: (data ?? []).map((row: any) => ({ ligne: row.id, id: row.external_id, matricule: row.matricule_snapshot, steamId: row.steam_id || "", discordId: row.discord_id || "", rapports: row.reports_count, prisesService: row.service_count, dateFin: dateFr(row.ended_on), instructeur: row.instructor_snapshot || "", gerant: row.manager_snapshot || "", commentaire: row.comment || "", sanction: row.sanction || "", resultat: row.result || "", raison: row.reason || "", importeLe: dateHeureFr(row.imported_at), source: row.source || "" })), peutSupprimer: owner })
      }
      case "recupererRapportsInstructeur": {
        const { data, error } = await admin.from("instructor_reports").select("*").order("submitted_at", { ascending: false })
        if (error) throw error
        return json({ success: true, rapports: (data ?? []).map(rapportInstructeurClient), peutAdministrer: officer || instructor, peutModifier: officer || instructor, peutSupprimer: owner })
      }
      case "verifierMatriculeRapportTestInstructeur": {
        requireInstructor()
        const matricule = texte(payload.matricule)
        if (!matricule) throw new Error("Le matricule définitif est obligatoire.")
        const existe = (members ?? []).some((member: any) => normalise(member.matricule) === normalise(matricule))
        return json({
          success: true,
          matricule,
          disponible: !existe,
          message: existe
            ? "Ce matricule est déjà présent dans l’effectif."
            : "Ce matricule est disponible.",
        })
      }
      case "recupererSuivisFormationInstructeur":
      case "recupererMesSuivisInstructeur": {
        let query = admin.from("training_followups").select("*").eq("status", "EN_ATTENTE").order("updated_at", { ascending: false })
        const { data, error } = await query
        if (error) throw error
        await Promise.all((data ?? []).filter((row: any) => !!row.end_on).map(async (row: any) => {
          const absence = ajustementsAbsenceSuivi(row)
          if (nombre(row.compensated_absence_days) === absence.ecoules &&
              isoDate(row.end_after_absence_on) === isoDate(absence.dateFinApresAbsence)) return
          const { error: syncError } = await admin.from("training_followups").update({
            compensated_absence_days: absence.ecoules,
            end_after_absence_on: absence.dateFinApresAbsence,
            last_manual_freeze_at: null,
            manual_freeze_days: 0,
          }).eq("id", row.id)
          if (syncError) throw syncError
          row.compensated_absence_days = absence.ecoules
          row.end_after_absence_on = absence.dateFinApresAbsence
        }))
        const rows = action === "recupererMesSuivisInstructeur"
          ? (data ?? []).filter(suiviAttribueAInstructeur)
          : (data ?? [])
        const actifs = rows.filter((row: any) => !!row.end_on)
        const nouveaux = rows.filter((row: any) => !row.end_on)
        if (action === "recupererMesSuivisInstructeur") {
          return json({ success: true, suivis: actifs.map(suiviInstructeurClient) })
        }

        const [{ data: profilsActifs }, { data: droitsProfils }, { data: rapportsFormation }] = await Promise.all([
          admin.from("profiles").select("id,member_id,display_name,access_level").eq("active", true),
          admin.from("profile_permissions").select("profile_id,permission_code"),
          nouveaux.length
            ? admin.from("instructor_reports").select("folder_external_id,final_matricule,steam_id,discord_id").eq("active", true).eq("report_type", "FORMATION")
            : Promise.resolve({ data: [] }),
        ])
        const droitsParProfil = new Map<number, Set<string>>()
        for (const droit of droitsProfils ?? []) {
          if (!droitsParProfil.has(droit.profile_id)) droitsParProfil.set(droit.profile_id, new Set())
          droitsParProfil.get(droit.profile_id)?.add(droit.permission_code)
        }
        const profilParMembre = new Map((profilsActifs ?? []).filter((p: any) => p.member_id).map((p: any) => [p.member_id, p]))
        const instructeurs = (members ?? [])
          .filter((member: any) => (member.specializations ?? []).some((item: string) => normalise(item).includes("INSTRUCTEUR")))
          .map((member: any) => ({ nom: member.matricule, specialisation: (member.specializations ?? []).join("; ") }))
          .sort((a: any, b: any) => normalise(a.nom).localeCompare(normalise(b.nom)))
        const gerants = (members ?? [])
          .filter((member: any) => {
            const specialisations = normalise((member.specializations ?? []).join("; "))
            const profil: any = profilParMembre.get(member.id)
            const droits = profil ? droitsParProfil.get(profil.id) : null
            return specialisations.includes("RESPONSABLE INST") || specialisations.includes("INSTRUCTEUR EN CHEF") ||
              profil?.access_level === "owner" || droits?.has("role_staff_total") || droits?.has("suivis_decider_tous")
          })
          .map((member: any) => ({ nom: member.matricule, libelle: libelleGerantMembre(member), grade: member.grade || "" }))
          .sort((a: any, b: any) => normalise(a.nom).localeCompare(normalise(b.nom)))
        const nouveauxClients = nouveaux.map((row: any) => {
          const formation = (rapportsFormation ?? []).find((rapport: any) =>
            (rapport.folder_external_id && rapport.folder_external_id === row.external_id) ||
            (!rapport.folder_external_id && normalise(rapport.final_matricule) === normalise(row.matricule_snapshot)))
          return {
            ...suiviInstructeurClient(row),
            formationEffectuee: !!formation,
            steamIdFormation: formation?.steam_id || "",
            discordIdFormation: formation?.discord_id || "",
            identifiantsConformes: !!formation && normalise(row.steam_id) === normalise(formation.steam_id) &&
              normalise(row.discord_id) === normalise(formation.discord_id),
          }
        })
        return json({
          success: true,
          suivis: actifs.map(suiviInstructeurClient),
          nouveauxArrivants: nouveauxClients,
          instructeurs,
          gerants,
          gerantConnecte: libelleGerantMembre(ownMember ?? { matricule: actorName, specializations: [] }),
          peutModifier: peutAdministrerSuivis,
          peutDeciderTous: has("suivis_decider_tous"),
        })
      }
      case "mettreAJourMonSuiviInstructeur": {
        const suiviId = texte(payload.suiviId)
        let query = admin.from("training_followups").select("*")
        query = /^\d+$/.test(suiviId) ? query.eq("id", Number(suiviId)) : query.eq("external_id", suiviId)
        const { data: suivi, error } = await query.maybeSingle()
        if (error || !suivi) throw new Error("Suivi introuvable.")
        if (!suiviAttribueAInstructeur(suivi)) throw new Error("Ce suivi appartient uniquement à l’instructeur désigné.")
        const { error: updateError } = await admin.from("training_followups").update({ comment: texte(payload.commentaire) || null, service_count: Math.max(0, nombre(payload.prisesService)) }).eq("id", suivi.id)
        if (updateError) throw updateError
        return json({ success: true, message: "Suivi enregistré." })
      }
      case "recupererCandidatsRapportFormationInstructeur": {
        requireInstructor()
        const { data: suivis, error: suivisError } = await admin
          .from("training_followups")
          .select("external_id,matricule_snapshot,steam_id,discord_id")
          .eq("status", "EN_ATTENTE")
          .is("end_on", null)
          .order("created_at", { ascending: false })
        if (suivisError) throw suivisError
        const dossiers = (suivis ?? []).map((suivi: any) => suivi.external_id)
        const { data: formations, error: formationsError } = dossiers.length
          ? await admin.from("instructor_reports")
            .select("folder_external_id")
            .eq("active", true)
            .eq("report_type", "FORMATION")
            .in("folder_external_id", dossiers)
          : { data: [], error: null }
        if (formationsError) throw formationsError
        const dossiersFormes = new Set((formations ?? []).map((rapport: any) => rapport.folder_external_id))
        const candidats = (suivis ?? [])
          .filter((suivi: any) => !dossiersFormes.has(suivi.external_id))
          .map((suivi: any) => ({
            matricule: suivi.matricule_snapshot,
            steamId: suivi.steam_id || "",
            discordId: suivi.discord_id || "",
          }))
          .sort((a: any, b: any) => normalise(a.matricule).localeCompare(normalise(b.matricule)))
        return json({ success: true, candidats })
      }
      case "enregistrerRapportTestInstructeur":
      case "enregistrerRapportFormationInstructeur": {
        requireInstructor()
        const isTest = action === "enregistrerRapportTestInstructeur"
        const matricule = texte(payload.matricule)
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(matricule))
        if (isTest && member) throw new Error("Ce matricule est déjà présent dans l’effectif. Vérifiez-en un autre.")
        const personneFormee = texte(payload.personneFormee)
        const steamId = texte(payload.steamId)
        const discordId = texte(payload.discordId).replace(/\D/g, "")
        const score = isTest ? Number(texte(payload.note).replace(",", ".")) : null
        if (!matricule) throw new Error("Le matricule définitif est obligatoire.")
        if (isTest && !personneFormee) throw new Error("La personne formée est obligatoire.")
        if (!steamId) throw new Error("Le Steam ID est obligatoire.")
        if (!/^\d{15,22}$/.test(discordId)) throw new Error("Le Discord ID doit contenir entre 15 et 22 chiffres.")
        if (isTest && (!Number.isFinite(score) || score < 0 || score > 20)) throw new Error("La note doit être comprise entre 0 et 20.")
        const accepted = !isTest || Number(score) >= 14
        const reportExternalId = idExterne()
        let folderExternalId = reportExternalId
        let suiviExistant: any = null
        if (isTest && accepted) {
          const { data, error } = await admin.from("training_followups")
            .select("id,external_id")
            .eq("status", "EN_ATTENTE")
            .ilike("matricule_snapshot", matricule)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
          if (error) throw error
          suiviExistant = data
          if (suiviExistant?.external_id) folderExternalId = suiviExistant.external_id
        } else if (!isTest) {
          const { data: suivi, error: suiviError } = await admin.from("training_followups")
            .select("id,external_id")
            .eq("status", "EN_ATTENTE")
            .is("end_on", null)
            .ilike("matricule_snapshot", matricule)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle()
          if (suiviError) throw suiviError
          if (!suivi) throw new Error("Cette personne n’est plus en attente de formation. Actualisez la page.")
          folderExternalId = suivi.external_id
          const { data: formationExistante, error: formationError } = await admin.from("instructor_reports")
            .select("id")
            .eq("active", true)
            .eq("report_type", "FORMATION")
            .eq("folder_external_id", folderExternalId)
            .limit(1)
            .maybeSingle()
          if (formationError) throw formationError
          if (formationExistante) throw new Error("Un rapport Formation existe déjà pour cette personne.")
        }
        const row = {
          external_id: reportExternalId, created_by_profile_id: profile.id, instructor_snapshot: actorName,
          report_type: isTest ? "TEST" : "FORMATION", event_on: isoDate(isTest ? payload.dateTest : payload.dateFormation) ?? aujourdHui(),
          trainee_name: isTest ? personneFormee : (member?.matricule ?? matricule), final_matricule: matricule,
          steam_id: steamId, discord_id: discordId,
          score, result: accepted ? "ACCEPTE" : "REFUSE", folder_external_id: folderExternalId,
          remark: texte(payload.remarque) || null, comment: texte(payload.commentaire) || null,
        }
        const { data: created, error } = await admin.from("instructor_reports").insert(row).select("*").single()
        if (error) throw error
        if (isTest && accepted && !suiviExistant) {
          const { error: suiviError } = await admin.from("training_followups").insert({
            external_id: folderExternalId,
            matricule_snapshot: matricule,
            steam_id: steamId,
            discord_id: discordId,
            reports_count: 0,
            service_count: 0,
            instructor_profile_id: null,
            instructor_snapshot: null,
            manager_profile_id: null,
            manager_snapshot: null,
            status: "EN_ATTENTE",
            source: `Rapport Instructeur TEST / Dossier ${folderExternalId} / Rapport ${reportExternalId}`,
          })
          if (suiviError) {
            await admin.from("instructor_reports").delete().eq("id", created.id)
            throw suiviError
          }
        }
        await audit(isTest ? "Rapport Test enregistré" : "Rapport Formation enregistré", matricule)
        return json({
          success: true,
          message: isTest
            ? `Rapport Test enregistré et classé « ${accepted ? "Accepté" : "Refusé"} ».`
            : `Rapport Formation enregistré pour ${matricule}.`,
          rapport: rapportInstructeurClient(created),
        })
      }
      case "modifierRapportInstructeur": {
        if (!officer && !instructor) throw new Error("Permission insuffisante.")
        const id = texte(payload.rapportId)
        let query = admin.from("instructor_reports").select("*")
        query = /^\d+$/.test(id) ? query.eq("id", Number(id)) : query.eq("external_id", id)
        const { data: row, error } = await query.maybeSingle()
        if (error || !row) throw new Error("Rapport Instructeur introuvable.")
        const score = payload.note === undefined ? row.score : nombre(payload.note)
        const { data: updated, error: updateError } = await admin.from("instructor_reports").update({
          event_on: isoDate(payload.date) ?? row.event_on, trainee_name: texte(payload.personneFormee) || row.trainee_name,
          final_matricule: texte(payload.matricule) || null, steam_id: texte(payload.steamId) || null,
          discord_id: texte(payload.discordId) || null, score, result: row.report_type === "TEST" ? (score >= 14 ? "ACCEPTE" : "REFUSE") : row.result,
          remark: texte(payload.remarque) || null, comment: texte(payload.commentaire) || null,
        }).eq("id", row.id).select("*").single()
        if (updateError) throw updateError
        return json({ success: true, message: "Rapport Instructeur modifié.", rapport: rapportInstructeurClient(updated) })
      }
      case "supprimerRapportInstructeur": {
        if (!owner) throw new Error("Suppression réservée au propriétaire.")
        const id = texte(payload.rapportId)
        const query = admin.from("instructor_reports").delete()
        const { error } = /^\d+$/.test(id) ? await query.eq("id", Number(id)) : await query.eq("external_id", id)
        if (error) throw error
        return json({ success: true, message: "Rapport Instructeur supprimé." })
      }
      case "ajouterSuiviFormationInstructeur":
      case "demarrerSuiviFormationInstructeur": {
        requireTrainingManager()
        if (action === "demarrerSuiviFormationInstructeur") {
          const suiviId = texte(payload.suiviId)
          let suiviQuery = admin.from("training_followups").select("*")
          suiviQuery = /^\d+$/.test(suiviId) ? suiviQuery.eq("id", Number(suiviId)) : suiviQuery.eq("external_id", suiviId)
          const { data: suivi, error: suiviError } = await suiviQuery.maybeSingle()
          if (suiviError || !suivi) throw new Error("Suivi introuvable. Actualisez la page.")
          if (normalise(suivi.status) !== "EN_ATTENTE" || suivi.end_on) throw new Error("Ce suivi a déjà été pris en charge.")
          const matricule = texte(payload.matricule) || suivi.matricule_snapshot
          const steamId = texte(payload.steamId) || suivi.steam_id
          const discordId = texte(payload.discordId || suivi.discord_id).replace(/\D/g, "")
          if (!matricule || !steamId) throw new Error("Le matricule et le Steam ID sont obligatoires.")
          if (!/^\d{15,22}$/.test(discordId)) throw new Error("Le Discord ID doit contenir entre 15 et 22 chiffres.")
          if ((members ?? []).some((item: any) => normalise(item.matricule) === normalise(matricule))) throw new Error("Ce matricule est déjà présent dans l’effectif.")
          if ((members ?? []).some((item: any) => normalise(item.steam_id) === normalise(steamId))) throw new Error("Ce Steam ID est déjà présent dans l’effectif.")
          if ((members ?? []).some((item: any) => normalise(item.discord_id) === normalise(discordId))) throw new Error("Ce Discord ID est déjà présent dans l’effectif.")
          if ((members ?? []).length >= 35) throw new Error("L’effectif a atteint sa limite de 35 GDA.")
          const { data: formation, error: formationError } = await admin.from("instructor_reports")
            .select("id,steam_id,discord_id").eq("active", true).eq("report_type", "FORMATION")
            .eq("folder_external_id", suivi.external_id).order("submitted_at", { ascending: false }).limit(1).maybeSingle()
          if (formationError) throw formationError
          if (!formation) throw new Error("La prise en charge reste bloquée tant que le rapport Formation n’est pas enregistré.")
          const idsDifferents = normalise(suivi.steam_id) !== normalise(formation.steam_id) || normalise(suivi.discord_id) !== normalise(formation.discord_id)
          if (idsDifferents && !bool(payload.identifiantsConfirmes)) throw new Error("Les identifiants Test et Formation diffèrent : confirmez les identifiants définitifs.")
          const instructeurNom = texte(payload.instructeur)
          const membreInstructeur = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(instructeurNom))
          if (!membreInstructeur || !(membreInstructeur.specializations ?? []).some((item: string) => normalise(item).includes("INSTRUCTEUR"))) {
            throw new Error("La personne choisie ne possède pas la spécialisation Instructeur.")
          }
          const profilInstructeur = await profilActifParMatricule(instructeurNom)
          if (!profilInstructeur) throw new Error("Le profil de l’instructeur choisi est introuvable.")
          const sanction = ["P1", "P2"].includes(normalise(payload.sanction)) ? normalise(payload.sanction) : "Rien"
          const dateFinInitiale = ajouterJoursIso(aujourdHui(), 7)
          const dateFin = ajouterJoursIso(dateFinInitiale, joursSanctionSuivi(sanction))
          const { data: membreCree, error: membreError } = await admin.from("members").insert({
            matricule, grade: "Caporal", steam_id: steamId, discord_id: discordId, presence: "Présent",
            reports_count: 0, observation: "0", joined_on: aujourdHui(), sanction: "Clean",
            recommendation: "0", specializations: [], medals: [], active: true,
          }).select("id").single()
          if (membreError) throw membreError
          const { error: updateError } = await admin.from("training_followups").update({
            member_id: membreCree.id, matricule_snapshot: matricule, steam_id: steamId, discord_id: discordId,
            initial_end_on: dateFinInitiale, end_on: dateFin, end_after_absence_on: dateFin,
            instructor_profile_id: profilInstructeur.id, instructor_snapshot: instructeurNom,
            manager_profile_id: profile.id, manager_snapshot: libelleGerantMembre(ownMember ?? { matricule: actorName, specializations: [] }),
            sanction, status: "EN_ATTENTE",
          }).eq("id", suivi.id)
          if (updateError) {
            await admin.from("members").delete().eq("id", membreCree.id)
            throw updateError
          }
          await audit("Période probatoire démarrée", matricule, `Rapport Formation ${formation.id}`)
          return json({ success: true, message: `La période probatoire de ${matricule} a été démarrée et le membre a été ajouté à l’effectif comme Caporal.` })
        }
        const matricule = texte(payload.matricule)
        const member = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(matricule))
        const steamId = texte(payload.steamId)
        const discordId = texte(payload.discordId).replace(/\D/g, "")
        if (!matricule || !steamId) throw new Error("Le matricule et le Steam ID sont obligatoires.")
        if (!/^\d{15,22}$/.test(discordId)) throw new Error("Le Discord ID doit contenir entre 15 et 22 chiffres.")
        if (member) throw new Error("Ce matricule est déjà présent dans l’effectif.")
        if ((members ?? []).some((item: any) => normalise(item.steam_id) === normalise(steamId))) throw new Error("Ce Steam ID est déjà présent dans l’effectif.")
        if ((members ?? []).some((item: any) => normalise(item.discord_id) === normalise(discordId))) throw new Error("Ce Discord ID est déjà présent dans l’effectif.")
        if ((members ?? []).length >= 35) throw new Error("L’effectif a atteint sa limite de 35 GDA.")
        const instructeurNom = texte(payload.instructeur) || actorName
        const membreInstructeur = (members ?? []).find((item: any) => normalise(item.matricule) === normalise(instructeurNom))
        if (!membreInstructeur || !(membreInstructeur.specializations ?? []).some((item: string) => normalise(item).includes("INSTRUCTEUR"))) {
          throw new Error("La personne choisie ne possède pas la spécialisation Instructeur.")
        }
        const profilInstructeur = await profilActifParMatricule(instructeurNom)
        if (!profilInstructeur) throw new Error("Le profil de l’instructeur choisi est introuvable.")
        const gerantNom = texte(payload.gerant)
        const profilGerant = gerantNom ? await profilActifParMatricule(matriculeDepuisLibelleGerant(gerantNom)) : null
        const sanction = ["P1", "P2"].includes(normalise(payload.sanction)) ? normalise(payload.sanction) : "Rien"
        const finInitiale = new Date(`${aujourdHui()}T12:00:00Z`); finInitiale.setUTCDate(finInitiale.getUTCDate() + 7)
        const fin = new Date(finInitiale); fin.setUTCDate(fin.getUTCDate() + joursSanctionSuivi(sanction))
        const { data: membreCree, error: membreError } = await admin.from("members").insert({
          matricule, grade: "Caporal", steam_id: steamId, discord_id: discordId, presence: "Présent",
          reports_count: 0, observation: "0", joined_on: aujourdHui(), sanction: "Clean",
          recommendation: "0", specializations: [], medals: [], active: true,
        }).select("id").single()
        if (membreError) throw membreError
        const { error } = await admin.from("training_followups").insert({
          external_id: idExterne(), member_id: membreCree.id, matricule_snapshot: matricule,
          steam_id: steamId, discord_id: discordId,
          reports_count: 0, service_count: Math.max(0, nombre(payload.prisesService)),
          initial_end_on: finInitiale.toISOString().slice(0, 10), end_on: fin.toISOString().slice(0, 10), end_after_absence_on: fin.toISOString().slice(0, 10), instructor_profile_id: profilInstructeur.id,
          instructor_snapshot: instructeurNom, manager_profile_id: profilGerant?.id ?? null, manager_snapshot: gerantNom || null,
          comment: texte(payload.commentaire) || null, sanction, status: "EN_ATTENTE", source: "SITE",
        })
        if (error) {
          await admin.from("members").delete().eq("id", membreCree.id)
          throw error
        }
        return json({ success: true, message: `Le suivi de ${matricule} a été ajouté et le membre est entré dans l’effectif comme Caporal.` })
      }
      case "modifierSuiviFormationInstructeur":
      case "transfererGeranceSuiviFormationInstructeur":
      case "deciderSuiviFormationInstructeur":
      case "supprimerSuiviFormationInstructeur": {
        if (action !== "deciderSuiviFormationInstructeur") requireTrainingManager()
        const id = texte(payload.suiviId)
        let query = admin.from("training_followups").select("*")
        query = /^\d+$/.test(id) ? query.eq("id", Number(id)) : query.eq("external_id", id)
        const { data: row, error } = await query.maybeSingle()
        if (error || !row) throw new Error("Suivi introuvable.")
        if (normalise(row.status) !== "EN_ATTENTE") throw new Error("Ce suivi est déjà terminé et se trouve dans les archives.")
        if (action === "deciderSuiviFormationInstructeur" && !has("suivis_decider_tous") && !estGerantSuivi(row)) {
          throw new Error("Seul le gérant de ce suivi peut prendre cette décision.")
        }
        if (action === "supprimerSuiviFormationInstructeur") {
          const { error: deleteError } = await admin.from("training_followups").delete().eq("id", row.id)
          if (deleteError) throw deleteError
        } else if (action === "transfererGeranceSuiviFormationInstructeur") {
          const nom = texte(payload.nouveauGerant)
          const matricule = matriculeDepuisLibelleGerant(nom)
          const membreGerant = (members ?? []).find((member: any) => normalise(member.matricule) === normalise(matricule))
          const { data: manager } = membreGerant
            ? await admin.from("profiles").select("id,display_name").eq("member_id", membreGerant.id).eq("active", true).maybeSingle()
            : await admin.from("profiles").select("id,display_name").ilike("display_name", matricule).eq("active", true).maybeSingle()
          const { error: updateError } = await admin.from("training_followups").update({ manager_profile_id: manager?.id ?? null, manager_snapshot: nom }).eq("id", row.id)
          if (updateError) throw updateError
        } else if (action === "deciderSuiviFormationInstructeur") {
          const decision = normalise(payload.decision) === "ACCEPTE" ? "ACCEPTE" : "REFUSE"
          const raison = texte(payload.raison)
          if (decision === "REFUSE" && !raison) throw new Error("La raison du refus est obligatoire.")
          const { data: compteurActuel, error: compteurError } = await admin.from("training_followups")
            .select("reports_count").eq("id", row.id).single()
          if (compteurError) throw compteurError
          const { data: archiveCreee, error: archiveError } = await admin.from("instructor_archives").insert({
            external_id: idExterne(), matricule_snapshot: row.matricule_snapshot, steam_id: row.steam_id, discord_id: row.discord_id,
            reports_count: compteurActuel.reports_count, service_count: row.service_count, ended_on: aujourdHui(), instructor_snapshot: row.instructor_snapshot,
            manager_snapshot: row.manager_snapshot, comment: row.comment, sanction: row.sanction, result: decision,
            reason: raison || null, imported_at: new Date().toISOString(), source: "SITE",
          }).select("id").single()
          if (archiveError) throw archiveError
          let departCreeId: number | null = null
          try {
            let membreSuivi: any = null
            if (row.member_id) {
              const { data } = await admin.from("members").select("*").eq("id", row.member_id).maybeSingle()
              membreSuivi = data
            }
            if (!membreSuivi) {
              const { data } = await admin.from("members").select("*").ilike("matricule", row.matricule_snapshot).maybeSingle()
              membreSuivi = data
            }
            if (decision === "REFUSE") {
              const dateRetour = ajouterJoursIso(aujourdHui(), 7)
              const { data: departCree, error: departError } = await admin.from("departures").insert({
                external_id: idExterne(), member_id: membreSuivi?.id ?? row.member_id ?? null,
                matricule_snapshot: row.matricule_snapshot, grade_snapshot: membreSuivi?.grade || "Caporal",
                steam_id_snapshot: row.steam_id, discord_id_snapshot: row.discord_id,
                departure_type: "LICENCIEMENT", starts_on: aujourdHui(), ends_on: dateRetour,
                reason: raison, status: "TEMPORAIRE", decided_by_profile_id: profile.id, decided_by_snapshot: profile.display_name,
                medals_snapshot: membreSuivi?.medals ?? [],
              }).select("id").single()
              if (departError) throw departError
              departCreeId = departCree.id
            }
            const { error: updateError } = await admin.from("training_followups").update({ status: decision, comment: raison || row.comment }).eq("id", row.id)
            if (updateError) throw updateError
            const { error: rapportsError } = await admin.from("instructor_reports").update({ active: false }).eq("folder_external_id", row.external_id)
            if (rapportsError) throw rapportsError
            if (decision === "REFUSE" && membreSuivi?.id) {
              const { error: membreError } = await admin.from("members").delete().eq("id", membreSuivi.id)
              if (membreError) throw membreError
            }
          } catch (decisionError) {
            await admin.from("training_followups").update({ status: "EN_ATTENTE", comment: row.comment }).eq("id", row.id)
            await admin.from("instructor_reports").update({ active: true }).eq("folder_external_id", row.external_id)
            if (departCreeId) await admin.from("departures").delete().eq("id", departCreeId)
            await admin.from("instructor_archives").delete().eq("id", archiveCreee.id)
            throw decisionError
          }
          await audit(decision === "ACCEPTE" ? "Période probatoire acceptée" : "Période probatoire refusée", row.matricule_snapshot, raison)
          return json({
            success: true,
            message: decision === "ACCEPTE"
              ? `${row.matricule_snapshot} a été accepté et conservé dans l’effectif.`
              : `${row.matricule_snapshot} a été refusé, licencié et retiré de l’effectif.`,
          })
        } else {
          const instructeurNom = texte(payload.instructeur) || row.instructor_snapshot
          const profilInstructeur = await profilActifParMatricule(instructeurNom)
          if (!profilInstructeur) throw new Error("Le profil de l’instructeur choisi est introuvable.")
          const gerantNom = texte(payload.gerant) || row.manager_snapshot
          const profilGerant = gerantNom ? await profilActifParMatricule(matriculeDepuisLibelleGerant(gerantNom)) : null
          const sanction = ["P1", "P2"].includes(normalise(payload.sanction)) ? normalise(payload.sanction) : "Rien"
          const dateFinInitiale = isoDate(row.initial_end_on) || ajouterJoursIso(row.end_on, -joursSanctionSuivi(row.sanction)) || ajouterJoursIso(aujourdHui(), 7)
          const dateFin = ajouterJoursIso(dateFinInitiale, joursSanctionSuivi(sanction))
          const { error: updateError } = await admin.from("training_followups").update({
            matricule_snapshot: texte(payload.matricule) || row.matricule_snapshot, steam_id: texte(payload.steamId) || null,
            discord_id: texte(payload.discordId) || null,
            service_count: Math.max(0, nombre(payload.prisesService)), instructor_profile_id: profilInstructeur.id,
            instructor_snapshot: instructeurNom, manager_profile_id: profilGerant?.id ?? row.manager_profile_id,
            manager_snapshot: gerantNom, comment: texte(payload.commentaire) || null,
            sanction, initial_end_on: dateFinInitiale, end_on: dateFin,
            end_after_absence_on: ajouterJoursIso(dateFin, ajustementsAbsenceSuivi({ ...row, end_on: dateFin, initial_end_on: dateFinInitiale }).planifies),
          }).eq("id", row.id)
          if (updateError) throw updateError
        }
        return json({ success: true, message: "Suivi de formation mis à jour." })
      }
      case "supprimerArchiveInstructeur": {
        if (!owner) throw new Error("Suppression réservée au propriétaire.")
        const id = texte(payload.archiveId)
        const query = admin.from("instructor_archives").delete()
        const { error } = /^\d+$/.test(id) ? await query.eq("id", Number(id)) : await query.eq("external_id", id)
        if (error) throw error
        return json({ success: true, message: "Archive supprimée." })
      }
      case "definirDefcon": {
        if (!peutGererDefcon) throw new Error("Modification DEFCON réservée aux officiers supérieurs, au propriétaire et au Staff.")
        const niveau = Math.max(0, Math.min(4, nombre(payload.niveau)))
        const modifieLe = new Date().toISOString()
        const { error } = await admin.from("defcon_state").update({ level: niveau, updated_by_profile_id: profile.id, updated_at: modifieLe }).eq("singleton", true)
        if (error) throw error
        await audit("DEFCON modifié", texte(payload.niveau))
        return json({ success: true, defcon: { niveau, modifiePar: actorName, modifieLe }, message: niveau ? `DEFCON ${niveau} activé.` : "DEFCON désactivé." })
      }
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
