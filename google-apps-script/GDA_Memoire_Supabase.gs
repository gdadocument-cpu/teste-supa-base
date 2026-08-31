/**
 * Script allégé du document mémoire GDA.
 *
 * Fonctions conservées :
 * - réception Supabase -> Google Sheets ;
 * - copie vers le document Effectif Officiers ;
 * - envoi Google Form -> Supabase ;
 * - présentation, compteurs, tri et outils de réparation.
 *
 * L'ancien backend du site (OAuth, permissions et opérations métier) est
 * désormais assuré par Supabase et n'est volontairement plus présent ici.
 */

/**
 * Backend Google Apps Script de l'application GDA.
 * Compatible avec le Google Sheets existant.
 */

const CONFIG = Object.freeze({
  EFFECTIF: {
    SHEET: 'Effectif Global',
    START: 5,
    MATRICULE: 3,       // C
    GRADE: 4,           // D
    STEAM_ID: 5,        // E
    DISCORD_ID: 6,      // F
    PRESENCE: 7,        // G
    RAPPORTS: 8,        // H
    OBSERVATION: 9,     // I
    PROMO_RETRO: 10,    // J
    DATE_ENTREE: 11,    // K
    SANCTION: 12,       // L
    RECOMMANDATION: 13, // M
    NOTES: 14,          // N
    SPECIALISATION: 15, // O
    MEDAILLE: 16        // P
  },
  ABSENCES: {
    SHEET: 'Registre Absence',
    START: 2,
    MATRICULE: 1, // A
    GRADE: 2,     // B
    DATE_DEBUT: 3,// C
    DATE_FIN: 4,  // D
    RAISON: 5,    // E
    STATUT: 6,    // F
    AUTEUR: 7     // G
  },
  DEPARTS: {
    SHEET: 'Départ GDA',
    START: 2,
    MATRICULE: 2,    // B
    GRADE: 3,        // C
    TYPE: 4,         // D
    STEAM_ID: 5,     // E
    DISCORD_ID: 6,   // F
    DATE_DEBUT: 7,   // G
    DATE_FIN: 8,     // H
    RAISON: 9,       // I
    STATUT: 10,       // J (formule Actif/Inactif)
    AUTEUR: 11,      // K
    MEDAILLES: 12,   // L
    MEDAILLES_RESTAUREES_LE: 13 // M (restauration à usage unique)
  },
  RAPPORTS: {
    SHEET: 'Rapport GDA',
    START: 2,
    MATRICULE: 2,    // B
    DATE_RAPPORT: 3, // C
    GRADE: 4,        // D
    RAPPORT: 5,      // E
    COMMENTAIRE: 6,  // F
    CONCLUSION: 7,   // G
    ENVOYE_LE: 8     // H
  },
  LOGS: {
    SHEET: 'Logs',
    START: 2,
    DATE: 2,       // B
    PERSONNE: 3,   // C
    GRADE: 4,      // D
    TYPE: 5,       // E
    CHOIX: 6,      // F
    RAISON: 7,     // G
    AUTEUR: 8      // H
  },
  STOCKAGE: {
    SPREADSHEET_ID: '12h0cadcFTQpoSmT1gKAt5mLONu8eEdhlDATbwyVTUyA',
    RAPPORTS_SHEET: 'Suivi Rapports',
    RAPPORTS_HISTORIQUE_SHEET: 'Historique Rapports',
    JOURNAL_ACTIONS_SHEET: 'Journal Actions',
    DEMANDES_ABSENCES_SHEET: 'Demandes Absence',
    PARAMETRES_SHEET: 'Paramètres GDA',
    RAPPORTS_START: 2,
    RAPPORT_ID: 1,       // A
    RAPPORT_STATUT: 2,   // B
    RAPPORT_AUTEUR: 3,   // C
    RAPPORT_TRAITE_LE: 4,// D
    RAPPORT_MAJ_LE: 5,   // E
    RAPPORT_NOM: 6,      // F
    RAPPORT_GRADE: 7,    // G
    RAPPORT_DATE: 8,     // H
    RAPPORT_ENVOYE_LE: 9,// I
    ARCHIVES_INSTRUCTEUR_SHEET: 'Archives Instructeur',
    RAPPORTS_INSTRUCTEUR_SHEET: 'Rapports Instructeur',
    SUIVIS_FORMATION_SHEET: 'Suivis Formation',
    HISTORIQUE_GESTION_PERSONNEL_SHEET: 'Historique Gestion Personnel',
    LISTE_BLANCHE_SHEET: 'Liste Blanche',
    RECOMMANDATIONS_OBSERVATIONS_SHEET: 'Recommandations Observations'
  }
});

const LISTE_BLANCHE_GDA = Object.freeze({
  START: 2,
  ID: 1,
  IDENTIFIANT: 2,
  DISCORD_ID: 3,
  CREE_LE: 4,
  MODIFIE_LE: 5
});

const CLE_SOURCE_PRINCIPALE_ID = 'GDA_SOURCE_PRINCIPALE_ID';
const CLE_MODE_AUTONOME_MEMOIRE = 'GDA_MODE_AUTONOME_MEMOIRE';
const HISTORIQUE_GESTION_PERSONNEL = Object.freeze({
  START: 2,
  DATE: 1,
  PERSONNE: 2,
  GRADE: 3,
  TYPE: 4,
  CHOIX: 5,
  RAISON: 6,
  AUTEUR: 7
});
const FONCTION_SYNCHRONISATION_PRINCIPALE = 'synchroniserDocumentPrincipalGDA';
const FONCTION_SYNCHRONISATION_ARCHIVES_INSTRUCTEUR =
  'synchroniserArchivesInstructeurGDA';
const ARCHIVES_INSTRUCTEUR = Object.freeze({
  SOURCE_SPREADSHEET_ID: '1Q4TNAwivGMy1E6BNxxDZuV7o0OGPtQRWuqiAmlFTl58',
  SOURCE_SHEET: 'Archives',
  SOURCE_START: 2,
  START: 2,
  ID: 1,
  MATRICULE: 2,
  STEAM_ID: 3,
  DISCORD_ID: 4,
  RAPPORTS: 5,
  PRISES_SERVICE: 6,
  DATE_FIN: 7,
  INSTRUCTEUR: 8,
  GERANT: 9,
  COMMENTAIRE: 10,
  SANCTION: 11,
  RESULTAT: 12,
  RAISON: 13,
  IMPORTE_LE: 14,
  SOURCE: 15
});
const RAPPORTS_INSTRUCTEUR = Object.freeze({
  START: 2,
  ID: 1,
  CREE_LE: 2,
  AUTEUR: 3,
  TYPE: 4,
  DATE_EVENEMENT: 5,
  PERSONNE_FORMEE: 6,
  MATRICULE_DEFINITIF: 7,
  STEAM_ID: 8,
  DISCORD_ID: 9,
  NOTE: 10,
  RESULTAT: 11,
  REMARQUE: 12,
  COMMENTAIRE: 13,
  DOSSIER_ID: 14,
  ACTIF: 15
});
const SUIVIS_FORMATION = Object.freeze({
  SOURCE_SHEET: 'Suivis Forma',
  SOURCE_START: 2,
  START: 2,
  ID: 1,
  MATRICULE: 2,
  STEAM_ID: 3,
  DISCORD_ID: 4,
  RAPPORTS: 5,
  PRISES_SERVICE: 6,
  DATE_FIN: 7,
  INSTRUCTEUR: 8,
  GERANT: 9,
  COMMENTAIRE: 10,
  SANCTION: 11,
  STATUT: 12,
  CREE_LE: 13,
  MODIFIE_LE: 14,
  SOURCE: 15,
  ABSENCE_REGISTRE_COMPENSEE: 16,
  DERNIER_GEL_MANUEL: 17,
  GEL_MANUEL_EN_COURS: 18,
  DATE_FIN_INITIALE: 19,
  DATE_FIN_APRES_ABSENCE: 20
});

const SANCTIONS_SUIVI_FORMATION = Object.freeze({
  RIEN: 0,
  P1: 4,
  P2: 6
});

function normaliserSanctionSuiviFormation_(valeur) {
  const sanction = normaliser_(valeur);
  if (!sanction || sanction === 'RIEN' || sanction === 'AUCUNE SANCTION') {
    return 'Rien';
  }
  if (sanction === 'P1') return 'P1';
  if (sanction === 'P2') return 'P2';
  // Les anciennes sanctions libres sont considérées comme absentes afin de
  // ne pas bloquer la lecture et la migration des suivis déjà enregistrés.
  return 'Rien';
}

function validerSanctionSuiviFormation_(valeur) {
  const sanction = normaliser_(valeur);
  if (
    sanction &&
    sanction !== 'RIEN' &&
    sanction !== 'AUCUNE SANCTION' &&
    sanction !== 'P1' &&
    sanction !== 'P2'
  ) {
    throw new Error('Sanction invalide. Choisissez Rien, P1 ou P2.');
  }
  return normaliserSanctionSuiviFormation_(valeur);
}

function joursSanctionSuiviFormation_(valeur) {
  const sanction = normaliserSanctionSuiviFormation_(valeur);
  return SANCTIONS_SUIVI_FORMATION[sanction.toUpperCase()] || 0;
}

function dateFinSuiviAvecSanction_(dateInitiale, sanction) {
  return ajouterJoursCalendaires_(
    debutJour_(dateInitiale),
    joursSanctionSuiviFormation_(sanction)
  );
}
const DEMANDES_ABSENCES = Object.freeze({
  START: 2,
  ID: 1,
  CREE_LE: 2,
  MODIFIE_LE: 3,
  MATRICULE: 4,
  GRADE: 5,
  DATE_DEBUT: 6,
  DATE_FIN: 7,
  RAISON: 8,
  STATUT: 9,
  DECIDE_PAR: 10,
  DECIDE_LE: 11,
  MOTIF_REFUS: 12,
  LIGNE_REGISTRE: 13,
  NOTIFICATION_LUE: 14,
  NOTIFICATION_SUPPRIMEE: 15
});
const FEUILLES_DONNEES_GDA = Object.freeze([
  CONFIG.EFFECTIF.SHEET,
  CONFIG.ABSENCES.SHEET,
  CONFIG.DEPARTS.SHEET,
  CONFIG.RAPPORTS.SHEET,
  CONFIG.LOGS.SHEET
]);

const REFERENTIEL_GESTION = Object.freeze({
  grades: [
    'Lieutenant-Colonel', 'Commandant', 'Vice-Commandant', 'Capitaine',
    'Lieutenant', 'Sous-Lieutenant', 'Aspirant', 'Major', 'Adjudant-Chef',
    'Adjudant', 'Sergent-Chef', 'Sergent', 'Caporal-Chef', 'Caporal',
    'Ancien GDA'
  ],
  sanctions: [
    'Mise à pied',
    'Clean',
    'Averto',
    'Pénalité',
    'Blâme 1',
    'Blâme 2'
  ],
  dureesBlacklist: [
    '1 semaine', '2 semaines', '3 semaines', '1 mois',
    '2 mois', '3 mois', '6 mois', 'Permanent'
  ],
  medailles: [
    '🏅 | Croix de la Bravoure',
    '🏅 | Médaille du Mérite',
    "🏅 | Médaille de l'Activité",
    "🏅 | Médaille de l'Ancienneté",
    '🏅 | Médaille du Vétéran',
    '🏅 | Médaille de la Défense',
    '🏅 | Insigne Médecin',
    '🏅 | Insigne GSPR',
    '🏅 | Insigne Instructeur',
    '⚜️ | Ancien Gérant'
  ],
  specialisations: [
    'Gérant GDA',
    'CO-Gérant GDA',
    'Responsable MDC',
    'CO-Responsable MDC',
    'Responsable INST',
    'CO-Responsable INST',
    'Instructeur en chef',
    'Instructeur',
    'Médecin',
    'Instructeur et Médecin'
  ]
});

const PERMISSIONS_GDA = Object.freeze({
  EFFECTIF_MODIFIER: 'effectif_modifier',
  EFFECTIF_PUBLIC_ACTUALISER: 'effectif_public_actualiser',
  ABSENCES_GERER: 'absences_gerer',
  DISPONIBILITES_MODIFIER_SUPPRIMER: 'disponibilites_modifier_supprimer',
  DEPARTS_GERER: 'departs_gerer',
  PERSONNEL_HISTORIQUE_MODIFIER: 'personnel_historique_modifier',
  PERSONNEL_HISTORIQUE_SUPPRIMER: 'personnel_historique_supprimer',
  RAPPORTS_GERER: 'rapports_gerer',
  RAPPORTS_SUPPRIMER: 'rapports_supprimer',
  SUIVIS_DECIDER_TOUS: 'suivis_decider_tous',
  ADMINISTRATION_STAFF: 'administration_staff',
  ADMINISTRATION_PERMISSIONS: 'administration_permissions',
  ADMINISTRATION_LOGS: 'administration_logs',
  ROLE_VISITEUR: 'role_visiteur',
  ROLE_STAFF_TOTAL: 'role_staff_total'
});

const LIBELLES_PERMISSIONS_GDA = Object.freeze({
  effectif_modifier: 'Modifier l’effectif',
  effectif_public_actualiser: 'Forcer l’actualisation de l’effectif public',
  absences_gerer: 'Gérer les absences',
  disponibilites_modifier_supprimer: 'Modifier et supprimer dans les disponibilités du personnel',
  departs_gerer: 'Gérer les départs',
  personnel_historique_modifier: 'Modifier l’historique du personnel',
  personnel_historique_supprimer: 'Supprimer dans l’historique du personnel',
  rapports_gerer: 'Archiver les rapports',
  rapports_supprimer: 'Supprimer des rapports',
  suivis_decider_tous: 'Accepter ou refuser n’importe quel suivi de formation',
  administration_staff: 'Staff — accéder au menu Administration',
  administration_permissions: 'Administration — modifier les permissions',
  administration_logs: 'Administration — consulter les Logs',
  role_visiteur: 'Rôle Visiteur — consulter tous les espaces hors Administration, sans modification',
  role_staff_total: 'Rôle Staff — mêmes droits administratifs que le propriétaire'
});

