import { createClient } from "@supabase/supabase-js"

const config = window.GDA_SUPABASE
const supabase = createClient(config.url, config.publishableKey, {
  auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
})

const status = document.querySelector("#status")
const results = document.querySelector("#results")
const login = document.querySelector("#login-discord")
const logout = document.querySelector("#logout")

const show = (value) => {
  results.textContent = JSON.stringify(value, null, 2)
}

async function loadSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    status.textContent = "Non connecté — le fournisseur Discord doit encore être activé dans Supabase."
    login.hidden = false
    logout.hidden = true
    return
  }

  login.hidden = true
  logout.hidden = false
  status.textContent = "Session Discord vérifiée. Chargement du profil…"
  const { data, error } = await supabase.functions.invoke("profile-bootstrap", { body: {} })
  if (error || !data?.success) {
    status.textContent = data?.error || error?.message || "Profil refusé."
    return
  }

  status.textContent = `${data.profile.matricule} — ${data.profile.grade}`
  const [gdaRoster, officerRoster, reports] = await Promise.all([
    supabase.from("current_gda_roster").select("matricule,grade,sanction,presence,joined_on").order("joined_on"),
    supabase.from("current_officer_roster").select("matricule,grade,sanction,presence,joined_on").order("joined_on"),
    supabase.from("reports").select("matricule_snapshot,grade_snapshot,report_on,status").order("submitted_at", { ascending: false }).limit(5),
  ])
  show({
    profil: data.profile,
    effectifGdaRetarde: gdaRoster.data,
    effectifOfficierInstantane: officerRoster.data,
    derniersRapportsAvecGradeArchive: reports.data,
    erreurs: [gdaRoster.error, officerRoster.error, reports.error].filter(Boolean),
  })
}

login.addEventListener("click", async () => {
  const redirectTo = new URL("supabase-test.html", window.location.href).href
  const { error } = await supabase.auth.signInWithOAuth({ provider: "discord", options: { redirectTo } })
  if (error) status.textContent = error.message
})

logout.addEventListener("click", async () => {
  await supabase.auth.signOut()
  window.location.reload()
})

loadSession().catch((error) => {
  status.textContent = error.message
})
