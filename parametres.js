const parametresButton = document.getElementById("parametresButton");
const PARAMETRES_SITE_API_URL = API_URL;

let parametresSiteConfiguration = {
  maximumGda: 35,
  heureActualisation: "20:00",
  themeActif: "gda-classique"
};
let parametresSiteThemes = [
  { id: "gda-classique", nom: "GDA Classique", description: "Interface officielle actuelle de l’intranet GDA." },
  { id: "theme-test", nom: "Moderne", description: "Interface PC moderne, aérée et organisée en cartes." },
  { id: "theme-noel", nom: "Noël", description: "Décor hivernal complet avec neige, givre et blason de Noël." }
];
let parametresSiteLiens = [];
let parametresSiteDefcon = [0, 1, 2, 3, 4].map(function(niveau) {
  return { niveau: niveau, titre: niveau ? `DEFCON N-${niveau} activé` : "DEFCON désactivé", resume: "Information DEFCON.", details: "" };
});
let parametresSitePeutGerer = false;
let parametresSitePeutDeconnecterTous = false;
let parametresSiteCharges = false;
let parametresSiteChargement = null;
let parametresAjoutCategorie = "";

function utilisateurPeutGererParametresSiteGDA() {
  if (typeof utilisateurEstVisiteurGDA === "function" && utilisateurEstVisiteurGDA()) return false;
  if (typeof utilisateurPossedeRoleDirectGDA === "function" && utilisateurPossedeRoleDirectGDA("role_staff_total")) return false;
  return utilisateurEstProprietaireOuCoproprietaireGDA() ||
    String(sessionStorage.getItem("specialisationUtilisateur") || "")
      .split(/[;,]/)
      .some(function (specialisation) {
        return normaliserParametresSite(specialisation).trim() === "GERANT GDA";
      });
}

function appliquerConfigurationSiteGDA(resultat) {
  const configuration = resultat && resultat.configuration || {};
  parametresSiteConfiguration = {
    maximumGda: Math.max(1, Number(configuration.maximumGda || 35)),
    heureActualisation: String(configuration.heureActualisation || "20:00").slice(0, 5),
    themeActif: String(configuration.themeActif || "gda-classique"),
    modifieLe: configuration.modifieLe || ""
  };
  parametresSiteThemes = Array.isArray(resultat && resultat.themes) && resultat.themes.length
    ? resultat.themes.slice()
    : parametresSiteThemes;
  if (typeof window.enregistrerThemesDisponiblesGDA === "function") {
    window.enregistrerThemesDisponiblesGDA(parametresSiteThemes);
  }
  if (typeof window.appliquerThemeGDA === "function") {
    parametresSiteConfiguration.themeActif = window.appliquerThemeGDA(parametresSiteConfiguration.themeActif);
  }
  parametresSiteLiens = Array.isArray(resultat && resultat.liens)
    ? resultat.liens.slice().sort(function (a, b) {
        if (a.categorie !== b.categorie) return String(a.categorie).localeCompare(String(b.categorie));
        return Number(a.ordre || 0) - Number(b.ordre || 0);
      })
    : [];
  parametresSiteDefcon = Array.isArray(resultat && resultat.defconAnnonces) && resultat.defconAnnonces.length
    ? resultat.defconAnnonces.slice().sort(function(a, b) { return Number(a.niveau) - Number(b.niveau); })
    : parametresSiteDefcon;
  parametresSitePeutGerer = resultat && resultat.peutGerer === true;
  parametresSitePeutDeconnecterTous = resultat && resultat.peutDeconnecterTous === true;
  parametresSiteCharges = true;
  if (typeof window.mettreAJourMaximumEffectifGDA === "function") {
    window.mettreAJourMaximumEffectifGDA(parametresSiteConfiguration.maximumGda);
  }
  rendreLiensDynamiquesGDA();
  if (typeof appliquerVisibiliteModulesGDA === "function") {
    appliquerVisibiliteModulesGDA();
  }
}

async function chargerConfigurationSiteGDA(forcer) {
  if (parametresSiteChargement && !forcer) return parametresSiteChargement;
  if (parametresSiteCharges && !forcer) return Promise.resolve(parametresSiteConfiguration);
  parametresSiteChargement = (async function () {
    const reponse = await fetch(
      PARAMETRES_SITE_API_URL + "?action=recupererParametresSite" + (forcer ? "&_=" + Date.now() : ""),
      { cache: "no-store" }
    );
    const resultat = await reponse.json();
    if (!resultat.success) throw new Error(resultat.message || "Impossible de charger les paramètres du site.");
    appliquerConfigurationSiteGDA(resultat);
    return resultat;
  })();
  try {
    return await parametresSiteChargement;
  } finally {
    parametresSiteChargement = null;
  }
}