const PROPRIETAIRE_GDA = 'MILO';
const CLE_PROPRIETAIRE_GDA = 'GDA_PROPRIETAIRE';
const CLE_COPROPRIETAIRES_GDA = 'GDA_COPROPRIETAIRES';
const CLE_EFFECTIF_PUBLIC_META = 'GDA_EFFECTIF_PUBLIC_META';
const PREFIXE_EFFECTIF_PUBLIC = 'GDA_EFFECTIF_PUBLIC_';
const TAILLE_BLOC_EFFECTIF_PUBLIC = 1800;
const CLE_REVISION_DONNEES_GDA = 'GDA_REVISION_DONNEES';
const CLE_DERNIERE_ACTION_DONNEES_GDA = 'GDA_DERNIERE_ACTION_DONNEES';
const CLE_DEFCON_NIVEAU_GDA = 'GDA_DEFCON_NIVEAU';
const CLE_DEFCON_MODIFIE_PAR_GDA = 'GDA_DEFCON_MODIFIE_PAR';
const CLE_DEFCON_MODIFIE_LE_GDA = 'GDA_DEFCON_MODIFIE_LE';
const DISCORD_OAUTH = Object.freeze({
  CLIENT_ID: '1527029681310929080',
  REDIRECT_URI: 'https://gdadocument-cpu.github.io/Intranet/oauth-callback.html',
  AUTHORIZE_URL: 'https://discord.com/oauth2/authorize',
  TOKEN_URL: 'https://discord.com/api/v10/oauth2/token',
  USER_URL: 'https://discord.com/api/v10/users/@me',
  SECRET_PROPERTY: 'DISCORD_CLIENT_SECRET',
  STATE_PREFIX: 'GDA_DISCORD_STATE_',
  RESULT_PREFIX: 'GDA_DISCORD_RESULT_',
  SESSION_PREFIX: 'GDA_DISCORD_SESSION_',
  REMEMBER_PREFIX: 'GDA_DISCORD_REMEMBER_',
  STATE_TTL_MS: 10 * 60 * 1000,
  SESSION_TTL_SECONDS: 6 * 60 * 60,
  REMEMBER_TTL_MS: 7 * 24 * 60 * 60 * 1000
});

function doGet() {
  return json_({
    success: true,
    service: 'GDA Google Sheets bridge',
    sourcePrincipale: 'Supabase'
  });
}

function doPost(e) {
  try {
    if (
      !e || !e.postData ||
      String(e.postData.type || '').toLowerCase().indexOf('application/json') === -1
    ) {
      throw new Error('Une requête JSON est obligatoire.');
    }
    const chargeUtile = JSON.parse(e.postData.contents || '{}');
    if (chargeUtile.action !== 'synchroniserGoogleSheetsDepuisSupabase') {
      throw new Error('Action non prise en charge.');
    }
    return json_(synchroniserGoogleSheetsDepuisSupabase_(chargeUtile));
  } catch (erreur) {
    console.error(erreur && erreur.stack ? erreur.stack : erreur);
    return json_({
      success: false,
      message: erreur && erreur.message ? erreur.message : 'Synchronisation invalide.'
    });
  }
}

function normaliserIdDiscord_(valeur) {
  const correspondance = String(valeur == null ? '' : valeur)
    .match(/\d{15,22}/);
  return correspondance ? correspondance[0] : '';
}

function retourAnticipe(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.ABSENCES_GERER);
  const c = CONFIG.ABSENCES;
  const ligne = ligneRequise_(p.ligne, c.START);
  return verrou_(function () {
    const feuille = feuille_(c.SHEET);
    exigerLigne_(feuille, ligne, c.START);
    feuille.getRange(ligne, c.DATE_FIN).setValue(new Date()).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.STATUT).setValue('RETOUR ANTICIPE');
    return reponseAbsencesMutation_('Retour anticipé enregistré.');
  });
}

function auditerFeuillesMemoireGDA() {
  const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  return classeur.getSheets().map(function (feuille) {
    const derniereLigne = feuille.getLastRow();
    const derniereColonne = feuille.getLastColumn();
    let validations = 0;
    let formules = 0;
    if (derniereLigne && derniereColonne) {
      const plage = feuille.getRange(1, 1, derniereLigne, derniereColonne);
      plage.getDataValidations().forEach(function (ligne) {
        ligne.forEach(function (validation) {
          if (validation) validations++;
        });
      });
      plage.getFormulas().forEach(function (ligne) {
        ligne.forEach(function (formule) {
          if (formule) formules++;
        });
      });
    }
    return {
      feuille: feuille.getName(),
      lignes: derniereLigne,
      colonnes: derniereColonne,
      validations: validations,
      formules: formules,
      cellulesFusionnees: feuille
        .getRange(1, 1, feuille.getMaxRows(), feuille.getMaxColumns())
        .getMergedRanges().length
    };
  });
}

/**
 * Rend toutes les feuilles mémoire adaptées aux écritures du site.
 * Une copie complète est créée avant la première modification.
 */

function optimiserToutesFeuillesMemoireGDA() {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  try {
    const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
    const avant = auditerFeuillesMemoireGDA();
    const horodatage = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() || 'Europe/Paris',
      'yyyy-MM-dd HH-mm-ss'
    );
    const sauvegarde = classeur.copy('Sauvegarde GDA mémoire avant optimisation ' + horodatage);

    classeur.getSheets().forEach(function (feuille) {
      const maxLignes = Math.max(feuille.getMaxRows(), 1);
      const maxColonnes = Math.max(feuille.getMaxColumns(), 1);
      const plageComplete = feuille.getRange(1, 1, maxLignes, maxColonnes);
      plageComplete.clearDataValidations();
      plageComplete.getMergedRanges().forEach(function (plage) {
        plage.breakApart();
      });

      const derniereLigne = feuille.getLastRow();
      const derniereColonne = feuille.getLastColumn();
      if (derniereLigne && derniereColonne) {
        feuille.getRange(1, 1, derniereLigne, derniereColonne)
          .setVerticalAlignment('middle');
      }
      normaliserFeuilleMemoireGDA_(feuille);
    });

    SpreadsheetApp.flush();
    CacheService.getScriptCache().remove('GDA_EFFECTIF_CACHE_V1');
    const apres = auditerFeuillesMemoireGDA();
    return {
      success: true,
      sauvegardeId: sauvegarde.getId(),
      sauvegardeUrl: sauvegarde.getUrl(),
      feuilles: apres.length,
      validationsSupprimees: avant.reduce(function (total, feuille) {
        return total + feuille.validations;
      }, 0),
      fusionsSupprimees: avant.reduce(function (total, feuille) {
        return total + feuille.cellulesFusionnees;
      }, 0),
      formulesConservees: apres.reduce(function (total, feuille) {
        return total + feuille.formules;
      }, 0),
      auditAvant: avant,
      auditApres: apres
    };
  } finally {
    verrou.releaseLock();
  }
}

