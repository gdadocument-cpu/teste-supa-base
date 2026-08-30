/**
 * Synchronisation autonome de la feuille "Effectif Global".
 *
 * La feuille cible n'est jamais supprimée : son identifiant interne (gid)
 * reste stable et les formules des autres feuilles continuent à la reconnaître.
 */

const SYNC_EFFECTIF_SOURCE_ID = '12h0cadcFTQpoSmT1gKAt5mLONu8eEdhlDATbwyVTUyA';
const SYNC_EFFECTIF_CIBLE_ID = '1IfPHHVFWeXva00F8innTY6a2wq8fj_PCwY2x2cljvj0';
const SYNC_EFFECTIF_NOM_FEUILLE = 'Effectif Global';

/**
 * Fonction à associer au déclencheur automatique toutes les deux heures.
 */
function synchroniserEffectifGlobal(verrouDejaPris) {
  const verrou = LockService.getScriptLock();
  if (!verrouDejaPris) verrou.waitLock(30000);

  try {
    const classeurSource = SpreadsheetApp.openById(SYNC_EFFECTIF_SOURCE_ID);
    const classeurCible = SpreadsheetApp.openById(SYNC_EFFECTIF_CIBLE_ID);
    const feuilleSource = classeurSource.getSheetByName(SYNC_EFFECTIF_NOM_FEUILLE);

    if (!feuilleSource) {
      throw new Error(
        'La feuille source « ' + SYNC_EFFECTIF_NOM_FEUILLE + ' » est introuvable.'
      );
    }

    const feuilleCible = classeurCible.getSheetByName(SYNC_EFFECTIF_NOM_FEUILLE);
    const nomTemporaire =
      '__SYNC_EFFECTIF_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);

    // Une feuille temporaire permet d'utiliser copyTo entre deux plages du
    // même classeur, sans jamais supprimer la feuille cible.
    const feuilleTemporaire = feuilleSource.copyTo(classeurCible);
    feuilleTemporaire.setName(nomTemporaire);

    try {
      if (!feuilleCible) {
        feuilleTemporaire.setName(SYNC_EFFECTIF_NOM_FEUILLE);
      } else {
        copierFeuilleEffectifSansLaRemplacer_(feuilleTemporaire, feuilleCible);
      }
    } finally {
      // Lors d'une première installation, la feuille temporaire est devenue
      // la feuille cible et ne doit évidemment pas être supprimée.
      if (feuilleTemporaire.getName() === nomTemporaire) {
        classeurCible.deleteSheet(feuilleTemporaire);
      }
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      message: 'La feuille Effectif Global a été synchronisée sans changer son gid.',
      date: Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone() || 'Europe/Paris',
        'dd/MM/yyyy HH:mm:ss'
      )
    };
  } finally {
    if (!verrouDejaPris) verrou.releaseLock();
  }
}

/**
 * Remplace le contenu et la présentation en conservant la feuille cible.
 */
function copierFeuilleEffectifSansLaRemplacer_(source, cible) {
  const lignes = source.getMaxRows();
  const colonnes = source.getMaxColumns();

  ajusterDimensionsFeuilleEffectif_(cible, lignes, colonnes);

  const filtreCible = cible.getFilter();
  if (filtreCible) filtreCible.remove();

  const plageCibleComplete = cible.getRange(1, 1, lignes, colonnes);
  plageCibleComplete.breakApart();
  cible.clear();
  cible.clearConditionalFormatRules();

  // Valeurs, formules, formats, validations et notes.
  source.getRange(1, 1, lignes, colonnes).copyTo(plageCibleComplete);

  // Lorsqu'une feuille est copiée dans un autre classeur, Google remplace
  // automatiquement les références internes à "Effectif Global" par le nom
  // de la feuille temporaire (__SYNC_EFFECTIF_xxx). On restaure immédiatement
  // le nom définitif avant que cette feuille temporaire soit supprimée.
  restaurerReferencesEffectifGlobal_(
    cible,
    source.getName(),
    SYNC_EFFECTIF_NOM_FEUILLE,
    lignes,
    colonnes
  );

  // Les fusions sont reproduites explicitement.
  source.getRange(1, 1, lignes, colonnes).getMergedRanges()
    .forEach(function (plage) {
      cible.getRange(
        plage.getRow(),
        plage.getColumn(),
        plage.getNumRows(),
        plage.getNumColumns()
      ).merge();
    });

  // Largeur des colonnes et hauteur des lignes utilisées.
  for (let colonne = 1; colonne <= colonnes; colonne++) {
    cible.setColumnWidth(colonne, source.getColumnWidth(colonne));
  }
  copierHauteursLignesEffectif_(source, cible, lignes);

  cible.setFrozenRows(source.getFrozenRows());
  cible.setFrozenColumns(source.getFrozenColumns());
  cible.setTabColor(source.getTabColor());

  const filtreSource = source.getFilter();
  if (filtreSource) {
    const plage = filtreSource.getRange();
    cible.getRange(
      plage.getRow(),
      plage.getColumn(),
      plage.getNumRows(),
      plage.getNumColumns()
    ).createFilter();
  }
}