window.chargerConfigurationSiteGDA = chargerConfigurationSiteGDA;

function libelleCategorieLienGDA(categorie) {
  return categorie === "INSTRUCTEUR" ? "Instructeur" : "Liens utiles";
}

function iconeLienDynamiqueGDA(lien) {
  if (lien && String(lien.icone || "").trim()) return String(lien.icone).trim();
  const nom = normaliserParametresSite(lien && lien.nom);
  if (nom.includes("REGLEMENT")) return "📜";
  if (nom.includes("GUIDE")) return "📘";
  if (nom.includes("MARTIAL")) return "⚖️";
  return lien && lien.categorie === "INSTRUCTEUR" ? "🎓" : "🔗";
}

function rendreLiensDynamiquesGDA() {
  const destinations = {
    LIENS_UTILES: document.getElementById("liensUtilesDynamiques"),
    INSTRUCTEUR: document.getElementById("liensInstructeurDynamiques")
  };
  Object.keys(destinations).forEach(function (categorie) {
    const destination = destinations[categorie];
    if (!destination) return;
    destination.innerHTML = parametresSiteLiens
      .filter(function (lien) { return lien.categorie === categorie; })
      .map(function (lien) {
        return `<button class="menuButton lien-dynamique-gda" type="button" data-lien-site="${echapperHTML(lien.id)}" hidden>
          ${echapperHTML(iconeLienDynamiqueGDA(lien))} ${echapperHTML(lien.nom)}
        </button>`;
      }).join("");
    destination.querySelectorAll("[data-lien-site]").forEach(function (bouton) {
      bouton.addEventListener("click", function () {
        ouvrirLienDynamiqueGDA(bouton.dataset.lienSite);
      });
    });
  });
  actualiserVisibiliteLiensDynamiquesGDA();
}

function actualiserVisibiliteLiensDynamiquesGDA() {
  document.querySelectorAll("#liensUtilesDynamiques [data-lien-site]").forEach(function (bouton) {
    bouton.hidden = !menuLiensUtilesOuvert;
  });
  document.querySelectorAll("#liensInstructeurDynamiques [data-lien-site]").forEach(function (bouton) {
    bouton.hidden = !menuInstructeurOuvert || !utilisateurPeutAccederEspaceInstructeurGDA();
  });
}

window.actualiserVisibiliteLiensDynamiquesGDA = actualiserVisibiliteLiensDynamiquesGDA;

function ouvrirLienDynamiqueGDA(id) {
  const lien = parametresSiteLiens.find(function (item) { return item.id === id; });
  if (!lien) return;
  definirModuleGdaActif("lien-site-" + id);
  if (lien.mode === "EXTERNAL") {
    const zone = document.getElementById("workspace");
    if (!zone) return;
    zone.innerHTML = `<section id="welcomePanel">
      <h3>${echapperHTML(iconeLienDynamiqueGDA(lien))} ${echapperHTML(lien.nom)}</h3>
      <p>Ce document est disponible sur son site dédié.</p>
      <p><a href="${echapperHTML(lien.url)}" target="_blank" rel="noopener noreferrer" class="bouton-lien-externe-gda">Ouvrir ${echapperHTML(lien.nom)}</a></p>
    </section>`;
    return;
  }
  ouvrirLienUtileGDA(
    iconeLienDynamiqueGDA(lien) + " " + lien.nom,
    lien.url,
    lien.nom,
    libelleCategorieLienGDA(lien.categorie)
  );
}

if (parametresButton) {
  parametresButton.addEventListener("click", ouvrirParametresSiteGDA);
}

async function ouvrirParametresSiteGDA() {
  if (!utilisateurPeutConsulterParametresSiteGDA()) return;
  definirModuleGdaActif("administration-parametres");
  const zone = document.getElementById("workspace");
  if (!zone) return;
  zone.innerHTML = `<section id="parametresSiteModule"><div class="parametres-message">Chargement des paramètres…</div></section>`;
  try {
    await chargerConfigurationSiteGDA(true);
    afficherParametresSiteGDA();
  } catch (erreur) {
    zone.innerHTML = `<section id="parametresSiteModule"><div class="parametres-message parametres-erreur">${echapperHTML(erreur.message || "Paramètres indisponibles.")}</div></section>`;
  }
}