function normaliserFeuilleMemoireGDA_(feuille) {
  const nom = feuille.getName();
  const derniereLigne = Math.max(feuille.getLastRow(), 1);
  const derniereColonne = Math.max(feuille.getLastColumn(), 1);
  const ligneEntete = nom === CONFIG.EFFECTIF.SHEET ? 4 : 1;
  assurerDimensionsFeuille_(feuille, ligneEntete, derniereColonne);
  feuille.setFrozenRows(ligneEntete);
  feuille.getRange(ligneEntete, 1, 1, derniereColonne)
    .setFontWeight('bold')
    .setBackground('#12324a')
    .setFontColor('#ffffff');

  if (nom === CONFIG.EFFECTIF.SHEET && derniereLigne >= CONFIG.EFFECTIF.START) {
    feuille.getRange(CONFIG.EFFECTIF.START, CONFIG.EFFECTIF.MATRICULE,
      derniereLigne - CONFIG.EFFECTIF.START + 1, 4).setNumberFormat('@');
    feuille.getRange(CONFIG.EFFECTIF.START, CONFIG.EFFECTIF.PROMO_RETRO,
      derniereLigne - CONFIG.EFFECTIF.START + 1, 2).setNumberFormat('dd/MM/yyyy');
  } else if (nom === CONFIG.ABSENCES.SHEET && derniereLigne >= CONFIG.ABSENCES.START) {
    feuille.getRange(CONFIG.ABSENCES.START, CONFIG.ABSENCES.MATRICULE,
      derniereLigne - CONFIG.ABSENCES.START + 1, 2).setNumberFormat('@');
    feuille.getRange(CONFIG.ABSENCES.START, CONFIG.ABSENCES.DATE_DEBUT,
      derniereLigne - CONFIG.ABSENCES.START + 1, 2).setNumberFormat('dd/MM/yyyy');
  } else if (nom === CONFIG.DEPARTS.SHEET && derniereLigne >= CONFIG.DEPARTS.START) {
    feuille.getRange(CONFIG.DEPARTS.START, CONFIG.DEPARTS.MATRICULE,
      derniereLigne - CONFIG.DEPARTS.START + 1, 5).setNumberFormat('@');
    feuille.getRange(CONFIG.DEPARTS.START, CONFIG.DEPARTS.DATE_DEBUT,
      derniereLigne - CONFIG.DEPARTS.START + 1, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  } else if (nom === CONFIG.RAPPORTS.SHEET && derniereLigne >= CONFIG.RAPPORTS.START) {
    feuille.getRange(CONFIG.RAPPORTS.START, CONFIG.RAPPORTS.MATRICULE,
      derniereLigne - CONFIG.RAPPORTS.START + 1, 1).setNumberFormat('@');
    feuille.getRange(CONFIG.RAPPORTS.START, CONFIG.RAPPORTS.DATE_RAPPORT,
      derniereLigne - CONFIG.RAPPORTS.START + 1, 1).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(CONFIG.RAPPORTS.START, CONFIG.RAPPORTS.ENVOYE_LE,
      derniereLigne - CONFIG.RAPPORTS.START + 1, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }
}

function feuilleListeBlancheGDA_() {
  const c = LISTE_BLANCHE_GDA;
  const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  let feuille = classeur.getSheetByName(CONFIG.STOCKAGE.LISTE_BLANCHE_SHEET);
  if (!feuille) feuille = classeur.insertSheet(CONFIG.STOCKAGE.LISTE_BLANCHE_SHEET);
  if (propre_(feuille.getRange(1, 1).getValue()) !== 'Identifiant unique') {
    feuille.getRange(1, 1, 1, c.MODIFIE_LE).setValues([[
      'Identifiant unique',
      'Identifiant de connexion',
      'Discord ID',
      'CrÃ©Ã© le',
      'ModifiÃ© le'
    ]]).setFontWeight('bold');
    feuille.setFrozenRows(1);
  }
  feuille.getRange(2, c.IDENTIFIANT, Math.max(feuille.getMaxRows() - 1, 1), 2)
    .setNumberFormat('@');
  feuille.getRange(2, c.CREE_LE, Math.max(feuille.getMaxRows() - 1, 1), 2)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  return feuille;
}

function lireListeBlancheGDA_() {
  const c = LISTE_BLANCHE_GDA;
  const feuille = feuilleListeBlancheGDA_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return [];
  return feuille.getRange(c.START, 1, derniere - c.START + 1, c.MODIFIE_LE)
    .getValues().map(function (ligne, index) {
      return {
        ligne: c.START + index,
        id: propre_(ligne[c.ID - 1]),
        identifiant: propre_(ligne[c.IDENTIFIANT - 1]),
        discordId: normaliserIdDiscord_(ligne[c.DISCORD_ID - 1]),
        creeLe: dateHeureTexte_(ligne[c.CREE_LE - 1]),
        modifieLe: dateHeureTexte_(ligne[c.MODIFIE_LE - 1])
      };
    }).filter(function (entree) {
      return entree.id && entree.identifiant && entree.discordId;
    });
}

function membreDepuisListeBlancheGDA_(entree) {
  if (!entree) return null;
  return {
    matricule: entree.identifiant,
    grade: 'Externe',
    steamId: '',
    discordId: entree.discordId,
    presence: 'PrÃ©sent',
    specialisation: '',
    externe: true,
    listeBlancheId: entree.id
  };
}

function assurerFeuillesDisponibilitesMemoire_() {
  if (PropertiesService.getScriptProperties()
    .getProperty(CLE_FEUILLES_DISPONIBILITES_PLAINES) === 'OK') return;
  reconstruireFeuillesDisponibilitesMemoire();
}

/**
 * Reconstruit les deux registres dans le classeur mémoire sous forme de
 * feuilles ordinaires. Peut être relancée manuellement sans toucher au
 * document principal.
 */

function reconstruireFeuillesDisponibilitesMemoire() {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  try {
    const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
    reconstruireFeuilleMemoireOrdinaire_(
      classeur,
      CONFIG.ABSENCES.SHEET,
      7,
      function (feuille, derniereLigne) {
        feuille.getRange(1, 1, 1, 7).setValues([[
          'Matricule', 'Grade', 'Date de début', 'Date de fin',
          'Raison', 'Statut', 'Déclarée par'
        ]]);
        feuille.setFrozenRows(1);
        if (derniereLigne >= CONFIG.ABSENCES.START) {
          feuille
            .getRange(
              CONFIG.ABSENCES.START,
              CONFIG.ABSENCES.DATE_DEBUT,
              derniereLigne - CONFIG.ABSENCES.START + 1,
              2
            )
            .setNumberFormat('dd/MM/yyyy');
        }
      }
    );
    reconstruireFeuilleMemoireOrdinaire_(
      classeur,
      CONFIG.DEPARTS.SHEET,
      CONFIG.DEPARTS.MEDAILLES_RESTAUREES_LE,
      function (feuille, derniereLigne) {
        feuille.getRange(1, 1, 1, CONFIG.DEPARTS.MEDAILLES_RESTAUREES_LE).setValues([[
          '', 'Matricule', 'Grade', 'Type', 'Steam ID', 'Discord ID',
          'Date de départ', 'Date de retour', 'Raison', 'Statut',
          'Décision prise par', 'Médailles', 'Médailles restaurées le'
        ]]);
        feuille.setFrozenRows(1);
        if (derniereLigne >= CONFIG.DEPARTS.START) {
          feuille
            .getRange(
              CONFIG.DEPARTS.START,
              CONFIG.DEPARTS.DATE_DEBUT,
              derniereLigne - CONFIG.DEPARTS.START + 1,
              2
            )
            .setNumberFormat('dd/MM/yyyy HH:mm:ss');
          for (let ligne = CONFIG.DEPARTS.START; ligne <= derniereLigne; ligne++) {
            if (propre_(feuille.getRange(ligne, CONFIG.DEPARTS.MATRICULE).getValue())) {
              appliquerFormuleStatutDepart_(feuille, ligne);
            }
          }
          feuille
            .getRange(
              CONFIG.DEPARTS.START,
              CONFIG.DEPARTS.MEDAILLES_RESTAUREES_LE,
              derniereLigne - CONFIG.DEPARTS.START + 1,
              1
            )
            .setNumberFormat('dd/MM/yyyy HH:mm:ss');
        }
      }
    );
    PropertiesService.getScriptProperties()
      .setProperty(CLE_FEUILLES_DISPONIBILITES_PLAINES, 'OK');
    CacheService.getScriptCache().remove('GDA_HORAIRES_DEPARTS_REPARES_V1');
    SpreadsheetApp.flush();
    return 'Registre Absence et Départ GDA ont été reconstruits dans le document mémoire.';
  } finally {
    verrou.releaseLock();
  }
}

function reconstruireFeuilleMemoireOrdinaire_(classeur, nom, largeur, configurer) {
  const ancienne = classeur.getSheetByName(nom);
  if (!ancienne) throw new Error('Feuille mémoire introuvable : ' + nom);
  const position = ancienne.getIndex();
  const derniereLigne = Math.max(ancienne.getLastRow(), 1);
  const valeurs = ancienne.getRange(1, 1, derniereLigne, largeur).getValues();
  const nomTemporaire = ('_TMP_' + nom + '_' + Date.now()).slice(0, 99);
  const nouvelle = classeur.insertSheet(nomTemporaire);

  try {
    assurerDimensionsFeuille_(nouvelle, derniereLigne, largeur);
    nouvelle.getRange(1, 1, derniereLigne, largeur).setValues(valeurs);
    nouvelle.getRange(1, 1, 1, largeur)
      .setFontWeight('bold')
      .setBackground('#12324a')
      .setFontColor('#ffffff');
    configurer(nouvelle, derniereLigne);
    nouvelle.autoResizeColumns(1, largeur);
    classeur.deleteSheet(ancienne);
    nouvelle.setName(nom);
    classeur.setActiveSheet(nouvelle);
    classeur.moveActiveSheet(position);
    return nouvelle;
  } catch (erreur) {
    if (classeur.getSheetByName(nom) && classeur.getSheetByName(nomTemporaire)) {
      classeur.deleteSheet(nouvelle);
    }
    throw erreur;
  }
}

function ajouterJoursCalendaires_(date, jours) {
  const resultat = debutJour_(date);
  resultat.setDate(resultat.getDate() + Number(jours || 0));
  return resultat;
}

function reponseAbsencesMutation_(message) {
  SpreadsheetApp.flush();
  const toutes = lireAbsences_();
  synchroniserPresencesEffectifDepuisAbsences_(
    feuille_(CONFIG.EFFECTIF.SHEET),
    matriculesAbsentsActuels_(toutes)
  );
  return {
    success: true,
    message: message,
    actives: toutes.filter(function (absence) {
      return absence.statut === 'ACTIF';
    }),
    historiques: toutes.filter(function (absence) {
      return absence.statut !== 'ACTIF';
    })
  };
}

function rangGradeGestion_(grade) {
  const cible = normaliser_(grade);
  return REFERENTIEL_GESTION.grades.findIndex(g => normaliser_(g) === cible);
}

/**
 * Trie l'effectif selon la hiérarchie officielle, puis par date d'entrée :
 * les membres les plus anciens apparaissent avant les plus récents.
 * Le matricule sert uniquement à stabiliser l'ordre lorsque deux dates
 * sont identiques ou absentes.
 */

function trierEffectifParGradeEtDate_(membres) {
  return (Array.isArray(membres) ? membres : [])
    .slice()
    .sort(function (a, b) {
      const rangA = rangGradeGestion_(a && a.grade);
      const rangB = rangGradeGestion_(b && b.grade);
      const ordreA = rangA < 0 ? 999 : rangA;
      const ordreB = rangB < 0 ? 999 : rangB;
      if (ordreA !== ordreB) return ordreA - ordreB;

      const dateA = dateOuNull_(a && a.dateEntree);
      const dateB = dateOuNull_(b && b.dateEntree);
      const tempsA = dateA ? dateA.getTime() : Number.MAX_SAFE_INTEGER;
      const tempsB = dateB ? dateB.getTime() : Number.MAX_SAFE_INTEGER;
      if (tempsA !== tempsB) return tempsA - tempsB;

      return normaliser_(a && a.matricule)
        .localeCompare(normaliser_(b && b.matricule), 'fr');
    });
}

function normaliserGradeCompteur_(valeur) {
  return normaliser_(valeur)
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function codeGroupeGradeEffectif_(grade) {
  const cle = normaliserGradeCompteur_(grade);
  const groupes = {};
  ['Lieutenant-Colonel', 'Commandant', 'Vice-Commandant'].forEach(function (nom) {
    groupes[normaliserGradeCompteur_(nom)] = 'OFFSUP';
  });
  ['Capitaine', 'Lieutenant', 'Sous-Lieutenant', 'Aspirant'].forEach(function (nom) {
    groupes[normaliserGradeCompteur_(nom)] = 'OFF';
  });
  ['Major', 'Adjudant-Chef', 'Adjudant', 'Sergent-Chef', 'Sergent'].forEach(function (nom) {
    groupes[normaliserGradeCompteur_(nom)] = 'SO';
  });
  ['Caporal-Chef', 'Caporal'].forEach(function (nom) {
    groupes[normaliserGradeCompteur_(nom)] = 'HDR';
  });
  return groupes[cle] || '';
}

/**
 * Répare les codes de groupe en B et retire les lignes réellement vides qui
 * se trouvent au milieu de l'effectif, sans toucher aux intertitres en G.
 */

function synchroniserStructureEffectifGlobal_(feuille, supprimerLignesVides) {
  const c = CONFIG.EFFECTIF;
  const derniereLigne = feuille.getLastRow();
  if (derniereLigne < c.START) return;
  const derniereColonne = Math.max(feuille.getLastColumn(), c.MEDAILLE);
  const nombreLignes = derniereLigne - c.START + 1;
  const lignes = feuille.getRange(c.START, 1, nombreLignes, derniereColonne)
    .getDisplayValues();
  let premierContenu = -1;

  lignes.forEach(function (ligne, index) {
    const matricule = propre_(ligne[c.MATRICULE - 1]);
    const grade = propre_(ligne[c.GRADE - 1]);
    const codeAttendu = matricule ? codeGroupeGradeEffectif_(grade) : '';
    const codeActuel = propre_(ligne[1]);
    const codeReconnu = ['OFFSUP', 'OFF', 'SO', 'HDR'].includes(normaliser_(codeActuel));

    if (codeAttendu && normaliser_(codeActuel) !== normaliser_(codeAttendu)) {
      feuille.getRange(c.START + index, 2).setValue(codeAttendu);
      ligne[1] = codeAttendu;
    } else if (!matricule && !grade && codeReconnu) {
      feuille.getRange(c.START + index, 2).clearContent();
      ligne[1] = '';
    }

    if (premierContenu < 0 && ligne.some(function (valeur) {
      return propre_(valeur) !== '';
    })) premierContenu = index;
  });

  if (!supprimerLignesVides || premierContenu < 0) return;
  for (let index = lignes.length - 1; index > premierContenu; index--) {
    const vide = lignes[index].every(function (valeur) {
      return propre_(valeur) === '';
    });
    if (vide) feuille.deleteRow(c.START + index);
  }
}

/**
 * Déplace physiquement les lignes des membres dans la feuille Effectif Global.
 * Les intertitres, les formats, les validations et les couleurs restent liés
 * à leurs lignes respectives grâce à Sheet.moveRows().
 */

function trierLignesEffectifGlobal_(feuille) {
  const c = CONFIG.EFFECTIF;
  const derniereLigne = feuille.getLastRow();
  if (derniereLigne < c.START) return 0;

  const valeurs = feuille
    .getRange(
      c.START,
      c.MATRICULE,
      derniereLigne - c.START + 1,
      c.DATE_ENTREE - c.MATRICULE + 1
    )
    .getValues();

  const membres = valeurs.map(function (ligne) {
    return {
      matricule: propre_(ligne[0]),
      grade: propre_(ligne[c.GRADE - c.MATRICULE]),
      dateEntree: ligne[c.DATE_ENTREE - c.MATRICULE]
    };
  }).filter(function (membre) {
    return membre.matricule && rangGradeGestion_(membre.grade) >= 0;
  });

  const membresTries = trierEffectifParGradeEtDate_(membres);
  const grades = REFERENTIEL_GESTION.grades
    .filter(function (grade) {
      return codeGroupeGradeEffectif_(grade) !== '';
    })
    .slice()
    .reverse();
  let deplacements = 0;

  grades.forEach(function (grade) {
    const membresDuGrade = membresTries.filter(function (membre) {
      return normaliserGradeCompteur_(membre.grade) ===
        normaliserGradeCompteur_(grade);
    });
    const ligneIntertitre = trouverLigneIntertitreGradeEffectif_(
      feuille,
      grade
    );
    if (!ligneIntertitre) return;

    const ordreActuel = lireMatriculesSectionGradeEffectif_(
      feuille,
      ligneIntertitre
    );
    const ordreAttendu = membresDuGrade.map(function (membre) {
      return normaliser_(membre.matricule);
    });
    if (
      ordreActuel.length === ordreAttendu.length &&
      ordreActuel.every(function (matricule, index) {
        return matricule === ordreAttendu[index];
      })
    ) {
      return;
    }

    membresDuGrade.slice().reverse().forEach(function (membre) {
      const intertitreActuel = trouverLigneIntertitreGradeEffectif_(
        feuille,
        grade
      );
      const ligneMembre = trouverLigneMembreEffectif_(
        feuille,
        membre.matricule
      );
      if (!intertitreActuel || !ligneMembre) return;

      const destination = intertitreActuel + 1;
      if (ligneMembre === destination) return;

      feuille.moveRows(
        feuille.getRange(ligneMembre, 1, 1, 1),
        destination
      );
      deplacements++;
    });
  });

  if (deplacements > 0) SpreadsheetApp.flush();
  return deplacements;
}

function trouverLigneIntertitreGradeEffectif_(feuille, grade) {
  const c = CONFIG.EFFECTIF;
  const derniereLigne = feuille.getLastRow();
  if (derniereLigne < c.START) return 0;
  const valeurs = feuille
    .getRange(
      c.START,
      c.MATRICULE,
      derniereLigne - c.START + 1,
      c.PRESENCE - c.MATRICULE + 1
    )
    .getDisplayValues();
  const gradeAttendu = normaliserGradeCompteur_(grade);

  for (let index = 0; index < valeurs.length; index++) {
    const matricule = propre_(valeurs[index][0]);
    const gradeMembre = propre_(
      valeurs[index][c.GRADE - c.MATRICULE]
    );
    const texteIntertitre = normaliserGradeCompteur_(
      valeurs[index][c.PRESENCE - c.MATRICULE]
    );
    if (
      !matricule &&
      !gradeMembre &&
      (
        texteIntertitre === gradeAttendu ||
        texteIntertitre.indexOf(gradeAttendu + ' -') === 0
      )
    ) {
      return c.START + index;
    }
  }
  return 0;
}

function trouverLigneMembreEffectif_(feuille, matricule) {
  const c = CONFIG.EFFECTIF;
  const derniereLigne = feuille.getLastRow();
  if (derniereLigne < c.START) return 0;
  const valeurs = feuille
    .getRange(
      c.START,
      c.MATRICULE,
      derniereLigne - c.START + 1,
      1
    )
    .getDisplayValues();
  const cible = normaliser_(matricule);

  for (let index = 0; index < valeurs.length; index++) {
    if (normaliser_(valeurs[index][0]) === cible) {
      return c.START + index;
    }
  }
  return 0;
}

function lireMatriculesSectionGradeEffectif_(feuille, ligneIntertitre) {
  const c = CONFIG.EFFECTIF;
  const derniereLigne = feuille.getLastRow();
  const resultat = [];

  for (
    let ligne = ligneIntertitre + 1;
    ligne <= derniereLigne;
    ligne++
  ) {
    const valeurs = feuille
      .getRange(ligne, c.MATRICULE, 1, 2)
      .getDisplayValues()[0];
    const matricule = propre_(valeurs[0]);
    const grade = propre_(valeurs[1]);
    if (!matricule || rangGradeGestion_(grade) < 0) break;
    resultat.push(normaliser_(matricule));
  }
  return resultat;
}

/**
 * Fonction exécutable manuellement depuis Apps Script pour remettre
 * immédiatement toutes les lignes dans le bon ordre.
 */

function trierEffectifGlobal() {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  try {
    const feuille = feuille_(CONFIG.EFFECTIF.SHEET);
    mettreAJourCompteursEffectif_(feuille);
    return 'Effectif Global trié par grade et par ancienneté.';
  } finally {
    verrou.releaseLock();
  }
}

function reparerStructureEffectifGlobal() {
  const feuille = feuille_(CONFIG.EFFECTIF.SHEET);
  synchroniserPresencesEffectifDepuisAbsences_(
    feuille,
    matriculesAbsentsActuels_()
  );
  mettreAJourCompteursEffectif_(feuille);
  return 'Effectif Global réparé.';
}

/** Répercute les absences actives du registre dans la colonne G de l'effectif. */

function synchroniserPresencesEffectifDepuisAbsences_(feuille, absentsActuels) {
  const c = CONFIG.EFFECTIF;
  const derniereLigne = feuille.getLastRow();
  if (derniereLigne < c.START) return;
  const nombreLignes = derniereLigne - c.START + 1;
  const valeurs = feuille
    .getRange(c.START, c.MATRICULE, nombreLignes, c.PRESENCE - c.MATRICULE + 1)
    .getDisplayValues();
  const gradesAutorises = {};
  REFERENTIEL_GESTION.grades.forEach(function (grade) {
    gradesAutorises[normaliserGradeCompteur_(grade)] = true;
  });

  valeurs.forEach(function (ligne, index) {
    const matricule = propre_(ligne[0]);
    const grade = normaliserGradeCompteur_(ligne[c.GRADE - c.MATRICULE]);
    if (!matricule || !gradesAutorises[grade]) return;

    const estAbsent = Boolean(absentsActuels[normaliser_(matricule)]);
    const presenceAttendue = estAbsent ? 'Absent' : 'Présent';
    const presenceActuelle = propre_(ligne[c.PRESENCE - c.MATRICULE]);
    const cellule = feuille.getRange(c.START + index, c.PRESENCE);
    if (normaliser_(presenceActuelle) !== normaliser_(presenceAttendue)) {
      cellule
        .setValue(presenceAttendue)
        .setBackground(estAbsent ? '#e06666' : '#93c47d')
        .setFontColor(estAbsent ? '#ffffff' : '#000000')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
    }
  });
}

function mettreAJourCompteursEffectif_(feuille) {
  const c = CONFIG.EFFECTIF;
  // Ce nettoyage est volontairement centralisé ici : toute action qui met à
  // jour l'effectif élimine ainsi les lignes vides, quelle qu'en soit la cause.
  synchroniserStructureEffectifGlobal_(feuille, true);
  trierLignesEffectifGlobal_(feuille);
  const derniereLigne = feuille.getLastRow();
  const derniereColonne = feuille.getLastColumn();
  if (derniereLigne < 1 || derniereColonne < c.GRADE) return;

  const valeurs = feuille.getRange(1, 1, derniereLigne, derniereColonne)
    .getDisplayValues();
  const couleursPresence = feuille
    .getRange(1, c.PRESENCE, derniereLigne, 1)
    .getBackgrounds();
  const definitions = [
    ['Lieutenant-Colonel', '1', 'SUP'], ['Commandant', '1', 'SUP'],
    ['Vice-Commandant', '1', 'SUP'], ['Capitaine', '1', 'OFF'],
    ['Lieutenant', '2', 'OFF'], ['Sous-Lieutenant', '2', 'OFF'],
    ['Aspirant', '3', 'OFF'], ['Major', '2', 'SO'],
    ['Adjudant-Chef', '2', 'SO'], ['Adjudant', '2', 'SO'],
    ['Sergent-Chef', '∞', 'SO'], ['Sergent', '∞', 'SO'],
    ['Caporal-Chef', '∞', 'HDR'], ['Caporal', '∞', 'HDR']
  ].map(function (ligne) {
    return { grade: ligne[0], maximum: ligne[1], groupe: ligne[2] };
  });
  const parGrade = {};
  const comptes = {};
  definitions.forEach(function (definition) {
    const cle = normaliserGradeCompteur_(definition.grade);
    parGrade[cle] = definition;
    comptes[cle] = 0;
  });

  // La capacité située après « / » reste modifiable manuellement en G.
  valeurs.forEach(function (ligne) {
    const texte = propre_(ligne[c.PRESENCE - 1]);
    const normalise = normaliserGradeCompteur_(texte);
    const definition = definitions.find(function (element) {
      const grade = normaliserGradeCompteur_(element.grade);
      return normalise.indexOf(grade + ' -') === 0;
    });
    const capacite = texte.match(/\/\s*(\d+|∞)\s*$/);
    if (definition && capacite) definition.maximum = capacite[1];
  });

  valeurs.forEach(function (ligne) {
    const nom = propre_(ligne[c.MATRICULE - 1]);
    const grade = normaliserGradeCompteur_(ligne[c.GRADE - 1]);
    if (nom && parGrade[grade]) comptes[grade]++;
  });

  // Colore seulement les véritables membres, jamais les intertitres en G.
  valeurs.forEach(function (ligne, index) {
    const nom = propre_(ligne[c.MATRICULE - 1]);
    const grade = normaliserGradeCompteur_(ligne[c.GRADE - 1]);
    if (!nom || !parGrade[grade]) return;
    const presence = normaliser_(ligne[c.PRESENCE - 1]);
    if (presence !== 'PRESENT' && presence !== 'ABSENT') return;

    const fond = presence === 'PRESENT' ? '#93c47d' : '#e06666';
    const texte = presence === 'PRESENT' ? '#000000' : '#ffffff';
    if (String(couleursPresence[index][0]).toLowerCase() !== fond) {
      feuille.getRange(index + 1, c.PRESENCE)
        .setBackground(fond)
        .setFontColor(texte)
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
    }
  });

  const totaux = { SUP: 0, OFF: 0, SO: 0, HDR: 0 };
  definitions.forEach(function (definition) {
    totaux[definition.groupe] += comptes[normaliserGradeCompteur_(definition.grade)];
  });

  valeurs.forEach(function (ligne, indexLigne) {
    const nom = propre_(ligne[c.MATRICULE - 1]);
    const gradeMembre = normaliserGradeCompteur_(ligne[c.GRADE - 1]);
    if (nom && parGrade[gradeMembre]) return;

    // Les compteurs par grade sont précisément placés en colonne G.
    const texteCompteur = propre_(ligne[c.PRESENCE - 1]);
    const compteurNormalise = normaliserGradeCompteur_(texteCompteur);
    const definition = definitions.find(function (element) {
      const grade = normaliserGradeCompteur_(element.grade);
      return compteurNormalise === grade ||
        compteurNormalise.indexOf(grade + ' -') === 0;
    });
    if (definition) {
      const nouveauCompteur = definition.grade + ' - ' +
        comptes[normaliserGradeCompteur_(definition.grade)] + '/' + definition.maximum;
      if (texteCompteur !== nouveauCompteur) {
        feuille.getRange(indexLigne + 1, c.PRESENCE)
          .setNumberFormat('@')
          .setValue(nouveauCompteur);
      }
    }

    // Les quatre bandeaux de catégories peuvent être fusionnés et commencer
    // dans une autre colonne : on recherche uniquement ces quatre libellés.
    ligne.forEach(function (valeur, indexColonne) {
      const texte = propre_(valeur);
      const normalise = normaliserGradeCompteur_(texte);
      let nouveauTitre = '';
      if (normalise.includes('OFFICIERS SUPERIEURS GDA')) {
        nouveauTitre = '💂 Officiers Supérieurs GDA | ' + totaux.SUP + '/3 💂';
      } else if (normalise.includes('SOUS OFFICIERS GDA')) {
        nouveauTitre = '💂 Sous Officiers GDA | ' + totaux.SO + '/∞ 💂';
      } else if (normalise.includes('HOMMES DU RANG GDA')) {
        nouveauTitre = '💂 Hommes du rang GDA | ' + totaux.HDR + '/∞ 💂';
      } else if (normalise.includes('OFFICIERS GDA')) {
        nouveauTitre = '💂 Officiers GDA | ' + totaux.OFF + '/8 💂';
      }
      if (nouveauTitre && texte !== nouveauTitre) {
        feuille.getRange(indexLigne + 1, indexColonne + 1)
          .setNumberFormat('@')
          .setValue(nouveauTitre);
      }
    });
  });
}

function onEdit(e) {
  if (!e || !e.range) return;
  const feuille = e.range.getSheet();
  if (feuille.getName() === CONFIG.ABSENCES.SHEET) {
    const effectif = e.source.getSheetByName(CONFIG.EFFECTIF.SHEET);
    if (effectif) {
      synchroniserPresencesEffectifDepuisAbsences_(
        effectif,
        matriculesAbsentsActuels_()
      );
      mettreAJourCompteursEffectif_(effectif);
    }
    return;
  }
  if (feuille.getName() !== CONFIG.EFFECTIF.SHEET) return;
  if (e.range.getLastColumn() < CONFIG.EFFECTIF.MATRICULE ||
      e.range.getColumn() > CONFIG.EFFECTIF.DATE_ENTREE) return;
  mettreAJourCompteursEffectif_(feuille);
}

/** Recalcule également les compteurs à chaque ouverture du classeur. */

function onOpen(e) {
  const classeur = e && e.source ? e.source : SpreadsheetApp.getActive();
  const feuille = classeur.getSheetByName(CONFIG.EFFECTIF.SHEET);
  if (feuille) {
    synchroniserPresencesEffectifDepuisAbsences_(
      feuille,
      matriculesAbsentsActuels_()
    );
    mettreAJourCompteursEffectif_(feuille);
  }
}

function lireEffectif_() {
  const c = CONFIG.EFFECTIF;
  const feuille = feuille_(c.SHEET);
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return [];
  const valeurs = feuille.getRange(c.START, c.MATRICULE, derniere - c.START + 1, c.MEDAILLE - c.MATRICULE + 1).getValues();
  return valeurs.map((r, i) => ({
    ligne: c.START + i,
    feuille: feuille,
    matricule: propre_(r[0]),
    grade: propre_(r[1]),
    steamId: propre_(r[2]),
    discordId: propre_(r[3]),
    presence: propre_(r[4]),
    nombreRapports: nombre_(r[5]),
    observation: propre_(r[6]),
    datePromotionRetro: dateTexte_(r[7]),
    dateEntree: dateTexte_(r[8]),
    sanction: propre_(r[9]),
    recommandation: propre_(r[10]),
    notes: propre_(r[11]),
    specialisation: propre_(r[12]),
    medaille: propre_(r[13])
  })).filter(function (membre) {
    return (
      membre.matricule !== '' &&
      !estLigneResumeEffectif_(membre.matricule)
    );
  });
}

function estLigneResumeEffectif_(matricule) {
  const texte = normaliser_(matricule);

  return (
    texte.includes('OFFICIERS GDA') ||
    texte.includes('SOUS OFFICIERS GDA') ||
    texte.includes('HOMMES DU RANG GDA')
  );
}

function lireAbsences_() {
  const c = CONFIG.ABSENCES;
  const feuille = feuille_(c.SHEET);
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return [];
  const valeurs = feuille.getRange(c.START, 1, derniere - c.START + 1, c.AUTEUR).getValues();
  const aujourdHui = debutJour_(new Date());
  return valeurs.map((r, i) => {
    const debut = dateOuNull_(r[c.DATE_DEBUT - 1]);
    const fin = dateOuNull_(r[c.DATE_FIN - 1]);
    const statutFeuille = normaliser_(r[c.STATUT - 1]);
    const retourAnticipe =
      statutFeuille.includes('RETOUR') ||
      statutFeuille.includes('TERMINE');
    const dansLaPeriode = !!debut && !!fin &&
      debutJour_(debut) <= aujourdHui &&
      debutJour_(fin) >= aujourdHui;
    const statut = !retourAnticipe && dansLaPeriode ? 'ACTIF' : 'TERMINE';
    return {
      ligne: c.START + i,
      nom: propre_(r[c.MATRICULE - 1]),
      grade: propre_(r[c.GRADE - 1]),
      dateDebut: dateTexte_(debut),
      dateFin: dateTexte_(fin),
      raison: propre_(r[c.RAISON - 1]),
      statut: statut,
      auteur: propre_(r[c.AUTEUR - 1]),
      joursRestants: statut === 'ACTIF' && fin ? Math.max(0, differenceJours_(aujourdHui, fin)) : 0,
      dateValide: !!debut
    };
  }).filter(a => a.nom && a.dateValide).map(a => {
    delete a.dateValide;
    return a;
  });
}

function matriculesAbsentsActuels_(absences) {
  const resultat = {};
  (Array.isArray(absences) ? absences : lireAbsences_()).forEach(function (absence) {
    if (absence.statut !== 'ACTIF') return;
    const cle = normaliser_(absence.nom);
    if (cle) resultat[cle] = true;
  });
  return resultat;
}

function trouverMembre_(matricule) {
  const cible = normaliser_(matricule);
  if (!cible) return null;
  const entreeExterne = lireListeBlancheGDA_().find(function (entree) {
    return normaliser_(entree.identifiant) === cible;
  });
  if (entreeExterne) return membreDepuisListeBlancheGDA_(entreeExterne);
  const membreEffectif = lireEffectif_().find(function (membre) {
    return normaliser_(membre.matricule) === cible;
  });
  return membreEffectif || null;
}

function exigerConnexion_(matricule) {
  const membre = trouverMembre_(requis_(matricule, 'Le matricule'));
  if (!membre) throw new Error('Acces refuse : matricule inconnu.');
  if (!propre_(membre.matricule)) throw new Error('Acces refuse : nom ou matricule non renseigne.');
  if (!propre_(membre.grade)) throw new Error('Acces refuse : grade non renseigne.');
  return membre;
}

function estProprietaireGDA_(membre) {
  if (membre && membre.externe === true) return false;
  return normaliser_(membre && membre.matricule) ===
    normaliser_(obtenirNomProprietaireGDA_());
}

function obtenirNomProprietaireGDA_() {
  return propre_(PropertiesService.getScriptProperties()
    .getProperty(CLE_PROPRIETAIRE_GDA)) || PROPRIETAIRE_GDA;
}

/**
 * Réparation administrative ponctuelle : rétablit Milo comme propriétaire
 * principal sans supprimer les autres co-propriétaires.
 * Cette fonction peut être lancée directement depuis l'éditeur Apps Script.
 */

function obtenirCoproprietairesGDA_() {
  const brut = PropertiesService.getScriptProperties()
    .getProperty(CLE_COPROPRIETAIRES_GDA);
  if (!brut) return [];
  try {
    const liste = JSON.parse(brut);
    return Array.isArray(liste) ? liste.map(propre_).filter(Boolean) : [];
  } catch (erreur) {
    return [];
  }
}

function estCoproprietaireGDA_(membre) {
  if (membre && membre.externe === true) return false;
  const cible = normaliser_(membre && membre.matricule);
  return !!cible && obtenirCoproprietairesGDA_().some(function (nom) {
    return normaliser_(nom) === cible;
  });
}

function toutesPermissionsGDA_() {
  return Object.keys(LIBELLES_PERMISSIONS_GDA);
}

function permissionsAdministrativesCompletesGDA_() {
  return toutesPermissionsGDA_().filter(function (permission) {
    return permission !== PERMISSIONS_GDA.ROLE_VISITEUR;
  });
}

function clePermissionsMembre_(matricule) {
  const encode = Utilities.base64EncodeWebSafe(
    normaliser_(matricule),
    Utilities.Charset.UTF_8
  ).replace(/=+$/g, '');
  return 'GDA_PERMISSIONS_' + encode;
}

function clePermissionsIdentite_(membre) {
  if (membre && membre.externe === true && propre_(membre.listeBlancheId)) {
    return 'GDA_PERMISSIONS_LB_' + propre_(membre.listeBlancheId);
  }
  return clePermissionsMembre_(membre && membre.matricule);
}

function obtenirAccesMembre_(membre) {
  if (estProprietaireGDA_(membre)) {
    return {
      proprietaire: true,
      coproprietaire: false,
      permissions: permissionsAdministrativesCompletesGDA_()
    };
  }

  if (estCoproprietaireGDA_(membre)) {
    return {
      proprietaire: false,
      coproprietaire: true,
      permissions: permissionsAdministrativesCompletesGDA_()
    };
  }

  const brut = PropertiesService
    .getScriptProperties()
    .getProperty(clePermissionsIdentite_(membre));
  let permissions = [];

  if (brut) {
    try {
      permissions = JSON.parse(brut);
    } catch (erreur) {
      permissions = [];
    }
  }

  // Compatibilité avec l'ancien droit unique « administration » : les
  // personnes qui le possédaient ne perdent pas leurs accès au déploiement.
  if (Array.isArray(permissions) && permissions.includes('administration')) {
    permissions = permissions.concat([
      PERMISSIONS_GDA.ADMINISTRATION_STAFF,
      PERMISSIONS_GDA.ADMINISTRATION_PERMISSIONS,
      PERMISSIONS_GDA.ADMINISTRATION_LOGS
    ]);
  }

  const autorisees = toutesPermissionsGDA_();
  if (Array.isArray(permissions) &&
      permissions.includes(PERMISSIONS_GDA.ROLE_STAFF_TOTAL)) {
    return {
      proprietaire: false,
      coproprietaire: false,
      permissions: permissionsAdministrativesCompletesGDA_()
    };
  }
  return {
    proprietaire: false,
    coproprietaire: false,
    permissions: Array.isArray(permissions)
      ? permissions.filter(permission => autorisees.includes(permission))
      : []
  };
}

function utilisateurAPermission_(membre, permission) {
  return obtenirAccesMembre_(membre)
    .permissions
    .includes(permission);
}

function exigerPermissionGDA_(membre, permission) {
  if (!utilisateurAPermission_(membre, permission)) {
    throw new Error(
      'Accès refusé : permission requise — ' +
      (LIBELLES_PERMISSIONS_GDA[permission] || permission) + '.'
    );
  }
}

function classeurDonneesGDA_() {
  return SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
}

function feuille_(nom) {
  const feuille = classeurDonneesGDA_().getSheetByName(nom);
  if (!feuille) throw new Error('Feuille introuvable : ' + nom);
  return feuille;
}

function assurerDimensionsFeuille_(feuille, derniereLigne, derniereColonne) {
  const ligneDemandee = Math.max(1, Number(derniereLigne) || 1);
  const colonneDemandee = Math.max(1, Number(derniereColonne) || 1);
  const lignesManquantes = ligneDemandee - feuille.getMaxRows();
  const colonnesManquantes = colonneDemandee - feuille.getMaxColumns();
  if (lignesManquantes > 0) {
    feuille.insertRowsAfter(feuille.getMaxRows(), lignesManquantes);
  }
  if (colonnesManquantes > 0) {
    feuille.insertColumnsAfter(feuille.getMaxColumns(), colonnesManquantes);
  }
}

function exigerLigne_(feuille, ligne, minimum) {
  if (ligne < minimum || ligne > feuille.getLastRow()) throw new Error('Ligne de donnees invalide.');
}

function ligneRequise_(valeur, minimum) {
  const ligne = Number(valeur);
  if (!Number.isInteger(ligne) || ligne < minimum) throw new Error('Numero de ligne invalide.');
  return ligne;
}

function appliquerFormuleStatutDepart_(feuille, ligne) {
  feuille
    .getRange(ligne, CONFIG.DEPARTS.STATUT)
    .setFormula(formuleStatutDepart_(ligne));
}

function formuleStatutDepart_(ligne) {
  return (
    '=IF(OR(D' + ligne + '="",G' + ligne + '=""),"",' +
    'IF(H' + ligne + '="Permanent","Actif",' +
    'IF(NOT(ISNUMBER(H' + ligne + ')),"",' +
    'IF(OR(TODAY()<G' + ligne + ',TODAY()>H' + ligne + '),' +
    '"Inactif","Actif"))))'
  );
}

function verrou_(operation) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(15000);
  try { return operation(); } finally { verrou.releaseLock(); }
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function requis_(valeur, libelle) {
  const texte = propre_(valeur);
  if (!texte) throw new Error(libelle + ' est obligatoire.');
  return texte;
}

function propre_(valeur) {
  return valeur === null || valeur === undefined ? '' : String(valeur).trim();
}

function normaliser_(valeur) {
  return propre_(valeur)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/’/g, "'")
    .toUpperCase();
}

function nombre_(valeur) {
  const n = Number(valeur);
  return Number.isFinite(n) ? n : 0;
}

function dateOuNull_(valeur) {
  if (valeur instanceof Date && !isNaN(valeur)) return valeur;
  const texte = propre_(valeur);
  if (!texte) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(texte)) {
    const p = texte.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  const date = new Date(texte);
  return isNaN(date) ? null : date;
}

function dateTexte_(valeur) {
  const date = dateOuNull_(valeur);
  return date ? Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
}

function dateHeureTexte_(valeur) {
  const date = dateOuNull_(valeur);
  return date
    ? Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss")
    : '';
}

function debutJour_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceJours_(debut, fin) {
  return Math.ceil((debutJour_(fin) - debutJour_(debut)) / 86400000);
}

/**
 * Configure une fois la transmission des réponses du Google Form vers Supabase.
 * Cette fonction doit être lancée manuellement depuis l'éditeur Apps Script.
 */

function configurerEnvoiRapportsGoogleFormSupabase() {
  const interfaceUtilisateur = SpreadsheetApp.getUi();
  const demande = interfaceUtilisateur.prompt(
    'Connexion des rapports à Supabase',
    'Collez le secret fourni dans le fichier CONFIGURATION_GOOGLE_FORM_SUPABASE.txt.',
    interfaceUtilisateur.ButtonSet.OK_CANCEL
  );
  if (demande.getSelectedButton() !== interfaceUtilisateur.Button.OK) return;

  const secret = propre_(demande.getResponseText());
  if (!/^[a-f0-9]{64}$/i.test(secret)) {
    interfaceUtilisateur.alert('Le secret doit contenir exactement 64 caractères.');
    return;
  }

  PropertiesService.getScriptProperties().setProperties({
    GDA_SUPABASE_FORM_URL: 'https://hiothrwlpmulpcwwjxqf.supabase.co/functions/v1/google-form-reports',
    GDA_SUPABASE_FORM_SECRET: secret
  });

  ScriptApp.getProjectTriggers().forEach(function (declencheur) {
    if (declencheur.getHandlerFunction() === 'envoyerRapportGoogleFormVersSupabase') {
      ScriptApp.deleteTrigger(declencheur);
    }
  });
  ScriptApp
    .newTrigger('envoyerRapportGoogleFormVersSupabase')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();

  interfaceUtilisateur.alert(
    'Connexion terminée. Les prochaines réponses du formulaire seront aussi envoyées vers Supabase.'
  );
}

/**
 * Déclencheur installé : transmet uniquement les nouvelles lignes de Rapport GDA.
 */

function envoyerRapportGoogleFormVersSupabase(evenement) {
  if (!evenement || !evenement.range) {
    throw new Error('Cette fonction doit être appelée par le déclencheur du formulaire.');
  }
  const feuille = evenement.range.getSheet();
  if (!estFeuilleRapportGoogleFormSupabase_(feuille)) {
    console.log('Réponse ignorée : la feuille ne correspond pas au formulaire Rapport GDA.');
    return;
  }
  envoyerLigneRapportGoogleFormSupabase_(
    feuille,
    evenement.range.getRow(),
    Array.isArray(evenement.values) ? evenement.values : null,
    evenement.namedValues || null
  );
}

/**
 * Permet de transmettre le dernier rapport déjà présent sans attendre une
 * nouvelle réponse. À lancer manuellement pour vérifier la connexion.
 */

function renvoyerDernierRapportGoogleFormSupabase() {
  const classeur = SpreadsheetApp.getActive();
  const feuille = classeur.getSheetByName(CONFIG.RAPPORTS.SHEET) || classeur.getActiveSheet();
  const ligne = premiereLigneRapportGoogleFormSupabase_(feuille);
  if (!ligne) throw new Error('Aucun rapport à transmettre.');
  envoyerLigneRapportGoogleFormSupabase_(feuille, ligne);
  SpreadsheetApp.getUi().alert('Le dernier rapport a bien été transmis à Supabase.');
}

function envoyerLigneRapportGoogleFormSupabase_(feuille, ligne, valeursEvenement, valeursNommees) {
  const proprietes = PropertiesService.getScriptProperties();
  const url = propre_(proprietes.getProperty('GDA_SUPABASE_FORM_URL'));
  const secret = propre_(proprietes.getProperty('GDA_SUPABASE_FORM_SECRET'));
  if (!url || !secret) {
    throw new Error('La connexion Supabase du formulaire n’est pas configurée.');
  }

  const champs = lireChampsRapportGoogleFormSupabase_(
    feuille,
    ligne,
    valeursEvenement,
    valeursNommees
  );
  const dateEnvoi = champs.dateEnvoi || new Date();
  const identifiantReponse = empreinteRapportGoogleFormSupabase_([
    feuille.getParent().getId(),
    dateGoogleFormSupabase_(dateEnvoi, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    champs.matricule,
    dateGoogleFormSupabase_(champs.dateRapport, 'yyyy-MM-dd'),
    champs.rapport
  ].join('|'));
  const chargeUtile = {
    typeFlux: 'RAPPORT_GDA',
    identifiantReponse: identifiantReponse,
    nomFeuille: feuille.getName(),
    identifiantClasseur: feuille.getParent().getId(),
    identifiantFeuille: String(feuille.getSheetId()),
    ligne: ligne,
    matricule: champs.matricule,
    dateRapport: dateGoogleFormSupabase_(champs.dateRapport, 'yyyy-MM-dd'),
    gradeFormulaire: champs.gradeFormulaire,
    rapport: champs.rapport,
    commentaire: champs.commentaire,
    conclusion: champs.conclusion,
    dateEnvoi: dateGoogleFormSupabase_(dateEnvoi, "yyyy-MM-dd'T'HH:mm:ssXXX")
  };

  const reponse = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-gda-form-secret': secret },
    payload: JSON.stringify(chargeUtile),
    muteHttpExceptions: true
  });
  const code = reponse.getResponseCode();
  let resultat = null;
  try {
    resultat = JSON.parse(reponse.getContentText());
  } catch (erreur) {
    resultat = null;
  }
  if (code < 200 || code >= 300 || !resultat || resultat.success !== true) {
    throw new Error(
      resultat && resultat.message
        ? resultat.message
        : 'Supabase a refusé le rapport (HTTP ' + code + ').'
    );
  }
  console.log(
    resultat.duplicate
      ? 'Rapport déjà présent dans Supabase : ' + resultat.id
      : 'Rapport transmis à Supabase : ' + resultat.id
  );
}

/**
 * Lit les réponses par le titre des questions, et non par leur numéro de
 * colonne. Le formulaire collecte aussi l'adresse e-mail : les positions des
 * colonnes peuvent donc changer sans décaler le matricule ou le rapport.
 */

function lireChampsRapportGoogleFormSupabase_(feuille, ligne, valeursEvenement, valeursNommees) {
  const nombreColonnes = Math.max(1, feuille.getLastColumn());
  const valeurs = Array.isArray(valeursEvenement) && valeursEvenement.length
    ? valeursEvenement.slice()
    : feuille.getRange(ligne, 1, 1, nombreColonnes).getValues()[0];
  const entetes = feuille.getRange(1, 1, 1, nombreColonnes).getDisplayValues()[0];
  const index = {};

  entetes.forEach(function (entete, colonne) {
    const cle = normaliser_(entete);
    if (cle) index[cle] = valeurs[colonne];
  });
  if (valeursNommees && typeof valeursNommees === 'object') {
    Object.keys(valeursNommees).forEach(function (nom) {
      const valeur = valeursNommees[nom];
      index[normaliser_(nom)] = Array.isArray(valeur) ? valeur[0] : valeur;
    });
  }

  function lire(noms) {
    for (let i = 0; i < noms.length; i++) {
      const valeur = index[normaliser_(noms[i])];
      if (valeur !== undefined && valeur !== null && propre_(valeur)) return valeur;
    }
    return '';
  }

  return {
    dateEnvoi: lire(['Horodateur', 'Timestamp', 'Date d\'envoi']) || valeurs[0] || '',
    dateRapport: lire(['Date', 'Date du rapport']),
    matricule: propre_(lire(['Votre matricule', 'Matricule'])),
    gradeFormulaire: propre_(lire(['Votre grade', 'Grade'])),
    rapport: propre_(lire(['Votre Rapport', 'Rapport'])),
    commentaire: propre_(lire(['Commentaire sur votre service', 'Commentaire'])),
    conclusion: propre_(lire(['Conclusion']))
  };
}

function premiereLigneRapportGoogleFormSupabase_(feuille) {
  const debut = CONFIG.RAPPORTS.START;
  const fin = feuille.getLastRow();
  if (fin < debut) return 0;
  const nombreColonnes = Math.max(1, feuille.getLastColumn());
  const valeurs = feuille
    .getRange(debut, 1, fin - debut + 1, nombreColonnes)
    .getDisplayValues();
  for (let index = 0; index < valeurs.length; index++) {
    const champs = lireChampsRapportGoogleFormSupabase_(
      feuille,
      debut + index,
      valeurs[index],
      null
    );
    if (champs.matricule && champs.rapport) {
      return debut + index;
    }
  }
  return 0;
}

function empreinteRapportGoogleFormSupabase_(valeur) {
  const octets = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    valeur,
    Utilities.Charset.UTF_8
  );
  return octets.map(function (octet) {
    const positif = octet < 0 ? octet + 256 : octet;
    return ('0' + positif.toString(16)).slice(-2);
  }).join('');
}

