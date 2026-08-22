(function initialiserRoadmapOfficiersGDA() {
  "use strict";

  const API_ROADMAP = API_URL;
  const LARGEUR_MINIMALE_TABLEAU = 1280;
  const HAUTEUR_MINIMALE_TABLEAU = 720;
  let donneesRoadmap = null;
  let chargementRoadmap = false;
  let interactionRoadmap = false;
  let canalRoadmap = null;
  let carteEditee = null;

  function echapperRoadmap(valeur) {
    return String(valeur == null ? "" : valeur)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function notifierRoadmap(message, type) {
    if (typeof afficherNotificationGDA === "function") {
      afficherNotificationGDA(message, type || "succes");
    }
  }

  function iconeRoadmap(code, classe) {
    if (typeof window.iconeGDA === "function") return window.iconeGDA(code, classe || "");
    return '<span class="roadmap-icone-secours" aria-hidden="true">◆</span>';
  }

  function couleurIconeRoadmap(code) {
    return window.GDA_ICONES?.parCode?.[code]?.couleur || "bleu";
  }

  function formaterDateRoadmap(date) {
    if (!date) return "";
    const valeur = new Date(String(date) + "T12:00:00Z");
    if (Number.isNaN(valeur.getTime())) return String(date);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit", month: "long", year: "numeric", timeZone: "UTC"
    }).format(valeur);
  }

  function hauteurTableauRoadmap() {
    const cartes = Array.isArray(donneesRoadmap?.cartes) ? donneesRoadmap.cartes : [];
    return Math.max(
      HAUTEUR_MINIMALE_TABLEAU,
      ...cartes.map(function(carte) {
        return Number(carte.y || 0) + Number(carte.hauteur || 220) + 100;
      })
    );
  }

  function carteRoadmapHTML(carte) {
    const couleur = couleurIconeRoadmap(carte.icone);
    const peutModifier = donneesRoadmap?.peutModifier === true;
    return `
      <article class="roadmap-carte roadmap-couleur-${echapperRoadmap(couleur)}"
               data-carte-id="${Number(carte.id)}"
               style="left:${Number(carte.x || 0)}px;top:${Number(carte.y || 0)}px;width:${Number(carte.largeur || 300)}px;height:${Number(carte.hauteur || 220)}px;z-index:${Number(carte.niveau || 1)}">
        <header class="roadmap-carte-poignee" ${peutModifier ? 'title="Maintenez pour déplacer la carte"' : ""}>
          ${iconeRoadmap(carte.icone, "roadmap-carte-icone")}
          <strong>${echapperRoadmap(carte.titre)}</strong>
          ${peutModifier ? `<button class="roadmap-carte-editer" type="button" data-action="editer" title="Modifier la carte" aria-label="Modifier ${echapperRoadmap(carte.titre)}">✎</button>` : ""}
        </header>
        <div class="roadmap-carte-contenu">
          ${carte.date ? `<time datetime="${echapperRoadmap(carte.date)}">📅 ${echapperRoadmap(formaterDateRoadmap(carte.date))}</time>` : ""}
          <p>${echapperRoadmap(carte.texte || "Aucun détail.")}</p>
        </div>
        <footer>
          <small>Par ${echapperRoadmap(carte.auteur || "Officier supérieur")}</small>
          <div class="roadmap-carte-actions">
            ${peutModifier ? `<button class="roadmap-publication${carte.publiee ? " est-publiee" : ""}" type="button"
                    data-action="publication" title="${carte.publiee ? "Retirer des annonces" : "Publier dans les annonces"}">
              ${carte.publiee ? "📣 Publiée" : "📣 Publier"}
            </button>` : ""}
            <div class="roadmap-votes" aria-label="Votes">
              <button class="roadmap-vote roadmap-vote-pour${carte.monVote === "UP" ? " est-actif" : ""}" type="button"
                      data-action="voter" data-vote="UP" ${peutModifier ? "" : "disabled"}
                      aria-label="Voter pour" aria-pressed="${carte.monVote === "UP" ? "true" : "false"}">
                👍 <span>${Number(carte.votesPour || 0)}</span>
              </button>
              <button class="roadmap-vote roadmap-vote-contre${carte.monVote === "DOWN" ? " est-actif" : ""}" type="button"
                      data-action="voter" data-vote="DOWN" ${peutModifier ? "" : "disabled"}
                      aria-label="Voter contre" aria-pressed="${carte.monVote === "DOWN" ? "true" : "false"}">
                👎 <span>${Number(carte.votesContre || 0)}</span>
              </button>
            </div>
          </div>
        </footer>
        ${peutModifier ? '<span class="roadmap-redimensionner" role="button" tabindex="0" aria-label="Redimensionner la carte"></span>' : ""}
      </article>`;
  }

  function optionsIconesRoadmap(selection) {
    const groupes = Array.isArray(window.GDA_ICONES?.groupes) ? window.GDA_ICONES.groupes : [];
    return groupes.map(function(groupe) {
      return `
        <section class="roadmap-icones-groupe">
          <h5>${echapperRoadmap(groupe[0])}</h5>
          <div>
            ${groupe[1].map(function(icone) {
              const code = icone[0];
              return `<button class="roadmap-icone-option${code === selection ? " est-selectionnee" : ""}"
                              type="button" data-icone="${echapperRoadmap(code)}"
                              title="${echapperRoadmap(icone[1])}">
                        ${iconeRoadmap(code, "roadmap-option-icone")}
                        <span>${echapperRoadmap(icone[1])}</span>
                      </button>`;
            }).join("")}
          </div>
        </section>`;
    }).join("");
  }

  function dialogueRoadmapHTML() {
    return `
      <dialog id="roadmapDialogue" class="roadmap-dialogue">
        <form id="roadmapFormulaire" method="dialog">
          <header>
            <div>
              <span>Carte dynamique</span>
              <h4 id="roadmapDialogueTitre">Nouvelle carte</h4>
            </div>
            <button type="button" id="roadmapFermerDialogue" aria-label="Fermer">×</button>
          </header>
          <label>
            <span>Titre</span>
            <input id="roadmapTitre" type="text" maxlength="120" required>
          </label>
          <label>
            <span>Date prévue</span>
            <input id="roadmapDate" type="date">
          </label>
          <label class="roadmap-dialogue-large">
            <span>Texte</span>
            <textarea id="roadmapTexte" maxlength="3000" rows="7" placeholder="Décrivez l’idée, l’objectif ou l’étape à réaliser…"></textarea>
          </label>
          <fieldset class="roadmap-dialogue-large">
            <legend>Icône</legend>
            <input id="roadmapIcone" type="hidden" value="objective">
            <div id="roadmapIconeApercu" class="roadmap-icone-apercu"></div>
            <div id="roadmapIcones" class="roadmap-icones">${optionsIconesRoadmap("objective")}</div>
          </fieldset>
          <footer class="roadmap-dialogue-large">
            <button id="roadmapSupprimer" class="roadmap-supprimer" type="button" hidden>Supprimer</button>
            <span></span>
            <button id="roadmapAnnuler" type="button">Annuler</button>
            <button id="roadmapEnregistrer" class="roadmap-enregistrer" type="submit">Enregistrer</button>
          </footer>
        </form>
      </dialog>`;
  }

  function afficherRoadmapOfficiers() {
    const espace = document.getElementById("workspace");
    if (!espace || !donneesRoadmap || (typeof moduleGdaEstActif === "function" && !moduleGdaEstActif("roadmap-officiers"))) return;
    const cartes = Array.isArray(donneesRoadmap.cartes) ? donneesRoadmap.cartes : [];
    espace.innerHTML = `
      <section id="roadmapOfficiersModule" class="roadmap-module">
        <header class="roadmap-entete">
          <div>
            <span class="roadmap-kicker">Planification collaborative</span>
            <h3>🗺️ Roadmap</h3>
            <p>Déplacez, redimensionnez et faites voter les prochaines idées du commandement.</p>
          </div>
          <div class="roadmap-entete-actions">
            <button id="roadmapActualiser" type="button">↻ Actualiser</button>
            ${donneesRoadmap.peutModifier ? '<button id="roadmapAjouter" class="roadmap-ajouter" type="button" title="Ajouter une carte" aria-label="Ajouter une carte">+</button>' : ""}
          </div>
        </header>
        <div class="roadmap-legende">
          <span>⠿ Déplacement par l’en-tête</span>
          <span>◢ Redimensionnement par le coin</span>
          <span>👍 / 👎 Un seul choix de vote par personne</span>
          <span>📣 Une carte publiée devient visible et votable sur l’accueil</span>
        </div>
        <div class="roadmap-tableau-defilement">
          <div id="roadmapTableau" class="roadmap-tableau" style="min-width:${LARGEUR_MINIMALE_TABLEAU}px;height:${hauteurTableauRoadmap()}px">
            ${cartes.length ? cartes.map(carteRoadmapHTML).join("") : `
              <div class="roadmap-vide">
                ${iconeRoadmap("objective", "roadmap-vide-icone")}
                <strong>La Roadmap est vide</strong>
                <p>Utilisez le bouton + pour poser la première idée.</p>
              </div>`}
          </div>
        </div>
        ${donneesRoadmap.peutModifier ? dialogueRoadmapHTML() : ""}
      </section>`;

    document.getElementById("roadmapActualiser")?.addEventListener("click", function() {
      chargerRoadmapOfficiers(true);
    });
    document.getElementById("roadmapAjouter")?.addEventListener("click", function() {
      ouvrirDialogueRoadmap(null);
    });
    espace.querySelectorAll("[data-action='editer']").forEach(function(bouton) {
      bouton.addEventListener("click", function(evenement) {
        evenement.stopPropagation();
        const carte = trouverCarteRoadmap(bouton.closest(".roadmap-carte")?.dataset.carteId);
        if (carte) ouvrirDialogueRoadmap(carte);
      });
    });
    espace.querySelectorAll("[data-action='voter']").forEach(function(bouton) {
      bouton.addEventListener("click", function() {
        const id = bouton.closest(".roadmap-carte")?.dataset.carteId;
        envoyerMutationRoadmap("voterCarteRoadmapOfficiers", { carteId: id, vote: bouton.dataset.vote }, bouton, false, true);
      });
    });
    espace.querySelectorAll("[data-action='publication']").forEach(function(bouton) {
      bouton.addEventListener("click", function() {
        const carte = trouverCarteRoadmap(bouton.closest(".roadmap-carte")?.dataset.carteId);
        if (!carte) return;
        const action = carte.publiee ? "retirerCarteRoadmapAnnonce" : "publierCarteRoadmapOfficiers";
        const question = carte.publiee
          ? "Retirer cette proposition des annonces ? Les votes déjà reçus seront conservés."
          : "Publier cette proposition dans les annonces afin que tous les GDA puissent voter ?";
        if (window.confirm(question)) envoyerMutationRoadmap(action, { carteId: carte.id }, bouton);
      });
    });
    if (donneesRoadmap.peutModifier) {
      initialiserDialogueRoadmap();
      initialiserInteractionsRoadmap();
    }
  }

  function trouverCarteRoadmap(id) {
    return (donneesRoadmap?.cartes || []).find(function(carte) {
      return Number(carte.id) === Number(id);
    }) || null;
  }

  function selectionnerIconeRoadmap(code) {
    const champ = document.getElementById("roadmapIcone");
    if (champ) champ.value = code;
    document.querySelectorAll("#roadmapIcones [data-icone]").forEach(function(bouton) {
      bouton.classList.toggle("est-selectionnee", bouton.dataset.icone === code);
    });
    const apercu = document.getElementById("roadmapIconeApercu");
    const definition = window.GDA_ICONES?.parCode?.[code];
    if (apercu) {
      apercu.innerHTML = `${iconeRoadmap(code, "roadmap-apercu-icone")}<div><small>Icône sélectionnée</small><strong>${echapperRoadmap(definition?.libelle || code)}</strong></div>`;
    }
  }

  function ouvrirDialogueRoadmap(carte) {
    const dialogue = document.getElementById("roadmapDialogue");
    if (!dialogue) return;
    carteEditee = carte;
    document.getElementById("roadmapDialogueTitre").textContent = carte ? "Modifier la carte" : "Nouvelle carte";
    document.getElementById("roadmapTitre").value = carte?.titre || "";
    document.getElementById("roadmapDate").value = carte?.date || "";
    document.getElementById("roadmapTexte").value = carte?.texte || "";
    document.getElementById("roadmapSupprimer").hidden = !carte;
    selectionnerIconeRoadmap(carte?.icone || "objective");
    dialogue.showModal();
    document.getElementById("roadmapTitre").focus();
  }

  function fermerDialogueRoadmap() {
    document.getElementById("roadmapDialogue")?.close();
    carteEditee = null;
  }

  function initialiserDialogueRoadmap() {
    document.getElementById("roadmapFermerDialogue")?.addEventListener("click", fermerDialogueRoadmap);
    document.getElementById("roadmapAnnuler")?.addEventListener("click", fermerDialogueRoadmap);
    document.getElementById("roadmapIcones")?.addEventListener("click", function(evenement) {
      const bouton = evenement.target.closest("[data-icone]");
      if (bouton) selectionnerIconeRoadmap(bouton.dataset.icone);
    });
    document.getElementById("roadmapFormulaire")?.addEventListener("submit", function(evenement) {
      evenement.preventDefault();
      const donnees = {
        titre: document.getElementById("roadmapTitre").value.trim(),
        date: document.getElementById("roadmapDate").value,
        texte: document.getElementById("roadmapTexte").value.trim(),
        icone: document.getElementById("roadmapIcone").value
      };
      if (carteEditee) {
        donnees.carteId = carteEditee.id;
        envoyerMutationRoadmap("modifierCarteRoadmapOfficiers", donnees, document.getElementById("roadmapEnregistrer"), true);
      } else {
        const nombreCartes = (donneesRoadmap?.cartes || []).length;
        donnees.x = 28 + (nombreCartes % 4) * 34;
        donnees.y = 28 + (nombreCartes % 5) * 34;
        envoyerMutationRoadmap("creerCarteRoadmapOfficiers", donnees, document.getElementById("roadmapEnregistrer"), true);
      }
    });
    document.getElementById("roadmapSupprimer")?.addEventListener("click", function() {
      if (!carteEditee || !window.confirm(`Supprimer définitivement la carte « ${carteEditee.titre} » ?`)) return;
      envoyerMutationRoadmap("supprimerCarteRoadmapOfficiers", { carteId: carteEditee.id }, this, true);
    });
  }

  function initialiserInteractionsRoadmap() {
    document.querySelectorAll(".roadmap-carte").forEach(function(element) {
      const poignee = element.querySelector(".roadmap-carte-poignee");
      const redimensionner = element.querySelector(".roadmap-redimensionner");
      if (poignee) poignee.addEventListener("pointerdown", function(evenement) {
        if (evenement.target.closest("button")) return;
        demarrerInteractionRoadmap(evenement, element, false);
      });
      if (redimensionner) redimensionner.addEventListener("pointerdown", function(evenement) {
        demarrerInteractionRoadmap(evenement, element, true);
      });
    });
  }

  function demarrerInteractionRoadmap(evenement, element, redimensionnement) {
    if (evenement.button !== undefined && evenement.button !== 0) return;
    evenement.preventDefault();
    interactionRoadmap = true;
    const tableau = document.getElementById("roadmapTableau");
    const departX = evenement.clientX;
    const departY = evenement.clientY;
    const gauche = element.offsetLeft;
    const haut = element.offsetTop;
    const largeur = element.offsetWidth;
    const hauteur = element.offsetHeight;
    const niveau = Math.min(1000000, Math.max(1, ...(donneesRoadmap.cartes || []).map(c => Number(c.niveau || 1))) + 1);
    element.style.zIndex = niveau;
    element.classList.add(redimensionnement ? "est-redimensionnee" : "est-deplacee");
    evenement.currentTarget.setPointerCapture?.(evenement.pointerId);

    const deplacer = function(eventMove) {
      const dx = eventMove.clientX - departX;
      const dy = eventMove.clientY - departY;
      if (redimensionnement) {
        element.style.width = Math.max(220, Math.min(900, largeur + dx)) + "px";
        element.style.height = Math.max(170, Math.min(900, hauteur + dy)) + "px";
      } else {
        const maxX = Math.max(0, tableau.clientWidth - element.offsetWidth);
        const maxY = Math.max(0, tableau.clientHeight - element.offsetHeight);
        element.style.left = Math.max(0, Math.min(maxX, gauche + dx)) + "px";
        element.style.top = Math.max(0, Math.min(maxY, haut + dy)) + "px";
      }
    };
    const terminer = function() {
      window.removeEventListener("pointermove", deplacer);
      window.removeEventListener("pointerup", terminer);
      window.removeEventListener("pointercancel", terminer);
      element.classList.remove("est-redimensionnee", "est-deplacee");
      interactionRoadmap = false;
      envoyerMutationRoadmap("modifierCarteRoadmapOfficiers", {
        carteId: element.dataset.carteId,
        x: Math.round(parseFloat(element.style.left) || element.offsetLeft),
        y: Math.round(parseFloat(element.style.top) || element.offsetTop),
        largeur: element.offsetWidth,
        hauteur: element.offsetHeight,
        niveau: niveau
      }, null, false);
    };
    window.addEventListener("pointermove", deplacer);
    window.addEventListener("pointerup", terminer, { once: true });
    window.addEventListener("pointercancel", terminer, { once: true });
  }

  async function envoyerMutationRoadmap(action, champs, bouton, fermerApres, rechargerApres) {
    if (bouton) bouton.disabled = true;
    try {
      const donnees = new URLSearchParams({ action: action });
      Object.entries(champs || {}).forEach(function(entree) {
        donnees.set(entree[0], entree[1] == null ? "" : String(entree[1]));
      });
      const reponse = await fetch(API_ROADMAP + "?action=" + encodeURIComponent(action), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: donnees.toString(),
        cache: "no-store"
      });
      const resultat = await reponse.json();
      if (!reponse.ok || !resultat.success) throw new Error(resultat.message || "Modification de la Roadmap impossible.");
      if (rechargerApres) {
        await chargerRoadmapOfficiers(true, true);
      } else {
        donneesRoadmap = resultat;
      }
      if (fermerApres) fermerDialogueRoadmap();
      if (!rechargerApres) afficherRoadmapOfficiers();
      if (resultat.message) notifierRoadmap(resultat.message, "succes");
    } catch (erreur) {
      notifierRoadmap(erreur.message || "Modification de la Roadmap impossible.", "erreur");
      if (bouton) bouton.disabled = false;
    }
  }

  async function chargerRoadmapOfficiers(forcer, silencieux) {
    if (chargementRoadmap) return;
    chargementRoadmap = true;
    const espace = document.getElementById("workspace");
    if (!silencieux && !donneesRoadmap && espace) {
      espace.innerHTML = '<section class="roadmap-chargement">Chargement de la Roadmap…</section>';
    }
    try {
      if (forcer && typeof window.gdaForcerActualisation === "function") {
        window.gdaForcerActualisation("recupererRoadmapOfficiers");
      }
      const reponse = await fetch(API_ROADMAP + "?action=recupererRoadmapOfficiers" + (forcer ? "&_=" + Date.now() : ""), { cache: "no-store" });
      const resultat = await reponse.json();
      if (!reponse.ok || !resultat.success) throw new Error(resultat.message || "Roadmap indisponible.");
      donneesRoadmap = resultat;
      afficherRoadmapOfficiers();
    } catch (erreur) {
      if (!silencieux && espace) {
        espace.innerHTML = `<section class="roadmap-erreur"><strong>Roadmap indisponible</strong><p>${echapperRoadmap(erreur.message)}</p><button id="roadmapReessayer" type="button">Réessayer</button></section>`;
        document.getElementById("roadmapReessayer")?.addEventListener("click", function() { chargerRoadmapOfficiers(true); });
      }
    } finally {
      chargementRoadmap = false;
    }
  }

  function initialiserTempsReelRoadmap() {
    const client = window.gdaSupabase?.client;
    if (!client || canalRoadmap) return;
    canalRoadmap = client.channel("gda-roadmap-global", { config: { private: false } })
      .on("broadcast", { event: "roadmap-change" }, function() {
        const dialogueOuvert = document.getElementById("roadmapDialogue")?.open;
        if (interactionRoadmap || dialogueOuvert || (typeof moduleGdaEstActif === "function" && !moduleGdaEstActif("roadmap-officiers"))) return;
        window.setTimeout(function() { chargerRoadmapOfficiers(true, true); }, 250);
      })
      .subscribe();
  }

  window.ouvrirRoadmapOfficiersGDA = function() {
    if (typeof definirModuleGdaActif === "function") definirModuleGdaActif("roadmap-officiers");
    initialiserTempsReelRoadmap();
    chargerRoadmapOfficiers(true);
  };
  window.chargerRoadmapOfficiersGDA = chargerRoadmapOfficiers;
})();