function afficherParametresSiteGDA() {
  if (!moduleGdaEstActif("administration-parametres")) return;
  const zone = document.getElementById("workspace");
  if (!zone) return;
  zone.innerHTML = `
    <section id="parametresSiteModule">
      <header class="parametres-entete">
        <div><span>Administration</span><h3>🛠️ Paramètres du site</h3><p>Configuration générale et documents intégrés aux menus.</p></div>
        <button id="parametresActualiser" type="button">↻ Actualiser</button>
      </header>
      <form id="parametresGenerauxFormulaire" class="parametres-bloc parametres-generaux">
        <div><h4>Configuration générale</h4><p>Ces valeurs sont utilisées immédiatement par Supabase.</p></div>
        <label><span>Nombre maximum de GDA</span><input name="maximumGda" type="number" min="1" max="200" step="1" value="${echapperHTML(parametresSiteConfiguration.maximumGda)}" required></label>
        <label><span>Heure de mise à jour de l’effectif GDA</span><input name="heureActualisation" type="time" value="${echapperHTML(parametresSiteConfiguration.heureActualisation)}" required></label>
        <button type="submit">Enregistrer les paramètres</button>
        <output class="parametres-retour" aria-live="polite"></output>
      </form>
      ${creerSecuriteSessionsParametresGDA()}
      ${creerSelectionThemesParametresGDA()}
      ${creerParametresAnnoncesDefconGDA()}
      <div class="parametres-categories">
        ${creerCategorieParametresLiensGDA("LIENS_UTILES")}
        ${creerCategorieParametresLiensGDA("INSTRUCTEUR")}
      </div>
    </section>`;
  brancherParametresSiteGDA();
  if (typeof appliquerModeVisiteurGDA === "function") appliquerModeVisiteurGDA();
}

function creerSecuriteSessionsParametresGDA() {
  if (!parametresSitePeutDeconnecterTous) return "";
  return `<section class="parametres-bloc parametres-securite-sessions">
    <div>
      <h4>🔐 Sessions des utilisateurs</h4>
      <p>Force tous les utilisateurs, vous compris, à se reconnecter afin de charger la dernière version du site.</p>
    </div>
    <button id="parametresDeconnecterTous" class="danger" type="button">⏻ Déconnecter tout le monde</button>
    <output class="parametres-retour" aria-live="polite"></output>
  </section>`;
}

function creerParametresAnnoncesDefconGDA() {
  const verrouille = !parametresSitePeutGerer;
  return `<section class="parametres-bloc parametres-defcon-section">
    <header><div><h4>🚨 Annonces automatiques DEFCON</h4><p>Personnalisez le résumé visible sur l’accueil et le message complet affiché au clic.</p></div></header>
    <div class="parametres-defcon-liste">
      ${parametresSiteDefcon.map(function(modele) {
        const niveau = Math.max(0, Math.min(4, Number(modele.niveau) || 0));
        return `<details class="parametres-defcon-carte" ${niveau === 4 ? "open" : ""}>
          <summary>${niveau ? `DEFCON N-${niveau}` : "DEFCON désactivé"}<span>${echapperHTML(modele.titre || "")}</span></summary>
          <form class="parametres-defcon-formulaire" data-niveau-defcon="${niveau}">
            <label><span>Titre de l’annonce</span><input name="titre" maxlength="120" value="${echapperHTML(modele.titre || "")}" required ${verrouille ? "disabled" : ""}></label>
            <label><span>Résumé toujours visible</span><textarea name="resume" maxlength="500" required ${verrouille ? "disabled" : ""}>${echapperHTML(modele.resume || "")}</textarea></label>
            <label><span>Message complet dépliable</span><textarea name="details" maxlength="5000" rows="9" placeholder="Laissez vide si aucun détail n’est nécessaire." ${verrouille ? "disabled" : ""}>${echapperHTML(modele.details || "")}</textarea></label>
            ${verrouille ? "" : '<button type="submit">Enregistrer cette annonce</button>'}
            <output class="parametres-retour" aria-live="polite"></output>
          </form>
        </details>`;
      }).join("")}
    </div>
  </section>`;
}