function estFeuilleRapportGoogleFormSupabase_(feuille) {
  if (feuille.getName() === CONFIG.RAPPORTS.SHEET) return true;
  const derniereColonne = Math.max(1, Math.min(20, feuille.getLastColumn()));
  const entetes = feuille.getRange(1, 1, 1, derniereColonne).getDisplayValues()[0];
  const texteEntetes = normaliser_(entetes.join(' | '));
  const contientIdentite = texteEntetes.indexOf('MATRICULE') !== -1 ||
    texteEntetes.indexOf('PSEUDO') !== -1 ||
    texteEntetes.indexOf('NOM') !== -1;
  return texteEntetes.indexOf('RAPPORT') !== -1 &&
    texteEntetes.indexOf('DATE') !== -1 &&
    contientIdentite;
}

function dateGoogleFormSupabase_(valeur, format) {
  const date = valeur instanceof Date ? valeur : new Date(valeur);
  if (isNaN(date.getTime())) return propre_(valeur);
  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone() || 'Europe/Paris',
    format
  );
}

// ============================================================================
// Synchronisation Supabase -> Google Sheets (copie de consultation)
// ============================================================================

const SYNCHRONISATION_SUPABASE_SHEETS = Object.freeze({
  SECRET_PROPERTY: 'GDA_SUPABASE_SHEETS_SECRET',
  EFFECTIF_FINGERPRINT_PROPERTY: 'GDA_SUPABASE_SHEETS_EFFECTIF_EMPREINTE_V1',
  EFFECTIF_OFFICIER_SPREADSHEET_ID: '1IfPHHVFWeXva00F8innTY6a2wq8fj_PCwY2x2cljvj0',
  EFFECTIF_OFFICIER_SHEET: 'Effectif Global',
  EFFECTIF_TEMPLATE: '__MODELE_EFFECTIF_SUPABASE',
  ABSENCES_TEMPLATE: '__MODELE_ABSENCES_SUPABASE',
  DEPARTS_TEMPLATE: '__MODELE_DEPARTS_SUPABASE',
  EFFECTIF_ID_COLUMN: 17, // Q, masquée
  ABSENCES_ID_COLUMN: 8,  // H, masquée
  DEPARTS_ID_COLUMN: 14,  // N, masquée
  GRADES: Object.freeze([
    'Lieutenant-Colonel',
    'Commandant',
    'Vice-Commandant',
    'Capitaine',
    'Lieutenant',
    'Sous-Lieutenant',
    'Aspirant',
    'Major',
    'Adjudant-Chef',
    'Adjudant',
    'Sergent-Chef',
    'Sergent',
    'Caporal-Chef',
    'Caporal',
    'Ancien GDA'
  ])
});

