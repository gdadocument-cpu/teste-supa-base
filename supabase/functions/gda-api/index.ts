import "@supabase/functions-js/edge-runtime.d.ts"
import { withSupabase } from "@supabase/server"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: corsHeaders })

const authenticated = withSupabase({ auth: "user" }, async (req, ctx) => {
  const url = new URL(req.url)
  let payload: Record<string, unknown> = Object.fromEntries(url.searchParams)
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") ?? ""
    payload = contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries())
  }
  const action = String(payload.action ?? "")
  const db = ctx.supabase

  if (action === "recupererEffectifPublic") {
    const { data, error } = await db.from("current_gda_roster").select("*").order("joined_on")
    if (error) return json({ success: false, error: error.message }, 400)
    return json({ success: true, membres: data ?? [], source: "supabase_delayed_gda" })
  }
  if (action === "recupererEffectifOfficier" || action === "recupererEffectif") {
    const { data, error } = await db.from("current_officer_roster").select("*").order("joined_on")
    if (error) return json({ success: false, error: error.message }, 400)
    return json({ success: true, membres: data ?? [], source: "supabase_instant_officer" })
  }
  if (action === "recupererRapports") {
    const { data, error } = await db.from("reports").select("*").order("submitted_at", { ascending: false }).limit(500)
    if (error) return json({ success: false, error: error.message }, 400)
    return json({ success: true, rapports: data ?? [] })
  }
  if (action === "recupererAbsences") {
    const { data, error } = await db.from("absences").select("*").order("starts_on", { ascending: false }).limit(500)
    if (error) return json({ success: false, error: error.message }, 400)
    return json({ success: true, absences: data ?? [] })
  }
  if (action === "recupererDemandesAbsence") {
    const { data, error } = await db.from("absence_requests").select("*").order("created_at", { ascending: false }).limit(500)
    if (error) return json({ success: false, error: error.message }, 400)
    return json({ success: true, demandes: data ?? [] })
  }
  if (action === "recupererDeparts") {
    const { data, error } = await db.from("departures").select("*").order("starts_on", { ascending: false }).limit(500)
    if (error) return json({ success: false, error: error.message }, 400)
    return json({ success: true, departs: data ?? [] })
  }

  return json({ success: false, error: `Action Supabase non prise en charge : ${action || "vide"}.` }, 400)
})

export default {
  fetch(req: Request) {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
    return authenticated(req)
  },
}
