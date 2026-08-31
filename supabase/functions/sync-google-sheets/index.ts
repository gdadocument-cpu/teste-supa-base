import "jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"

const GRADES = [
  "Lieutenant-Colonel", "Commandant", "Vice-Commandant", "Capitaine",
  "Lieutenant", "Sous-Lieutenant", "Aspirant", "Major", "Adjudant-Chef",
  "Adjudant", "Sergent-Chef", "Sergent", "Caporal-Chef", "Caporal", "Ancien GDA",
]

const json = (body: unknown, status = 200) => Response.json(body, { status })
const texte = (value: unknown) => String(value ?? "").trim()
const normalise = (value: unknown) => texte(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toUpperCase()
const isoDate = (value: unknown) => texte(value).slice(0, 10)

const typeDepart = (value: unknown) => {
  const type = normalise(value)
  if (type === "DEPART") return "Départ"
  if (type === "LICENCIEMENT") return "Licenciement"
  if (type === "BLACKLIST" || type.includes("BLACKLIST") || /^BL(?:\s|-|$)/.test(type)) {
    return "Blacklist"
  }
  return texte(value)
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ success: false, message: "Méthode refusée." }, 405)

    const demande = await req.json().catch(() => ({})) as Record<string, unknown>

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: configuration, error: configurationError } = await admin
      .rpc("google_sheets_sync_config")
    if (configurationError) throw configurationError
    const destinationUrl = texte(configuration?.url)
    const sharedSecret = texte(configuration?.secret)
    if (!destinationUrl || !sharedSecret) {
      return json({
        success: false,
        configured: false,
        message: "L’URL Apps Script et le secret Google Sheets doivent encore être enregistrés dans Vault.",
      }, 409)
    }

    const [membresResult, absencesResult, departsResult] = await Promise.all([
      admin
        .from("members")
        .select("id,matricule,grade,steam_id,discord_id,presence,reports_count,observation,promotion_changed_on,joined_on,sanction,recommendation,notes,specializations,medals")
        .eq("active", true),
      admin
        .from("absences")
        .select("id,matricule_snapshot,grade_snapshot,starts_on,ends_on,reason,active,declared_by_snapshot,profiles!absences_declared_by_profile_id_fkey(display_name)")
        .order("starts_on", { ascending: false })
        .order("id", { ascending: false }),
      admin
        .from("departures")
        .select("id,matricule_snapshot,grade_snapshot,steam_id_snapshot,discord_id_snapshot,departure_type,starts_on,ends_on,reason,status,medals_snapshot,medals_restored_at,decided_by_snapshot,profiles!departures_decided_by_profile_id_fkey(display_name)")
        .order("starts_on", { ascending: false })
        .order("id", { ascending: false }),
    ])
    if (membresResult.error) throw membresResult.error
    if (absencesResult.error) throw absencesResult.error
    if (departsResult.error) throw departsResult.error

    const ordreGrades = new Map(GRADES.map((grade, index) => [normalise(grade), index]))
    const effectif = (membresResult.data ?? [])
      .map((row: any) => ({
        id: row.id,
        matricule: row.matricule,
        grade: row.grade,
        steamId: row.steam_id ?? "",
        discordId: row.discord_id ?? "",
        presence: String(row.presence ?? "").trim() || "Présent",
        rapports: row.reports_count ?? 0,
        observation: row.observation ?? "",
        datePromotion: isoDate(row.promotion_changed_on),
        dateEntree: isoDate(row.joined_on),
        sanction: row.sanction || "Clean",
        recommandation: row.recommendation ?? "",
        notes: row.notes ?? "",
        specialisations: row.specializations ?? [],
        medailles: row.medals ?? [],
      }))
      .sort((a: any, b: any) => {
        const gradeA = ordreGrades.get(normalise(a.grade)) ?? 999
        const gradeB = ordreGrades.get(normalise(b.grade)) ?? 999
        return gradeA - gradeB || a.matricule.localeCompare(b.matricule, "fr", { sensitivity: "base" })
      })

    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date())
    const absences = (absencesResult.data ?? []).map((row: any) => ({
      id: row.id,
      matricule: row.matricule_snapshot,
      grade: row.grade_snapshot,
      dateDebut: isoDate(row.starts_on),
      dateFin: isoDate(row.ends_on),
      raison: row.reason,
      statut: row.active && row.starts_on <= today && row.ends_on >= today ? "ACTIF" : "TERMINE",
      auteur: row.profiles?.display_name || row.declared_by_snapshot || "",
    }))

    const departs = (departsResult.data ?? []).map((row: any) => ({
      id: row.id,
      matricule: row.matricule_snapshot,
      grade: row.grade_snapshot,
      type: typeDepart(row.departure_type),
      steamId: row.steam_id_snapshot ?? "",
      discordId: row.discord_id_snapshot ?? "",
      dateDebut: isoDate(row.starts_on),
      dateFin: isoDate(row.ends_on),
      raison: row.reason ?? "",
      statut: row.status,
      auteur: row.profiles?.display_name || row.decided_by_snapshot || "",
      medailles: row.medals_snapshot ?? [],
      medaillesRestaureesLe: row.medals_restored_at ?? "",
    }))

    const destinationResponse = await fetch(destinationUrl, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "synchroniserGoogleSheetsDepuisSupabase",
        secret: sharedSecret,
        forcerEffectif: demande.source === "administration",
        effectif,
        absences,
        departs,
      }),
    })
    const destinationText = await destinationResponse.text()
    let destinationResult: any = null
    try {
      destinationResult = JSON.parse(destinationText)
    } catch {
      destinationResult = null
    }
    if (!destinationResponse.ok || destinationResult?.success !== true) {
      throw new Error(
        destinationResult?.message ||
        `Google Apps Script a refusé la synchronisation (HTTP ${destinationResponse.status}).`,
      )
    }

    return json({
      success: true,
      effectif: effectif.length,
      absences: absences.length,
      departs: departs.length,
      destination: destinationResult,
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error
      ? error.message
      : texte((error as any)?.message || error)
    return json({
      success: false,
      message: message || "Synchronisation Google Sheets impossible.",
    }, 500)
  }
})
