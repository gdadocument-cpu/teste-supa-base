import { createClient } from "@supabase/supabase-js"

const config = window.GDA_SUPABASE

if (!config?.url || !config?.publishableKey) {
  throw new Error("Configuration Supabase GDA manquante.")
}

const client = createClient(config.url, config.publishableKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})

window.gdaSupabase = Object.freeze({
  client,
  publishableKey: config.publishableKey,
  async session() {
    const { data, error } = await client.auth.getSession()
    if (error) throw error
    return data.session
  },
  surveillerSession(callback) {
    const { data } = client.auth.onAuthStateChange((evenement, session) => {
      callback(evenement, session)
    })
    return data.subscription
  },
  surveillerPublicationsEffectif(callback) {
    const canal = client
      .channel("publications-effectif-gda")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "gda_roster_versions" },
        callback,
      )
      .subscribe()
    return {
      unsubscribe() {
        return client.removeChannel(canal)
      },
    }
  },
  async connexionDiscord(redirectTo) {
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    })
    if (error) throw error
    return data
  },
  async profil() {
    const { data, error } = await client.functions.invoke("profile-bootstrap", {
      body: {},
    })
    if (error) throw error
    if (!data?.success) throw new Error(data?.error || "Profil GDA refusé.")
    return data
  },
  async deconnexion() {
    const { error } = await client.auth.signOut({ scope: "local" })
    if (error) throw error
  },
})