function synchroniserGoogleSheetsDepuisSupabase_(chargeUtile) {
  const secretAttendu = propre_(
    PropertiesService.getScriptProperties()
      .getProperty(SYNCHRONISATION_SUPABASE_SHEETS.SECRET_PROPERTY)
  );
  const secretRecu = propre_(chargeUtile.secret);
  if (!secretAttendu || !secretRecu || !secretsSynchronisationEgaux_(secretAttendu, secretRecu)) {
    throw new Error('Authentification de la synchronisation refusée.');
  }
  if (
    !Array.isArray(chargeUtile.effectif) ||
    !Array.isArray(chargeUtile.absences) ||
    !Array.isArray(chargeUtile.departs)
  ) {
    throw new Error('Les données de synchronisation sont incomplètes.');
  }

  const verrou = LockService.getScriptLock();
  if (!verrou.tryLock(30000)) {
    throw new Error('Une autre synchronisation Google Sheets est déjà en cours.');
  }
  try {
    const proprietes = PropertiesService.getScriptProperties();
    const empreinteEffectif = empreinteEffectifSupabaseSheets_(chargeUtile.effectif);
    const effectifInchange = !chargeUtile.forcerEffectif &&
      proprietes.getProperty(SYNCHRONISATION_SUPABASE_SHEETS.EFFECTIF_FINGERPRINT_PROPERTY) ===
        empreinteEffectif;
    const resultatEffectif = effectifInchange
      ? { ignore: true, raison: 'effectif-inchange' }
      : synchroniserEffectifSupabaseSheets_(chargeUtile.effectif);
    const resultatEffectifOfficier = effectifInchange
      ? { ignore: true, raison: 'effectif-inchange' }
      : synchroniserEffectifOfficierSupabaseSheets_(chargeUtile.effectif);
    if (!effectifInchange) {
      proprietes.setProperty(
        SYNCHRONISATION_SUPABASE_SHEETS.EFFECTIF_FINGERPRINT_PROPERTY,
        empreinteEffectif
      );
    }
    const resultatAbsences = synchroniserAbsencesSupabaseSheets_(chargeUtile.absences);
    const resultatDeparts = synchroniserDepartsSupabaseSheets_(chargeUtile.departs);
    proprietes.setProperty(
      'GDA_SUPABASE_SHEETS_DERNIERE_SYNCHRONISATION',
      new Date().toISOString()
    );
    return {
      success: true,
      effectif: resultatEffectif,
      effectifOfficier: resultatEffectifOfficier,
      absences: resultatAbsences,
      departs: resultatDeparts,
      synchroniseLe: new Date().toISOString()
    };
  } finally {
    verrou.releaseLock();
  }
}

