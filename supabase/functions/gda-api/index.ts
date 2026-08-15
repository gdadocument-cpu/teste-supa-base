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
const TACHES_OFFICIERS = [
  "NA",
  "GESTION_RAPPORT",
  "RECO_MISSION_GDA_OBSERVATION_HDR",
  "GESTION_DEMANDE_ENTRAINEMENT",
  "OBSERVATION_EZ",
  "GESTION_ABSENCES",
  "GESTION_DOCUMENTS_GDA",
]
const LIBELLES_TACHES_OFFICIERS: Record<string, string> = {
  GESTION_RAPPORT: "Gestion des rapports",
  RECO_MISSION_GDA_OBSERVATION_HDR: "Reco Mission / Reco GDA / Observation HDR",
  GESTION_DEMANDE_ENTRAINEMENT: "Gestion des demandes d’entraînement",
  OBSERVATION_EZ: "Observation EZ",
  GESTION_ABSENCES: "Gestion des absences",
  GESTION_DOCUMENTS_GDA: "Gestion du bon fonctionnement des documents GDA",
}
const THEMES_SITE = [
  {
    id: "gda-classique",
    nom: "GDA Classique",
    description: "Interface officielle actuelle de l’intranet GDA.",
  },
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
const debutSemaineParis = () => {
  const aujourd = aujourdHui()
  const date = new Date(`${aujourd}T12:00:00Z`)
  const jour = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - jour + 1)
  return date.toISOString().slice(0, 10)
}
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
const instantParis = (year: number, month: number, day: number, hour: number, minute = 0) => {
  const cibleUtc = Date.UTC(year, month - 1, day, hour, minute, 0)
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
const metadonneesEffectifGda = (dernierePublication: unknown, heurePublication: unknown = "20:00", reference = new Date()) => {
  const correspondanceHeure = texte(heurePublication).match(/^(\d{1,2}):(\d{2})/)
  const heure = correspondanceHeure ? Math.max(0, Math.min(23, Number(correspondanceHeure[1]))) : 20
  const minute = correspondanceHeure ? Math.max(0, Math.min(59, Number(correspondanceHeure[2]))) : 0
  const parties = partiesDateHeureParis(reference)
  const echeanceAujourdhui = instantParis(parties.year, parties.month, parties.day, heure, minute)
  const lendemainCivil = new Date(Date.UTC(parties.year, parties.month - 1, parties.day + 1, 12))
  const echeanceDemain = instantParis(
    lendemainCivil.getUTCFullYear(),
    lendemainCivil.getUTCMonth() + 1,
    lendemainCivil.getUTCDate(),
    heure,
    minute,
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
    heureActualisation: `${String(heure).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
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

    const [{ data: grants }, { data: members }, { data: delayed }, { data: defcon }, { data: suivisProbatoires }, { data: absencesSuivis }, { data: derniereVersionEffectif }, { data: configurationSite }] = await Promise.all([
      admin.from("profile_permissions").select("permission_code").eq("profile_id", profile.id),
      admin.from("members").select("*").eq("active", true),
      admin.from("current_gda_roster").select("*"),
      admin.from("defcon_state").select("level,updated_at").eq("singleton", true).maybeSingle(),
      admin.from("training_followups").select("*").eq("status", "EN_ATTENTE"),
      admin.from("absences").select("member_id,matricule_snapshot,starts_on,ends_on"),
      admin.from("gda_roster_versions").select("published_at").order("published_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle(),
      admin.from("site_configuration").select("max_gda,roster_publish_time,active_theme,updated_at").eq("singleton", true).maybeSingle(),
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
    const valeurReferentiel = (valeur: unknown, referentiel: string[], message: string) => {
      const trouve = referentiel.find((item) => normalise(item) === normalise(valeur))
      if (!trouve) throw new Error(message)
      return trouve
    }
    const privilegieGestionPersonnel = owner || permissions.has("role_staff_total") || permissions.has("role_visiteur")
    const exigerAutoriteGestionPersonnel = (cible: any) => {
      if (privilegieGestionPersonnel) return
      const rangAuteur = rangGrade(actorGrade)
      const rangCible = rangGrade(cible?.grade)
      if (rangAuteur < 0 || rangCible < rangAuteur) {
        throw new Error("Accès refusé : vous ne pouvez pas gérer une personne ayant un grade supérieur au vôtre.")
      }
    }
    const specialisationsModifiablesGestionPersonnel = () => {
      const modifiables = new Set(["Instructeur", "Médecin", "Instructeur et Médecin"])
      const rangAuteur = rangGrade(actorGrade)
      const rangCapitaine = rangGrade("Capitaine")
      if (privilegieGestionPersonnel || (rangAuteur >= 0 && rangAuteur <= rangCapitaine)) {
        ["Responsable MDC", "CO-Responsable MDC", "Responsable INST", "CO-Responsable INST", "Instructeur en chef"]
          .forEach((item) => modifiables.add(item))
      }
      const specialisationsAuteur = normalise((ownMember?.specializations ?? []).join(";"))
      if (specialisationsAuteur.includes("RESPONSABLE MDC")) modifiables.add("CO-Responsable MDC")
      if (specialisationsAuteur.includes("RESPONSABLE INST")) {
        modifiables.add("CO-Responsable INST")
        modifiables.add("Instructeur en chef")
      }
      if (specialisationsAuteur.includes("CO-RESPONSABLE INST")) modifiables.add("Instructeur en chef")
      if (specialisationsAuteur.includes("GERANT GDA")) modifiables.add("CO-Gérant GDA")
      if (privilegieGestionPersonnel) modifiables.add("Gérant GDA")
      return modifiables
    }
    const specialisationsValideesGestionPersonnel = (valeur: unknown) => {
      const finales: string[] = []
      for (const saisie of texte(valeur).split(/[;,]/).map(texte).filter(Boolean)) {
        const valide = valeurReferentiel(saisie, SPECIALISATIONS, "Spécialisation invalide.")
        if (!finales.some((item) => normalise(item) === normalise(valide))) finales.push(valide)
      }
      const instructeur = finales.some((item) => normalise(item) === "INSTRUCTEUR")
      const medecin = finales.some((item) => normalise(item) === "MEDECIN")
      const combinaison = finales.some((item) => normalise(item) === "INSTRUCTEUR ET MEDECIN")
      if (combinaison || (instructeur && medecin)) {
        return finales.filter((item) => !["INSTRUCTEUR", "MEDECIN", "INSTRUCTEUR ET MEDECIN"].includes(normalise(item)))
          .concat("Instructeur et Médecin")
      }
      return finales
    }
    const rangAuteurNotes = rangGrade(actorGrade)
    const peutNoterMembre = (member: any) => {
      const rangCible = rangGrade(member?.grade)
      return officer && rangAuteurNotes >= 0 && rangCible > rangAuteurNotes
    }
    const peutGererDefcon = owner || permissions.has("role_staff_total") || ["LIEUTENANTCOLONEL", "COMMANDANT", "VICECOMMANDANT"].includes(actorGradeNormalise)
    const peutCommencerNouvelleSemaine = has("recommandations_nouvelle_semaine") ||
      ["LIEUTENANTCOLONEL", "COMMANDANT", "VICECOMMANDANT"].includes(actorGradeNormalise)
    const gradeOfficierInstantane = normalise(ownMember?.grade).replace(/[^A-Z]/g, "")
    const officierSuperieur = owner || permissions.has("role_staff_total") ||
      ["LIEUTENANTCOLONEL", "COMMANDANT", "VICECOMMANDANT"].includes(gradeOfficierInstantane)
    const requireSeniorOfficer = () => {
      if (!officierSuperieur) throw new Error("Accès réservé aux officiers supérieurs.")
    }
    const peutGererParametres = owner || permissions.has("role_staff_total") ||
      (ownMember?.specializations ?? []).some((item: string) => normalise(item) === "GERANT GDA")
    const maximumGda = Math.max(1, Math.min(200, nombre(configurationSite?.max_gda) || 35))
    const heurePublicationEffectif = texte(configurationSite?.roster_publish_time).slice(0, 5) || "20:00"
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
      if (onlyOwn && !profile.member_id) return []
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
        statut: row.status === "LU" ? "LU" : row.status === "REFUSE" ? "REFUSE" : row.status === "ARCHIVE" ? "ARCHIVE" : "EN ATTENTE",
        traitePar: noms.get(row.processed_by_profile_id) || row.processed_by_snapshot || "",
        dateTraitement: dateHeureFr(row.processed_at),
        source: row.source,
        discordUrl: row.discord_url || "",
        motifRefus: row.refusal_reason || "",
        modifiable: row.source === "SITE" && ["EN_ATTENTE", "REFUSE"].includes(row.status),
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

    const tachesOfficiersClient = async (message = "") => {
      requireSeniorOfficer()
      const semaine = debutSemaineParis()
      const today = aujourdHui()
      const { data: taches, error } = await admin
        .from("officer_weekly_tasks")
        .select("member_id,task_code,updated_at")
        .eq("week_start", semaine)
      if (error) throw error

      const tacheParMembre = new Map((taches ?? []).map((item: any) => [item.member_id, item]))
      const absentParMembre = new Set(
        (absencesSuivis ?? [])
          .filter((absence: any) => absence.member_id && absence.starts_on <= today && absence.ends_on >= today)
          .map((absence: any) => absence.member_id)
      )
      const ligne = (member: any) => {
        const tache = tacheParMembre.get(member.id)
        return {
          id: member.id,
          nom: member.matricule,
          grade: member.grade,
          discordId: member.discord_id || "",
          specialisations: member.specializations ?? [],
          absent: absentParMembre.has(member.id) || normalise(member.presence).includes("ABSENT"),
          tache: tache?.task_code ?? "NA",
          modifieLe: tache?.updated_at ?? "",
        }
      }
      const estSuperieur = (member: any) => ["LIEUTENANTCOLONEL", "COMMANDANT", "VICECOMMANDANT"]
        .includes(normalise(member.grade).replace(/[^A-Z]/g, ""))
      const estOfficier = (member: any) => ["CAPITAINE", "LIEUTENANT", "SOUSLIEUTENANT", "ASPIRANT"]
        .includes(normalise(member.grade).replace(/[^A-Z]/g, ""))
      const estGerantSpecialisation = (member: any) => {
        return (member.specializations ?? []).some((specialisation: string) =>
          ["RESPONSABLE INST", "RESPONSABLE MDC"].includes(normalise(specialisation))
        )
      }
      const parGrade = (a: any, b: any) => {
        const difference = rangGrade(a.grade) - rangGrade(b.grade)
        return difference || texte(a.nom).localeCompare(texte(b.nom), "fr", { sensitivity: "base" })
      }

      return {
        success: true,
        message,
        semaine,
        groupes: {
          officiersSuperieurs: (members ?? [])
            .filter((member: any) => estSuperieur(member) && !estGerantSpecialisation(member))
            .sort(parGrade).map(ligne),
          officiers: (members ?? [])
            .filter((member: any) => estOfficier(member) && !estGerantSpecialisation(member))
            .sort(parGrade).map(ligne),
          gerantsSpecialisation: (members ?? [])
            .filter((member: any) =>
              estGerantSpecialisation(member) && (estSuperieur(member) || estOfficier(member))
            )
            .sort(parGrade).map(ligne),
        },
      }
    }

    const maTacheOfficierClient = async (message = "") => {
      if (!profile.member_id) return { success: true, message, tache: null }
      const semaine = debutSemaineParis()
      const { data: tache, error } = await admin.from("officer_weekly_tasks")
        .select("id,week_start,task_code,member_name_snapshot,member_grade_snapshot,updated_at")
        .eq("week_start", semaine)
        .eq("member_id", profile.member_id)
        .maybeSingle()
      if (error) throw error
      if (!tache || tache.task_code === "NA") return { success: true, message, tache: null }

      const membre = memberById.get(profile.member_id)
      const today = aujourdHui()
      const absent = normalise(membre?.presence).includes("ABSENT") || (absencesSuivis ?? []).some((absence: any) =>
        absence.member_id === profile.member_id && absence.starts_on <= today && absence.ends_on >= today
      )
      if (absent) return { success: true, message, tache: null }

      const { data: notification, error: notificationError } = await admin.from("notifications")
        .select("id,read_at,deleted_at")
        .eq("profile_id", profile.id)
        .eq("notification_type", "TACHE_OFFICIER")
        .eq("related_table", "officer_weekly_tasks")
        .eq("related_id", tache.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (notificationError) throw notificationError
      return {
        success: true,
        message,
        tache: {
          id: tache.id,
          code: tache.task_code,
          libelle: LIBELLES_TACHES_OFFICIERS[tache.task_code] || tache.task_code,
          semaine: tache.week_start,
          modifieLe: tache.updated_at,
          priseEnCompte: !notification || !!notification.read_at || !!notification.deleted_at,
        },
      }
    }

    const notificationsAbsenceClient = async () => {
      if (!profile.member_id) return { success: true, notifications: [], nonLues: 0 }
      const demandes = await demandesClient(true)
      const notificationsAbsence = demandes
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
      const { data: notificationsGenerales, error: notificationsError } = await admin.from("notifications")
        .select("id,notification_type,title,message,related_table,related_id,read_at,created_at")
        .eq("profile_id", profile.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100)
      if (notificationsError) throw notificationsError
      const maTache = await maTacheOfficierClient()
      const idTacheActive = maTache.tache?.id ?? null
      const notifications = [
        ...notificationsAbsence,
        ...(notificationsGenerales ?? [])
          .filter((item: any) => item.notification_type !== "TACHE_OFFICIER" || item.related_id === idTacheActive)
          .map((item: any) => ({
          id: `notification-${item.id}`,
          titre: item.title,
          message: item.message || "",
          date: item.created_at,
          lue: !!item.read_at,
          type: normalise(item.notification_type).includes("REFUS") ? "refus" : "succes",
          tacheOfficier: item.notification_type === "TACHE_OFFICIER",
        })),
      ].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
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
      const modifiables = specialisationsModifiablesGestionPersonnel()
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

    const normaliserUrlLienSite = (valeur: unknown) => {
      const saisie = texte(valeur)
      let url: URL
      try {
        url = new URL(saisie)
      } catch (_) {
        throw new Error("Le lien doit être une adresse web valide.")
      }
      if (!["https:", "http:"].includes(url.protocol)) {
        throw new Error("Seuls les liens HTTP et HTTPS sont autorisés.")
      }
      if (url.hostname === "docs.google.com" && /\/document\/d\//.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/(edit|view)(?:\/.*)?$/, "/preview")
        url.search = ""
        url.hash = ""
      }
      return url.toString()
    }

    const parametresSiteDonnees = async (message = "") => {
      const [{ data: configuration, error: configurationError }, { data: liens, error: liensError }] = await Promise.all([
        admin.from("site_configuration").select("max_gda,roster_publish_time,active_theme,updated_at").eq("singleton", true).single(),
        admin.from("navigation_links").select("external_id,category,label,icon,url,display_mode,sort_order,updated_at")
          .eq("active", true).order("category", { ascending: true }).order("sort_order", { ascending: true }).order("id", { ascending: true }),
      ])
      if (configurationError) throw configurationError
      if (liensError) throw liensError
      return {
        success: true,
        message,
        peutGerer: peutGererParametres,
        configuration: {
          maximumGda: Math.max(1, Math.min(200, nombre(configuration?.max_gda) || 35)),
          heureActualisation: texte(configuration?.roster_publish_time).slice(0, 5) || "20:00",
          themeActif: THEMES_SITE.some((theme) => theme.id === texte(configuration?.active_theme))
            ? texte(configuration?.active_theme)
            : "gda-classique",
          modifieLe: configuration?.updated_at || "",
        },
        themes: THEMES_SITE,
        liens: (liens ?? []).map((lien: any) => ({
          id: lien.external_id,
          categorie: lien.category,
          nom: lien.label,
          icone: lien.icon || "🔗",
          url: lien.url,
          mode: lien.display_mode,
          ordre: nombre(lien.sort_order),
          modifieLe: lien.updated_at || "",
        })),
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
          maximumGda,
          peutModifier: has("effectif_modifier"),
          peutAjouter: owner || ["LIEUTENANT-COLONEL", "COMMANDANT", "VICE-COMMANDANT"].includes(normalise(ownMember?.grade)),
          grades: GRADES, sanctions: SANCTIONS, medailles: MEDAILLES, specialisations: SPECIALISATIONS,
        })
      case "recupererEffectifPublic":
        return json({ success: true, membres: membresPublic, ...metadonneesEffectifGda(derniereVersionEffectif?.published_at, heurePublicationEffectif), peutActualiser: has("effectif_public_actualiser"), actualisationForcee: false })
      case "recupererTachesOfficiers":
        return json(await tachesOfficiersClient())
      case "recupererMaTacheOfficier":
        return json(await maTacheOfficierClient())
      case "enregistrerTacheOfficier": {
        requireSeniorOfficer()
        const memberId = nombre(payload.memberId)
        const tache = normalise(payload.tache).replace(/[^A-Z0-9_]/g, "_") || "NA"
        if (!TACHES_OFFICIERS.includes(tache)) throw new Error("Tâche officier invalide.")
        const member = (members ?? []).find((item: any) => item.id === memberId)
        if (!member) throw new Error("Officier introuvable.")
        const grade = normalise(member.grade).replace(/[^A-Z]/g, "")
        const eligible = [
          "LIEUTENANTCOLONEL", "COMMANDANT", "VICECOMMANDANT", "CAPITAINE",
          "LIEUTENANT", "SOUSLIEUTENANT", "ASPIRANT",
        ].includes(grade)
        if (!eligible) throw new Error("Cette personne ne fait pas partie de la liste des tâches officiers.")

        const today = aujourdHui()
        const absent = normalise(member.presence).includes("ABSENT") || (absencesSuivis ?? []).some((absence: any) =>
          absence.member_id === member.id && absence.starts_on <= today && absence.ends_on >= today
        )
        if (absent) throw new Error("Impossible d’attribuer une tâche à une personne absente.")

        const semaine = debutSemaineParis()
        const { data: ancienneTache, error: ancienneTacheError } = await admin.from("officer_weekly_tasks")
          .select("id,task_code")
          .eq("week_start", semaine)
          .eq("member_id", member.id)
          .maybeSingle()
        if (ancienneTacheError) throw ancienneTacheError
        let tacheEnregistree: any = null
        if (tache === "NA") {
          const { error } = await admin.from("officer_weekly_tasks")
            .delete().eq("week_start", semaine).eq("member_id", member.id)
          if (error) throw error
        } else {
          const { data, error } = await admin.from("officer_weekly_tasks").upsert({
            week_start: semaine,
            member_id: member.id,
            task_code: tache,
            member_name_snapshot: member.matricule,
            member_grade_snapshot: member.grade,
            assigned_by_profile_id: profile.id,
            updated_at: new Date().toISOString(),
          }, { onConflict: "week_start,member_id" }).select("id,task_code").single()
          if (error) throw error
          tacheEnregistree = data
        }

        if (ancienneTache?.task_code !== tache) {
          const { data: profilsDestinataires, error: profilsError } = await admin.from("profiles")
            .select("id")
            .eq("member_id", member.id)
            .eq("active", true)
          if (profilsError) throw profilsError
          const profilsIds = (profilsDestinataires ?? []).map((item: any) => item.id)
          if (profilsIds.length) {
            const maintenant = new Date().toISOString()
            const { error: anciennesNotificationsError } = await admin.from("notifications")
              .update({ deleted_at: maintenant })
              .in("profile_id", profilsIds)
              .eq("notification_type", "TACHE_OFFICIER")
              .is("deleted_at", null)
            if (anciennesNotificationsError) throw anciennesNotificationsError

            const libelle = LIBELLES_TACHES_OFFICIERS[tache] || tache
            const notifications = profilsIds.map((profileId: number) => tache === "NA"
              ? {
                  profile_id: profileId,
                  notification_type: "TACHE_OFFICIER_RETIREE",
                  title: "Tâche hebdomadaire retirée",
                  message: "Vous n’avez plus de tâche attribuée pour cette semaine.",
                }
              : {
                  profile_id: profileId,
                  notification_type: "TACHE_OFFICIER",
                  title: ancienneTache ? "Tâche hebdomadaire modifiée" : "Nouvelle tâche hebdomadaire",
                  message: `Votre tâche de la semaine : ${libelle}.`,
                  related_table: "officer_weekly_tasks",
                  related_id: tacheEnregistree.id,
                })
            const { error: notificationError } = await admin.from("notifications").insert(notifications)
            if (notificationError) throw notificationError
          }
        }
        await audit("Tâche officier modifiée", member.matricule, tache)
        return json(await tachesOfficiersClient("Tâche enregistrée pour la semaine."))
      }
      case "prendreConnaissanceTacheOfficier": {
        const semaine = debutSemaineParis()
        if (!profile.member_id) throw new Error("Aucune tâche liée à ce profil.")
        const { data: tache, error: tacheError } = await admin.from("officer_weekly_tasks")
          .select("id")
          .eq("week_start", semaine)
          .eq("member_id", profile.member_id)
          .maybeSingle()
        if (tacheError) throw tacheError
        if (!tache) throw new Error("Aucune tâche active cette semaine.")
        const { error } = await admin.from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("profile_id", profile.id)
          .eq("notification_type", "TACHE_OFFICIER")
          .eq("related_table", "officer_weekly_tasks")
          .eq("related_id", tache.id)
          .is("read_at", null)
        if (error) throw error
        return json(await maTacheOfficierClient("Tâche prise en compte."))
      }
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
        return json({ success: true, membres: rows.map((row: any) => ({ ...membreClient(memberById.get(row.member_id), true), grade: row.grade })), ...metadonneesEffectifGda(version.published_at, heurePublicationEffectif), peutActualiser: true, actualisationForcee: true })
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
        if ((members ?? []).length >= maximumGda) throw new Error(`L’effectif a atteint sa limite de ${maximumGda} GDA.`)
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
        if (row.source !== "SITE") throw new Error("Seuls les rapports envoyés depuis l’intranet peuvent être modifiés.")
        if (row.member_id !== profile.member_id || !["EN_ATTENTE", "REFUSE"].includes(row.status)) throw new Error("Ce rapport n’est plus modifiable.")
        const etaitRefuse = row.status === "REFUSE"
        const { error } = await admin.from("reports").update({
          report_on: isoDate(payload.dateRapport), body: texte(payload.rapport),
          comment: texte(payload.commentaire) || null, conclusion: texte(payload.conclusion) || null,
          status: "EN_ATTENTE", refusal_reason: null, rejected_at: null,
          processed_by_profile_id: null, processed_by_snapshot: null, processed_at: null,
          resubmitted_at: etaitRefuse ? new Date().toISOString() : row.resubmitted_at,
        }).eq("id", row.id)
        if (error) throw error
        if (etaitRefuse) {
          await admin.from("report_status_history").insert({
            report_id: row.id, matricule_snapshot: row.matricule_snapshot, grade_snapshot: row.grade_snapshot,
            previous_status: "REFUSE", new_status: "EN_ATTENTE", changed_by_profile_id: profile.id,
            changed_by_snapshot: profile.display_name, report_on: isoDate(payload.dateRapport) || row.report_on,
          })
          await audit("Rapport corrigé et renvoyé", row.matricule_snapshot)
        }
        return json({ success: true, message: etaitRefuse ? "Rapport corrigé et renvoyé aux Officiers." : "Rapport modifié.", nom: actorName, grade: actorGrade, rapports: await rapportsClient(true) })
      }
      case "supprimerMonRapport": {
        const row = await rapportParPayload()
        if (row.source !== "SITE") throw new Error("Seuls les rapports envoyés depuis l’intranet peuvent être supprimés par leur auteur.")
        if (row.member_id !== profile.member_id || !["EN_ATTENTE", "REFUSE"].includes(row.status)) throw new Error("Ce rapport n’est plus supprimable.")
        const { error } = await admin.from("reports").delete().eq("id", row.id)
        if (error) throw error
        return json({ success: true, message: "Rapport supprimé.", nom: actorName, grade: actorGrade, rapports: await rapportsClient(true) })
      }
      case "changerStatutRapport": {
        requireOfficer()
        const row = await rapportParPayload()
        const demande = normalise(payload.statut)
        const status = demande.includes("ARCH") ? "ARCHIVE" : demande.includes("REFUS") ? "REFUSE" : demande === "LU" || demande.includes("VALID") ? "LU" : "EN_ATTENTE"
        const transitions: Record<string, string[]> = {
          EN_ATTENTE: ["LU", "REFUSE"],
          LU: ["ARCHIVE"],
          ARCHIVE: ["LU"],
        }
        if (!(transitions[row.status] ?? []).includes(status)) throw new Error("Cette transition de statut n’est pas autorisée.")
        const motifRefus = status === "REFUSE" ? texte(payload.motifRefus) : ""
        if (status === "REFUSE" && row.source !== "SITE") throw new Error("Seuls les rapports envoyés depuis l’intranet peuvent être refusés.")
        if (status === "REFUSE" && !motifRefus) throw new Error("Le motif du refus est obligatoire.")
        if (motifRefus.length > 1500) throw new Error("Le motif du refus est limité à 1 500 caractères.")
        const maintenant = new Date().toISOString()
        const { error } = await admin.from("reports").update({
          status, refusal_reason: motifRefus || null, rejected_at: status === "REFUSE" ? maintenant : null,
          processed_by_profile_id: profile.id, processed_by_snapshot: profile.display_name, processed_at: maintenant,
        }).eq("id", row.id)
        if (error) throw error
        await admin.from("report_status_history").insert({ report_id: row.id, matricule_snapshot: row.matricule_snapshot, grade_snapshot: row.grade_snapshot, previous_status: row.status, new_status: status, changed_by_profile_id: profile.id, changed_by_snapshot: profile.display_name, report_on: row.report_on })
        if (status === "REFUSE") {
          let profilDestinataire: any = null
          if (row.member_id) {
            const { data } = await admin.from("profiles").select("id").eq("member_id", row.member_id).eq("active", true).maybeSingle()
            profilDestinataire = data
          }
          if (!profilDestinataire) {
            const { data } = await admin.from("profiles").select("id").ilike("display_name", row.matricule_snapshot).eq("active", true).maybeSingle()
            profilDestinataire = data
          }
          if (profilDestinataire) {
            const { error: notificationError } = await admin.from("notifications").insert({
              profile_id: profilDestinataire.id, notification_type: "RAPPORT_REFUSE",
              title: "Rapport refusé",
              message: `Votre rapport du ${dateFr(row.report_on)} a été refusé : ${motifRefus}. Vous pouvez le corriger puis le renvoyer.`,
              related_table: "reports", related_id: row.id,
            })
            if (notificationError) throw notificationError
          }
        }
        await audit("Statut rapport modifié", row.matricule_snapshot, status)
        return json({ success: true, message: status === "REFUSE" ? "Rapport refusé et auteur notifié." : "Statut du rapport modifié.", statut: status, rapports: await rapportsClient() })
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
        const { error: notificationsError } = await admin.from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("profile_id", profile.id)
          .is("deleted_at", null)
          .is("read_at", null)
        if (notificationsError) throw notificationsError
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
        const { error: notificationsError } = await admin.from("notifications")
          .update({ deleted_at: new Date().toISOString() })
          .eq("profile_id", profile.id)
          .is("deleted_at", null)
        if (notificationsError) throw notificationsError
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
        const type = typeDepartNormalise(payload.type)
        if (!type) throw new Error("Type de départ invalide.")
        const start = isoDate(payload.dateDepart) ?? aujourdHui()
        const dureeBlacklist = type === "BLACKLIST"
          ? valeurReferentiel(payload.duree, DUREES_BLACKLIST, "Durée de blacklist invalide.")
          : ""
        const end = type === "BLACKLIST"
          ? finBlacklist(start, dureeBlacklist)
          : isoDate(payload.dateRetour) ?? ajouterJoursIso(start, 7)
        if (type !== "BLACKLIST" && end < ajouterJoursIso(start, 7)) {
          throw new Error("La date de retour doit être située au moins 7 jours après la date de départ.")
        }
        const { data: departCree, error } = await admin.from("departures").insert({
          external_id: idExterne(), member_id: member.id, matricule_snapshot: member.matricule,
          grade_snapshot: delayedById.get(member.id)?.grade ?? member.grade, steam_id_snapshot: member.steam_id,
          discord_id_snapshot: member.discord_id, departure_type: type, starts_on: start, ends_on: end,
          reason: texte(payload.raison) || null, status: end ? "TEMPORAIRE" : "PERMANENT",
          decided_by_profile_id: profile.id, decided_by_snapshot: profile.display_name, medals_snapshot: member.medals ?? [],
        }).select("id").single()
        if (error) throw error
        const { error: retraitError } = await admin.from("members")
          .update({ active: false }).eq("id", member.id).eq("active", true).select("id").single()
        if (retraitError) {
          await admin.from("departures").delete().eq("id", departCree.id)
          throw retraitError
        }
        await audit("Dossier de départ ajouté", member.matricule, type)
        const donnees = await departsDonnees(`Dossier enregistré et ${member.matricule} retiré de l’effectif.`)
        const { data: membresActifs, error: membresError } = await admin.from("members")
          .select("*").eq("active", true).order("id", { ascending: true })
        if (membresError) throw membresError
        return json({
          ...donnees,
          membres: (membresActifs ?? []).map((item: any) => ({ nom: item.matricule, grade: item.grade })),
          effectif: (membresActifs ?? []).map((item: any) => membreClient(item)),
        })
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
        return json({ success: true, membres: membresClient.map((m: any) => ({ nom: m.nom, grade: m.grade, recommandations: m.recommandation, observations: m.observation })), historique, peutPurger: peutCommencerNouvelleSemaine })
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
        if (!peutCommencerNouvelleSemaine) throw new Error("Permission Nouvelle semaine insuffisante.")
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
        exigerAutoriteGestionPersonnel(member)
        const type = valeurReferentiel(payload.type, ["Promotion", "Rétrogradation", "Sanction", "Départ", "Licenciement", "Blacklist", "Médaille", "Spécialisation"], "Type de gestion invalide.")
        const choixDemande = texte(payload.choix)
        const patch: Record<string, unknown> = {}
        const normalizedType = normalise(type)
        let choixJournal = choixDemande
        if (["PROMOTION", "RETROGRADATION"].includes(normalizedType)) {
          const nouveauGrade = valeurReferentiel(choixDemande, GRADES, "Grade invalide.")
          const rangActuel = rangGrade(member.grade)
          const nouveauRang = rangGrade(nouveauGrade)
          if (normalizedType === "PROMOTION" && (rangActuel < 0 || nouveauRang < 0 || nouveauRang >= rangActuel)) {
            throw new Error("La promotion doit mener vers un grade supérieur.")
          }
          if (normalizedType === "RETROGRADATION" && (rangActuel < 0 || nouveauRang < 0 || nouveauRang <= rangActuel)) {
            throw new Error("La rétrogradation doit mener vers un grade inférieur.")
          }
          patch.grade = nouveauGrade
          patch.promotion_changed_on = aujourdHui()
          choixJournal = nouveauGrade
        } else if (normalizedType === "SANCTION") {
          const sanction = valeurReferentiel(choixDemande, SANCTIONS, "Sanction invalide.")
          patch.sanction = sanction
          choixJournal = sanction
        } else if (normalizedType === "SPECIALISATION") {
          const demandees = specialisationsValideesGestionPersonnel(choixDemande)
          const actuelles = specialisationsValideesGestionPersonnel((member.specializations ?? []).join(";"))
          const clesModifiables = new Set([...specialisationsModifiablesGestionPersonnel()].map(normalise))
          for (const specialisation of SPECIALISATIONS) {
            const presenteAvant = actuelles.some((item) => normalise(item) === normalise(specialisation))
            const presenteApres = demandees.some((item) => normalise(item) === normalise(specialisation))
            if (presenteAvant !== presenteApres && !clesModifiables.has(normalise(specialisation))) {
              throw new Error(`Vous n’êtes pas autorisé à modifier la spécialisation « ${specialisation} ».`)
            }
          }
          patch.specializations = demandees
          choixJournal = demandees.length ? demandees.join(", ") : "Aucune spécialisation"
        }
        else if (normalizedType === "MEDAILLE") {
          const retrait = normalise(choixDemande).startsWith("RETIR")
          const medailleDemandee = choixDemande.replace(/^(?:Retir|Donn)[^:]*:\s*/i, "")
          const medaille = valeurReferentiel(medailleDemandee, MEDAILLES, "Médaille invalide.")
          const medals = new Set<string>(member.medals ?? [])
          const existante = [...medals].find((item) => normalise(item) === normalise(medaille))
          if (retrait) {
            if (!existante) throw new Error("Cette personne ne possède pas cette médaille.")
            medals.delete(existante)
            choixJournal = `Retirer : ${medaille}`
          } else {
            if (existante) throw new Error("Cette personne possède déjà cette médaille.")
            medals.add(medaille)
            choixJournal = medaille
          }
          patch.medals = [...medals].filter(Boolean)
        }
        let departCreeId: number | null = null
        let membreRetire = false
        if (["DEPART", "LICENCIEMENT", "BLACKLIST"].includes(normalizedType)) {
          const startsOn = isoDate(payload.dateDepart) ?? aujourdHui()
          const dureeBlacklist = normalizedType === "BLACKLIST"
            ? valeurReferentiel(choixDemande, DUREES_BLACKLIST, "Durée de blacklist invalide.")
            : ""
          const endsOn = normalizedType === "BLACKLIST"
            ? finBlacklist(startsOn, dureeBlacklist)
            : isoDate(payload.dateRetour) ?? ajouterJoursIso(startsOn, 7)
          if (normalizedType !== "BLACKLIST" && endsOn < ajouterJoursIso(startsOn, 7)) {
            throw new Error("La date de retour doit être située au moins 7 jours après la date de départ.")
          }
          choixJournal = normalizedType === "BLACKLIST"
            ? `Blacklist — ${dureeBlacklist}`
            : `${type} enregistré — retour autorisé le ${dateFr(endsOn)}`
          const { data: departCree, error } = await admin.from("departures").insert({
            external_id: idExterne(), member_id: member.id, matricule_snapshot: member.matricule,
            grade_snapshot: delayedById.get(member.id)?.grade ?? member.grade, steam_id_snapshot: member.steam_id,
            discord_id_snapshot: member.discord_id, departure_type: normalizedType, starts_on: startsOn,
            ends_on: endsOn, reason: texte(payload.raison) || null,
            status: endsOn ? "TEMPORAIRE" : "PERMANENT", decided_by_profile_id: profile.id, decided_by_snapshot: profile.display_name,
            medals_snapshot: member.medals ?? [],
          }).select("id").single()
          if (error) throw error
          departCreeId = departCree.id
          const { error: retraitError } = await admin.from("members")
            .update({ active: false }).eq("id", member.id).eq("active", true).select("id").single()
          if (retraitError) {
            await admin.from("departures").delete().eq("id", departCreeId)
            throw retraitError
          }
          membreRetire = true
        } else if (Object.keys(patch).length) {
          const { error } = await admin.from("members").update(patch).eq("id", member.id).eq("active", true)
          if (error) throw error
        }
        const { error: historyError } = await admin.from("personnel_history").insert({
          member_id: member.id, matricule_snapshot: member.matricule,
          grade_snapshot: delayedById.get(member.id)?.grade ?? member.grade,
          action_type: type, choice: choixJournal || null, reason: texte(payload.raison) || null,
          performed_by_profile_id: profile.id, performed_by_snapshot: profile.display_name, occurred_at: new Date().toISOString(),
        })
        if (historyError) {
          if (membreRetire) await admin.from("members").update({ active: true }).eq("id", member.id)
          if (departCreeId) await admin.from("departures").delete().eq("id", departCreeId)
          if (Object.keys(patch).length) {
            const restauration: Record<string, unknown> = {}
            for (const cle of Object.keys(patch)) restauration[cle] = member[cle]
            await admin.from("members").update(restauration).eq("id", member.id)
          }
          throw historyError
        }
        await audit(type, member.matricule, choixJournal)
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
          message: membreRetire
            ? `${type} enregistré pour ${member.matricule} et personne retirée de l’effectif.`
            : `${type} enregistré(e) pour ${member.matricule}.`,
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
      case "recupererParametresSite":
        return json(await parametresSiteDonnees())
      case "enregistrerParametresSite": {
        if (!peutGererParametres) throw new Error("Modification réservée à la propriété et aux Gérant GDA.")
        const maximum = Math.trunc(nombre(payload.maximumGda))
        const heure = texte(payload.heureActualisation)
        if (maximum < 1 || maximum > 200) throw new Error("Le maximum de GDA doit être compris entre 1 et 200.")
        if (maximum < (members ?? []).length) {
          throw new Error(`Le maximum ne peut pas être inférieur à l’effectif actif actuel (${(members ?? []).length}).`)
        }
        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(heure)) throw new Error("L’heure d’actualisation est invalide.")
        const { error } = await admin.from("site_configuration").update({
          max_gda: maximum,
          roster_publish_time: `${heure}:00`,
          updated_by_profile_id: profile.id,
        }).eq("singleton", true)
        if (error) throw error
        await audit("Paramètres du site modifiés", "Configuration", `Maximum ${maximum} GDA · actualisation ${heure}`)
        return json(await parametresSiteDonnees("Paramètres enregistrés."))
      }
      case "enregistrerThemeSite": {
        if (!peutGererParametres) throw new Error("Modification réservée à la propriété et aux Gérant GDA.")
        const theme = texte(payload.theme)
        const themeDisponible = THEMES_SITE.find((item) => item.id === theme)
        if (!themeDisponible) throw new Error("Thème du site invalide.")
        const { error } = await admin.from("site_configuration").update({
          active_theme: theme,
          updated_by_profile_id: profile.id,
        }).eq("singleton", true)
        if (error) throw error
        await audit("Thème du site modifié", themeDisponible.nom)
        return json(await parametresSiteDonnees(`Thème « ${themeDisponible.nom} » activé.`))
      }
      case "enregistrerLienSite": {
        if (!peutGererParametres) throw new Error("Modification réservée à la propriété et aux Gérant GDA.")
        const categorieNormalisee = normalise(payload.categorie).replace(/[^A-Z]+/g, "_").replace(/^_|_$/g, "")
        const categorie = categorieNormalisee === "LIENS_UTILES" ? "LIENS_UTILES"
          : categorieNormalisee === "INSTRUCTEUR" ? "INSTRUCTEUR" : ""
        if (!categorie) throw new Error("Catégorie de lien invalide.")
        const nom = texte(payload.nom)
        if (!nom || nom.length > 100) throw new Error("Le nom du lien doit contenir entre 1 et 100 caractères.")
        const icone = texte(payload.icone)
        if (!icone || Array.from(icone).length > 16 || /[<>&]/.test(icone)) {
          throw new Error("L’icône doit contenir entre 1 et 16 caractères valides.")
        }
        const url = normaliserUrlLienSite(payload.url)
        const mode = normalise(payload.mode) === "EXTERNAL" ? "EXTERNAL" : "IFRAME"
        const id = texte(payload.id)
        let ordre = Math.max(0, Math.min(10000, Math.trunc(nombre(payload.ordre))))
        if (!id && !ordre) {
          const { data: dernier } = await admin.from("navigation_links").select("sort_order")
            .eq("category", categorie).eq("active", true).order("sort_order", { ascending: false }).limit(1).maybeSingle()
          ordre = nombre(dernier?.sort_order) + 10
        }
        const donneesLien = {
          category: categorie,
          label: nom,
          icon: icone,
          url,
          display_mode: mode,
          sort_order: ordre,
          active: true,
          updated_by_profile_id: profile.id,
        }
        const resultat = id
          ? await admin.from("navigation_links").update(donneesLien).eq("external_id", id).select("external_id").single()
          : await admin.from("navigation_links").insert({ ...donneesLien, created_by_profile_id: profile.id }).select("external_id").single()
        if (resultat.error) throw resultat.error
        await audit(id ? "Lien du site modifié" : "Lien du site ajouté", nom, categorie)
        return json(await parametresSiteDonnees(id ? "Lien modifié." : "Lien ajouté."))
      }
      case "supprimerLienSite": {
        if (!peutGererParametres) throw new Error("Modification réservée à la propriété et aux Gérant GDA.")
        const id = texte(payload.id)
        const { data: lien, error: rechercheError } = await admin.from("navigation_links")
          .select("label,category").eq("external_id", id).maybeSingle()
        if (rechercheError || !lien) throw new Error("Lien introuvable.")
        const { error } = await admin.from("navigation_links").delete().eq("external_id", id)
        if (error) throw error
        await audit("Lien du site supprimé", lien.label, lien.category)
        return json(await parametresSiteDonnees("Lien supprimé."))
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
      case "synchroniserGoogleSheets": {
        requirePermission("administration_permissions")
        const reponseSynchronisation = await fetch(
          `${supabaseUrl}/functions/v1/sync-google-sheets`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              source: "administration",
              requestedBy: profile.display_name,
            }),
          },
        )
        const texteSynchronisation = await reponseSynchronisation.text()
        let resultatSynchronisation: any = null
        try {
          resultatSynchronisation = JSON.parse(texteSynchronisation)
        } catch {
          resultatSynchronisation = null
        }
        if (!reponseSynchronisation.ok || resultatSynchronisation?.success !== true) {
          throw new Error(
            resultatSynchronisation?.message ||
            "La synchronisation Google Sheets n’a pas pu être exécutée.",
          )
        }
        await audit("Google Sheets synchronisé manuellement")
        return json({
          success: true,
          message: "Google Sheets a été synchronisé.",
          effectif: nombre(resultatSynchronisation.effectif),
          absences: nombre(resultatSynchronisation.absences),
          departs: nombre(resultatSynchronisation.departs),
          synchroniseLe: resultatSynchronisation.destination?.synchroniseLe || new Date().toISOString(),
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
          if ((members ?? []).length >= maximumGda) throw new Error(`L’effectif a atteint sa limite de ${maximumGda} GDA.`)
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
        if ((members ?? []).length >= maximumGda) throw new Error(`L’effectif a atteint sa limite de ${maximumGda} GDA.`)
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
