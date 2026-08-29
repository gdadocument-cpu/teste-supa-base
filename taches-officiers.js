(function initialiserTachesOfficiersGDA() {
  "use strict";

  const API_TACHES_OFFICIERS = API_URL;
  const GROUPES_TACHES_OFFICIERS = [
    ["officiersSuperieurs", "Officiers supérieurs", "Commandement supérieur"],
    ["officiers", "Officiers", "Corps des officiers"],
    ["gerantsSpecialisation", "Gérants de spécialisation", "Responsables INST et MDC"]
  ];
  const GRADES_MESSAGE_DISCORD = [
    "LIEUTENANT-COLONEL", "COMMANDANT", "VICE-COMMANDANT", "CAPITAINE",
    "LIEUTENANT", "SOUS-LIEUTENANT", "ASPIRANT"
  ];
  const SEPARATEUR_OFF_SUP_DISCORD =
    "----------------------------------------------------------------------------OFF-SUP-----------------------------------------------------------------------------------";
  const SEPARATEUR_OFF_DISCORD =
    "-------------------------------------------------------------------------------OFF------------------------------------------------------------------------------------";

  let donneesTachesOfficiers = null;
  let chargementTachesOfficiers = false;

  function echapperTachesOfficiers(valeur) {
    return String(valeur == null ? "" : valeur)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normaliserTachesOfficiers(valeur) {
    return String(valeur || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function iconeGradeTachesOfficiers(grade) {
    if (typeof obtenirIconeGradeEffectif === "function") {
      return obtenirIconeGradeEffectif(grade);
    }
    return "images/logo.png";
  }

  function classeGradeTachesOfficiers(grade) {
    const normalise = normaliserTachesOfficiers(grade);
    if (["LIEUTENANT-COLONEL", "COMMANDANT", "VICE-COMMANDANT"].includes(normalise)) {
      return "taches-officiers-grade-superieur";
    }
    return "taches-officiers-grade-officier";
  }

  function listeOptionsTachesOfficiers() {
    const options = Array.isArray(donneesTachesOfficiers?.options)
      ? donneesTachesOfficiers.options
      : [];
    return [{ code: "NA", libelle: "N/A" }].concat(options);
  }

  function optionsTachesOfficiers(selection) {
    return listeOptionsTachesOfficiers().map(function(option) {
      return '<option value="' + echapperTachesOfficiers(option.code) + '"' +
        (option.code === selection ? " selected" : "") + ">" +
        echapperTachesOfficiers(option.libelle) + "</option>";
    }).join("");
  }

  function libelleTacheOfficier(code) {
    return listeOptionsTachesOfficiers().find(function(option) {
      return option.code === code;
    })?.libelle || "N/A";
  }

  function membresMessageDiscord(superieurs) {
    const groupes = donneesTachesOfficiers?.groupes || {};
    const uniques = new Map();
    ["officiersSuperieurs", "officiers", "gerantsSpecialisation"].forEach(function(cle) {
      (Array.isArray(groupes[cle]) ? groupes[cle] : []).forEach(function(membre) {
        uniques.set(Number(membre.id), membre);
      });
    });
    return Array.from(uniques.values())
      .filter(function(membre) {
        const grade = normaliserTachesOfficiers(membre.grade);
        const estSuperieur = GRADES_MESSAGE_DISCORD.slice(0, 3).includes(grade);
        return superieurs ? estSuperieur : !estSuperieur && GRADES_MESSAGE_DISCORD.includes(grade);
      })
      .sort(function(a, b) {
        const rangA = GRADES_MESSAGE_DISCORD.indexOf(normaliserTachesOfficiers(a.grade));
        const rangB = GRADES_MESSAGE_DISCORD.indexOf(normaliserTachesOfficiers(b.grade));
        return rangA - rangB || String(a.nom || "").localeCompare(String(b.nom || ""), "fr", { sensitivity: "base" });
      });
  }

  function ligneMessageDiscord(membre, idsManquants) {
    const discordId = String(membre.discordId || "").trim();
    if (!/^\d{15,22}$/.test(discordId)) idsManquants.push(String(membre.nom || "Inconnu"));
    const mention = /^\d{15,22}$/.test(discordId) ? `<@${discordId}>` : `@${membre.nom || "Inconnu"}`;
    const tache = membre.absent === true
      ? "Absent"
      : libelleTacheOfficier(membre.tache || "NA");
    return `${mention} : ${tache}`;
  }

  function genererMessageDiscord() {
    const idsManquants = [];
    const lignesSuperieurs = membresMessageDiscord(true).map(function(membre) {
      return ligneMessageDiscord(membre, idsManquants);
    });
    const lignesOfficiers = membresMessageDiscord(false).map(function(membre) {
      return ligneMessageDiscord(membre, idsManquants);
    });
    if (idsManquants.length) {
      throw new Error("Discord ID manquant pour : " + idsManquants.join(", ") + ".");
    }
    const grade = sessionStorage.getItem("gradeEffectifPublicUtilisateur") ||
      sessionStorage.getItem("gradeUtilisateur") || "Grade non renseigné";
    const nom = sessionStorage.getItem("nomUtilisateur") || "Utilisateur";
    const lignes = [
      "# Roulement des taches Hebdomadaire",
      "",
      "**`Courrier à l'attention de :`**  <@&1272570947102179444>",
      "**`CC :`**  <@&1274098953100460133>",
      "## **`Tache à réaliser sur le document Officiers GDA `**",
      "",
      SEPARATEUR_OFF_SUP_DISCORD,
      "",
      ...lignesSuperieurs.flatMap(function(ligne) { return [ligne, ""]; }),
      SEPARATEUR_OFF_DISCORD,
      "",
      ...lignesOfficiers.flatMap(function(ligne) { return [ligne, ""]; }),
      `Respectueusement *${grade} ${nom}*`
    ];
    const message = lignes.join("\n").trim();
    if (message.length > 2000) {
      throw new Error("Le message dépasse la limite Discord de 2 000 caractères.");
    }
    return message;
  }

  async function copierTexteDiscord(texte) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texte);
      return;
    }
    const zone = document.createElement("textarea");
    zone.value = texte;
    zone.setAttribute("readonly", "");
    zone.style.position = "fixed";
    zone.style.opacity = "0";
    document.body.appendChild(zone);
    zone.select();
    const copieReussie = document.execCommand("copy");
    zone.remove();
    if (!copieReussie) throw new Error("Le navigateur a refusé l’accès au presse-papiers.");
  }

  async function copierMessageDiscord() {
    const bouton = document.getElementById("copierMessageDiscordTachesOfficiers");
    if (bouton) bouton.disabled = true;
    try {
      await copierTexteDiscord(genererMessageDiscord());
      if (typeof afficherNotificationGDA === "function") {
        afficherNotificationGDA("Message Discord copié. Vous pouvez maintenant le coller dans Discord.", "succes");
      }
    } catch (erreur) {
      if (typeof afficherNotificationGDA === "function") {
        afficherNotificationGDA(erreur.message || "Impossible de copier le message Discord.", "erreur");
      }
    } finally {
      if (bouton) bouton.disabled = false;
    }
  }

  function ligneTachesOfficiers(membre) {
    const absent = membre.absent === true;
    const specialisations = Array.isArray(membre.specialisations)
      ? membre.specialisations.join(" · ")
      : "";
    return `
      <article class="taches-officiers-ligne${absent ? " est-absent" : ""}">
        <div class="taches-officiers-identite">
          <img src="${echapperTachesOfficiers(iconeGradeTachesOfficiers(membre.grade))}"
               alt="" class="taches-officiers-grade-icone">
          <span class="taches-officiers-grade ${classeGradeTachesOfficiers(membre.grade)}">
            ${echapperTachesOfficiers(membre.grade)}
          </span>
          <span class="taches-officiers-nom">
            <strong>${echapperTachesOfficiers(membre.nom)}</strong>
            ${specialisations ? `<small>${echapperTachesOfficiers(specialisations)}</small>` : ""}
          </span>
        </div>
        <div class="taches-officiers-affectation">
          ${absent ? '<span class="taches-officiers-absent" title="Personne absente">⛔ Absent</span>' : ""}
          <label>
            <span class="sr-only">Tâche de ${echapperTachesOfficiers(membre.nom)}</span>
            <select class="taches-officiers-select"
                    data-member-id="${Number(membre.id)}"
                    data-valeur-initiale="${echapperTachesOfficiers(membre.tache || "NA")}"
                    ${absent ? "disabled" : ""}>
              ${optionsTachesOfficiers(membre.tache || "NA")}
            </select>
          </label>
        </div>
      </article>`;
  }

  function groupeTachesOfficiers(cle, titre, sousTitre) {
    const membres = donneesTachesOfficiers && donneesTachesOfficiers.groupes &&
      Array.isArray(donneesTachesOfficiers.groupes[cle])
      ? donneesTachesOfficiers.groupes[cle]
      : [];
    return `
      <section class="taches-officiers-groupe taches-officiers-groupe-${echapperTachesOfficiers(cle)}">
        <header>
          <div>
            <h4>${echapperTachesOfficiers(titre)}</h4>
            <p>${echapperTachesOfficiers(sousTitre)}</p>
          </div>
          <span>${membres.length}</span>
        </header>
        <div class="taches-officiers-liste">
          ${membres.length
            ? membres.map(ligneTachesOfficiers).join("")
            : '<p class="taches-officiers-vide">Aucune personne dans cette catégorie.</p>'}
        </div>
      </section>`;
  }

  function panneauEditionTachesOfficiers() {
    if (!donneesTachesOfficiers?.peutModifierListe) return "";
    const options = Array.isArray(donneesTachesOfficiers.options) ? donneesTachesOfficiers.options : [];
    return `
      <section id="editionListeTachesOfficiers" class="taches-officiers-edition" hidden>
        <header>
          <div>
            <span class="taches-officiers-kicker">Liste personnalisée</span>
            <h4>Modifier la liste des tâches</h4>
            <p>Ajoutez un nouveau choix ou supprimez une tâche qui n’est plus utilisée.</p>
          </div>
          <button id="fermerEditionTachesOfficiers" class="taches-officiers-fermer" type="button" aria-label="Fermer">×</button>
        </header>
        <form id="ajouterOptionTacheOfficier" class="taches-officiers-ajout">
          <label for="nouveauLibelleTacheOfficier">Nom de la nouvelle tâche</label>
          <div>
            <input id="nouveauLibelleTacheOfficier" name="libelle" maxlength="100" required
                   placeholder="Ex. Gestion des entraînements">
            <button type="submit">＋ Ajouter</button>
          </div>
        </form>
        <div class="taches-officiers-options-edition">
          ${options.length ? options.map(function(option) {
            return `<article>
              <span>${echapperTachesOfficiers(option.libelle)}</span>
              <button type="button" class="supprimer-option-tache-officier"
                      data-code="${echapperTachesOfficiers(option.code)}"
                      data-libelle="${echapperTachesOfficiers(option.libelle)}">Supprimer</button>
            </article>`;
          }).join("") : '<p class="taches-officiers-vide">Aucune tâche personnalisée.</p>'}
        </div>
      </section>`;
  }

  function afficherTachesOfficiers() {
    const espace = document.getElementById("workspace");
    if (!espace || !donneesTachesOfficiers) return;
    espace.innerHTML = `
      <section id="tachesOfficiersModule" class="taches-officiers-module">
        <header class="taches-officiers-entete">
          <div>
            <span class="taches-officiers-kicker">Organisation manuelle</span>
            <h3>♟️ Tâches officiers</h3>
            <p>Les affectations restent actives jusqu’à ce qu’un responsable les modifie.</p>
          </div>
          <div class="taches-officiers-semaine">
            <span>Mise à jour</span>
            <strong>Uniquement manuelle</strong>
            <div class="taches-officiers-actions">
              ${donneesTachesOfficiers.peutModifierListe
                ? '<button id="modifierListeTachesOfficiers" class="taches-officiers-modifier-liste" type="button">✎ Modifier la liste</button>'
                : ""}
              <button id="copierMessageDiscordTachesOfficiers" class="taches-officiers-message-discord" type="button">💬 Message Discord</button>
              <button id="actualiserTachesOfficiers" type="button">↻ Actualiser</button>
            </div>
          </div>
        </header>
        ${panneauEditionTachesOfficiers()}
        <div class="taches-officiers-groupes">
          ${GROUPES_TACHES_OFFICIERS.map(function(groupe) {
            return groupeTachesOfficiers(groupe[0], groupe[1], groupe[2]);
          }).join("")}
        </div>
      </section>`;

    const boutonActualiser = document.getElementById("actualiserTachesOfficiers");
    if (boutonActualiser) boutonActualiser.addEventListener("click", function() {
      chargerTachesOfficiers(true);
    });
    document.getElementById("copierMessageDiscordTachesOfficiers")?.addEventListener("click", copierMessageDiscord);
    document.getElementById("modifierListeTachesOfficiers")?.addEventListener("click", function() {
      const panneau = document.getElementById("editionListeTachesOfficiers");
      if (panneau) panneau.hidden = false;
    });
    document.getElementById("fermerEditionTachesOfficiers")?.addEventListener("click", function() {
      const panneau = document.getElementById("editionListeTachesOfficiers");
      if (panneau) panneau.hidden = true;
    });
    document.getElementById("ajouterOptionTacheOfficier")?.addEventListener("submit", ajouterOptionTacheOfficier);
    espace.querySelectorAll(".supprimer-option-tache-officier").forEach(function(bouton) {
      bouton.addEventListener("click", supprimerOptionTacheOfficier);
    });
    espace.querySelectorAll(".taches-officiers-select").forEach(function(selecteur) {
      selecteur.addEventListener("change", enregistrerTacheOfficier);
    });
  }

  async function chargerTachesOfficiers(forcer) {
    if (chargementTachesOfficiers) return;
    chargementTachesOfficiers = true;
    const espace = document.getElementById("workspace");
    if (!donneesTachesOfficiers && espace) {
      espace.innerHTML = '<section class="taches-officiers-chargement">Chargement des tâches officiers…</section>';
    }
    try {
      if (forcer && typeof window.gdaForcerActualisation === "function") {
        window.gdaForcerActualisation("recupererTachesOfficiers");
      }
      const reponse = await fetch(
        API_TACHES_OFFICIERS + "?action=recupererTachesOfficiers" + (forcer ? "&_=" + Date.now() : ""),
        { cache: "no-store" }
      );
      const resultat = await reponse.json();
      if (!reponse.ok || !resultat.success) {
        throw new Error(resultat.message || "Impossible de charger les tâches officiers.");
      }
      donneesTachesOfficiers = resultat;
      afficherTachesOfficiers();
    } catch (erreur) {
      if (espace) {
        espace.innerHTML = `<section class="taches-officiers-erreur">
          <strong>Chargement impossible</strong>
          <p>${echapperTachesOfficiers(erreur.message)}</p>
          <button type="button" id="reessayerTachesOfficiers">Réessayer</button>
        </section>`;
        document.getElementById("reessayerTachesOfficiers")?.addEventListener("click", function() {
          chargerTachesOfficiers(true);
        });
      }
    } finally {
      chargementTachesOfficiers = false;
    }
  }

  async function envoyerModificationListeTachesOfficiers(action, valeurs) {
    const donnees = new URLSearchParams(Object.assign({ action: action }, valeurs || {}));
    const reponse = await fetch(API_TACHES_OFFICIERS + "?action=" + encodeURIComponent(action), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: donnees.toString(),
      cache: "no-store"
    });
    const resultat = await reponse.json();
    if (!reponse.ok || !resultat.success) {
      throw new Error(resultat.message || "Impossible de modifier la liste des tâches.");
    }
    donneesTachesOfficiers = resultat;
    afficherTachesOfficiers();
    const panneau = document.getElementById("editionListeTachesOfficiers");
    if (panneau) panneau.hidden = false;
    if (typeof afficherNotificationGDA === "function") {
      afficherNotificationGDA(resultat.message || "Liste des tâches mise à jour.", "succes");
    }
  }

  async function ajouterOptionTacheOfficier(evenement) {
    evenement.preventDefault();
    const formulaire = evenement.currentTarget;
    const bouton = formulaire.querySelector('button[type="submit"]');
    const champ = formulaire.querySelector('[name="libelle"]');
    if (bouton) bouton.disabled = true;
    try {
      await envoyerModificationListeTachesOfficiers("ajouterOptionTacheOfficier", {
        libelle: champ?.value || ""
      });
    } catch (erreur) {
      if (bouton) bouton.disabled = false;
      if (typeof afficherNotificationGDA === "function") {
        afficherNotificationGDA(erreur.message || "Ajout impossible.", "erreur");
      }
    }
  }

  async function supprimerOptionTacheOfficier(evenement) {
    const bouton = evenement.currentTarget;
    const libelle = bouton.dataset.libelle || "cette tâche";
    if (!window.confirm('Supprimer « ' + libelle + ' » de la liste ?')) return;
    bouton.disabled = true;
    try {
      await envoyerModificationListeTachesOfficiers("supprimerOptionTacheOfficier", {
        tache: bouton.dataset.code || ""
      });
    } catch (erreur) {
      bouton.disabled = false;
      if (typeof afficherNotificationGDA === "function") {
        afficherNotificationGDA(erreur.message || "Suppression impossible.", "erreur");
      }
    }
  }

  async function enregistrerTacheOfficier(evenement) {
    const selecteur = evenement.currentTarget;
    const valeurPrecedente = selecteur.dataset.valeurInitiale || "NA";
    selecteur.disabled = true;
    try {
      const donnees = new URLSearchParams({
        action: "enregistrerTacheOfficier",
        memberId: selecteur.dataset.memberId || "",
        tache: selecteur.value
      });
      const reponse = await fetch(API_TACHES_OFFICIERS + "?action=enregistrerTacheOfficier", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: donnees.toString(),
        cache: "no-store"
      });
      const resultat = await reponse.json();
      if (!reponse.ok || !resultat.success) {
        throw new Error(resultat.message || "Impossible d’enregistrer cette tâche.");
      }
      donneesTachesOfficiers = resultat;
      afficherTachesOfficiers();
      if (typeof afficherNotificationGDA === "function") {
        afficherNotificationGDA(resultat.message || "Tâche enregistrée.", "succes");
      }
    } catch (erreur) {
      selecteur.value = valeurPrecedente;
      selecteur.disabled = false;
      if (typeof afficherNotificationGDA === "function") {
        afficherNotificationGDA(erreur.message, "erreur");
      }
    }
  }

  window.ouvrirTachesOfficiersGDA = function() {
    if (typeof definirModuleGdaActif === "function") {
      definirModuleGdaActif("taches-officiers");
    }
    chargerTachesOfficiers(true);
  };
  window.chargerTachesOfficiersGDA = chargerTachesOfficiers;
})();