function synchroniserEffectifOfficierSupabaseSheets_(membres) {
  const c = SYNCHRONISATION_SUPABASE_SHEETS;
  const classeur = SpreadsheetApp.openById(c.EFFECTIF_OFFICIER_SPREADSHEET_ID);
  const feuille = classeur.getSheetByName(c.EFFECTIF_OFFICIER_SHEET);
  if (!feuille) {
    throw new Error(
      'Feuille « ' + c.EFFECTIF_OFFICIER_SHEET + ' » introuvable dans le document Officiers.'
    );
  }

  const classeurMemoire = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  const modeleMemoire = classeurMemoire.getSheetByName(c.EFFECTIF_TEMPLATE);
  if (!modeleMemoire) {
    throw new Error('Le modèle propre Effectif Global est introuvable dans le document mémoire.');
  }

  const modeleTemporaire = modeleMemoire.copyTo(classeur);
  modeleTemporaire.setName(
    '__MODELE_EFFECTIF_OFFICIERS_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10)
  );
  try {
    return synchroniserEffectifDansFeuilleSupabaseSheets_(
      membres,
      feuille,
      modeleTemporaire
    );
  } finally {
    classeur.deleteSheet(modeleTemporaire);
  }
}

function empreinteEffectifSupabaseSheets_(membres) {
  const contenu = JSON.stringify(membres || []);
  const octets = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    contenu,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(octets);
}

function normaliserMembresEffectifOfficier_(membres) {
  const c = SYNCHRONISATION_SUPABASE_SHEETS;
  const gradesConnus = {};
  c.GRADES.forEach(function (grade, index) {
    gradesConnus[normaliser_(grade)] = { grade: grade, ordre: index };
  });
  return membres.map(function (membre) {
    const gradeNormalise = normaliser_(membre.grade);
    if (!gradesConnus[gradeNormalise]) {
      throw new Error('Grade Supabase sans emplacement Officier : ' + propre_(membre.grade));
    }
    return {
      id: propre_(membre.id),
      matricule: propre_(membre.matricule),
      grade: gradesConnus[gradeNormalise].grade,
      ordreGrade: gradesConnus[gradeNormalise].ordre,
      steamId: propre_(membre.steamId),
      discordId: propre_(membre.discordId),
      presence: propre_(membre.presence) || 'Présent',
      rapports: Number(membre.rapports) || 0,
      observation: propre_(membre.observation),
      datePromotion: propre_(membre.datePromotion),
      dateEntree: propre_(membre.dateEntree),
      sanction: propre_(membre.sanction) || 'Clean',
      recommandation: propre_(membre.recommandation),
      notes: propre_(membre.notes),
      specialisations: listeSynchronisationSheet_(membre.specialisations),
      medailles: listeSynchronisationSheet_(membre.medailles)
    };
  }).filter(function (membre) {
    return membre.id && membre.matricule;
  }).sort(function (a, b) {
    if (a.ordreGrade !== b.ordreGrade) return a.ordreGrade - b.ordreGrade;
    return a.matricule.localeCompare(b.matricule, 'fr', { sensitivity: 'base' });
  });
}

function ligneEffectifOfficier_(membre) {
  return [
    sigleGradeSynchronisation_(membre.grade),
    membre.matricule,
    membre.grade,
    membre.steamId,
    membre.discordId,
    membre.presence,
    membre.rapports,
    membre.observation,
    dateSheetSynchronisation_(membre.datePromotion),
    dateSheetSynchronisation_(membre.dateEntree),
    membre.sanction,
    membre.recommandation,
    membre.notes,
    membre.specialisations,
    membre.medailles
  ];
}

function trouverLigneModeleEffectifOfficier_(feuille) {
  const debut = CONFIG.EFFECTIF.START;
  const fin = feuille.getLastRow();
  if (fin < debut) return 0;
  const valeurs = feuille.getRange(debut, 3, fin - debut + 1, 2).getDisplayValues();
  const grades = SYNCHRONISATION_SUPABASE_SHEETS.GRADES.map(normaliser_);
  for (let index = 0; index < valeurs.length; index++) {
    if (propre_(valeurs[index][0]) && grades.indexOf(normaliser_(valeurs[index][1])) !== -1) {
      return debut + index;
    }
  }
  return 0;
}

function trouverBlocGradeEffectifOfficier_(feuille, grade) {
  const entete = trouverLigneEnteteGradeSynchronisation_(feuille, grade);
  if (!entete) return null;
  const structures = lignesStructureEffectifOfficier_(feuille);
  let prochaine = feuille.getLastRow() + 1;
  structures.forEach(function (ligne) {
    if (ligne > entete && ligne < prochaine) prochaine = ligne;
  });
  return {
    entete: entete,
    debut: entete + 1,
    fin: prochaine - 1
  };
}