function utilisateurPeutConsulterParametresSiteGDA() {
  return (typeof utilisateurEstVisiteurGDA === "function" && utilisateurEstVisiteurGDA()) ||
    utilisateurPeutGererParametresSiteGDA();
}

function creerSelectionThemesParametresGDA() {
  return `<section class="parametres-bloc parametres-themes-section">
    <header><div><h4>🎨 Thème de l’intranet</h4><p>Le thème choisi est appliqué globalement à tous les utilisateurs.</p></div></header>
    <div class="parametres-themes-liste">
      ${parametresSiteThemes.map(function(theme) {
        const actif = theme.id === parametresSiteConfiguration.themeActif;
        return `<article class="parametres-theme-carte ${actif ? "est-actif" : ""}">
          <div class="parametres-theme-apercu" data-theme-apercu="${echapperHTML(theme.id)}" aria-hidden="true"><span></span><i></i><b></b></div>
          <div><strong>${echapperHTML(theme.nom)}</strong><p>${echapperHTML(theme.description || "Thème visuel GDA")}</p></div>
          <button type="button" data-activer-theme="${echapperHTML(theme.id)}" ${actif ? "disabled" : ""}>${actif ? "✓ Thème actif" : "Activer ce thème"}</button>
        </article>`;
      }).join("")}
    </div>
  </section>`;
}

function creerCategorieParametresLiensGDA(categorie) {
  const liens = parametresSiteLiens.filter(function (lien) { return lien.categorie === categorie; });
  return `<section class="parametres-bloc parametres-liens-section" data-categorie-parametres="${categorie}">
    <header><div><h4>${categorie === "INSTRUCTEUR" ? "🎓 Liens Instructeur" : "🔗 Liens utiles"}</h4><p>${liens.length} onglet${liens.length > 1 ? "s" : ""} configuré${liens.length > 1 ? "s" : ""}</p></div><button type="button" data-ajouter-lien="${categorie}">＋ Ajouter un onglet</button></header>
    <div class="parametres-liens-liste">
      ${liens.length ? liens.map(creerFormulaireLienParametresGDA).join("") : '<div class="parametres-vide">Aucun lien dans cette catégorie.</div>'}
      ${parametresAjoutCategorie === categorie ? creerFormulaireLienParametresGDA({ categorie, nom: "", icone: categorie === "INSTRUCTEUR" ? "🎓" : "🔗", url: "", mode: "IFRAME", ordre: (liens.length + 1) * 10 }) : ""}
    </div>
  </section>`;
}

function creerFormulaireLienParametresGDA(lien) {
  const nouveau = !lien.id;
  const iconesProposees = ["🔗", "📜", "📘", "⚖️", "🎓", "📋", "📁", "📊", "🛡️", "📌", "🌐", "⚙️"];
  const iconeActuelle = iconeLienDynamiqueGDA(lien);
  const iconePersonnalisee = !iconesProposees.includes(iconeActuelle);
  return `<form class="parametres-lien-formulaire ${nouveau ? "parametres-lien-nouveau" : ""}" data-lien-id="${echapperHTML(lien.id || "")}" data-lien-categorie="${echapperHTML(lien.categorie)}">
    <label class="parametres-lien-nom"><span>Nom de l’onglet</span><input name="nom" maxlength="100" value="${echapperHTML(lien.nom || "")}" required></label>
    <label class="parametres-lien-icone"><span>Icône</span><select name="iconeChoix">${iconesProposees.map(function (icone) { return `<option value="${echapperHTML(icone)}" ${icone === iconeActuelle ? "selected" : ""}>${echapperHTML(icone)}</option>`; }).join("")}<option value="PERSONNALISEE" ${iconePersonnalisee ? "selected" : ""}>Autre…</option></select><input name="iconePersonnalisee" maxlength="16" value="${echapperHTML(iconePersonnalisee ? iconeActuelle : "")}" placeholder="Votre emoji" ${iconePersonnalisee ? "" : "hidden"}></label>
    <label class="parametres-lien-url"><span>Lien du document</span><input name="url" type="url" value="${echapperHTML(lien.url || "")}" placeholder="https://…" required></label>
    <label><span>Affichage</span><select name="mode"><option value="IFRAME" ${lien.mode !== "EXTERNAL" ? "selected" : ""}>Intégré au site</option><option value="EXTERNAL" ${lien.mode === "EXTERNAL" ? "selected" : ""}>Nouvel onglet</option></select></label>
    <label><span>Ordre</span><input name="ordre" type="number" min="0" max="10000" value="${Number(lien.ordre || 0)}"></label>
    <div class="parametres-lien-actions"><button type="submit">${nouveau ? "Ajouter" : "Enregistrer"}</button>${nouveau ? '<button type="button" data-annuler-ajout>Annuler</button>' : '<button type="button" class="danger" data-supprimer-lien>Supprimer</button>'}</div>
    <output class="parametres-retour" aria-live="polite"></output>
  </form>`;
}

