(function initialiserNavigationMobileGDA() {
  "use strict";

  const requeteMobile = window.matchMedia("(max-width: 750px)");
  const idsPrincipaux = [
    "officierGdaButton",
    "espaceGdaButton",
    "specialisationsButton",
    "liensUtilesButton",
    "administrationButton"
  ];
  const descriptions = {
    officierGdaButton: "Effectif, rapports et gestion du personnel",
    espaceGdaButton: "Votre effectif, vos rapports et vos absences",
    specialisationsButton: "Espaces Instructeur et Médecin",
    liensUtilesButton: "Documents et ressources GDA",
    administrationButton: "Permissions, journaux et paramètres"
  };

  const desktop = document.getElementById("desktop");
  const sidebar = document.getElementById("sidebar");
  const workspace = document.getElementById("workspace");
  const logoutButton = document.getElementById("logoutButton");

  if (!desktop || !sidebar || !workspace) return;

  function boutonAffiche(bouton) {
    return Boolean(bouton && !bouton.hidden);
  }

  function boutonsPrincipauxDisponibles() {
    return idsPrincipaux
      .map(function (id) { return document.getElementById(id); })
      .filter(boutonAffiche);
  }

  function navigationPrincipaleActive() {
    const principaux = boutonsPrincipauxDisponibles();
    if (!principaux.length) return false;

    return !Array.from(sidebar.querySelectorAll(".menuButton:not(.menuButtonPrincipal)"))
      .some(boutonAffiche);
  }

  function decomposerLibelle(libelle) {
    const propre = String(libelle || "").replace(/\s+/g, " ").trim();
    const correspondance = propre.match(/^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*(.*)$/u);
    return correspondance
      ? { icone: correspondance[1], titre: correspondance[2] }
      : { icone: "•", titre: propre };
  }

  function restaurerDeconnexion() {
    if (logoutButton && logoutButton.parentElement !== desktop) {
      desktop.appendChild(logoutButton);
    }
  }

  function construireAccueilMobile() {
    const boutons = boutonsPrincipauxDisponibles();
    if (!boutons.length) return;

    const cartes = boutons.map(function (bouton) {
      const libelle = decomposerLibelle(bouton.textContent);
      return `
        <button class="gda-mobile-carte" type="button" data-cible-menu="${bouton.id}">
          <span class="gda-mobile-carte-icone" aria-hidden="true">${libelle.icone}</span>
          <span class="gda-mobile-carte-texte">
            <strong>${libelle.titre}</strong>
            <small>${descriptions[bouton.id] || "Ouvrir cet espace"}</small>
          </span>
          <span class="gda-mobile-carte-fleche" aria-hidden="true">›</span>
        </button>`;
    }).join("");

    workspace.innerHTML = `
      <section class="gda-mobile-accueil" aria-labelledby="gdaMobileAccueilTitre">
        <header class="gda-mobile-accueil-entete">
          <span>Tableau de bord</span>
          <h3 id="gdaMobileAccueilTitre">Bienvenue dans l’intranet GDA</h3>
          <p>Choisissez l’espace que vous souhaitez consulter.</p>
        </header>
        <div class="gda-mobile-cartes">${cartes}</div>
        <div class="gda-mobile-deconnexion">
          <span>Se déconnecter</span>
        </div>
      </section>`;

    workspace.querySelectorAll("[data-cible-menu]").forEach(function (carte) {
      carte.addEventListener("click", function () {
        const cible = document.getElementById(carte.dataset.cibleMenu || "");
        if (cible) cible.click();
      });
    });

    const zoneDeconnexion = workspace.querySelector(".gda-mobile-deconnexion");
    if (logoutButton && zoneDeconnexion) {
      zoneDeconnexion.prepend(logoutButton);
    }
  }

  function actualiserNavigationMobile() {
    const mobileActif = requeteMobile.matches && desktop.classList.contains("visible");
    const accueilActif = mobileActif && navigationPrincipaleActive();

    document.body.classList.toggle("gda-mobile-actif", mobileActif);
    document.body.classList.toggle("gda-mobile-accueil-actif", accueilActif);

    if (!mobileActif) {
      restaurerDeconnexion();
      return;
    }

    if (!accueilActif) {
      restaurerDeconnexion();
      return;
    }

    if (!workspace.querySelector(".gda-mobile-accueil")) {
      construireAccueilMobile();
    } else if (logoutButton && !workspace.contains(logoutButton)) {
      const zoneDeconnexion = workspace.querySelector(".gda-mobile-deconnexion");
      if (zoneDeconnexion) zoneDeconnexion.prepend(logoutButton);
    }
  }

  let actualisationPlanifiee = false;
  function planifierActualisation() {
    if (actualisationPlanifiee) return;
    actualisationPlanifiee = true;
    window.requestAnimationFrame(function () {
      actualisationPlanifiee = false;
      actualiserNavigationMobile();
    });
  }

  const observateur = new MutationObserver(planifierActualisation);
  observateur.observe(sidebar, {
    attributes: true,
    attributeFilter: ["hidden"],
    childList: true,
    subtree: true
  });
  observateur.observe(workspace, { childList: true });
  observateur.observe(desktop, {
    attributes: true,
    attributeFilter: ["class"]
  });

  if (typeof requeteMobile.addEventListener === "function") {
    requeteMobile.addEventListener("change", planifierActualisation);
  } else {
    requeteMobile.addListener(planifierActualisation);
  }

  planifierActualisation();
})();