function lignesStructureEffectifOfficier_(feuille) {
  const fin = feuille.getLastRow();
  if (!fin) return [];
  const valeurs = feuille.getRange(1, 2, fin, 15).getDisplayValues();
  const grades = SYNCHRONISATION_SUPABASE_SHEETS.GRADES.map(normaliser_);
  const categories = [
    'OFFICIERS SUPERIEURS GDA',
    'OFFICIERS GDA',
    'SOUS OFFICIERS GDA',
    'HOMMES DU RANG GDA'
  ];
  const lignes = [];
  valeurs.forEach(function (ligne, index) {
    const estCategorie = ligne.some(function (valeur) {
      const texte = normaliser_(valeur);
      if (!texte) return false;
      return categories.some(function (categorie) { return texte.indexOf(categorie) !== -1; });
    });
    if (estCategorie) {
      lignes.push(index + 1);
      return;
    }

    // Dans B:P, C contient le matricule et D le grade sur une ligne membre.
    // Une telle ligne ne doit jamais etre confondue avec une entete de grade.
    const estLigneMembre = propre_(ligne[1]) &&
      grades.indexOf(normaliser_(ligne[2])) !== -1;
    if (estLigneMembre) return;

    const estEnteteGrade = ligne.some(function (valeur) {
      const texte = normaliser_(valeur);
      return grades.some(function (grade) {
        return texte === grade || texte.indexOf(grade + ' - ') === 0;
      });
    });
    if (estEnteteGrade) lignes.push(index + 1);
  });
  return lignes;
}

function assurerEmplacementsGradeEffectifOfficier_(feuille, grade, necessaires, ligneModele) {
  if (!necessaires) return;
  let bloc = trouverBlocGradeEffectifOfficier_(feuille, grade);
  if (!bloc) {
    throw new Error('Entete du grade « ' + grade + ' » introuvable dans l’effectif Officier.');
  }
  const disponibles = Math.max(0, bloc.fin - bloc.debut + 1);
  const manque = necessaires - disponibles;
  if (manque <= 0) return;

  const apres = bloc.entete + disponibles;
  feuille.insertRowsAfter(apres, manque);
  for (let index = 0; index < manque; index++) {
    copierPresentationLigneSynchronisation_(
      feuille,
      ligneModele,
      feuille,
      apres + index + 1,
      1,
      Math.min(16, feuille.getMaxColumns())
    );
  }
}

function ecrirePlageSansEcraserFormulesEffectifOfficier_(plage, valeurs) {
  const formules = plage.getFormulas();
  const contientFormule = formules.some(function (ligne) {
    return ligne.some(function (formule) { return !!formule; });
  });
  if (!contientFormule) {
    plage.setValues(valeurs);
    return;
  }

  // Cas defensif : une future formule ajoutee dans la grille reste intacte.
  valeurs.forEach(function (ligne, indexLigne) {
    let debutSegment = -1;
    for (let colonne = 0; colonne <= ligne.length; colonne++) {
      const libre = colonne < ligne.length && !formules[indexLigne][colonne];
      if (libre && debutSegment === -1) debutSegment = colonne;
      if ((!libre || colonne === ligne.length) && debutSegment !== -1) {
        const segment = ligne.slice(debutSegment, colonne);
        plage.getSheet().getRange(
          plage.getRow() + indexLigne,
          plage.getColumn() + debutSegment,
          1,
          segment.length
        ).setValues([segment]);
        debutSegment = -1;
      }
    }
  });
}

function actualiserCompteurEnteteSansFormuleEffectifOfficier_(feuille, ligne, grade, nombre) {
  const plage = feuille.getRange(ligne, 2, 1, 15);
  const valeurs = plage.getDisplayValues()[0];
  const formules = plage.getFormulas()[0];
  const cible = normaliser_(grade);
  for (let index = 0; index < valeurs.length; index++) {
    const texte = propre_(valeurs[index]);
    const normalise = normaliser_(texte);
    if (normalise === cible || normalise.indexOf(cible + ' -') === 0) {
      if (formules[index]) return;
      feuille.getRange(ligne, index + 2).setValue(
        /\d+\s*\/\s*[^\s]+/.test(texte)
          ? texte.replace(/\d+\s*\/\s*([^\s]+)/, nombre + '/$1')
          : grade + ' - ' + nombre
      );
      return;
    }
  }
}

function synchroniserEffectifSupabaseSheets_(membres) {
  const c = SYNCHRONISATION_SUPABASE_SHEETS;
  const feuille = feuille_(CONFIG.EFFECTIF.SHEET);
  const modele = assurerModeleSynchronisationSheet_(feuille, c.EFFECTIF_TEMPLATE);
  return synchroniserEffectifDansFeuilleSupabaseSheets_(membres, feuille, modele);
}

function synchroniserEffectifDansFeuilleSupabaseSheets_(membres, feuille, modele) {
  const c = SYNCHRONISATION_SUPABASE_SHEETS;
  assurerColonnesSynchronisationSheet_(feuille, c.EFFECTIF_ID_COLUMN);
  feuille.hideColumns(c.EFFECTIF_ID_COLUMN);

  const gradesConnus = {};
  c.GRADES.forEach(function (grade, index) {
    gradesConnus[normaliser_(grade)] = { grade: grade, ordre: index };
  });
  const membresPropres = membres.map(function (membre) {
    const gradeNormalise = normaliser_(membre.grade);
    if (!gradesConnus[gradeNormalise]) {
      throw new Error('Grade Supabase sans emplacement dans Effectif Global : ' + propre_(membre.grade));
    }
    return {
      id: propre_(membre.id),
      matricule: propre_(membre.matricule),
      grade: gradesConnus[gradeNormalise].grade,
      ordreGrade: gradesConnus[gradeNormalise].ordre,
      steamId: propre_(membre.steamId),
      discordId: propre_(membre.discordId),
      presence: propre_(membre.presence) || 'Présent',
      rapports: Number(membre.rapports) || 0,
      observation: propre_(membre.observation),
      datePromotion: propre_(membre.datePromotion),
      dateEntree: propre_(membre.dateEntree),
      sanction: propre_(membre.sanction) || 'Clean',
      recommandation: propre_(membre.recommandation),
      notes: propre_(membre.notes),
      specialisations: listeSynchronisationSheet_(membre.specialisations),
      medailles: listeSynchronisationSheet_(membre.medailles)
    };
  }).filter(function (membre) {
    return membre.id && membre.matricule;
  }).sort(function (a, b) {
    if (a.ordreGrade !== b.ordreGrade) return a.ordreGrade - b.ordreGrade;
    return a.matricule.localeCompare(b.matricule, 'fr', { sensitivity: 'base' });
  });

  const gradesUtilises = {};
  membresPropres.forEach(function (membre) {
    gradesUtilises[normaliser_(membre.grade)] = true;
  });
  Object.keys(gradesUtilises).forEach(function (gradeNormalise) {
    const grade = gradesConnus[gradeNormalise].grade;
    if (!trouverLigneEnteteGradeSynchronisation_(feuille, grade)) {
      throw new Error('La ligne modèle du grade « ' + grade + ' » est introuvable.');
    }
  });
  if (!trouverPremiereLigneMembreModeleSynchronisation_(modele, c.GRADES)) {
    throw new Error('Aucune ligne membre n’est disponible dans le modèle Effectif Global.');
  }

  const idsAttendus = {};
  membresPropres.forEach(function (membre) {
    idsAttendus['membre:' + membre.id] = true;
  });
  const lignesSupprimees = supprimerMembresAbsentsEffectifSynchronisation_(
    feuille,
    idsAttendus,
    c.EFFECTIF_ID_COLUMN
  );
  let lignesAjoutees = 0;
  let lignesDeplacees = 0;
  let lignesActualisees = 0;

  c.GRADES.forEach(function (grade) {
    const membresGrade = membresPropres.filter(function (membre) {
      return normaliser_(membre.grade) === normaliser_(grade);
    });
    let ligneEntete = trouverLigneEnteteGradeSynchronisation_(feuille, grade);
    if (!ligneEntete) return;
    actualiserCompteurEnteteSynchronisation_(feuille, ligneEntete, grade, membresGrade.length);
    const ligneModele = trouverLigneMembreModeleSynchronisation_(modele, grade) ||
      trouverPremiereLigneMembreModeleSynchronisation_(modele, c.GRADES);
    membresGrade.forEach(function (membre, index) {
      const id = 'membre:' + membre.id;
      let ligneCible = ligneEntete + index + 1;
      const ligneActuelle = trouverLigneMembreParIdSynchronisation_(
        feuille,
        id,
        c.EFFECTIF_ID_COLUMN
      );
      if (ligneActuelle !== ligneCible) {
        if (ligneActuelle) {
          feuille.deleteRow(ligneActuelle);
          lignesDeplacees++;
        } else {
          lignesAjoutees++;
        }
        ligneEntete = trouverLigneEnteteGradeSynchronisation_(feuille, grade);
        ligneCible = ligneEntete + index + 1;
        feuille.insertRowBefore(ligneCible);
        copierPresentationLigneSynchronisation_(modele, ligneModele, feuille, ligneCible, 1, 16);
      }
      const valeursAttendues = [
        sigleGradeSynchronisation_(membre.grade),
        membre.matricule,
        membre.grade,
        membre.steamId,
        membre.discordId,
        membre.presence,
        membre.rapports,
        membre.observation,
        dateSheetSynchronisation_(membre.datePromotion),
        dateSheetSynchronisation_(membre.dateEntree),
        membre.sanction,
        membre.recommandation,
        membre.notes,
        membre.specialisations,
        membre.medailles
      ];
      const plage = feuille.getRange(ligneCible, 2, 1, 15);
      if (!valeursEffectifSynchronisationEgales_(plage.getValues()[0], valeursAttendues)) {
        plage.setValues([valeursAttendues]);
        lignesActualisees++;
      }
      if (propre_(feuille.getRange(ligneCible, c.EFFECTIF_ID_COLUMN).getValue()) !== id) {
        feuille.getRange(ligneCible, c.EFFECTIF_ID_COLUMN).setValue(id);
      }
    });
  });

  actualiserCompteursCategoriesEffectifSynchronisation_(feuille, membresPropres);
  return {
    total: membresPropres.length,
    ajoutees: lignesAjoutees,
    deplacees: lignesDeplacees,
    actualisees: lignesActualisees,
    supprimees: lignesSupprimees,
    versionTri: 'incremental-v1'
  };
}

function synchroniserAbsencesSupabaseSheets_(absences) {
  const c = SYNCHRONISATION_SUPABASE_SHEETS;
  const feuille = feuille_(CONFIG.ABSENCES.SHEET);
  const modele = assurerModeleSynchronisationSheet_(feuille, c.ABSENCES_TEMPLATE);
  assurerColonnesSynchronisationSheet_(feuille, c.ABSENCES_ID_COLUMN);
  feuille.hideColumns(c.ABSENCES_ID_COLUMN);

  const donnees = absences.map(function (absence) {
    return {
      id: 'absence:' + propre_(absence.id),
      valeurs: [
        propre_(absence.matricule),
        propre_(absence.grade),
        dateSheetSynchronisation_(absence.dateDebut),
        dateSheetSynchronisation_(absence.dateFin),
        propre_(absence.raison),
        propre_(absence.statut),
        propre_(absence.auteur)
      ],
      dateTri: propre_(absence.dateDebut)
    };
  }).filter(function (absence) {
    return absence.id !== 'absence:' && absence.valeurs[0];
  });

  return fusionnerArchiveSynchronisation_({
    feuille: feuille,
    modele: modele,
    debut: CONFIG.ABSENCES.START,
    colonneId: c.ABSENCES_ID_COLUMN,
    premiereColonne: 1,
    nombreColonnes: 7,
    donnees: donnees,
    cleVisible: cleAbsenceSynchronisation_
  });
}

function synchroniserDepartsSupabaseSheets_(departs) {
  const c = SYNCHRONISATION_SUPABASE_SHEETS;
  const feuille = feuille_(CONFIG.DEPARTS.SHEET);
  const modele = assurerModeleSynchronisationSheet_(feuille, c.DEPARTS_TEMPLATE);
  assurerColonnesSynchronisationSheet_(feuille, c.DEPARTS_ID_COLUMN);
  feuille.hideColumns(c.DEPARTS_ID_COLUMN);

  const donnees = departs.map(function (depart) {
    return {
      id: 'depart:' + propre_(depart.id),
      valeurs: [
        propre_(depart.matricule),
        propre_(depart.grade),
        propre_(depart.type),
        propre_(depart.steamId),
        propre_(depart.discordId),
        dateSheetSynchronisation_(depart.dateDebut),
        dateSheetSynchronisation_(depart.dateFin),
        propre_(depart.raison),
        propre_(depart.statut),
        propre_(depart.auteur),
        listeSynchronisationSheet_(depart.medailles),
        dateHeureSheetSynchronisation_(depart.medaillesRestaureesLe)
      ],
      dateTri: propre_(depart.dateDebut)
    };
  }).filter(function (depart) {
    return depart.id !== 'depart:' && depart.valeurs[0];
  });

  return fusionnerArchiveSynchronisation_({
    feuille: feuille,
    modele: modele,
    debut: CONFIG.DEPARTS.START,
    colonneId: c.DEPARTS_ID_COLUMN,
    premiereColonne: 2,
    nombreColonnes: 12,
    donnees: donnees,
    cleVisible: cleDepartSynchronisation_,
    colonneFormule: CONFIG.DEPARTS.STATUT
  });
}