function brancherParametresSiteGDA() {
  document.getElementById("parametresActualiser")?.addEventListener("click", ouvrirParametresSiteGDA);
  document.getElementById("parametresGenerauxFormulaire")?.addEventListener("submit", enregistrerParametresGenerauxGDA);
  document.getElementById("parametresDeconnecterTous")?.addEventListener("click", deconnecterTousUtilisateursGDA);
  document.querySelectorAll("[data-activer-theme]").forEach(function(bouton) {
    bouton.addEventListener("click", activerThemeParametresGDA);
  });
  document.querySelectorAll(".parametres-defcon-formulaire").forEach(function(formulaire) {
    formulaire.addEventListener("submit", enregistrerAnnonceDefconGDA);
  });
  document.querySelectorAll("[data-ajouter-lien]").forEach(function (bouton) {
    bouton.addEventListener("click", function () {
      parametresAjoutCategorie = bouton.dataset.ajouterLien;
      afficherParametresSiteGDA();
    });
  });
  document.querySelectorAll(".parametres-lien-formulaire").forEach(function (formulaire) {
    formulaire.addEventListener("submit", enregistrerLienParametresGDA);
    const choixIcone = formulaire.querySelector('[name="iconeChoix"]');
    const iconePersonnalisee = formulaire.querySelector('[name="iconePersonnalisee"]');
    choixIcone?.addEventListener("change", function () {
      iconePersonnalisee.hidden = choixIcone.value !== "PERSONNALISEE";
      if (!iconePersonnalisee.hidden) iconePersonnalisee.focus();
    });
    formulaire.querySelector("[data-supprimer-lien]")?.addEventListener("click", supprimerLienParametresGDA);
    formulaire.querySelector("[data-annuler-ajout]")?.addEventListener("click", function () {
      parametresAjoutCategorie = "";
      afficherParametresSiteGDA();
    });
  });
}

async function deconnecterTousUtilisateursGDA(evenement) {
  const bouton = evenement.currentTarget;
  const section = bouton.closest(".parametres-securite-sessions");
  const retour = section?.querySelector(".parametres-retour");
  const confirmation = window.confirm(
    "Déconnecter immédiatement tous les utilisateurs du site, y compris votre session ?"
  );
  if (!confirmation) return;
  bouton.disabled = true;
  if (retour) retour.textContent = "Réinitialisation de toutes les sessions…";
  try {
    await requeteMutationParametresGDA("deconnecterTousUtilisateurs", {});
    if (typeof deconnecterUtilisateurGDA === "function") {
      await deconnecterUtilisateurGDA(true);
    } else {
      window.location.replace(new URL("/", window.location.origin).href);
    }
  } catch (erreur) {
    if (retour) {
      retour.textContent = erreur.message || "Déconnexion générale impossible.";
      retour.classList.add("erreur");
    }
    bouton.disabled = false;
  }
}

async function enregistrerAnnonceDefconGDA(evenement) {
  evenement.preventDefault();
  const formulaire = evenement.currentTarget;
  const bouton = formulaire.querySelector("button[type=submit]");
  const retour = formulaire.querySelector(".parametres-retour");
  if (bouton) bouton.disabled = true;
  retour.textContent = "Enregistrement…";
  try {
    const donnees = Object.fromEntries(new FormData(formulaire).entries());
    donnees.niveau = formulaire.dataset.niveauDefcon || "0";
    const resultat = await requeteMutationParametresGDA("enregistrerAnnonceDefcon", donnees);
    afficherParametresSiteGDA();
    afficherNotificationGDA(resultat.message, "succes");
  } catch (erreur) {
    retour.textContent = erreur.message || "Enregistrement impossible.";
    retour.classList.add("erreur");
    if (bouton) bouton.disabled = false;
  }
}

