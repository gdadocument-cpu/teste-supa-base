(function () {
  "use strict";

  let donnees = null;
  let chargement = null;
  let afficherTout = false;
  const TYPES = {
    IMPORTANT: ["!", "Important"], INFO: ["i", "Information"],
    MISSION: ["▦", "Mission"], SUCCESS: ["✓", "Terminé"]
  };

  function h(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function estAccueil() {
    if (document.querySelector("#workspace > #accueilDashboardGDA")) return true;
    const panneau = document.querySelector("#workspace > #welcomePanel");
    if (!panneau) return false;
    return panneau.classList.contains("welcome-membre") ||
      panneau.querySelector("h3")?.textContent?.trim() === "Bienvenue dans l’interface GDA";
  }

  function relatif(texte) {
    const date = new Date(texte);
    if (Number.isNaN(date.getTime())) return "";
    const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return "À l’instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `Il y a ${heures} h`;
    return `Il y a ${Math.floor(heures / 24)} j`;
  }

  function carte(icone, valeur, libelle, classe) {
    return `<article class="accueil-statistique ${classe}"><b aria-hidden="true">${icone}</b><strong>${h(valeur)}</strong><span>${h(libelle)}</span></article>`;
  }

  function annonce(a) {
    const type = TYPES[a.type] || TYPES.INFO;
    return `<article class="accueil-annonce accueil-annonce-${h((a.type || "INFO").toLowerCase())}">
      <b class="accueil-annonce-icone" aria-hidden="true">${type[0]}</b>
      <div><header><strong>${h(a.titre)}</strong><small>${type[1]}</small></header><p>${h(a.description)}</p><span>Par ${h(a.auteur)} · ${h(relatif(a.creeLe))}</span></div>
      ${a.peutSupprimer ? `<button class="accueil-annonce-supprimer" data-id="${h(a.id)}" type="button" title="Supprimer cette annonce" aria-label="Supprimer cette annonce">×</button>` : ""}
    </article>`;
  }

  function formulaire() {
    return `<details class="accueil-annonce-formulaire"><summary>＋ Nouvelle annonce</summary>
      <form id="formAnnonceAccueil">
        <label>Type<select name="type"><option value="INFO">Information</option><option value="IMPORTANT">Important</option><option value="MISSION">Mission</option><option value="SUCCESS">Terminé / validé</option></select></label>
        <label>Titre<input name="titre" maxlength="120" required placeholder="Titre de l’annonce"></label>
        <label class="accueil-annonce-description">Description<textarea name="description" maxlength="1200" required placeholder="Information à communiquer"></textarea></label>
        <label>Expiration facultative<input name="expireLe" type="datetime-local"></label>
        <button type="submit">Publier</button>
      </form></details>`;
  }

  function rendre() {
    if (!donnees || !estAccueil()) return;
    const s = donnees.statistiques || {};
    const stats = donnees.officier ? [
      carte("♟", s.effectifActif, "Effectif total", "effectif"),
      carte("◈", `${s.pourcentageDisponibles}%`, "Membres disponibles", "disponibles"),
      carte("▤", s.rapportsEnAttente, "Rapports en attente", "rapports"),
      carte("▦", s.absencesEnAttente, "Absences en attente", "absences")
    ] : [
      carte("♟", s.effectifActif, "Effectif GDA actif", "effectif"),
      carte("◈", `${s.pourcentageDisponibles}%`, "Membres présents / disponibles", "disponibles"),
      carte("▤", s.mesRapportsEnregistres, "Mes rapports validés ou archivés", "rapports")
    ];
    const liste = Array.isArray(donnees.annonces) ? donnees.annonces : [];
    const visibles = afficherTout ? liste : liste.slice(0, 3);
    document.getElementById("workspace").innerHTML = `<section id="accueilDashboardGDA" class="accueil-dashboard">
      <section class="accueil-presentation"><span>GARDE DE L’ADMINISTRATION</span><h2>Bienvenue dans<br>l’interface GDA</h2><i></i><p>Accédez rapidement aux informations essentielles, aux outils et aux ressources de la Garde de l’Administration.</p></section>
      <section class="accueil-statut"><h2>Statut général</h2><i></i><div>${stats.join("")}</div></section>
      <section class="accueil-annonces"><header><div><h2>Annonces importantes</h2><i></i></div>${liste.length > 3 ? `<button id="toutesAnnoncesAccueil" type="button">${afficherTout ? "Réduire" : "Voir toutes les annonces"} →</button>` : ""}</header>
        <div class="accueil-annonces-liste">${visibles.length ? visibles.map(annonce).join("") : '<p class="accueil-annonces-vide">Aucune annonce importante pour le moment.</p>'}</div>
        ${donnees.peutCreerAnnonce ? formulaire() : ""}</section>
    </section>`;
    brancher();
    document.dispatchEvent(new CustomEvent("gda:workspace-change"));
  }

  function brancher() {
    document.getElementById("toutesAnnoncesAccueil")?.addEventListener("click", function () { afficherTout = !afficherTout; rendre(); });
    document.querySelectorAll(".accueil-annonce-supprimer").forEach(function (bouton) {
      bouton.addEventListener("click", function () {
        if (confirm("Supprimer cette annonce ?")) envoyer("supprimerAnnonceAccueil", { annonceId: bouton.dataset.id });
      });
    });
    document.getElementById("formAnnonceAccueil")?.addEventListener("submit", function (event) {
      event.preventDefault();
      const f = new FormData(event.currentTarget);
      const expiration = String(f.get("expireLe") || "");
      envoyer("creerAnnonceAccueil", { type: f.get("type"), titre: f.get("titre"), description: f.get("description"), expireLe: expiration ? new Date(expiration).toISOString() : "" });
    });
  }

  async function envoyer(action, valeurs) {
    try {
      const body = new URLSearchParams({ action, identifiant: sessionStorage.getItem("identifiantUtilisateur") || "" });
      Object.entries(valeurs).forEach(([k, v]) => body.set(k, String(v == null ? "" : v)));
      const reponse = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString(), cache: "no-store" });
      const resultat = await reponse.json();
      if (!resultat.success) throw new Error(resultat.message || "Action impossible.");
      donnees = resultat; rendre();
      if (typeof afficherNotificationGDA === "function") afficherNotificationGDA(resultat.message, "succes");
    } catch (e) {
      if (typeof afficherNotificationGDA === "function") afficherNotificationGDA(e.message, "erreur");
    }
  }

  async function actualiser(force) {
    if (chargement && !force) return chargement;
    chargement = (async function () {
      try {
        const url = `${API_URL}?action=recupererTableauAccueil&identifiant=${encodeURIComponent(sessionStorage.getItem("identifiantUtilisateur") || "")}${force ? `&_=${Date.now()}` : ""}`;
        const reponse = await fetch(url, { cache: force ? "no-store" : "default" });
        const resultat = await reponse.json();
        if (!resultat.success) throw new Error(resultat.message);
        donnees = resultat; rendre();
      } catch (e) { console.warn("Tableau d’accueil indisponible :", e); }
      finally { chargement = null; }
    })();
    return chargement;
  }

  window.afficherTableauAccueilGDA = function () { if (estAccueil()) { if (donnees) rendre(); actualiser(false); } };
  window.actualiserTableauAccueilGDA = actualiser;
})();
