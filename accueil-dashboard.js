(function () {
  "use strict";

  let donnees = null;
  let chargement = null;
  let afficherTout = false;
  let annoncesAActualiser = false;
  let canalAnnoncesGlobalGDA = null;
  let minuteurSynchronisationAnnoncesGDA = null;
  const TYPES = { IMPORTANT: "Important", INFO: "Information", MISSION: "Mission", SUCCESS: "Terminé" };

  function h(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function estAccueil() {
    // Une réponse asynchrone de l'accueil peut arriver après que l'utilisateur
    // a choisi un module. Le DOM peut encore contenir l'ancien écran pendant
    // le chargement : le module actif reste donc la source de vérité.
    if (
      typeof moduleGdaEstActif === "function" &&
      !moduleGdaEstActif("")
    ) return false;
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

  function icone(code, classe) {
    return typeof window.iconeGDA === "function" ? window.iconeGDA(code, classe) : `<span class="gda-icone">●</span>`;
  }

  function iconeDisponibilites(pourcentage) {
    const niveau = Math.max(0, Math.min(100, Number(pourcentage) || 0));
    return `<span class="accueil-statistique-icone accueil-bouclier-jauge"
      style="--niveau-disponibilite:${niveau}%;--intensite-disponibilite:${niveau / 100}"
      title="Bouclier rempli à ${niveau}%" aria-hidden="true">
      ${icone("shield", "accueil-bouclier-source accueil-statistique-icone")}
      <span class="accueil-bouclier-interieur"><i></i></span>
    </span>`;
  }

  function carte(code, valeur, libelle, classe, niveau) {
    const illustration = code === "shield"
      ? iconeDisponibilites(niveau)
      : icone(code, "accueil-statistique-icone");
    return `<article class="accueil-statistique ${classe}">${illustration}<strong>${h(valeur)}</strong><span>${h(libelle)}</span></article>`;
  }

  function annonce(a) {
    const libelleType = TYPES[a.type] || TYPES.INFO;
    const details = String(a.details || "").trim();
    const depliable = details.length > 0;
    const auteurEtDate = a.auteur
      ? `Par ${h(a.auteur)} · ${h(relatif(a.creeLe))}`
      : h(relatif(a.creeLe));
    const voteRoadmap = a.roadmap ? `<div class="accueil-annonce-votes" aria-label="Vote sur cette proposition">
      <span>Votre avis :</span>
      <button type="button" data-roadmap-vote="UP" data-carte-id="${h(a.roadmap.carteId)}"
        class="accueil-vote-pour${a.roadmap.monVote === "UP" ? " est-actif" : ""}" ${a.roadmap.peutVoter ? "" : "disabled"}
        aria-pressed="${a.roadmap.monVote === "UP" ? "true" : "false"}">👍 <b>${Number(a.roadmap.votesPour || 0)}</b></button>
      <button type="button" data-roadmap-vote="DOWN" data-carte-id="${h(a.roadmap.carteId)}"
        class="accueil-vote-contre${a.roadmap.monVote === "DOWN" ? " est-actif" : ""}" ${a.roadmap.peutVoter ? "" : "disabled"}
        aria-pressed="${a.roadmap.monVote === "DOWN" ? "true" : "false"}">👎 <b>${Number(a.roadmap.votesContre || 0)}</b></button>
    </div>` : "";
    return `<article class="accueil-annonce accueil-annonce-${h((a.type || "INFO").toLowerCase())}${depliable ? " est-depliable" : ""}"
      ${depliable ? 'data-annonce-depliable="true" tabindex="0" role="button" aria-expanded="false"' : ""}>
      ${icone(a.icone || "info", "accueil-annonce-icone")}
      <div><header><strong>${h(a.titre)}</strong><small>${libelleType}</small></header><p>${h(a.description)}</p>
        ${depliable ? `<div class="accueil-annonce-details">${h(details)}</div><em class="accueil-annonce-indice">Afficher le message complet⌄</em>` : ""}
        ${voteRoadmap}
        <span>${auteurEtDate}</span></div>
      ${a.peutSupprimer ? `<button class="accueil-annonce-supprimer" data-id="${h(a.id)}" type="button" title="Supprimer cette annonce" aria-label="Supprimer cette annonce">×</button>` : ""}
    </article>`;
  }

  function formulaire() {
    const groupes = window.GDA_ICONES?.groupes || [];
    const galerie = groupes.map(function (groupe) {
      return `<section><h4>${h(groupe[0])}</h4><div>${groupe[1].map(function (item) {
        return `<button type="button" class="gda-choix-icone" data-code="${h(item[0])}" title="${h(item[1])}">${icone(item[0])}<span>${h(item[1])}</span></button>`;
      }).join("")}</div></section>`;
    }).join("");
    return `<details class="accueil-annonce-formulaire"><summary>＋ Nouvelle annonce</summary>
      <form id="formAnnonceAccueil">
        <label>Type<select name="type"><option value="INFO">Information</option><option value="IMPORTANT">Important</option><option value="MISSION">Mission</option><option value="SUCCESS">Terminé / validé</option></select></label>
        <label>Icône<input name="icone" type="hidden" value="info"><button id="ouvrirIconesAnnonce" class="gda-icone-selectionnee" type="button">${icone("info")}<span>Information</span></button></label>
        <label>Titre<input name="titre" maxlength="120" required placeholder="Titre de l’annonce"></label>
        <label class="accueil-annonce-description">Description<textarea name="description" maxlength="1200" required placeholder="Information à communiquer"></textarea></label>
        <label>Expiration facultative<input name="expireLe" type="datetime-local"></label>
        <button type="submit">Publier</button>
      </form><div id="selecteurIconesAnnonce" class="gda-selecteur-icones" hidden><header><strong>Choisir une icône</strong><button id="fermerIconesAnnonce" type="button" aria-label="Fermer">×</button></header>${galerie}</div></details>`;
  }

  function rendre() {
    if (!donnees || !estAccueil()) return;
    const s = donnees.statistiques || {};
    const stats = donnees.officier ? [
      carte("personnel", s.effectifActif, "Effectif total", "effectif"),
      carte("shield", `${s.pourcentageDisponibles}%`, "Membres disponibles", "disponibles", s.pourcentageDisponibles),
      carte("report", s.rapportsEnAttente, "Rapports en attente", "rapports"),
      carte("calendar", s.absencesEnAttente, "Absences en attente", "absences")
    ] : [
      carte("personnel", s.effectifActif, "Effectif GDA actif", "effectif"),
      carte("shield", `${s.pourcentageDisponibles}%`, "Membres présents / disponibles", "disponibles", s.pourcentageDisponibles),
      carte("report", s.mesRapportsEnregistres, "Mes rapports validés ou archivés", "rapports")
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

  function rendreErreur(message) {
    if (!estAccueil()) return;
    document.getElementById("workspace").innerHTML = `<section id="welcomePanel" class="accueil-dashboard-erreur">
      <span aria-hidden="true">!</span><h3>Tableau d’accueil indisponible</h3>
      <p>${h(message || "Impossible de charger les informations de l’accueil.")}</p>
      <button id="reessayerTableauAccueil" type="button">↻ Réessayer</button>
    </section>`;
    document.getElementById("reessayerTableauAccueil")?.addEventListener("click", function () { actualiser(true); });
  }

  function brancher() {
    document.getElementById("toutesAnnoncesAccueil")?.addEventListener("click", function () { afficherTout = !afficherTout; rendre(); });
    document.querySelectorAll("[data-annonce-depliable]").forEach(function (element) {
      function basculer() {
        const ouvert = element.classList.toggle("est-depliee");
        element.setAttribute("aria-expanded", String(ouvert));
        const indice = element.querySelector(".accueil-annonce-indice");
        if (indice) indice.textContent = ouvert ? "Masquer le message complet⌃" : "Afficher le message complet⌄";
      }
      element.addEventListener("click", function (evenement) {
        if (evenement.target.closest(".accueil-annonce-supprimer,[data-roadmap-vote]")) return;
        basculer();
      });
      element.addEventListener("keydown", function (evenement) {
        if (evenement.key !== "Enter" && evenement.key !== " ") return;
        evenement.preventDefault();
        basculer();
      });
    });
    document.querySelectorAll(".accueil-annonce-supprimer").forEach(function (bouton) {
      bouton.addEventListener("click", function (evenement) {
        evenement.stopPropagation();
        if (confirm("Supprimer cette annonce ?")) envoyer("supprimerAnnonceAccueil", { annonceId: bouton.dataset.id });
      });
    });
    document.querySelectorAll("[data-roadmap-vote]").forEach(function (bouton) {
      bouton.addEventListener("click", function (evenement) {
        evenement.stopPropagation();
        envoyer("voterCarteRoadmapOfficiers", { carteId: bouton.dataset.carteId, vote: bouton.dataset.roadmapVote });
      });
    });
    document.getElementById("formAnnonceAccueil")?.addEventListener("submit", function (event) {
      event.preventDefault();
      const f = new FormData(event.currentTarget);
      const expiration = String(f.get("expireLe") || "");
      envoyer("creerAnnonceAccueil", { type: f.get("type"), icone: f.get("icone"), titre: f.get("titre"), description: f.get("description"), expireLe: expiration ? new Date(expiration).toISOString() : "" });
    });
    const selecteur = document.getElementById("selecteurIconesAnnonce");
    document.getElementById("ouvrirIconesAnnonce")?.addEventListener("click", function () { if (selecteur) selecteur.hidden = false; });
    document.getElementById("fermerIconesAnnonce")?.addEventListener("click", function () { if (selecteur) selecteur.hidden = true; });
    document.querySelectorAll(".gda-choix-icone").forEach(function (bouton) {
      bouton.addEventListener("click", function () {
        const code = bouton.dataset.code || "info";
        const form = document.getElementById("formAnnonceAccueil");
        if (form?.elements.icone) form.elements.icone.value = code;
        const selection = document.getElementById("ouvrirIconesAnnonce");
        const reference = window.GDA_ICONES?.parCode?.[code];
        if (selection) selection.innerHTML = `${icone(code)}<span>${h(reference?.libelle || code)}</span>`;
        if (selecteur) selecteur.hidden = true;
      });
    });
  }

  async function envoyer(action, valeurs) {
    try {
      const body = new URLSearchParams({ action, identifiant: sessionStorage.getItem("identifiantUtilisateur") || "" });
      Object.entries(valeurs).forEach(([k, v]) => body.set(k, String(v == null ? "" : v)));
      const reponse = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: body.toString(), cache: "no-store" });
      const resultat = await reponse.json();
      if (!resultat.success) throw new Error(resultat.message || "Action impossible.");
      if (action === "voterCarteRoadmapOfficiers") await actualiser(true);
      else { donnees = resultat; rendre(); }
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
        donnees = resultat;
        annoncesAActualiser = false;
        rendre();
      } catch (e) {
        console.warn("Tableau d’accueil indisponible :", e);
        rendreErreur(e.message);
      }
      finally { chargement = null; }
    })();
    return chargement;
  }

  function synchroniserAnnoncesGlobalesGDA() {
    annoncesAActualiser = true;
    window.clearTimeout(minuteurSynchronisationAnnoncesGDA);
    minuteurSynchronisationAnnoncesGDA = window.setTimeout(function () {
      if (!estAccueil()) return;
      actualiser(true);
    }, 120);
  }

  function initialiserAnnoncesGlobalesTempsReelGDA() {
    const client = window.gdaSupabase && window.gdaSupabase.client;
    if (!client || canalAnnoncesGlobalGDA) return;
    canalAnnoncesGlobalGDA = client
      .channel("gda-annonces-global", { config: { private: false } })
      .on("broadcast", { event: "announcements-change" }, synchroniserAnnoncesGlobalesGDA)
      .subscribe();
  }

  window.afficherTableauAccueilGDA = function () {
    if (!estAccueil()) return;
    if (donnees && !annoncesAActualiser) rendre();
    actualiser(annoncesAActualiser);
  };
  window.actualiserTableauAccueilGDA = actualiser;
  function tenterChargementInitial() {
    if (sessionStorage.getItem("identifiantUtilisateur") && estAccueil()) {
      window.afficherTableauAccueilGDA();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tenterChargementInitial, { once: true });
  else tenterChargementInitial();
  initialiserAnnoncesGlobalesTempsReelGDA();
  window.setTimeout(tenterChargementInitial, 2500);
})();