/**
 * Corrige les formules que Google Sheets a automatiquement redirigées vers
 * la feuille temporaire lors du copyTo().
 *
 * Exemple :
 *   =NB.SI('__SYNC_EFFECTIF_ab12cd34'!B:B;"SO")
 * redevient :
 *   =NB.SI('Effectif Global'!B:B;"SO")
 */
function restaurerReferencesEffectifGlobal_(
  feuille,
  nomTemporaire,
  nomDefinitif,
  nombreLignes,
  nombreColonnes
) {
  if (!nomTemporaire || nomTemporaire === nomDefinitif) return;

  const plage = feuille.getRange(1, 1, nombreLignes, nombreColonnes);
  const formules = plage.getFormulas();
  const referenceTemporaireAvecQuotes = "'" + nomTemporaire + "'!";
  const referenceTemporaireSansQuotes = nomTemporaire + '!';
  const referenceDefinitive = "'" + nomDefinitif + "'!";

  for (let ligne = 0; ligne < formules.length; ligne++) {
    for (let colonne = 0; colonne < formules[ligne].length; colonne++) {
      const formule = formules[ligne][colonne];
      if (!formule) continue;

      const formuleCorrigee = formule
        .split(referenceTemporaireAvecQuotes)
        .join(referenceDefinitive)
        .split(referenceTemporaireSansQuotes)
        .join(referenceDefinitive);

      if (formuleCorrigee !== formule) {
        feuille
          .getRange(ligne + 1, colonne + 1)
          .setFormula(formuleCorrigee);
      }
    }
  }
}

/**
 * Copie les hauteurs en regroupant les lignes consécutives de même taille.
 * Google Apps Script ne fournit pas de méthode getDefaultRowHeight().
 */
function copierHauteursLignesEffectif_(source, cible, nombreLignes) {
  if (nombreLignes < 1) return;

  let debutGroupe = 1;
  let hauteurGroupe = source.getRowHeight(1);

  for (let ligne = 2; ligne <= nombreLignes; ligne++) {
    const hauteur = source.getRowHeight(ligne);
    if (hauteur === hauteurGroupe) continue;

    cible.setRowHeights(
      debutGroupe,
      ligne - debutGroupe,
      hauteurGroupe
    );
    debutGroupe = ligne;
    hauteurGroupe = hauteur;
  }

  cible.setRowHeights(
    debutGroupe,
    nombreLignes - debutGroupe + 1,
    hauteurGroupe
  );
}

function ajusterDimensionsFeuilleEffectif_(feuille, lignes, colonnes) {
  const lignesActuelles = feuille.getMaxRows();
  const colonnesActuelles = feuille.getMaxColumns();

  if (lignesActuelles < lignes) {
    feuille.insertRowsAfter(lignesActuelles, lignes - lignesActuelles);
  } else if (lignesActuelles > lignes) {
    feuille.deleteRows(lignes + 1, lignesActuelles - lignes);
  }

  if (colonnesActuelles < colonnes) {
    feuille.insertColumnsAfter(colonnesActuelles, colonnes - colonnesActuelles);
  } else if (colonnesActuelles > colonnes) {
    feuille.deleteColumns(colonnes + 1, colonnesActuelles - colonnes);
  }
}