async function activerThemeParametresGDA(evenement) {
  const bouton = evenement.currentTarget;
  const theme = bouton.dataset.activerTheme || "";
  bouton.disabled = true;
  try {
    const resultat = await requeteMutationParametresGDA("enregistrerThemeSite", { theme: theme });
    afficherParametresSiteGDA();
    afficherNotificationGDA(resultat.message, "succes");
  } catch (erreur) {
    bouton.disabled = false;
    afficherNotificationGDA(erreur.message || "Impossible d’activer ce thème.", "erreur");
  }
}

async function requeteMutationParametresGDA(action, donnees) {
  const reponse = await fetch(PARAMETRES_SITE_API_URL + "?action=" + encodeURIComponent(action), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donnees || {})
  });
  const resultat = await reponse.json();
  if (!resultat.success) throw new Error(resultat.message || "Enregistrement impossible.");
  appliquerConfigurationSiteGDA(resultat);
  if (typeof gdaForcerActualisation === "function") gdaForcerActualisation("recupererParametresSite");
  return resultat;
}

async function enregistrerParametresGenerauxGDA(evenement) {
  evenement.preventDefault();
  const formulaire = evenement.currentTarget;
  const bouton = formulaire.querySelector("button[type=submit]");
  const retour = formulaire.querySelector(".parametres-retour");
  bouton.disabled = true;
  retour.textContent = "Enregistrement…";
  try {
    const donnees = Object.fromEntries(new FormData(formulaire).entries());
    const resultat = await requeteMutationParametresGDA("enregistrerParametresSite", donnees);
    afficherParametresSiteGDA();
    afficherNotificationGDA(resultat.message, "succes");
  } catch (erreur) {
    retour.textContent = erreur.message || "Enregistrement impossible.";
    retour.classList.add("erreur");
    bouton.disabled = false;
  }
}

async function enregistrerLienParametresGDA(evenement) {
  evenement.preventDefault();
  const formulaire = evenement.currentTarget;
  const bouton = formulaire.querySelector("button[type=submit]");
  const retour = formulaire.querySelector(".parametres-retour");
  bouton.disabled = true;
  retour.textContent = "Enregistrement…";
  try {
    const donnees = Object.fromEntries(new FormData(formulaire).entries());
    donnees.id = formulaire.dataset.lienId || "";
    donnees.categorie = formulaire.dataset.lienCategorie;
    donnees.icone = donnees.iconeChoix === "PERSONNALISEE"
      ? String(donnees.iconePersonnalisee || "").trim()
      : donnees.iconeChoix;
    delete donnees.iconeChoix;
    delete donnees.iconePersonnalisee;
    const resultat = await requeteMutationParametresGDA("enregistrerLienSite", donnees);
    parametresAjoutCategorie = "";
    afficherParametresSiteGDA();
    afficherNotificationGDA(resultat.message, "succes");
  } catch (erreur) {
    retour.textContent = erreur.message || "Enregistrement impossible.";
    retour.classList.add("erreur");
    bouton.disabled = false;
  }
}

async function supprimerLienParametresGDA(evenement) {
  const formulaire = evenement.currentTarget.closest(".parametres-lien-formulaire");
  const lien = parametresSiteLiens.find(function (item) { return item.id === formulaire.dataset.lienId; });
  if (!lien || !window.confirm(`Supprimer l’onglet « ${lien.nom} » ?`)) return;
  try {
    const resultat = await requeteMutationParametresGDA("supprimerLienSite", { id: lien.id });
    afficherParametresSiteGDA();
    afficherNotificationGDA(resultat.message, "succes");
  } catch (erreur) {
    formulaire.querySelector(".parametres-retour").textContent = erreur.message || "Suppression impossible.";
  }
}

function normaliserParametresSite(valeur) {
  return String(valeur || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

window.addEventListener("gda-donnees-modifiees", function(evenement) {
  if (evenement.detail?.action !== "enregistrerThemeSite") return;
  chargerConfigurationSiteGDA(true).then(function() {
    if (moduleGdaEstActif("administration-parametres")) afficherParametresSiteGDA();
  }).catch(function(erreur) {
    console.warn("Actualisation du thème indisponible :", erreur);
  });
});

window.setInterval(function() {
  if (document.hidden || !sessionStorage.getItem("sessionTokenDiscord")) return;
  chargerConfigurationSiteGDA(true).catch(function(erreur) {
    console.warn("Synchronisation du thème indisponible :", erreur);
  });
}, 30000);
