(function initialiserTachesOfficiersGDA() {
  "use strict";

  const API_TACHES_OFFICIERS = API_URL;
  const OPTIONS_TACHES_OFFICIERS = [
    ["NA", "N/A"],
    ["GESTION_RAPPORT", "Gestion Rapport"],
    ["RECO_MISSION_GDA_OBSERVATION_HDR", "Reco Mission / Reco GDA / Observation HDR"],
    ["GESTION_DEMANDE_ENTRAINEMENT", "Gestion demande d’entraînement"],
    ["OBSERVATION_EZ", "Observation EZ"],
    ["GESTION_ABSENCES", "Gestion des absences"],
    ["GESTION_DOCUMENTS_GDA", "Gestion bon fonctionnement des documents GDA"]
  ];
  const GROUPES_TACHES_OFFICIERS = [
    ["officiersSuperieurs", "Officiers supérieurs", "Commandement supérieur"],
    ["officiers", "Officiers", "Corps des officiers"],
    ["gerantsSpecialisation", "Gérants de spécialisation", "Responsables INST et MDC"]
  ];
  const LIBELLES_MESSAGE_DISCORD = {
    NA: "N/A",
    GESTION_RAPPORT: "Gestion des rapports",
    RECO_MISSION_GDA_OBSERVATION_HDR: "Reco Mission / Reco GDA / Observation HDR",
    GESTION_DEMANDE_ENTRAINEMENT: "Gestion des demandes d’entraînement",
    OBSERVATION_EZ: "Observation EZ",
    GESTION_ABSENCES: "Gestion des absences",
    GESTION_DOCUMENTS_GDA: "Gestion du bon fonctionnement des documents GDA"
  };
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

  function formaterSemaineTachesOfficiers(semaine) {
    const date = new Date(String(semaine || "") + "T12:00:00Z");
    if (Number.isNaN(date.getTime())) return "Semaine en cours";
    const fin = new Date(date.getTime());
    fin.setUTCDate(fin.getUTCDate() + 6);
    const format = new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });
    return "Du " + format.format(date) + " au " + format.format(fin);
  }

  function optionsTachesOfficiers(selection) {
    return OPTIONS_TACHES_OFFICIERS.map(function(option) {
      return '<option value="' + option[0] + '"' +
        (option[0] === selection ? " selected" : "") + ">" +
        echapperTachesOfficiers(option[1]) + "</option>";
    }).join("");
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
      : LIBELLES_MESSAGE_DISCORD[membre.tache || "NA"] || "N/A";
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
      "# Roulement des taches semestrielle",
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

  function afficherTachesOfficiers() {
    const espace = document.getElementById("workspace");
    if (!espace || !donneesTachesOfficiers) return;
    espace.innerHTML = `
      <section id="tachesOfficiersModule" class="taches-officiers-module">
        <header class="taches-officiers-entete">
          <div>
            <span class="taches-officiers-kicker">Organisation hebdomadaire</span>
            <h3>♟️ Tâches officiers</h3>
            <p>Attribuez les responsabilités de la semaine aux officiers disponibles.</p>
          </div>
          <div class="taches-officiers-semaine">
            <span>Semaine actuelle</span>
            <strong>${echapperTachesOfficiers(formaterSemaineTachesOfficiers(donneesTachesOfficiers.semaine))}</strong>
            <div class="taches-officiers-actions">
              <button id="copierMessageDiscordTachesOfficiers" class="taches-officiers-message-discord" type="button">💬 Message Discord</button>
              <button id="actualiserTachesOfficiers" type="button">↻ Actualiser</button>
            </div>
          </div>
        </header>
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