function fusionnerArchiveSynchronisation_(options) {
  const feuille = options.feuille;
  const derniereLigne = feuille.getLastRow();
  const nombreExistant = Math.max(0, derniereLigne - options.debut + 1);
  const lignesExistantes = nombreExistant
    ? feuille.getRange(options.debut, 1, nombreExistant, options.colonneId).getValues()
    : [];
  const indexIds = {};
  const indexCles = {};

  lignesExistantes.forEach(function (ligne, index) {
    const numeroLigne = options.debut + index;
    const id = propre_(ligne[options.colonneId - 1]);
    if (id) indexIds[id] = numeroLigne;
    const visible = ligne.slice(
      options.premiereColonne - 1,
      options.premiereColonne - 1 + options.nombreColonnes
    );
    const cle = options.cleVisible(visible);
    if (cle) {
      if (!indexCles[cle]) indexCles[cle] = [];
      indexCles[cle].push(numeroLigne);
    }
  });

  let actualisees = 0;
  let rapprochees = 0;
  const nouvelles = [];
  options.donnees.forEach(function (element) {
    let ligne = indexIds[element.id] || 0;
    if (!ligne) {
      const cle = options.cleVisible(element.valeurs);
      const candidates = indexCles[cle] || [];
      ligne = candidates.length ? candidates.shift() : 0;
      if (ligne) rapprochees++;
    }
    if (!ligne) {
      nouvelles.push(element);
      return;
    }
    ecrireLigneArchiveSynchronisation_(options, ligne, element);
    actualisees++;
  });

  nouvelles.sort(function (a, b) {
    return String(a.dateTri).localeCompare(String(b.dateTri));
  }).forEach(function (element) {
    feuille.insertRowBefore(options.debut);
    copierPresentationLigneSynchronisation_(
      options.modele,
      options.debut,
      feuille,
      options.debut,
      1,
      options.colonneId
    );
    if (options.colonneFormule) {
      const formuleModele = options.modele
        .getRange(options.debut, options.colonneFormule)
        .getFormulaR1C1();
      if (formuleModele) {
        feuille.getRange(options.debut, options.colonneFormule).setFormulaR1C1(formuleModele);
      }
    }
    ecrireLigneArchiveSynchronisation_(options, options.debut, element);
  });

  return {
    totalSupabase: options.donnees.length,
    actualisees: actualisees,
    rapprochees: rapprochees,
    ajoutees: nouvelles.length,
    supprimees: 0
  };
}

function ecrireLigneArchiveSynchronisation_(options, ligne, element) {
  const valeurs = element.valeurs.slice();
  if (options.colonneFormule) {
    const positionStatut = options.colonneFormule - options.premiereColonne;
    const statut = valeurs[positionStatut];
    const avantStatut = valeurs.slice(0, positionStatut);
    const apresStatut = valeurs.slice(positionStatut + 1);
    if (avantStatut.length) {
      options.feuille.getRange(
        ligne,
        options.premiereColonne,
        1,
        avantStatut.length
      ).setValues([avantStatut]);
    }
    if (apresStatut.length) {
      options.feuille.getRange(
        ligne,
        options.colonneFormule + 1,
        1,
        apresStatut.length
      ).setValues([apresStatut]);
    }
    const celluleStatut = options.feuille.getRange(ligne, options.colonneFormule);
    if (!celluleStatut.getFormula()) celluleStatut.setValue(statut);
  } else {
    options.feuille.getRange(
      ligne,
      options.premiereColonne,
      1,
      options.nombreColonnes
    ).setValues([valeurs]);
  }
  options.feuille.getRange(ligne, options.colonneId).setValue(element.id);
}

function assurerModeleSynchronisationSheet_(feuille, nomModele) {
  const classeur = feuille.getParent();
  let modele = classeur.getSheetByName(nomModele);
  if (!modele) {
    modele = feuille.copyTo(classeur).setName(nomModele);
    modele.hideSheet();
  }
  return modele;
}

function assurerColonnesSynchronisationSheet_(feuille, derniereColonne) {
  const manque = derniereColonne - feuille.getMaxColumns();
  if (manque > 0) feuille.insertColumnsAfter(feuille.getMaxColumns(), manque);
}

function copierPresentationLigneSynchronisation_(modele, ligneModele, feuille, ligneCible, debut, fin) {
  const nombreColonnes = fin - debut + 1;
  const source = modele.getRange(ligneModele, debut, 1, nombreColonnes);
  const cible = feuille.getRange(ligneCible, debut, 1, nombreColonnes);
  source.copyTo(cible, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  source.copyTo(cible, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
  feuille.setRowHeight(ligneCible, modele.getRowHeight(ligneModele));
}

function supprimerLignesMembresEffectifSynchronisation_(feuille, grades) {
  const gradesNormalises = {};
  grades.forEach(function (grade) { gradesNormalises[normaliser_(grade)] = true; });
  const debut = CONFIG.EFFECTIF.START;
  const fin = feuille.getLastRow();
  if (fin < debut) return;
  const valeurs = feuille.getRange(debut, CONFIG.EFFECTIF.MATRICULE, fin - debut + 1, 2)
    .getDisplayValues();
  for (let index = valeurs.length - 1; index >= 0; index--) {
    if (propre_(valeurs[index][0]) && gradesNormalises[normaliser_(valeurs[index][1])]) {
      feuille.deleteRow(debut + index);
    }
  }
}

function supprimerMembresAbsentsEffectifSynchronisation_(feuille, idsAttendus, colonneId) {
  const debut = CONFIG.EFFECTIF.START;
  const fin = feuille.getLastRow();
  if (fin < debut) return 0;
  const ids = feuille.getRange(debut, colonneId, fin - debut + 1, 1).getDisplayValues();
  let supprimees = 0;
  for (let index = ids.length - 1; index >= 0; index--) {
    const id = propre_(ids[index][0]);
    if (id.indexOf('membre:') === 0 && !idsAttendus[id]) {
      feuille.deleteRow(debut + index);
      supprimees++;
    }
  }
  return supprimees;
}

function trouverLigneMembreParIdSynchronisation_(feuille, id, colonneId) {
  const debut = CONFIG.EFFECTIF.START;
  const fin = feuille.getLastRow();
  if (fin < debut) return 0;
  const ids = feuille.getRange(debut, colonneId, fin - debut + 1, 1).getDisplayValues();
  for (let index = 0; index < ids.length; index++) {
    if (propre_(ids[index][0]) === id) return debut + index;
  }
  return 0;
}

function valeursEffectifSynchronisationEgales_(actuelles, attendues) {
  if (actuelles.length !== attendues.length) return false;
  for (let index = 0; index < attendues.length; index++) {
    const actuelle = actuelles[index];
    const attendue = attendues[index];
    if (actuelle instanceof Date || attendue instanceof Date) {
      if (cleDateSynchronisation_(actuelle) !== cleDateSynchronisation_(attendue)) return false;
    } else if (propre_(actuelle) !== propre_(attendue)) {
      return false;
    }
  }
  return true;
}

function trouverLigneEnteteGradeSynchronisation_(feuille, grade) {
  const debut = 4;
  const fin = feuille.getLastRow();
  if (fin < debut) return 0;
  const valeurs = feuille.getRange(debut, 2, fin - debut + 1, 15).getDisplayValues();
  const cible = normaliser_(grade);
  for (let index = 0; index < valeurs.length; index++) {
    for (let colonne = 0; colonne < valeurs[index].length; colonne++) {
      const texte = normaliser_(valeurs[index][colonne]);
      if (
        texte === cible ||
        texte.indexOf(cible + ' - ') === 0
      ) {
        const matricule = propre_(valeurs[index][CONFIG.EFFECTIF.MATRICULE - 2]);
        const gradeMembre = propre_(valeurs[index][CONFIG.EFFECTIF.GRADE - 2]);
        if (!(normaliser_(matricule) !== cible && normaliser_(gradeMembre) === cible)) {
          return debut + index;
        }
      }
    }
  }
  return 0;
}

function trouverLigneMembreModeleSynchronisation_(modele, grade) {
  const debut = CONFIG.EFFECTIF.START;
  const fin = modele.getLastRow();
  if (fin < debut) return 0;
  const valeurs = modele.getRange(debut, CONFIG.EFFECTIF.MATRICULE, fin - debut + 1, 2)
    .getDisplayValues();
  const cible = normaliser_(grade);
  for (let index = 0; index < valeurs.length; index++) {
    if (propre_(valeurs[index][0]) && normaliser_(valeurs[index][1]) === cible) {
      return debut + index;
    }
  }
  return 0;
}

function trouverPremiereLigneMembreModeleSynchronisation_(modele, grades) {
  for (let index = 0; index < grades.length; index++) {
    const ligne = trouverLigneMembreModeleSynchronisation_(modele, grades[index]);
    if (ligne) return ligne;
  }
  return 0;
}

function actualiserCompteurEnteteSynchronisation_(feuille, ligne, grade, nombre) {
  const valeurs = feuille.getRange(ligne, 2, 1, 15).getDisplayValues()[0];
  const cible = normaliser_(grade);
  for (let index = 0; index < valeurs.length; index++) {
    const texte = propre_(valeurs[index]);
    const normalise = normaliser_(texte);
    if (normalise === cible || normalise.indexOf(cible + ' -') === 0) {
      const nouveau = /\d+\s*\/\s*[^\s]+/.test(texte)
        ? texte.replace(/\d+\s*\/\s*([^\s]+)/, nombre + '/$1')
        : grade + ' - ' + nombre;
      if (nouveau !== texte) feuille.getRange(ligne, index + 2).setValue(nouveau);
      return;
    }
  }
}

function actualiserCompteursCategoriesEffectifSynchronisation_(feuille, membres) {
  const groupes = [
    { mots: ['OFFICIERS SUPERIEURS GDA'], grades: ['Lieutenant-Colonel', 'Commandant', 'Vice-Commandant'] },
    { mots: ['OFFICIERS GDA'], grades: ['Capitaine', 'Lieutenant', 'Sous-Lieutenant', 'Aspirant'] },
    { mots: ['SOUS OFFICIERS GDA'], grades: ['Major', 'Adjudant-Chef', 'Adjudant', 'Sergent-Chef', 'Sergent'] },
    { mots: ['HOMMES DU RANG GDA'], grades: ['Caporal-Chef', 'Caporal'] }
  ];
  const fin = feuille.getLastRow();
  const valeurs = feuille.getRange(1, 2, fin, 15).getDisplayValues();
  groupes.forEach(function (groupe) {
    const nombre = membres.filter(function (membre) {
      return groupe.grades.some(function (grade) {
        return normaliser_(grade) === normaliser_(membre.grade);
      });
    }).length;
    for (let ligne = 0; ligne < valeurs.length; ligne++) {
      let trouve = false;
      for (let colonne = 0; colonne < valeurs[ligne].length; colonne++) {
        const texte = propre_(valeurs[ligne][colonne]);
        if (groupe.mots.some(function (mot) { return normaliser_(texte).indexOf(mot) !== -1; })) {
          const cellule = feuille.getRange(ligne + 1, colonne + 2);
          if (!cellule.getFormula()) {
            const nouveau = /\d+\s*\/\s*[^\s]+/.test(texte)
              ? texte.replace(/\d+\s*\/\s*([^\s]+)/, nombre + '/$1')
              : texte;
            if (nouveau !== texte) cellule.setValue(nouveau);
          }
          trouve = true;
          break;
        }
      }
      if (trouve) break;
    }
  });
}

function sigleGradeSynchronisation_(grade) {
  const index = SYNCHRONISATION_SUPABASE_SHEETS.GRADES
    .map(normaliser_)
    .indexOf(normaliser_(grade));
  if (index >= 0 && index <= 2) return 'OFFSUP';
  if (index >= 3 && index <= 6) return 'OFF';
  if (index >= 7 && index <= 11) return 'SO';
  if (index >= 12 && index <= 13) return 'HDR';
  return '';
}

function cleAbsenceSynchronisation_(valeurs) {
  if (!propre_(valeurs[0])) return '';
  return [
    normaliser_(valeurs[0]),
    normaliser_(valeurs[1]),
    cleDateSynchronisation_(valeurs[2]),
    cleDateSynchronisation_(valeurs[3]),
    normaliser_(valeurs[4])
  ].join('|');
}

function cleDepartSynchronisation_(valeurs) {
  if (!propre_(valeurs[0])) return '';
  return [
    normaliser_(valeurs[0]),
    normaliser_(valeurs[1]),
    normaliser_(valeurs[2]),
    propre_(valeurs[3]),
    propre_(valeurs[4]),
    cleDateSynchronisation_(valeurs[5]),
    cleDateSynchronisation_(valeurs[6]),
    normaliser_(valeurs[7])
  ].join('|');
}

function cleDateSynchronisation_(valeur) {
  if (valeur instanceof Date && !isNaN(valeur.getTime())) {
    return Utilities.formatDate(valeur, 'Europe/Paris', 'yyyy-MM-dd');
  }
  const texte = propre_(valeur);
  if (/^\d{4}-\d{2}-\d{2}$/.test(texte)) return texte;
  const francaise = texte.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return francaise
    ? francaise[3] + '-' + ('0' + francaise[2]).slice(-2) + '-' + ('0' + francaise[1]).slice(-2)
    : texte;
}

function dateSheetSynchronisation_(valeur) {
  const texte = propre_(valeur);
  if (!texte) return '';
  const iso = texte.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!iso) return valeur;
  return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12, 0, 0);
}

function dateHeureSheetSynchronisation_(valeur) {
  const texte = propre_(valeur);
  if (!texte) return '';
  const date = new Date(texte);
  return isNaN(date.getTime()) ? valeur : date;
}

function listeSynchronisationSheet_(valeur) {
  if (Array.isArray(valeur)) {
    return valeur.map(propre_).filter(Boolean).join(', ');
  }
  return propre_(valeur);
}

function secretsSynchronisationEgaux_(a, b) {
  const empreinteA = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    a,
    Utilities.Charset.UTF_8
  );
  const empreinteB = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    b,
    Utilities.Charset.UTF_8
  );
  if (empreinteA.length !== empreinteB.length) return false;
  let difference = 0;
  for (let index = 0; index < empreinteA.length; index++) {
    difference |= empreinteA[index] ^ empreinteB[index];
  }
  return difference === 0;
}
