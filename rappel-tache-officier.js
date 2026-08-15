(function initialiserModuleRappelTacheOfficierGDA() {
  "use strict";

  let tacheActuelle = null;
  let initialisationFaite = false;
  let chargementEnCours = false;
  let renduPlanifie = false;

  function estAccueilPrincipalGDA() {
    const workspace = document.getElementById("workspace");
    const sidebar = document.getElementById("sidebar");
    if (!workspace || !sidebar) return false;
    if (workspace.querySelector(".gda-mobile-accueil")) return true;
    if (!workspace.querySelector("#welcomePanel")) return false;
    return !Array.from(sidebar.querySelectorAll(".menuButton:not(.menuButtonPrincipal)"))
      .some(function(bouton) { return !bouton.hidden; });
  }

  function formaterSemaineGDA(valeur) {
    const date = new Date(String(valeur || "") + "T12:00:00");
    if (Number.isNaN(date.getTime())) return "Cette semaine";
    return "Semaine du " + new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function retirerRappelGDA() {
    document.getElementById("rappelTacheOfficierGDA")?.remove();
  }

  function afficherRappelGDA() {
    retirerRappelGDA();
    if (!tacheActuelle || !estAccueilPrincipalGDA()) return;

    const workspace = document.getElementById("workspace");
    if (!workspace) return;
    const carte = document.createElement("aside");
    carte.id = "rappelTacheOfficierGDA";
    carte.className = "rappel-tache-officier" +
      (tacheActuelle.priseEnCompte ? " est-prise-en-compte" : " est-a-confirmer");
    carte.setAttribute("aria-live", "polite");
    carte.innerHTML = `
      <span class="rappel-tache-officier-icone" aria-hidden="true">📌</span>
      <div class="rappel-tache-officier-contenu">
        <span>Votre tâche de la semaine</span>
        <strong>${echapperHTML(tacheActuelle.libelle || tacheActuelle.code || "Tâche attribuée")}</strong>
        <small>${echapperHTML(formaterSemaineGDA(tacheActuelle.semaine))}</small>
      </div>
      ${tacheActuelle.priseEnCompte
        ? '<span class="rappel-tache-officier-confirmee">✓ Prise en compte</span>'
        : '<button type="button" class="rappel-tache-officier-bouton">J’ai pris connaissance</button>'}
    `;

    const accueilMobile = workspace.querySelector(".gda-mobile-accueil");
    if (accueilMobile) {
      const entete = accueilMobile.querySelector(".gda-mobile-accueil-entete");
      if (entete) entete.insertAdjacentElement("afterend", carte);
      else accueilMobile.prepend(carte);
    } else {
      const panneau = workspace.querySelector("#welcomePanel");
      if (panneau) panneau.appendChild(carte);
    }

    carte.querySelector(".rappel-tache-officier-bouton")?.addEventListener("click", function() {
      confirmerPriseEnCompteGDA();
    });
  }

  function planifierRenduGDA() {
    if (renduPlanifie) return;
    renduPlanifie = true;
    window.requestAnimationFrame(function() {
      renduPlanifie = false;
      afficherRappelGDA();
    });
  }

  async function chargerRappelGDA() {
    const jeton = sessionStorage.getItem("sessionTokenDiscord") || "";
    if (!jeton || chargementEnCours || document.hidden) return;
    chargementEnCours = true;
    try {
      const reponse = await fetch(API_URL + "?action=recupererMaTacheOfficier&_=" + Date.now(), {
        cache: "no-store"
      });
      const resultat = await reponse.json();
      if (!reponse.ok || !resultat.success) throw new Error(resultat.message || "Rappel indisponible.");
      tacheActuelle = resultat.tache || null;
      afficherRappelGDA();
    } catch (erreur) {
      console.warn("Rappel de tâche indisponible :", erreur);
    } finally {
      chargementEnCours = false;
    }
  }

  async function confirmerPriseEnCompteGDA() {
    const bouton = document.querySelector(".rappel-tache-officier-bouton");
    if (bouton) bouton.disabled = true;
    try {
      const donnees = new URLSearchParams({ action: "prendreConnaissanceTacheOfficier" });
      const reponse = await fetch(API_URL + "?action=prendreConnaissanceTacheOfficier", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: donnees.toString(),
        cache: "no-store"
      });
      const resultat = await reponse.json();
      if (!reponse.ok || !resultat.success) throw new Error(resultat.message || "Confirmation impossible.");
      tacheActuelle = resultat.tache || null;
      afficherRappelGDA();
      if (typeof actualiserNotificationsAbsenceGDA === "function") {
        actualiserNotificationsAbsenceGDA(true);
      }
      if (typeof afficherNotificationGDA === "function") {
        afficherNotificationGDA(resultat.message || "Tâche prise en compte.", "succes");
      }
    } catch (erreur) {
      if (bouton) bouton.disabled = false;
      if (typeof afficherNotificationGDA === "function") {
        afficherNotificationGDA(erreur.message || "Confirmation impossible.", "erreur");
      }
    }
  }

  window.confirmerPriseEnCompteTacheOfficierGDA = confirmerPriseEnCompteGDA;
  window.actualiserRappelTacheOfficierGDA = chargerRappelGDA;
  window.initialiserRappelTacheOfficierGDA = function() {
    if (initialisationFaite) {
      chargerRappelGDA();
      return;
    }
    initialisationFaite = true;
    const workspace = document.getElementById("workspace");
    const sidebar = document.getElementById("sidebar");
    if (workspace) new MutationObserver(planifierRenduGDA).observe(workspace, { childList: true, subtree: false });
    if (sidebar) new MutationObserver(planifierRenduGDA).observe(sidebar, {
      attributes: true,
      attributeFilter: ["hidden"],
      subtree: true
    });
    window.addEventListener("gda-donnees-modifiees", function(evenement) {
      const actionsRappel = new Set([
        "enregistrerTacheOfficier",
        "ajouterAbsence",
        "modifierAbsence",
        "retourAnticipe",
        "supprimerAbsence",
        "traiterDemandeAbsence"
      ]);
      if (actionsRappel.has(evenement.detail?.action || "")) {
        chargerRappelGDA();
        if (typeof actualiserNotificationsAbsenceGDA === "function") {
          actualiserNotificationsAbsenceGDA(true);
        }
      }
    });
    document.addEventListener("visibilitychange", function() {
      if (!document.hidden) chargerRappelGDA();
    });
    chargerRappelGDA();
  };

  if (document.getElementById("desktop")?.classList.contains("visible")) {
    window.initialiserRappelTacheOfficierGDA();
  }
})();
