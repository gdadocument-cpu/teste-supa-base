import "jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const json = (body: unknown, status = 200) => Response.json(body, { status })
const texte = (valeur: unknown) => String(valeur ?? "").trim()
const normalise = (valeur: unknown) => texte(valeur)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toUpperCase()

const dateIso = (valeur: unknown) => {
  const saisie = texte(valeur)
  if (/^\d{4}-\d{2}-\d{2}$/.test(saisie)) return saisie
  const francaise = saisie.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return francaise ? `${francaise[3]}-${francaise[2]}-${francaise[1]}` : ""
}

const sha256 = async (valeur: string) => {
  const empreinte = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(valeur))
  return Array.from(new Uint8Array(empreinte))
    .map((octet) => octet.toString(16).padStart(2, "0"))
    .join("")
}

const comparaisonConstante = (gauche: string, droite: string) => {
  if (gauche.length !== droite.length) return false
  let difference = 0
  for (let index = 0; index < gauche.length; index++) {
    difference |= gauche.charCodeAt(index) ^ droite.charCodeAt(index)
  }
  return difference === 0
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ success: false, message: "Méthode refusée." }, 405)

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

    const secretRecu = texte(req.headers.get("x-gda-form-secret"))
    if (!secretRecu) return json({ success: false, message: "Authentification manquante." }, 401)

    const { data: configuration, error: configurationError } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "google_form_reports_webhook")
      .maybeSingle()
    if (configurationError) throw configurationError
    const secretAttendu = texte(configuration?.value?.sha256)
    const secretCalcule = await sha256(secretRecu)
    if (!secretAttendu || !comparaisonConstante(secretCalcule, secretAttendu)) {
      return json({ success: false, message: "Authentification invalide." }, 401)
    }

    const payload = await req.json()
    const typeFlux = texte(payload.typeFlux)
    const nomFeuille = texte(payload.nomFeuille)
    const identifiantReponse = texte(payload.identifiantReponse)
    const identifiantClasseur = texte(payload.identifiantClasseur)
    const identifiantFeuille = texte(payload.identifiantFeuille)
    const ligne = Math.trunc(Number(payload.ligne || 0))
    const matriculeFormulaire = texte(payload.matricule)
    const rapport = texte(payload.rapport)
    const commentaire = texte(payload.commentaire)
    const conclusion = texte(payload.conclusion)
    const jourRapport = dateIso(payload.dateRapport)

    if (typeFlux !== "RAPPORT_GDA") throw new Error("Type de formulaire invalide.")
    if (!nomFeuille || nomFeuille.length > 100) throw new Error("Nom de feuille invalide.")
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(identifiantClasseur)) throw new Error("Identifiant du classeur invalide.")
    if (!/^\d+$/.test(identifiantFeuille) || ligne < 2) throw new Error("Position de la réponse invalide.")
    if (identifiantReponse && !/^[a-f0-9]{64}$/i.test(identifiantReponse)) throw new Error("Identifiant de réponse invalide.")
    if (!matriculeFormulaire || matriculeFormulaire.length > 100) throw new Error("Matricule invalide.")
    if (!jourRapport) throw new Error("Date du rapport invalide.")
    if (!rapport || rapport.length > 10000) throw new Error("Le rapport doit contenir entre 1 et 10 000 caractères.")
    if (commentaire.length > 5000 || conclusion.length > 5000) throw new Error("Commentaire ou conclusion trop long.")

    const identifiantExterne = identifiantReponse
      ? `google-form:${identifiantReponse.toLowerCase()}`
      : `google-form:${identifiantClasseur}:${identifiantFeuille}:${ligne}`
    const { data: dejaImporte, error: doublonError } = await admin
      .from("reports")
      .select("external_id")
      .eq("external_id", identifiantExterne)
      .maybeSingle()
    if (doublonError) throw doublonError
    if (dejaImporte) return json({ success: true, duplicate: true, id: identifiantExterne })

    const [{ data: membres, error: membresError }, { data: effectifGda, error: effectifError }] = await Promise.all([
      admin.from("members").select("id,matricule,grade").eq("active", true),
      admin.from("current_gda_roster").select("member_id,matricule,grade"),
    ])
    if (membresError) throw membresError
    if (effectifError) throw effectifError

    const cleMatricule = normalise(matriculeFormulaire)
    const membre = (membres ?? []).find((element: any) => normalise(element.matricule) === cleMatricule)
    const membreEffectif = (effectifGda ?? []).find((element: any) =>
      normalise(element.matricule) === cleMatricule ||
      (membre?.id && element.member_id === membre.id)
    )
    if (!membreEffectif) {
      throw new Error(`Le matricule ${matriculeFormulaire} est introuvable dans l’effectif GDA publié.`)
    }

    const dateEnvoiDemandee = new Date(texte(payload.dateEnvoi))
    const dateEnvoi = Number.isNaN(dateEnvoiDemandee.getTime())
      ? new Date().toISOString()
      : dateEnvoiDemandee.toISOString()
    const { error: insertionError } = await admin.from("reports").insert({
      external_id: identifiantExterne,
      member_id: membreEffectif.member_id ?? membre?.id ?? null,
      matricule_snapshot: membreEffectif.matricule,
      grade_snapshot: membreEffectif.grade,
      report_on: jourRapport,
      body: rapport,
      comment: commentaire || null,
      conclusion: conclusion || null,
      submitted_at: dateEnvoi,
      status: "EN_ATTENTE",
      source: "GOOGLE_FORM",
    })
    if (insertionError) throw insertionError

    return json({
      success: true,
      id: identifiantExterne,
      matricule: membreEffectif.matricule,
      grade: membreEffectif.grade,
    }, 201)
  } catch (error) {
    console.error(error)
    return json({
      success: false,
      message: error instanceof Error ? error.message : "Import du rapport impossible.",
    }, 400)
  }
})
