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

function doGet(e) {
  const p = (e && e.parameter) || {};

  if (!p.action && (p.code || p.error || p.state)) {
    try {
      return traiterRetourDiscordOAuth_(p);
    } catch (erreur) {
      console.error(erreur && erreur.stack ? erreur.stack : erreur);
      const resultatErreur = {
        success: false,
        message: erreur && erreur.message
          ? erreur.message
          : 'La connexion Discord a échoué.'
      };
      enregistrerResultatDiscordOAuth_(p.state, resultatErreur);
      return pageRetourDiscordOAuth_(resultatErreur);
    }
  }

  try {
    const action = propre_(p.action);
    const routes = {
      preparerConnexionDiscord: preparerConnexionDiscord,
      recupererConnexionDiscord: recupererConnexionDiscord,
      finaliserConnexionDiscord: finaliserConnexionDiscord,
      restaurerSessionDiscord: restaurerSessionDiscord,
      presenceEnLigne: presenceEnLigne,
      definirDefcon: definirDefcon,
      recupererVersionDonnees: recupererVersionDonnees,
      recupererEffectif: recupererEffectif,
      recupererRecommandationsObservations: recupererRecommandationsObservations,
      ajouterRecommandationObservation: ajouterRecommandationObservation,
      modifierRecommandationObservation: modifierRecommandationObservation,
      purgerRecommandationsObservations: purgerRecommandationsObservations,
      recupererEffectifPublic: recupererEffectifPublic,
      actualiserEffectifPublic: actualiserEffectifPublic,
      enregistrerNote: enregistrerNote,
      modifierMembreEffectif: modifierMembreEffectif,
      ajouterMembreEffectif: ajouterMembreEffectif,
      recupererDisponibilites: recupererDisponibilites,
      recupererMesDemandesAbsence: recupererMesDemandesAbsence,
      ajouterDemandeAbsence: ajouterDemandeAbsence,
      modifierDemandeAbsence: modifierDemandeAbsence,
      supprimerDemandeAbsence: supprimerDemandeAbsence,
      terminerDemandeAbsence: terminerDemandeAbsence,
      traiterDemandeAbsence: traiterDemandeAbsence,
      recupererNotifications: recupererNotifications,
      marquerNotificationsLues: marquerNotificationsLues,
      effacerNotifications: effacerNotifications,
      ajouterAbsence: ajouterAbsence,
      modifierAbsence: modifierAbsence,
      retourAnticipe: retourAnticipe,
      supprimerAbsence: supprimerAbsence,
      recupererDeparts: recupererDeparts,
      ajouterDepart: ajouterDepart,
      modifierDepart: modifierDepart,
      supprimerDepart: supprimerDepart,
      recupererRapports: recupererRapports,
      ajouterRapport: ajouterRapport,
      ajouterRapportDiscord: ajouterRapportDiscord,
      recupererMesRapports: recupererMesRapports,
      ajouterMonRapport: ajouterMonRapport,
      modifierMonRapport: modifierMonRapport,
      supprimerMonRapport: supprimerMonRapport,
      changerStatutRapport: changerStatutRapport,
      archiverTousRapportsLus: archiverTousRapportsLus,
      supprimerRapport: supprimerRapport,
      recupererGestionPersonnel: recupererGestionPersonnel,
      appliquerGestionPersonnel: appliquerGestionPersonnel,
      modifierLogGestionPersonnel: modifierLogGestionPersonnel,
      supprimerLogGestionPersonnel: supprimerLogGestionPersonnel,
      recupererAdministration: recupererAdministration,
      recupererListeBlanche: recupererListeBlanche,
      ajouterListeBlanche: ajouterListeBlanche,
      modifierListeBlanche: modifierListeBlanche,
      supprimerListeBlanche: supprimerListeBlanche,
      recupererJournalActions: recupererJournalActions,
      recupererArchivesInstructeur: recupererArchivesInstructeur,
      supprimerArchiveInstructeur: supprimerArchiveInstructeur,
      recupererRapportsInstructeur: recupererRapportsInstructeur,
      modifierRapportInstructeur: modifierRapportInstructeur,
      supprimerRapportInstructeur: supprimerRapportInstructeur,
      verifierMatriculeRapportTestInstructeur: verifierMatriculeRapportTestInstructeur,
      enregistrerRapportTestInstructeur: enregistrerRapportTestInstructeur,
      enregistrerRapportFormationInstructeur: enregistrerRapportFormationInstructeur,
      recupererCandidatsRapportFormationInstructeur: recupererCandidatsRapportFormationInstructeur,
      recupererSuivisFormationInstructeur: recupererSuivisFormationInstructeur,
      recupererMesSuivisInstructeur: recupererMesSuivisInstructeur,
      mettreAJourMonSuiviInstructeur: mettreAJourMonSuiviInstructeur,
      ajouterSuiviFormationInstructeur: ajouterSuiviFormationInstructeur,
      demarrerSuiviFormationInstructeur: demarrerSuiviFormationInstructeur,
      modifierSuiviFormationInstructeur: modifierSuiviFormationInstructeur,
      supprimerSuiviFormationInstructeur: supprimerSuiviFormationInstructeur,
      transfererGeranceSuiviFormationInstructeur: transfererGeranceSuiviFormationInstructeur,
      deciderSuiviFormationInstructeur: deciderSuiviFormationInstructeur,
      supprimerJournalAction: supprimerJournalAction,
      viderJournalActions: viderJournalActions,
      enregistrerPermissions: enregistrerPermissions,
      definirCoproprietaire: definirCoproprietaire,
      transfererPropriete: transfererPropriete
    };

    if (!routes[action]) {
      return json_({ success: false, message: 'Action inconnue : ' + action });
    }

    if (
      action !== 'preparerConnexionDiscord' &&
      action !== 'recupererConnexionDiscord' &&
      action !== 'finaliserConnexionDiscord' &&
      action !== 'restaurerSessionDiscord'
    ) {
      const session = exigerSessionDiscord_(p.sessionToken, p.identifiant);
      p.identifiant = session.matricule;
      const membreSession = exigerConnexion_(session.matricule);
      const estVisiteur = permissionsBrutesMembre_(membreSession)
        .includes(PERMISSIONS_GDA.ROLE_VISITEUR);
      const actionLectureSeule = action === 'presenceEnLigne' ||
        action.indexOf('recuperer') === 0 ||
        action.indexOf('verifier') === 0;
      if (estVisiteur && !actionLectureSeule) {
        throw new Error('Le rôle Visiteur autorise uniquement la consultation.');
      }
      const actionsAccessiblesMembres = [
        'presenceEnLigne',
        'definirDefcon',
        'recupererVersionDonnees',
        'recupererEffectifPublic',
        'actualiserEffectifPublic',
        'recupererMesRapports',
        'ajouterMonRapport',
        'modifierMonRapport',
        'supprimerMonRapport',
        'recupererMesDemandesAbsence',
        'ajouterDemandeAbsence',
        'modifierDemandeAbsence',
        'supprimerDemandeAbsence',
        'terminerDemandeAbsence',
        'recupererNotifications',
        'marquerNotificationsLues',
        'effacerNotifications',
        'recupererArchivesInstructeur',
        'supprimerArchiveInstructeur',
        'recupererRapportsInstructeur',
        'modifierRapportInstructeur',
        'supprimerRapportInstructeur',
        'verifierMatriculeRapportTestInstructeur',
        'enregistrerRapportTestInstructeur',
        'enregistrerRapportFormationInstructeur',
        'recupererCandidatsRapportFormationInstructeur',
        'recupererSuivisFormationInstructeur',
        'recupererMesSuivisInstructeur',
        'mettreAJourMonSuiviInstructeur',
        'ajouterSuiviFormationInstructeur',
        'demarrerSuiviFormationInstructeur',
        'modifierSuiviFormationInstructeur',
        'supprimerSuiviFormationInstructeur',
        'transfererGeranceSuiviFormationInstructeur',
        'deciderSuiviFormationInstructeur'
      ];
      if (!actionsAccessiblesMembres.includes(action)) {
        const actionsAdministration = [
          'recupererAdministration',
          'enregistrerPermissions',
          'recupererJournalActions',
          'supprimerJournalAction',
          'viderJournalActions',
          'recupererListeBlanche',
          'ajouterListeBlanche',
          'modifierListeBlanche',
          'supprimerListeBlanche'
        ];
        const accesAdministration =
          actionsAdministration.includes(action) &&
          utilisateurAPermission_(membreSession, PERMISSIONS_GDA.ADMINISTRATION_STAFF);
        if (!estVisiteur && !accesAdministration && !membrePossedeRoleStaffTotal_(membreSession)) {
          exigerOfficierGDA_(membreSession, 'accéder à ce module');
        }
      }
    }
    const resultat = routes[action](p);
    if (!resultat || resultat.success !== false) {
      marquerRevisionDonneesGDA_(action);
      enregistrerJournalActionEnSilence_(action, p, resultat);
    }
    return json_(resultat);
  } catch (erreur) {
    console.error(erreur && erreur.stack ? erreur.stack : erreur);
    return json_({
      success: false,
      message: erreur && erreur.message ? erreur.message : 'Erreur serveur.'
    });
  }
}

function doPost(e) {
  return doGet(e);
}

/**
 * Réponse volontairement très légère utilisée par le navigateur pour savoir
 * si des données ont changé. Elle évite de relire toutes les feuilles tant
 * qu'aucune action d'écriture n'a été effectuée.
 */
function recupererVersionDonnees() {
  const proprietes = PropertiesService.getScriptProperties();
  return {
    success: true,
    revision: Number(proprietes.getProperty(CLE_REVISION_DONNEES_GDA)) || 0,
    derniereAction: propre_(
      proprietes.getProperty(CLE_DERNIERE_ACTION_DONNEES_GDA)
    )
  };
}

/**
 * Incrémente la révision après chaque mutation réussie.
 * Les lectures, vérifications, présences et étapes OAuth n'altèrent rien.
 */
function marquerRevisionDonneesGDA_(action) {
  const nom = propre_(action);
  if (
    !nom ||
    nom === 'presenceEnLigne' ||
    nom.indexOf('recuperer') === 0 ||
    nom.indexOf('verifier') === 0 ||
    nom === 'preparerConnexionDiscord' ||
    nom === 'finaliserConnexionDiscord' ||
    nom === 'restaurerSessionDiscord'
  ) {
    return;
  }

  const proprietes = PropertiesService.getScriptProperties();
  const ancienneRevision =
    Number(proprietes.getProperty(CLE_REVISION_DONNEES_GDA)) || 0;
  const nouvelleRevision = Math.max(Date.now(), ancienneRevision + 1);
  proprietes.setProperties({
    [CLE_REVISION_DONNEES_GDA]: String(nouvelleRevision),
    [CLE_DERNIERE_ACTION_DONNEES_GDA]: nom
  }, false);
}

/**
 * À exécuter une fois depuis l’éditeur Apps Script avant le déploiement.
 * Cette fonction vérifie le secret, les IDs de la colonne F et déclenche la
 * demande d’autorisation Google pour les requêtes externes vers Discord.
 */
function verifierConfigurationDiscordOAuth() {
  const secret = propre_(PropertiesService.getScriptProperties()
    .getProperty(DISCORD_OAUTH.SECRET_PROPERTY));
  if (!secret) {
    throw new Error('Ajoutez d’abord la propriété de script DISCORD_CLIENT_SECRET.');
  }

  const reponse = UrlFetchApp.fetch('https://discord.com/api/v10/gateway', {
    method: 'get',
    muteHttpExceptions: true
  });
  if (Number(reponse.getResponseCode()) !== 200) {
    throw new Error('Discord est actuellement inaccessible depuis Apps Script.');
  }

  const invalides = lireEffectif_().filter(function (membre) {
    return !normaliserIdDiscord_(membre.discordId);
  }).map(function (membre) {
    return membre.matricule;
  });

  if (invalides.length) {
    return 'OAuth Discord configuré, mais ID Discord absent ou invalide pour : ' +
      invalides.join(', ') + '.';
  }
  return 'OAuth Discord configuré. Tous les IDs de la colonne F sont valides.';
}

function preparerConnexionDiscord(p) {
  const membre = exigerMembreParMatricule_(p.identifiant || p.matricule);
  const discordId = normaliserIdDiscord_(membre.discordId);

  if (!discordId) {
    throw new Error(
      'Aucun identifiant Discord valide n’est renseigné pour ce membre en colonne F.'
    );
  }

  const secret = propre_(PropertiesService.getScriptProperties()
    .getProperty(DISCORD_OAUTH.SECRET_PROPERTY));
  if (!secret) {
    throw new Error(
      'Discord OAuth n’est pas encore configuré : propriété DISCORD_CLIENT_SECRET absente.'
    );
  }

  nettoyerEtatsDiscordExpires_();
  nettoyerSouvenirsDiscordExpires_();
  const state = creerJetonAleatoireDiscord_();
  PropertiesService.getScriptProperties().setProperty(
    DISCORD_OAUTH.STATE_PREFIX + state,
    JSON.stringify({
      matricule: membre.matricule,
      creeLe: Date.now(),
      resterConnecte: propre_(p.resterConnecte) === '1' ||
        normaliser_(p.resterConnecte) === 'TRUE'
    })
  );

  const parametres = [
    'client_id=' + encodeURIComponent(DISCORD_OAUTH.CLIENT_ID),
    'response_type=code',
    'redirect_uri=' + encodeURIComponent(DISCORD_OAUTH.REDIRECT_URI),
    'scope=identify',
    'state=' + encodeURIComponent(state)
  ];

  return {
    success: true,
    tentative: state,
    authorizeUrl: DISCORD_OAUTH.AUTHORIZE_URL + '?' + parametres.join('&')
  };
}

function recupererConnexionDiscord(p) {
  const tentative = propre_(p.tentative);
  if (!/^[a-f0-9]{64}$/i.test(tentative)) {
    throw new Error('Tentative Discord invalide.');
  }

  const cache = CacheService.getScriptCache();
  const cle = DISCORD_OAUTH.RESULT_PREFIX + tentative;
  const brut = cache.get(cle);
  if (!brut) {
    return { success: true, pending: true };
  }

  cache.remove(cle);
  const resultat = JSON.parse(brut);
  resultat.pending = false;
  return resultat;
}

/**
 * Termine OAuth depuis la page publique GitHub Pages. Le code Discord est
 * echange uniquement ici afin que le secret client ne quitte jamais Apps Script.
 */
function finaliserConnexionDiscord(p) {
  try {
    executerRetourDiscordOAuth_(p);
    return {
      success: true,
      message: 'Identite Discord verifiee. Vous pouvez fermer cette fenetre.'
    };
  } catch (erreur) {
    console.error(erreur && erreur.stack ? erreur.stack : erreur);
    const resultatErreur = {
      success: false,
      message: erreur && erreur.message
        ? erreur.message
        : 'La connexion Discord a echoue.'
    };
    enregistrerResultatDiscordOAuth_(p.state, resultatErreur);
    return resultatErreur;
  }
}

function traiterRetourDiscordOAuth_(p) {
  return pageRetourDiscordOAuth_(executerRetourDiscordOAuth_(p));
}

function executerRetourDiscordOAuth_(p) {
  if (p.error) {
    throw new Error(
      propre_(p.error_description) || 'Autorisation Discord annulée.'
    );
  }

  const state = requis_(p.state, 'Le paramètre state Discord');
  const stockage = PropertiesService.getScriptProperties();
  const cleEtat = DISCORD_OAUTH.STATE_PREFIX + state;
  const brut = stockage.getProperty(cleEtat);
  stockage.deleteProperty(cleEtat);

  if (!brut) {
    throw new Error('Cette demande Discord est inconnue ou a déjà été utilisée.');
  }

  const etat = JSON.parse(brut);
  if (
    !etat.creeLe ||
    Date.now() - Number(etat.creeLe) > DISCORD_OAUTH.STATE_TTL_MS
  ) {
    throw new Error('La demande Discord a expiré. Recommencez la connexion.');
  }

  const membre = exigerMembreParMatricule_(etat.matricule);
  const discordAttendu = normaliserIdDiscord_(membre.discordId);
  if (!discordAttendu) {
    throw new Error('Identifiant Discord absent ou invalide dans la colonne F.');
  }

  const secret = requis_(
    stockage.getProperty(DISCORD_OAUTH.SECRET_PROPERTY),
    'Le secret Discord OAuth'
  );
  const reponseJeton = UrlFetchApp.fetch(DISCORD_OAUTH.TOKEN_URL, {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      client_id: DISCORD_OAUTH.CLIENT_ID,
      client_secret: secret,
      grant_type: 'authorization_code',
      code: requis_(p.code, 'Le code Discord'),
      redirect_uri: DISCORD_OAUTH.REDIRECT_URI
    },
    muteHttpExceptions: true
  });
  const jetonDiscord = lireJsonDiscord_(reponseJeton, 'échange du code Discord');
  const accessToken = requis_(jetonDiscord.access_token, 'Le jeton Discord');

  const reponseUtilisateur = UrlFetchApp.fetch(DISCORD_OAUTH.USER_URL, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + accessToken
    },
    muteHttpExceptions: true
  });
  const utilisateurDiscord = lireJsonDiscord_(
    reponseUtilisateur,
    'récupération du profil Discord'
  );
  const discordRecu = normaliserIdDiscord_(utilisateurDiscord.id);

  if (!discordRecu || discordRecu !== discordAttendu) {
    throw new Error(
      'Ce compte Discord ne correspond pas à l’identifiant associé à ' +
      membre.matricule + '.'
    );
  }

  const acces = obtenirAccesMembre_(membre);
  const sessionToken = creerSessionDiscord_(membre, discordRecu);
  const souvenir = etat.resterConnecte
    ? creerSouvenirDiscord_(membre, discordRecu)
    : null;

  const resultat = {
    success: true,
    nom: membre.matricule,
    matricule: membre.matricule,
    grade: membre.grade,
    gradeAffiche: gradeEffectifPublicPourMembre_(membre),
    specialisation: membre.specialisation,
    permissions: acces.permissions,
    proprietaire: acces.proprietaire,
    coproprietaire: acces.coproprietaire,
    defcon: lireEtatDefconGDA_(),
    sessionToken: sessionToken,
    rememberToken: souvenir ? souvenir.token : '',
    rememberExpires: souvenir ? souvenir.expireLe : 0,
    discordNom: propre_(utilisateurDiscord.global_name) ||
      propre_(utilisateurDiscord.username)
  };
  enregistrerResultatDiscordOAuth_(state, resultat);
  return resultat;
}

function enregistrerResultatDiscordOAuth_(state, resultat) {
  const tentative = propre_(state);
  if (!/^[a-f0-9]{64}$/i.test(tentative)) return;
  CacheService.getScriptCache().put(
    DISCORD_OAUTH.RESULT_PREFIX + tentative,
    JSON.stringify(resultat),
    5 * 60
  );
}

function lireJsonDiscord_(reponse, operation) {
  const code = Number(reponse.getResponseCode());
  let contenu = {};
  try {
    contenu = JSON.parse(reponse.getContentText() || '{}');
  } catch (erreur) {
    contenu = {};
  }
  if (code < 200 || code >= 300) {
    throw new Error(
      'Échec Discord pendant ' + operation +
      (contenu.error_description ? ' : ' + contenu.error_description : '.')
    );
  }
  return contenu;
}

function pageRetourDiscordOAuth_(resultat) {
  const titre = resultat.success ? 'Connexion validée' : 'Connexion refusée';
  const couleur = resultat.success ? '#59e391' : '#ff7777';
  const message = resultat.success
    ? 'Identité Discord vérifiée. Cette fenêtre va se fermer.'
    : propre_(resultat.message) || 'La connexion Discord a échoué.';

  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="fr"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + echapperHtmlServeur_(titre) + '</title></head>' +
    '<body style="margin:0;background:#07192b;color:#eef7ff;font-family:Arial,sans-serif;' +
    'display:grid;place-items:center;min-height:100vh;text-align:center">' +
    '<main><h1 style="color:' + couleur + '">' + echapperHtmlServeur_(titre) + '</h1>' +
    '<p>' + echapperHtmlServeur_(message) + '</p></main>' +
    '<script>(function(){' +
    'if(window.opener){window.opener.postMessage({type:"GDA_DISCORD_AUTH_READY"},"*");}' +
    'setTimeout(function(){window.close();},800);' +
    '})();</script></body></html>'
  ).setTitle(titre);
}

function creerSessionDiscord_(membre, discordId) {
  const token = creerJetonAleatoireDiscord_();
  CacheService.getScriptCache().put(
    DISCORD_OAUTH.SESSION_PREFIX + token,
    JSON.stringify({
      matricule: membre.matricule,
      discordId: discordId,
      creeLe: Date.now()
    }),
    DISCORD_OAUTH.SESSION_TTL_SECONDS
  );
  return token;
}

function restaurerSessionDiscord(p) {
  const token = requis_(p.rememberToken, 'Le jeton de connexion mémorisée');
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error('La connexion mémorisée est invalide.');
  }
  const cle = DISCORD_OAUTH.REMEMBER_PREFIX + empreinteJetonDiscord_(token);
  const stockage = PropertiesService.getScriptProperties();
  const brut = stockage.getProperty(cle);
  if (!brut) {
    throw new Error('La connexion mémorisée est expirée ou invalide.');
  }

  let souvenir;
  try {
    souvenir = JSON.parse(brut);
  } catch (erreur) {
    stockage.deleteProperty(cle);
    throw new Error('La connexion mémorisée est invalide.');
  }

  if (!souvenir.expireLe || Date.now() >= Number(souvenir.expireLe)) {
    stockage.deleteProperty(cle);
    throw new Error('La connexion mémorisée a expiré.');
  }

  const membre = exigerMembreParMatricule_(souvenir.matricule);
  const discordActuel = normaliserIdDiscord_(membre.discordId);
  if (!discordActuel || discordActuel !== normaliserIdDiscord_(souvenir.discordId)) {
    stockage.deleteProperty(cle);
    throw new Error('Les informations Discord de ce membre ont changé.');
  }

  const acces = obtenirAccesMembre_(membre);
  return {
    success: true,
    nom: membre.matricule,
    matricule: membre.matricule,
    grade: membre.grade,
    gradeAffiche: gradeEffectifPublicPourMembre_(membre),
    specialisation: membre.specialisation,
    permissions: acces.permissions,
    proprietaire: acces.proprietaire,
    coproprietaire: acces.coproprietaire,
    defcon: lireEtatDefconGDA_(),
    sessionToken: creerSessionDiscord_(membre, discordActuel),
    rememberToken: token,
    rememberExpires: Number(souvenir.expireLe)
  };
}

function creerSouvenirDiscord_(membre, discordId, expirationFixe) {
  const token = creerJetonAleatoireDiscord_();
  const expireLe = Number(expirationFixe) ||
    (Date.now() + DISCORD_OAUTH.REMEMBER_TTL_MS);
  PropertiesService.getScriptProperties().setProperty(
    DISCORD_OAUTH.REMEMBER_PREFIX + empreinteJetonDiscord_(token),
    JSON.stringify({
      matricule: membre.matricule,
      discordId: discordId,
      creeLe: Date.now(),
      expireLe: expireLe
    })
  );
  return { token: token, expireLe: expireLe };
}

function empreinteJetonDiscord_(token) {
  return Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    propre_(token),
    Utilities.Charset.UTF_8
  ).map(function (octet) {
    return ('0' + ((octet + 256) % 256).toString(16)).slice(-2);
  }).join('');
}

function exigerSessionDiscord_(token, matriculeDemande) {
  const propreToken = propre_(token);
  if (!propreToken) {
    throw new Error('Session Discord requise. Rechargez la page et reconnectez-vous.');
  }
  const brut = CacheService.getScriptCache().get(
    DISCORD_OAUTH.SESSION_PREFIX + propreToken
  );
  if (!brut) {
    throw new Error('Session Discord expirée. Rechargez la page et reconnectez-vous.');
  }
  const session = JSON.parse(brut);
  if (
    matriculeDemande &&
    normaliser_(matriculeDemande) !== normaliser_(session.matricule)
  ) {
    throw new Error('La session Discord ne correspond pas à cet utilisateur.');
  }
  const membre = exigerMembreParMatricule_(session.matricule);
  if (normaliserIdDiscord_(membre.discordId) !== session.discordId) {
    throw new Error('L’identifiant Discord associé à ce membre a changé. Reconnectez-vous.');
  }
  return session;
}

function normaliserIdDiscord_(valeur) {
  const correspondance = String(valeur == null ? '' : valeur)
    .match(/\d{15,22}/);
  return correspondance ? correspondance[0] : '';
}

function creerJetonAleatoireDiscord_() {
  return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
}

function nettoyerEtatsDiscordExpires_() {
  const stockage = PropertiesService.getScriptProperties();
  const proprietes = stockage.getProperties();
  Object.keys(proprietes).forEach(function (cle) {
    if (cle.indexOf(DISCORD_OAUTH.STATE_PREFIX) !== 0) return;
    try {
      const etat = JSON.parse(proprietes[cle]);
      if (Date.now() - Number(etat.creeLe || 0) > DISCORD_OAUTH.STATE_TTL_MS) {
        stockage.deleteProperty(cle);
      }
    } catch (erreur) {
      stockage.deleteProperty(cle);
    }
  });
}

function nettoyerSouvenirsDiscordExpires_() {
  const stockage = PropertiesService.getScriptProperties();
  const proprietes = stockage.getProperties();
  Object.keys(proprietes).forEach(function (cle) {
    if (cle.indexOf(DISCORD_OAUTH.REMEMBER_PREFIX) !== 0) return;
    try {
      const souvenir = JSON.parse(proprietes[cle]);
      if (!souvenir.expireLe || Date.now() >= Number(souvenir.expireLe)) {
        stockage.deleteProperty(cle);
      }
    } catch (erreur) {
      stockage.deleteProperty(cle);
    }
  });
}

function echapperHtmlServeur_(valeur) {
  return String(valeur == null ? '' : valeur)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Controle de connexion compatible avec l'ancien script.
 *
 * La colonne C contient le matricule utilise comme nom dans l'interface.
 * La connexion n'est acceptee que si le matricule ET le grade sont presents.
 */
function presenceEnLigne(p) {
  const membre = exigerConnexion_(p.identifiant);
  const acces = obtenirAccesMembre_(membre);
  const versionDonnees = recupererVersionDonnees();
  const cache = CacheService.getScriptCache();
  const verrou = LockService.getScriptLock();
  const maintenant = Date.now();
  const expiration = 45000;

  verrou.waitLock(10000);
  try {
    let utilisateurs = [];
    const contenu = cache.get('GDA_PRESENCES_EN_LIGNE');

    if (contenu) {
      try {
        utilisateurs = JSON.parse(contenu);
      } catch (erreur) {
        utilisateurs = [];
      }
    }

    utilisateurs = utilisateurs.filter(function (utilisateur) {
      return (
        utilisateur &&
        utilisateur.identifiant &&
        maintenant - Number(utilisateur.derniereActivite || 0) < expiration
      );
    });

    const cleMembre = normaliser_(membre.matricule);
    const position = utilisateurs.findIndex(function (utilisateur) {
      return normaliser_(utilisateur.identifiant) === cleMembre;
    });
    const presence = {
      identifiant: membre.matricule,
      nom: membre.matricule,
      grade: membre.grade,
      derniereActivite: maintenant
    };

    if (position === -1) utilisateurs.push(presence);
    else utilisateurs[position] = presence;

    utilisateurs.sort(function (a, b) {
      return normaliser_(a.nom).localeCompare(normaliser_(b.nom));
    });

    cache.put(
      'GDA_PRESENCES_EN_LIGNE',
      JSON.stringify(utilisateurs),
      600
    );

    return {
      success: true,
      total: utilisateurs.length,
      permissions: acces.permissions,
      proprietaire: acces.proprietaire,
      coproprietaire: acces.coproprietaire,
      revisionDonnees: versionDonnees.revision,
      derniereActionDonnees: versionDonnees.derniereAction,
      defcon: lireEtatDefconGDA_(),
      peutGererDefcon: utilisateurPeutGererDefconGDA_(membre),
      utilisateurs: utilisateurs.map(function (utilisateur) {
        return {
          nom: utilisateur.nom,
          grade: gradeEffectifPublicPourMembre_({
            matricule: utilisateur.nom,
            grade: utilisateur.grade
          })
        };
      })
    };
  } finally {
    verrou.releaseLock();
  }
}

function definirDefcon(p) {
  const auteur = exigerConnexion_(p.identifiant);
  if (!utilisateurPeutGererDefconGDA_(auteur)) {
    throw new Error(
      'Le réglage DEFCON est réservé aux officiers supérieurs, au propriétaire, aux co-propriétaires et au Staff.'
    );
  }

  const niveauBrut = propre_(p.niveau);
  if (!/^[0-4]$/.test(niveauBrut)) {
    throw new Error('Le niveau DEFCON doit être compris entre 0 et 4.');
  }

  const niveau = Number(niveauBrut);
  const maintenant = new Date().toISOString();
  PropertiesService.getScriptProperties().setProperties({
    [CLE_DEFCON_NIVEAU_GDA]: String(niveau),
    [CLE_DEFCON_MODIFIE_PAR_GDA]: auteur.matricule,
    [CLE_DEFCON_MODIFIE_LE_GDA]: maintenant
  }, false);

  return {
    success: true,
    message: niveau ? 'DEFCON ' + niveau + ' activé.' : 'DEFCON désactivé.',
    defcon: lireEtatDefconGDA_()
  };
}

function lireEtatDefconGDA_() {
  const proprietes = PropertiesService.getScriptProperties();
  const niveau = Math.max(
    0,
    Math.min(4, Number(proprietes.getProperty(CLE_DEFCON_NIVEAU_GDA)) || 0)
  );
  return {
    niveau: niveau,
    modifiePar: propre_(proprietes.getProperty(CLE_DEFCON_MODIFIE_PAR_GDA)),
    modifieLe: propre_(proprietes.getProperty(CLE_DEFCON_MODIFIE_LE_GDA))
  };
}

function utilisateurPeutGererDefconGDA_(membre) {
  if (
    estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    membrePossedeRoleStaffTotal_(membre)
  ) {
    return true;
  }
  const grade = normaliser_(membre && membre.grade).replace(/[^A-Z]/g, '');
  return [
    'LIEUTENANTCOLONEL',
    'COMMANDANT',
    'VICECOMMANDANT'
  ].includes(grade);
}

function recupererEffectif(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const membres = trierEffectifParGradeEtDate_(lireEffectif_());
  const probatoires = matriculesSuivisProbatoiresActifs_();
  const absentsActuels = matriculesAbsentsActuels_();
  return {
    success: true,
    membres: membres.map(function (membre) {
      const resultat = membreClient_(membre);
      resultat.presence = membreEstAbsentActuellement_(
        membre,
        absentsActuels
      ) ? 'Absent' : 'Présent';
      resultat.enPeriodeProbatoire =
        probatoires[normaliser_(membre.matricule)] === true;
      return resultat;
    }),
    peutModifier: utilisateurPeutModifierEffectif_(auteur),
    peutAjouter: estOfficierSuperieurGDA_(auteur),
    grades: REFERENTIEL_GESTION.grades,
    sanctions: REFERENTIEL_GESTION.sanctions.slice(),
    medailles: fusionnerMedaillesEffectif_(
      REFERENTIEL_GESTION.medailles,
      membres.map(membre => membre.medaille)
    ),
    specialisations: REFERENTIEL_GESTION.specialisations.slice()
  };
}

function recupererRecommandationsObservations(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerOfficierGDA_(auteur, 'consulter les recommandations et observations');
  const membres = lireEffectif_();
  return {
    success: true,
    membres: membres.map(function (membre) {
      return {
        nom: membre.matricule,
        grade: gradeEffectifPublicPourMembre_(membre),
        recommandations: nombre_(membre.recommandation),
        observations: nombre_(membre.observation)
      };
    }),
    historique: lireRecommandationsObservations_(),
    peutPurger: estOfficierSuperieurGDA_(auteur)
  };
}

function ajouterRecommandationObservation(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerOfficierGDA_(auteur, 'ajouter une recommandation ou une observation');

  const cible = exigerMembreParMatricule_(p.personne);
  const type = normaliser_(p.type);
  if (type !== 'RECOMMANDATION' && type !== 'OBSERVATION') {
    throw new Error('Choisissez Recommandation ou Observation.');
  }

  const date = dateISORequise_(p.date, 'La date');
  const emetteurChoisi = requis_(p.emetteur, 'La personne ayant transmis l\'information');
  let emetteur = emetteurChoisi;
  if (normaliser_(emetteurChoisi) === 'AUTRE') {
    emetteur = limite_(
      requis_(p.emetteurAutre, 'Le nom de la personne extérieure'),
      120,
      'Le nom de la personne extérieure'
    );
  } else {
    emetteur = exigerMembreParMatricule_(emetteurChoisi).matricule;
  }

  let nature = '';
  let raison = '';
  if (type === 'OBSERVATION') {
    nature = normaliser_(p.nature);
    if (nature !== 'POSITIVE' && nature !== 'NEGATIVE') {
      throw new Error('Choisissez une observation positive ou négative.');
    }
    raison = limite_(requis_(p.raison, 'La raison'), 3000, 'La raison');
  } else {
    nature = normaliser_(p.raisonType);
    if (nature === 'RECOMPENSE DE MISSION') {
      raison = 'Récompense de mission';
    } else if (nature === 'AUTRE') {
      raison = limite_(requis_(p.raison, 'La raison'), 3000, 'La raison');
    } else {
      throw new Error('Choisissez Récompense de mission ou Autre.');
    }
  }

  return verrou_(function () {
    const feuille = feuilleRecommandationsObservations_();
    const ligne = prochaineLigne_(feuille, 2);
    const creeLe = new Date();
    feuille.getRange(ligne, 1, 1, 11).setValues([[
      Utilities.getUuid(),
      date,
      cible.matricule,
      exigerGradeEffectifPublicPourMembre_(cible, 'la recommandation ou l’observation'),
      type === 'OBSERVATION' ? 'Observation' : 'Recommandation',
      type === 'OBSERVATION'
        ? (nature === 'POSITIVE' ? 'Positive' : 'Négative')
        : (nature === 'RECOMPENSE DE MISSION' ? 'Récompense de mission' : 'Autre'),
      emetteur,
      raison,
      auteur.matricule,
      exigerGradeEffectifPublicPourMembre_(auteur, 'la recommandation ou l’observation'),
      creeLe
    ]]);
    feuille.getRange(ligne, 2).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, 11).setNumberFormat('dd/MM/yyyy HH:mm:ss');

    const colonneCompteur = type === 'OBSERVATION'
      ? CONFIG.EFFECTIF.OBSERVATION
      : CONFIG.EFFECTIF.RECOMMANDATION;
    const celluleCompteur = cible.feuille.getRange(cible.ligne, colonneCompteur);
    celluleCompteur.setValue(nombre_(celluleCompteur.getValue()) + 1);
    SpreadsheetApp.flush();

    return {
      success: true,
      message: type === 'OBSERVATION'
        ? 'Observation enregistrée.'
        : 'Recommandation enregistrée.',
      historique: lireRecommandationsObservations_()
    };
  });
}

function modifierRecommandationObservation(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerOfficierGDA_(auteur, 'modifier une recommandation ou une observation');
  const id = requis_(p.id, 'L\'identifiant de l\'entrée');
  const cible = exigerMembreParMatricule_(p.personne);
  const type = normaliser_(p.type);
  if (type !== 'RECOMMANDATION' && type !== 'OBSERVATION') {
    throw new Error('Choisissez Recommandation ou Observation.');
  }
  if (normaliser_(cible.matricule) === normaliser_(auteur.matricule)) {
    throw new Error('Vous ne pouvez pas modifier une entrée qui vous concerne.');
  }

  const date = dateISORequise_(p.date, 'La date');
  const emetteurChoisi = requis_(p.emetteur, 'La personne ayant transmis l\'information');
  let emetteur = emetteurChoisi;
  if (normaliser_(emetteurChoisi) === 'AUTRE') {
    emetteur = limite_(requis_(p.emetteurAutre, 'Le nom de la personne extérieure'), 120, 'Le nom de la personne extérieure');
  } else {
    emetteur = exigerMembreParMatricule_(emetteurChoisi).matricule;
  }

  let nature = '';
  let raison = '';
  if (type === 'OBSERVATION') {
    nature = normaliser_(p.nature);
    if (nature !== 'POSITIVE' && nature !== 'NEGATIVE') throw new Error('Choisissez une observation positive ou négative.');
    raison = limite_(requis_(p.raison, 'La raison'), 3000, 'La raison');
  } else {
    nature = normaliser_(p.raisonType);
    if (nature === 'RECOMPENSE DE MISSION') raison = 'Récompense de mission';
    else if (nature === 'AUTRE') raison = limite_(requis_(p.raison, 'La raison'), 3000, 'La raison');
    else throw new Error('Choisissez Récompense de mission ou Autre.');
  }

  return verrou_(function () {
    const feuille = feuilleRecommandationsObservations_();
    const derniereLigne = feuille.getLastRow();
    if (derniereLigne < 2) throw new Error('Entrée introuvable.');
    const ids = feuille.getRange(2, 1, derniereLigne - 1, 1).getDisplayValues();
    let ligneFeuille = 0;
    for (let i = 0; i < ids.length; i++) if (propre_(ids[i][0]) === id) { ligneFeuille = i + 2; break; }
    if (!ligneFeuille) throw new Error('Entrée introuvable. Actualisez la page.');
    const ancienne = feuille.getRange(ligneFeuille, 1, 1, 11).getValues()[0];
    if (normaliser_(ancienne[2]) === normaliser_(auteur.matricule)) {
      throw new Error('Vous ne pouvez pas modifier une entrée qui vous concerne.');
    }

    const ancienneCible = exigerMembreParMatricule_(ancienne[2]);
    const ancienneColonne = normaliser_(ancienne[4]) === 'OBSERVATION' ? CONFIG.EFFECTIF.OBSERVATION : CONFIG.EFFECTIF.RECOMMANDATION;
    const nouvelleColonne = type === 'OBSERVATION' ? CONFIG.EFFECTIF.OBSERVATION : CONFIG.EFFECTIF.RECOMMANDATION;
    const ancienneCellule = ancienneCible.feuille.getRange(ancienneCible.ligne, ancienneColonne);
    ancienneCellule.setValue(Math.max(0, nombre_(ancienneCellule.getValue()) - 1));
    const nouvelleCellule = cible.feuille.getRange(cible.ligne, nouvelleColonne);
    nouvelleCellule.setValue(nombre_(nouvelleCellule.getValue()) + 1);

    const memePersonne =
      normaliser_(ancienne[2]) === normaliser_(cible.matricule);
    const gradeHistorique = memePersonne && propre_(ancienne[3])
      ? propre_(ancienne[3])
      : exigerGradeEffectifPublicPourMembre_(
          cible,
          'la recommandation ou l’observation'
        );
    const gradeAuteurHistorique = propre_(ancienne[9]) ||
      exigerGradeEffectifPublicPourMembre_(
        auteur,
        'la recommandation ou l’observation'
      );

    feuille.getRange(ligneFeuille, 2, 1, 10).setValues([[
      date, cible.matricule, gradeHistorique,
      type === 'OBSERVATION' ? 'Observation' : 'Recommandation',
      type === 'OBSERVATION' ? (nature === 'POSITIVE' ? 'Positive' : 'Négative') : (nature === 'RECOMPENSE DE MISSION' ? 'Récompense de mission' : 'Autre'),
      emetteur, raison, auteur.matricule, gradeAuteurHistorique, new Date()
    ]]);
    feuille.getRange(ligneFeuille, 2).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligneFeuille, 11).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    SpreadsheetApp.flush();
    return {success:true, message:'Entrée modifiée.', historique:lireRecommandationsObservations_()};
  });
}

function purgerRecommandationsObservations(p) {
  const auteur = exigerConnexion_(p.identifiant);
  if (!estOfficierSuperieurGDA_(auteur)) {
    throw new Error('Accès refusé : seuls les officiers supérieurs peuvent effectuer la purge.');
  }

  return verrou_(function () {
    const feuilleHistorique = feuilleRecommandationsObservations_();
    const derniereLigne = feuilleHistorique.getLastRow();
    if (derniereLigne >= 2) {
      feuilleHistorique.getRange(2, 1, derniereLigne - 1, 11).clearContent();
    }

    lireEffectif_().forEach(function (membre) {
      membre.feuille.getRange(membre.ligne, CONFIG.EFFECTIF.OBSERVATION).setValue(0);
      membre.feuille.getRange(membre.ligne, CONFIG.EFFECTIF.RECOMMANDATION).setValue(0);
    });
    SpreadsheetApp.flush();
    return {
      success: true,
      message: 'La nouvelle semaine a été initialisée : compteurs et historique remis à zéro.',
      historique: []
    };
  });
}

function feuilleRecommandationsObservations_() {
  const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  const nom = CONFIG.STOCKAGE.RECOMMANDATIONS_OBSERVATIONS_SHEET;
  let feuille = classeur.getSheetByName(nom);
  const creee = !feuille;
  if (!feuille) feuille = classeur.insertSheet(nom);
  assurerDimensionsFeuille_(feuille, 2, 11);
  if (creee || propre_(feuille.getRange(1, 1).getValue()) !== 'ID') {
    feuille.getRange(1, 1, 1, 11).setValues([[
      'ID', 'Date', 'Personne concernée', 'Grade', 'Type', 'Nature',
      'Transmis par', 'Raison', 'Enregistré par', 'Grade enregistreur', 'Créé le'
    ]]);
    feuille.setFrozenRows(1);
    feuille.getRange(1, 1, 1, 11)
      .setBackground('#071c31')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }
  return feuille;
}

function lireRecommandationsObservations_() {
  const feuille = feuilleRecommandationsObservations_();
  const derniereLigne = feuille.getLastRow();
  if (derniereLigne < 2) return [];
  return feuille.getRange(2, 1, derniereLigne - 1, 11).getValues()
    .map(function (ligne) {
      return {
        id: propre_(ligne[0]),
        date: dateTexte_(ligne[1]),
        personne: propre_(ligne[2]),
        grade: propre_(ligne[3]),
        type: propre_(ligne[4]),
        nature: propre_(ligne[5]),
        emetteur: propre_(ligne[6]),
        raison: propre_(ligne[7]),
        enregistrePar: propre_(ligne[8]),
        creeLe: dateHeureTexte_(ligne[10])
      };
    })
    .filter(function (entree) { return entree.id && entree.personne; })
    .reverse();
}

function recupererEffectifPublic(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const instantane = obtenirEffectifPublicInstantane_();
  return reponseEffectifPublic_(auteur, instantane, false);
}

function actualiserEffectifPublic(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerOfficierGDA_(auteur, 'actualiser l’effectif public');
  exigerPermissionGDA_(
    auteur,
    PERMISSIONS_GDA.EFFECTIF_PUBLIC_ACTUALISER
  );

  const verrou = LockService.getScriptLock();
  verrou.waitLock(15000);
  try {
    const instantane = creerEffectifPublicInstantane_();
    enregistrerEffectifPublicInstantane_(instantane);
    return reponseEffectifPublic_(auteur, instantane, true);
  } finally {
    verrou.releaseLock();
  }
}

function reponseEffectifPublic_(auteur, instantane, actualisationForcee) {
  return {
    success: true,
    membres: instantane.membres,
    actualiseLe: instantane.actualiseLe,
    prochaineActualisation: prochaineActualisationEffectifPublic_().getTime(),
    peutActualiser:
      estOfficierGDA_(auteur) &&
      utilisateurAPermission_(
        auteur,
        PERMISSIONS_GDA.EFFECTIF_PUBLIC_ACTUALISER
      ),
    actualisationForcee: actualisationForcee === true
  };
}

function obtenirEffectifPublicInstantane_() {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(15000);
  try {
    let instantane = lireEffectifPublicInstantane_();
    const limite = derniereActualisationEffectifPublic_().getTime();

    if (
      !instantane ||
      !Number(instantane.actualiseLe) ||
      Number(instantane.actualiseLe) < limite
    ) {
      instantane = creerEffectifPublicInstantane_();
      enregistrerEffectifPublicInstantane_(instantane);
    }
    return instantane;
  } finally {
    verrou.releaseLock();
  }
}

function creerEffectifPublicInstantane_() {
  const absents = matriculesAbsentsActuels_();

  const membres = trierEffectifParGradeEtDate_(lireEffectif_())
    .map(function (membre) {
    const absent = membreEstAbsentActuellement_(membre, absents);

    return {
      nom: membre.matricule,
      grade: membre.grade,
      presence: absent ? 'Absent' : 'Présent',
      steamId: membre.steamId,
      discordId: membre.discordId,
      medailles: normaliserListeMedailles_(membre.medaille)
    };
  });

  return {
    actualiseLe: Date.now(),
    membres: membres
  };
}

function lireEffectifPublicInstantane_() {
  const stockage = PropertiesService.getScriptProperties();
  const metaBrut = stockage.getProperty(CLE_EFFECTIF_PUBLIC_META);
  if (!metaBrut) return null;

  try {
    const meta = JSON.parse(metaBrut);
    const nombreBlocs = Number(meta.nombreBlocs || 0);
    if (nombreBlocs < 1 || nombreBlocs > 200) return null;

    let contenu = '';
    for (let index = 0; index < nombreBlocs; index++) {
      const bloc = stockage.getProperty(PREFIXE_EFFECTIF_PUBLIC + index);
      if (bloc == null) return null;
      contenu += bloc;
    }

    const instantane = JSON.parse(contenu);
    return instantane && Array.isArray(instantane.membres)
      ? instantane
      : null;
  } catch (erreur) {
    return null;
  }
}

function gradeEffectifPublicPourMembre_(membre) {
  const instantane = lireEffectifPublicInstantane_();
  if (!instantane || !Array.isArray(instantane.membres)) return '';

  const matricule = normaliser_(membre && membre.matricule);
  const steamId = normaliser_(membre && membre.steamId);
  const discordId = normaliserIdDiscord_(membre && membre.discordId);

  function correspondanceUnique_(predicat) {
    const correspondances = instantane.membres.filter(function (element) {
      return element && predicat(element);
    });
    return correspondances.length === 1 ? correspondances[0] : null;
  }

  // Les identifiants uniques priment sur le nom. S'ils désignent deux lignes
  // différentes, aucune correspondance n'est acceptée afin de ne pas mélanger
  // les dossiers.
  const correspondancesIdentifiants = [];
  if (discordId) {
    const parDiscord = correspondanceUnique_(function (element) {
      return normaliserIdDiscord_(element.discordId) === discordId;
    });
    if (parDiscord) correspondancesIdentifiants.push(parDiscord);
  }
  if (steamId) {
    const parSteam = correspondanceUnique_(function (element) {
      return normaliser_(element.steamId) === steamId;
    });
    if (parSteam) correspondancesIdentifiants.push(parSteam);
  }

  let membrePublic = null;
  if (correspondancesIdentifiants.length) {
    membrePublic = correspondancesIdentifiants[0];
    const conflit = correspondancesIdentifiants.some(function (element) {
      return element !== membrePublic;
    });
    if (conflit) return '';
  } else if (!steamId && !discordId && matricule) {
    membrePublic = correspondanceUnique_(function (element) {
      return normaliser_(element.nom || element.matricule) === matricule;
    });
  }

  // Aucun retour vers membre.grade : cette valeur vient de l'Effectif
  // officier et ne doit jamais être révélée dans un affichage utilisateur.
  return propre_(membrePublic && membrePublic.grade);
}

function exigerGradeEffectifPublicPourMembre_(membre, contexte) {
  const grade = gradeEffectifPublicPourMembre_(membre);
  if (grade) return grade;
  throw new Error(
    'Grade introuvable dans l’Effectif GDA' +
    (contexte ? ' pour ' + contexte : '') +
    '. Actualisez l’Effectif GDA avant de continuer.'
  );
}

function enregistrerEffectifPublicInstantane_(instantane) {
  const stockage = PropertiesService.getScriptProperties();
  const contenu = JSON.stringify(instantane);
  const blocs = [];

  for (
    let position = 0;
    position < contenu.length;
    position += TAILLE_BLOC_EFFECTIF_PUBLIC
  ) {
    blocs.push(contenu.slice(
      position,
      position + TAILLE_BLOC_EFFECTIF_PUBLIC
    ));
  }

  let ancienNombre = 0;
  try {
    const ancienneMeta = JSON.parse(
      stockage.getProperty(CLE_EFFECTIF_PUBLIC_META) || '{}'
    );
    ancienNombre = Number(ancienneMeta.nombreBlocs || 0);
  } catch (erreur) {
    ancienNombre = 0;
  }

  const proprietes = {};
  blocs.forEach(function (bloc, index) {
    proprietes[PREFIXE_EFFECTIF_PUBLIC + index] = bloc;
  });
  proprietes[CLE_EFFECTIF_PUBLIC_META] = JSON.stringify({
    nombreBlocs: blocs.length,
    actualiseLe: instantane.actualiseLe
  });
  stockage.setProperties(proprietes, false);

  for (let index = blocs.length; index < ancienNombre; index++) {
    stockage.deleteProperty(PREFIXE_EFFECTIF_PUBLIC + index);
  }
}

function derniereActualisationEffectifPublic_() {
  const maintenant = new Date();
  const limite = new Date(maintenant.getTime());
  limite.setHours(20, 0, 0, 0);
  if (maintenant.getTime() < limite.getTime()) {
    limite.setDate(limite.getDate() - 1);
  }
  return limite;
}

function prochaineActualisationEffectifPublic_() {
  const maintenant = new Date();
  const prochaine = new Date(maintenant.getTime());
  prochaine.setHours(20, 0, 0, 0);
  if (maintenant.getTime() >= prochaine.getTime()) {
    prochaine.setDate(prochaine.getDate() + 1);
  }
  return prochaine;
}

function enregistrerNote(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const personne = requis_(p.personne, 'La personne');
  const note = limite_(p.note, 5000, 'La note');
  return verrou_(function () {
    const membre = trouverMembre_(personne);
    if (!membre) throw new Error('Membre introuvable.');
    membre.feuille.getRange(membre.ligne, CONFIG.EFFECTIF.NOTES).setValue(note);
    return { success: true, message: 'Note enregistree par ' + auteur.matricule + '.' };
  });
}

function modifierMembreEffectif(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerPermissionModificationEffectif_(auteur);

  const ancienNom = requis_(p.personne, 'La personne');
  const nouveauNom = limite_(requis_(p.nom, 'Le nom'), 120, 'Le nom');
  const nouveauGrade = validerGradeGestion_(p.grade);
  const steamId = limite_(p.steamId, 160, 'Le Steam ID');
  const discordId = limite_(p.discordId, 160, 'Le Discord ID');
  const observation = limite_(p.observation, 3000, 'L’observation');
  const sanctionDemandee = propre_(p.sanction);
  const sanctionValidee = sanctionDemandee
    ? validerValeurReferentiel_(
        sanctionDemandee,
        REFERENTIEL_GESTION.sanctions,
        'Sanction invalide.'
      )
    : '';
  const sanction = sanctionValidee;
  const recommandation = limite_(p.recommandation, 1500, 'La recommandation');
  const specialisation = validerSpecialisationsGestion_(p.specialisation);
  const medaille = limite_(p.medaille, 2000, 'La médaille');
  const datePromotionRetro = dateISOOptionnelle_(p.datePromotionRetro);
  const dateEntree = dateISOOptionnelle_(p.dateEntree);

  return verrou_(function () {
    const membre = exigerMembreParMatricule_(ancienNom);
    const homonyme = trouverMembre_(nouveauNom);

    if (
      homonyme &&
      homonyme.ligne !== membre.ligne
    ) {
      throw new Error('Ce nom ou matricule est déjà utilisé.');
    }

    const c = CONFIG.EFFECTIF;
    const largeurDetails = c.NOTES - c.STEAM_ID + 1;
    const valeurs = membre.feuille
      .getRange(membre.ligne, c.STEAM_ID, 1, largeurDetails)
      .getValues()[0];

    valeurs[c.STEAM_ID - c.STEAM_ID] = steamId;
    valeurs[c.DISCORD_ID - c.STEAM_ID] = discordId;
    valeurs[c.OBSERVATION - c.STEAM_ID] = observation;
    valeurs[c.PROMO_RETRO - c.STEAM_ID] = datePromotionRetro;
    valeurs[c.DATE_ENTREE - c.STEAM_ID] = dateEntree;
    valeurs[c.SANCTION - c.STEAM_ID] = sanction;
    valeurs[c.RECOMMANDATION - c.STEAM_ID] = recommandation;
    membre.feuille
      .getRange(membre.ligne, c.MATRICULE)
      .setValue(nouveauNom);
    ecrireGradeCellule_(
      membre.feuille.getRange(membre.ligne, c.GRADE),
      nouveauGrade
    );
    membre.feuille
      .getRange(membre.ligne, 2)
      .setValue(codeGroupeGradeEffectif_(nouveauGrade));
    membre.feuille
      .getRange(membre.ligne, c.STEAM_ID, 1, largeurDetails)
      .setValues([valeurs]);
    ecrireSpecialisationsCellule_(
      membre.feuille.getRange(membre.ligne, c.SPECIALISATION),
      specialisation
    );
    // La colonne P possède une validation stricte avec des libellés préfixés.
    // Elle est écrite séparément avec son format Google Sheets exact.
    ecrireMedaillesCellule_(
      membre.feuille.getRange(membre.ligne, c.MEDAILLE),
      medaille
    );
    migrerPermissionsMembre_(ancienNom, nouveauNom);
    membre.feuille
      .getRange(membre.ligne, c.PROMO_RETRO, 1, 2)
      .setNumberFormat('dd/MM/yyyy');
    mettreAJourCompteursEffectif_(membre.feuille);

    const auteurApresModification =
      normaliser_(auteur.matricule) === normaliser_(ancienNom)
        ? trouverMembre_(nouveauNom)
        : trouverMembre_(auteur.matricule);

    return {
      success: true,
      message: 'Fiche de ' + nouveauNom + ' mise à jour.',
      membre: membreClient_(trouverMembre_(nouveauNom)),
      gradeAuteur: auteurApresModification
        ? auteurApresModification.grade
        : auteur.grade,
      specialisationAuteur: auteurApresModification
        ? auteurApresModification.specialisation
        : auteur.specialisation,
      peutModifier: auteurApresModification
        ? utilisateurPeutModifierEffectif_(auteurApresModification)
        : false,
      nouvelIdentifiantAuteur:
        normaliser_(auteur.matricule) === normaliser_(ancienNom)
          ? nouveauNom
          : ''
    };
  });
}

function ajouterMembreEffectif(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  if (!estOfficierSuperieurGDA_(auteur)) {
    throw new Error(
      'Accès refusé : seuls les officiers supérieurs peuvent ajouter un nouveau GDA.'
    );
  }

  const nom = limite_(requis_(p.nom, 'Le nom ou matricule'), 120, 'Le nom ou matricule');
  const grade = validerGradeGestion_(p.grade);
  const steamId = limite_(requis_(p.steamId, 'Le Steam ID'), 160, 'Le Steam ID');
  const discordId = limite_(requis_(p.discordId, 'Le Discord ID'), 160, 'Le Discord ID');
  const dateEntree = propre_(p.dateEntree)
    ? dateISORequise_(p.dateEntree, 'La date d’entrée')
    : debutJour_(new Date());
  const specialisation = validerSpecialisationsGestion_(p.specialisation);
  const medaillesSelectionnees = decouperValeurs_(p.medaille).map(function (medaille) {
    return validerMedailleGestion_(medaille);
  });

  return verrou_(function () {
    const membres = lireEffectif_();
    if (membres.length >= 35) {
      throw new Error('L’effectif a atteint sa limite de 35 GDA.');
    }
    if (membres.some(function (membre) {
      return normaliser_(membre.matricule) === normaliser_(nom);
    })) {
      throw new Error('Ce nom ou matricule est déjà présent dans l’effectif.');
    }
    if (membres.some(function (membre) {
      return normaliser_(membre.steamId) === normaliser_(steamId);
    })) {
      throw new Error('Ce Steam ID est déjà associé à une personne.');
    }
    if (membres.some(function (membre) {
      return normaliser_(membre.discordId) === normaliser_(discordId);
    })) {
      throw new Error('Ce Discord ID est déjà associé à une personne.');
    }

    const restauration = retrouverMedaillesAncienGDA_(
      nom,
      steamId,
      discordId,
      medaillesSelectionnees
    );
    const medailles = restauration.medailles.join('; ');

    const c = CONFIG.EFFECTIF;
    const feuille = feuille_(c.SHEET);
    const ligne = prochaineLigne_(feuille, c.START);
    assurerDimensionsFeuille_(feuille, ligne, c.MEDAILLE);
    const largeur = c.MEDAILLE - c.MATRICULE + 1;
    const plage = feuille.getRange(ligne, c.MATRICULE, 1, largeur);
    try {
      plage.clearDataValidations();
      plage.setValues([[
        nom,
        grade,
        steamId,
        discordId,
        'Présent',
        0,
        0,
        '',
        dateEntree,
        '',
        0,
        '',
        specialisation,
        medailles
      ]]);
      feuille.getRange(ligne, 2).setValue(codeGroupeGradeEffectif_(grade));
      ecrireGradeCellule_(feuille.getRange(ligne, c.GRADE), grade);
      ecrireSpecialisationsCellule_(
        feuille.getRange(ligne, c.SPECIALISATION),
        specialisation
      );
      ecrireMedaillesCellule_(feuille.getRange(ligne, c.MEDAILLE), medailles);
      mettreAJourCompteursEffectif_(feuille);
      const membreAjoute = trouverMembre_(nom);
      if (!membreAjoute) {
        throw new Error('Le nouveau membre n’a pas pu être relu après son ajout.');
      }
      if (restauration.ligneDossier) {
        const feuilleDeparts = feuille_(CONFIG.DEPARTS.SHEET);
        assurerDimensionsFeuille_(
          feuilleDeparts,
          restauration.ligneDossier,
          CONFIG.DEPARTS.MEDAILLES_RESTAUREES_LE
        );
        feuilleDeparts
          .getRange(1, CONFIG.DEPARTS.MEDAILLES_RESTAUREES_LE)
          .setValue('Médailles restaurées le');
        feuilleDeparts
          .getRange(
            restauration.ligneDossier,
            CONFIG.DEPARTS.MEDAILLES_RESTAUREES_LE
          )
          .setValue(new Date())
          .setNumberFormat('dd/MM/yyyy HH:mm:ss');
      }
      return {
        success: true,
        message: nom + ' a été ajouté à l’effectif par ' + auteur.matricule + '.' +
          (restauration.totalRestaurees
            ? ' ' + restauration.totalRestaurees + ' médaille(s) historique(s) restaurée(s).'
            : ''),
        membre: membreClient_(membreAjoute),
        peutAjouter: true,
        medaillesRestaurees: restauration.totalRestaurees
      };
    } catch (erreur) {
      plage.clearContent();
      throw erreur;
    }
  });
}

function retrouverMedaillesAncienGDA_(nom, steamId, discordId, selectionnees) {
  const resultat = [];
  const clesAjoutees = {};

  (selectionnees || []).forEach(function (medaille) {
    const valide = validerMedailleGestion_(medaille);
    const cle = cleMedaille_(valide);
    if (!clesAjoutees[cle]) {
      clesAjoutees[cle] = true;
      resultat.push(valide);
    }
  });

  const dossiers = lireDeparts_().filter(function (dossier) {
    // Comparaison volontairement stricte : les trois valeurs doivent être
    // identiques au dossier historique, sans rapprochement approximatif.
    return propre_(dossier.nom) === propre_(nom) &&
      propre_(dossier.steamId) === propre_(steamId) &&
      propre_(dossier.discordId) === propre_(discordId);
  }).sort(function (a, b) {
    return (dateOuNull_(b.dateDepart) || 0) - (dateOuNull_(a.dateDepart) || 0) ||
      Number(b.ligne || 0) - Number(a.ligne || 0);
  });

  // Le dernier dossier fait foi. S’il a déjà servi, aucun dossier plus ancien
  // ne peut être utilisé : il faut un nouveau départ pour rouvrir ce droit.
  const dernierDossier = dossiers[0] || null;
  if (!dernierDossier || dernierDossier.medaillesRestaureesLe) {
    return {
      medailles: resultat,
      totalRestaurees: 0,
      ligneDossier: 0
    };
  }

  let totalRestaurees = 0;
  normaliserListeMedailles_(dernierDossier.medailles)
    .forEach(function (medaille) {
      let valide = '';
      try {
        valide = validerMedailleGestion_(medaille);
      } catch (erreur) {
        // Les anciennes médailles saisonnières retirées du référentiel ne
        // doivent ni être restaurées ni empêcher le retour du membre.
        return;
      }
      const cle = cleMedaille_(valide);
      if (!clesAjoutees[cle]) {
        clesAjoutees[cle] = true;
        resultat.push(valide);
        totalRestaurees++;
      }
    });

  return {
    medailles: resultat,
    totalRestaurees: totalRestaurees,
    ligneDossier: dernierDossier.ligne
  };
}

function ajouterMembreProbatoireEffectif_(matricule, steamId, discordId, dateEntree) {
  const membres = lireEffectif_();
  if (membres.length >= 35) {
    throw new Error('L’effectif a atteint sa limite de 35 GDA.');
  }
  if (membres.some(function (membre) {
    return normaliser_(membre.matricule) === normaliser_(matricule);
  })) {
    throw new Error('Ce matricule est déjà présent dans l’effectif.');
  }
  if (membres.some(function (membre) {
    return normaliser_(membre.steamId) === normaliser_(steamId);
  })) {
    throw new Error('Ce Steam ID est déjà présent dans l’effectif.');
  }
  if (membres.some(function (membre) {
    return normaliser_(membre.discordId) === normaliser_(discordId);
  })) {
    throw new Error('Ce Discord ID est déjà présent dans l’effectif.');
  }

  const c = CONFIG.EFFECTIF;
  const feuille = feuille_(c.SHEET);
  const ligne = prochaineLigne_(feuille, c.START);
  const largeur = c.MEDAILLE - c.MATRICULE + 1;
  assurerDimensionsFeuille_(feuille, ligne, c.MEDAILLE);
  const plage = feuille.getRange(ligne, c.MATRICULE, 1, largeur);
  try {
    plage.clearDataValidations();
    plage.setValues([[
      matricule,
      'Caporal',
      steamId,
      discordId,
      'Présent',
      0,
      0,
      '',
      dateOuNull_(dateEntree) || new Date(),
      '',
      0,
      '',
      '',
      ''
    ]]);
    ecrireGradeCellule_(feuille.getRange(ligne, c.GRADE), 'Caporal');
    return {
      feuille: feuille,
      ligne: ligne,
      colonne: c.MATRICULE,
      largeur: largeur,
      annulable: true
    };
  } catch (erreur) {
    plage.clearContent();
    throw erreur;
  }
}

function recupererMesDemandesAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  return reponseDemandesAbsenceMembre_(auteur, '');
}

function ajouterDemandeAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const debut = dateISORequise_(p.dateDebut, 'La date de début');
  const fin = dateISORequise_(p.dateFin, 'La date de fin');
  if (fin < debut) throw new Error('La date de fin précède la date de début.');
  verifierDureeDemandeAbsence_(debut, fin);
  const raison = limite_(p.raison, 1500, 'La raison');

  return verrou_(function () {
    const c = DEMANDES_ABSENCES;
    const feuille = feuilleDemandesAbsences_();
    const ligne = prochaineLigne_(feuille, c.START);
    const maintenant = new Date();
    feuille.getRange(ligne, 1, 1, c.NOTIFICATION_SUPPRIMEE).setValues([[
      Utilities.getUuid(), maintenant, maintenant, auteur.matricule,
      exigerGradeEffectifPublicPourMembre_(auteur, 'la demande d’absence'),
      debut, fin, raison, 'EN ATTENTE', '', '', '', '', false, false
    ]]);
    feuille.getRange(ligne, c.CREE_LE, 1, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    feuille.getRange(ligne, c.DATE_DEBUT, 1, 2).setNumberFormat('dd/MM/yyyy');
    return reponseDemandesAbsenceMembre_(auteur, 'Demande d’absence envoyée.');
  });
}

function modifierDemandeAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const debut = dateISORequise_(p.dateDebut, 'La date de début');
  const fin = dateISORequise_(p.dateFin, 'La date de fin');
  if (fin < debut) throw new Error('La date de fin précède la date de début.');
  verifierDureeDemandeAbsence_(debut, fin);
  const raison = limite_(p.raison, 1500, 'La raison');

  return verrou_(function () {
    const demande = exigerDemandeAbsenceProprietaire_(p.demandeId, auteur);
    if (demande.statutBase !== 'EN ATTENTE') {
      throw new Error('Cette demande a déjà été traitée et ne peut plus être modifiée.');
    }
    const c = DEMANDES_ABSENCES;
    const feuille = feuilleDemandesAbsences_();
    feuille.getRange(demande.ligne, c.MODIFIE_LE).setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    feuille.getRange(demande.ligne, c.DATE_DEBUT).setValue(debut).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(demande.ligne, c.DATE_FIN).setValue(fin).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(demande.ligne, c.RAISON).setValue(raison);
    return reponseDemandesAbsenceMembre_(auteur, 'Demande d’absence modifiée.');
  });
}

function supprimerDemandeAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  return verrou_(function () {
    const demande = exigerDemandeAbsenceProprietaire_(p.demandeId, auteur);
    const historiqueSupprimable =
      demande.statutBase === 'REFUSEE' ||
      demande.statut === 'TERMINEE';
    if (demande.statutBase !== 'EN ATTENTE' && !historiqueSupprimable) {
      throw new Error(
        'Une absence validée et encore active ne peut pas être supprimée de l’historique.'
      );
    }
    feuilleDemandesAbsences_().deleteRow(demande.ligne);
    return reponseDemandesAbsenceMembre_(
      auteur,
      historiqueSupprimable
        ? 'Demande retirée de votre historique personnel.'
        : 'Demande d’absence supprimée.'
    );
  });
}

function terminerDemandeAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  return verrou_(function () {
    const demande = exigerDemandeAbsenceProprietaire_(p.demandeId, auteur);
    if (demande.statutBase !== 'VALIDEE') {
      throw new Error('Seule une absence validée peut être terminée en avance.');
    }
    const aujourdHui = debutJour_(new Date());
    const finPrevue = dateOuNull_(demande.dateFin);
    if (!finPrevue || debutJour_(finPrevue) < aujourdHui) {
      throw new Error('Cette absence est déjà terminée.');
    }

    const ligneRegistre = trouverLigneRegistreDemandeAbsence_(demande);
    if (ligneRegistre) {
      const feuilleRegistre = feuille_(CONFIG.ABSENCES.SHEET);
      feuilleRegistre.getRange(ligneRegistre, CONFIG.ABSENCES.DATE_FIN)
        .setValue(aujourdHui).setNumberFormat('dd/MM/yyyy');
      feuilleRegistre.getRange(ligneRegistre, CONFIG.ABSENCES.STATUT)
        .setValue('RETOUR ANTICIPE');
    }

    const c = DEMANDES_ABSENCES;
    const feuille = feuilleDemandesAbsences_();
    feuille.getRange(demande.ligne, c.MODIFIE_LE).setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    feuille.getRange(demande.ligne, c.DATE_FIN).setValue(aujourdHui).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(demande.ligne, c.STATUT).setValue('TERMINEE');
    return reponseDemandesAbsenceMembre_(auteur, 'Fin d’absence enregistrée.');
  });
}

function traiterDemandeAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.ABSENCES_GERER);
  const decision = normaliser_(p.decision);
  if (!['ACCEPTER', 'REFUSER'].includes(decision)) {
    throw new Error('Décision invalide.');
  }
  const motifRefus = decision === 'REFUSER'
    ? limite_(p.motifRefus, 1500, 'Le motif du refus')
    : '';

  return verrou_(function () {
    const demande = trouverDemandeAbsence_(p.demandeId);
    if (!demande) throw new Error('Demande d’absence introuvable.');
    if (demande.statutBase !== 'EN ATTENTE') {
      throw new Error('Cette demande a déjà été traitée.');
    }

    const c = DEMANDES_ABSENCES;
    const feuille = feuilleDemandesAbsences_();
    let ligneRegistre = '';
    const statut = decision === 'ACCEPTER' ? 'VALIDEE' : 'REFUSEE';
    if (decision === 'ACCEPTER') {
      ligneRegistre = ajouterAbsenceRegistreDepuisDemande_(demande, auteur.matricule);
    }
    feuille.getRange(demande.ligne, c.MODIFIE_LE).setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    feuille.getRange(demande.ligne, c.STATUT).setValue(statut);
    feuille.getRange(demande.ligne, c.DECIDE_PAR).setValue(auteur.matricule);
    feuille.getRange(demande.ligne, c.DECIDE_LE).setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    feuille.getRange(demande.ligne, c.MOTIF_REFUS).setValue(motifRefus);
    feuille.getRange(demande.ligne, c.LIGNE_REGISTRE).setValue(ligneRegistre);
    feuille.getRange(demande.ligne, c.NOTIFICATION_LUE).setValue(false);
    feuille.getRange(demande.ligne, c.NOTIFICATION_SUPPRIMEE).setValue(false);
    return reponseDisponibilitesMutation_(
      decision === 'ACCEPTER' ? 'Demande d’absence acceptée.' : 'Demande d’absence refusée.',
      auteur
    );
  });
}

function recupererNotifications(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const notifications = lireDemandesAbsence_().filter(function (demande) {
    return normaliser_(demande.nom) === normaliser_(auteur.matricule) &&
      ['VALIDEE', 'REFUSEE'].includes(demande.statutBase) &&
      !demande.notificationSupprimee;
  }).map(function (demande) {
    const acceptee = demande.statutBase === 'VALIDEE';
    return {
      id: demande.id,
      titre: acceptee ? 'Demande d’absence acceptée' : 'Demande d’absence refusée',
      message: acceptee
        ? 'Votre demande du ' + dateAffichageCourte_(demande.dateDebut) + ' au ' + dateAffichageCourte_(demande.dateFin) + ' a été acceptée.'
        : 'Votre demande a été refusée : ' + (demande.motifRefus || 'motif non renseigné'),
      date: demande.dateDecision,
      lue: demande.notificationLue,
      type: acceptee ? 'succes' : 'refus'
    };
  }).sort(function (a, b) {
    return (dateOuNull_(b.date) || 0) - (dateOuNull_(a.date) || 0);
  });
  return {
    success: true,
    notifications: notifications,
    nonLues: notifications.filter(function (notification) { return !notification.lue; }).length
  };
}

function marquerNotificationsLues(p) {
  const auteur = exigerConnexion_(p.identifiant);
  return verrou_(function () {
    modifierNotificationsDemandesAbsence_(auteur.matricule, function (feuille, ligne) {
      feuille.getRange(ligne, DEMANDES_ABSENCES.NOTIFICATION_LUE).setValue(true);
    });
    return recupererNotifications({ identifiant: auteur.matricule });
  });
}

function effacerNotifications(p) {
  const auteur = exigerConnexion_(p.identifiant);
  return verrou_(function () {
    modifierNotificationsDemandesAbsence_(auteur.matricule, function (feuille, ligne) {
      feuille.getRange(ligne, DEMANDES_ABSENCES.NOTIFICATION_SUPPRIMEE).setValue(true);
    });
    return { success: true, notifications: [], nonLues: 0 };
  });
}

function recupererDisponibilites(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  const toutes = lireAbsences_();
  return {
    success: true,
    membres: lireEffectif_().map(function (membre) {
      return {
        nom: membre.matricule,
        grade: gradeEffectifPublicPourMembre_(membre)
      };
    }),
    actives: toutes.filter(a => a.statut === 'ACTIF'),
    historiques: toutes.filter(a => a.statut !== 'ACTIF'),
    demandesEnAttente: lireDemandesAbsence_().filter(function (demande) {
      return demande.statutBase === 'EN ATTENTE';
    }).map(demandeAbsenceClient_).sort(function (a, b) {
      return (dateOuNull_(b.dateCreation) || 0) - (dateOuNull_(a.dateCreation) || 0);
    }),
    peutGerer: utilisateurAPermission_(auteur, PERMISSIONS_GDA.ABSENCES_GERER),
    peutModifier: utilisateurPeutModifierDisponibilites_(auteur),
    peutSupprimer: utilisateurPeutModifierSupprimerDisponibilites_(auteur)
  };
}

function ajouterAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  const membre = exigerMembreParMatricule_(p.nom);
  const debut = dateISORequise_(p.dateDebut, 'La date de debut');
  const fin = dateISORequise_(p.dateFin, 'La date de fin');
  if (fin < debut) throw new Error('La date de fin precede la date de debut.');
  const raison = limite_(p.raison, 1500, 'La raison');

  return verrou_(function () {
    const c = CONFIG.ABSENCES;
    const feuille = feuille_(c.SHEET);
    const ligne = prochaineLigne_(feuille, c.START);
    ecrireNouvelleLigneAbsence_(feuille, ligne, {
      nom: membre.matricule,
      grade: exigerGradeEffectifPublicPourMembre_(membre, 'l’absence'),
      debut: debut,
      fin: fin,
      raison: raison,
      auteur: auteur.matricule
    });
    return reponseAbsencesMutation_('Absence ajoutée.');
  });
}

function modifierAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  exigerPermissionModificationDisponibilites_(auteur);
  const c = CONFIG.ABSENCES;
  const ligne = ligneRequise_(p.ligne, c.START);
  const debut = dateISORequise_(p.dateDebut, 'La date de debut');
  const fin = dateISORequise_(p.dateFin, 'La date de fin');
  if (fin < debut) throw new Error('La date de fin precede la date de debut.');
  const raison = limite_(p.raison, 1500, 'La raison');

  return verrou_(function () {
    const feuille = feuille_(c.SHEET);
    exigerLigne_(feuille, ligne, c.START);
    feuille.getRange(ligne, c.DATE_DEBUT).setValue(debut).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.DATE_FIN).setValue(fin).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.RAISON).setValue(raison);
    feuille.getRange(ligne, c.STATUT).setValue(fin < debutJour_(new Date()) ? 'TERMINE' : 'ACTIF');
    return reponseAbsencesMutation_('Absence modifiée.');
  });
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

function supprimerAbsence(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  exigerPermissionModifierSupprimerDisponibilites_(auteur);
  const c = CONFIG.ABSENCES;
  const ligne = ligneRequise_(p.ligne, c.START);

  return verrou_(function () {
    const feuille = feuille_(c.SHEET);
    exigerLigne_(feuille, ligne, c.START);
    const nom = propre_(feuille.getRange(ligne, c.MATRICULE).getValue());
    if (!nom) throw new Error('Cette absence n’existe plus.');

    feuille.getRange(
      ligne,
      c.MATRICULE,
      1,
      c.AUTEUR - c.MATRICULE + 1
    ).clearContent();
    CacheService.getScriptCache().remove('GDA_GEL_ABSENCES_SUIVIS_V3');
    const reponse = reponseDisponibilitesMutation_(
      'Absence de ' + nom + ' supprimée définitivement.',
      auteur
    );
    reponse.nomSupprime = nom;
    return reponse;
  });
}

function recupererDeparts(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  try {
    completerHorairesDepartsDepuisLogs_();
  } catch (erreur) {
    console.error('Restauration des horaires de départ impossible : ' + erreur.message);
  }
  const entrees = lireDeparts_();
  return {
    success: true,
    membres: lireEffectif_().map(function (membre) {
      return {
        nom: membre.matricule,
        grade: gradeEffectifPublicPourMembre_(membre)
      };
    }),
    departs: entrees.filter(e => normaliser_(e.type) === 'DEPART'),
    licenciements: entrees.filter(e => normaliser_(e.type) === 'LICENCIEMENT'),
    blacklists: entrees.filter(e => normaliser_(e.type) === 'BLACKLIST'),
    peutGerer: utilisateurAPermission_(auteur, PERMISSIONS_GDA.DEPARTS_GERER)
  };
}

function ajouterDepart(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.DEPARTS_GERER);
  const membre = exigerMembreParMatricule_(p.nom);
  const type = typeDepart_(p.type);
  const debut = appliquerHeureDate_(
    dateISORequise_(p.dateDepart, 'La date de depart'),
    new Date()
  );
  const raison = limite_(p.raison, 1500, 'La raison');
  const duree = propre_(p.duree);
  let fin = '';
  let typeEnregistre = type;

  if (type === 'Blacklist') {
    if (!duree) throw new Error('La duree de blacklist est obligatoire.');
    if (normaliser_(duree) === 'PERMANENT') {
      fin = 'Permanent';
      typeEnregistre = 'BL PERM';
    } else {
      fin = ajouterDuree_(debut, duree);
      typeEnregistre = 'BL ' + duree;
    }
  } else {
    fin = propre_(p.dateRetour)
      ? appliquerHeureDate_(dateISORequise_(p.dateRetour, 'La date de retour'), debut)
      : ajouterDuree_(debut, '1 semaine');
    if (fin < ajouterDuree_(debut, '1 semaine')) {
      throw new Error('La date de retour doit être située au moins 7 jours après la date de départ.');
    }
  }

  return verrou_(function () {
    const c = CONFIG.DEPARTS;
    const feuille = feuille_(c.SHEET);
    const ligne = prochaineLigne_(feuille, c.START);
    const largeur = c.MEDAILLES - c.MATRICULE + 1;
    const plage = feuille.getRange(ligne, c.MATRICULE, 1, largeur);
    const ecritureDepart = {
      feuille: feuille,
      ligne: ligne,
      colonne: c.MATRICULE,
      largeur: largeur,
      annulable: true
    };
    let sauvegardeEffectif = null;
    try {
      plage.clearDataValidations();
      plage.setValues([[
        membre.matricule,
        exigerGradeEffectifPublicPourMembre_(membre, 'le dossier de départ'),
        typeEnregistre,
        membre.steamId,
        membre.discordId,
        debut,
        fin,
        raison,
        '',
        auteur.matricule,
        membre.medaille
      ]]);
      feuille.getRange(ligne, c.DATE_DEBUT)
        .setNumberFormat('dd/MM/yyyy HH:mm:ss');
      if (fin instanceof Date) {
        feuille.getRange(ligne, c.DATE_FIN)
          .setNumberFormat('dd/MM/yyyy HH:mm:ss');
      }
      appliquerFormuleStatutDepart_(feuille, ligne);
      sauvegardeEffectif = retirerMembreEffectif_(membre);
      const reponse = reponseDepartsMutation_(
        'Dossier ajouté et ' + membre.matricule + ' retiré de l’effectif.'
      );
      finaliserRetraitMembreEffectifEnSilence_(sauvegardeEffectif);
      sauvegardeEffectif = null;
      return reponse;
    } catch (erreur) {
      if (sauvegardeEffectif) {
        restaurerMembreEffectifEnSilence_(sauvegardeEffectif);
      }
      annulerEcritureGestionEnSilence_(ecritureDepart);
      throw erreur;
    }
  });
}

function modifierDepart(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.DEPARTS_GERER);
  const c = CONFIG.DEPARTS;
  const ligne = ligneRequise_(p.ligne, c.START);
  const type = typeDepart_(p.type);
  const debutSaisi = propre_(p.dateDepart)
    ? dateISORequise_(p.dateDepart, 'La date de depart')
    : null;
  const finSaisie = propre_(p.dateRetour)
    ? dateISORequise_(p.dateRetour, 'La date de retour')
    : '';
  const statut = statutDepart_(p.statut);
  const raison = limite_(p.raison, 1500, 'La raison');

  return verrou_(function () {
    const feuille = feuille_(c.SHEET);
    exigerLigne_(feuille, ligne, c.START);
    const ancienType = propre_(
      feuille.getRange(ligne, c.TYPE).getValue()
    );
    const ancienDebut = dateOuNull_(
      feuille.getRange(ligne, c.DATE_DEBUT).getValue()
    );
    const ancienneFin = dateOuNull_(
      feuille.getRange(ligne, c.DATE_FIN).getValue()
    );
    if (!debutSaisi && !ancienDebut) {
      throw new Error('La date de départ est introuvable dans ce dossier.');
    }
    const heureReference = ancienDebut && !dateSansHeure_(ancienDebut)
      ? ancienDebut
      : new Date();
    const debut = debutSaisi
      ? appliquerHeureDate_(debutSaisi, heureReference)
      : ancienDebut;
    const fin = finSaisie
      ? appliquerHeureDate_(finSaisie, heureReference)
      : ancienneFin;
    let typeEnregistre = type;

    if (type === 'Blacklist') {
      if (statut === 'PERMANENT') {
        typeEnregistre = 'BL PERM';
      } else if (
        normaliser_(ancienType).startsWith('BL')
      ) {
        /* Conserve BL 1 semaine, BL 3 mois, etc. */
        typeEnregistre = ancienType;
      }
    }

    feuille.getRange(ligne, c.TYPE).setValue(typeEnregistre);
    feuille
      .getRange(ligne, c.DATE_DEBUT)
      .setValue(debut)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');

    const celluleFin =
      feuille.getRange(ligne, c.DATE_FIN);

    if (statut === 'PERMANENT') {
      celluleFin.setValue('Permanent');
    } else {
      celluleFin.setValue(fin);
      if (fin instanceof Date) {
        celluleFin.setNumberFormat('dd/MM/yyyy HH:mm:ss');
      }
    }
    feuille.getRange(ligne, c.RAISON).setValue(raison);
    appliquerFormuleStatutDepart_(feuille, ligne);
    return reponseDepartsMutation_('Dossier modifié.');
  });
}

function supprimerDepart(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.DEPARTS_GERER);
  const c = CONFIG.DEPARTS;
  const ligne = ligneRequise_(p.ligne, c.START);
  return verrou_(function () {
    const feuille = feuille_(c.SHEET);
    exigerLigne_(feuille, ligne, c.START);
    feuille.deleteRow(ligne);
    return reponseDepartsMutation_('Dossier supprimé.');
  });
}

function recupererRapports(p) {
  const auteur = exigerConnexion_(p.identifiant);
  return {
    success: true,
    membres: lireEffectif_().map(function (membre) {
      return {
        nom: membre.matricule,
        grade: gradeEffectifPublicPourMembre_(membre),
        gradeEffectifOfficier: membre.grade
      };
    }),
    rapports: lireRapports_(),
    peutValider: estOfficierGDA_(auteur),
    peutArchiver: utilisateurAPermission_(auteur, PERMISSIONS_GDA.RAPPORTS_GERER),
    peutSupprimer: utilisateurAPermission_(auteur, PERMISSIONS_GDA.RAPPORTS_SUPPRIMER)
  };
}

function recupererMesRapports(p) {
  const auteur = exigerConnexion_(p.identifiant);
  return reponseMesRapports_(auteur, '');
}

function ajouterMonRapport(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const dateRapport = dateISORequise_(p.dateRapport, 'La date du rapport');
  const rapport = limite_(p.rapport, 10000, 'Le rapport');
  const commentaire = limiteOptionnelle_(p.commentaire, 5000, 'Le commentaire');
  const conclusion = limiteOptionnelle_(p.conclusion, 5000, 'La conclusion');

  return verrou_(function () {
    const c = CONFIG.RAPPORTS;
    const feuille = feuille_(c.SHEET);
    const ligne = prochaineLigne_(feuille, c.START);
    const maintenant = new Date();

    feuille.getRange(ligne, c.MATRICULE).setValue(auteur.matricule);
    feuille
      .getRange(ligne, c.DATE_RAPPORT)
      .setValue(dateRapport)
      .setNumberFormat('dd/MM/yyyy');
    feuille
      .getRange(ligne, c.GRADE)
      .setValue(exigerGradeEffectifPublicPourMembre_(auteur, 'le rapport'));
    feuille.getRange(ligne, c.RAPPORT).setValue(rapport);
    feuille.getRange(ligne, c.COMMENTAIRE).setValue(commentaire);
    feuille.getRange(ligne, c.CONCLUSION).setValue(conclusion);
    feuille
      .getRange(ligne, c.ENVOYE_LE)
      .setValue(maintenant)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');

    // Supprime un éventuel ancien suivi lié à cette ligne. Le nouveau rapport
    // sera désormais suivi par son identifiant stable, jamais par sa position.
    PropertiesService
      .getScriptProperties()
      .deleteProperty(cleSuiviRapport_(ligne));

    return reponseMesRapports_(auteur, 'Rapport envoyé aux Officiers.');
  });
}

function modifierMonRapport(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const ligneDemandee = ligneRequise_(p.ligne, CONFIG.RAPPORTS.START);
  const rapportId = requis_(p.rapportId, 'L’identifiant du rapport');
  const dateRapport = dateISORequise_(p.dateRapport, 'La date du rapport');
  const rapport = limite_(p.rapport, 10000, 'Le rapport');
  const commentaire = limiteOptionnelle_(p.commentaire, 5000, 'Le commentaire');
  const conclusion = limiteOptionnelle_(p.conclusion, 5000, 'La conclusion');

  return verrou_(function () {
    const rapportExistant = exigerRapportPersonnelModifiable_(
      auteur,
      ligneDemandee,
      rapportId
    );
    const ligne = rapportExistant.ligne;
    const c = CONFIG.RAPPORTS;
    const feuille = feuille_(c.SHEET);

    supprimerSuiviRapportId_(rapportExistant.id);

    feuille
      .getRange(ligne, c.DATE_RAPPORT)
      .setValue(dateRapport)
      .setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.RAPPORT).setValue(rapport);
    feuille.getRange(ligne, c.COMMENTAIRE).setValue(commentaire);
    feuille.getRange(ligne, c.CONCLUSION).setValue(conclusion);

    return reponseMesRapports_(auteur, 'Rapport modifié.');
  });
}

function supprimerMonRapport(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const ligneDemandee = ligneRequise_(p.ligne, CONFIG.RAPPORTS.START);
  const rapportId = requis_(p.rapportId, 'L’identifiant du rapport');

  return verrou_(function () {
    const rapport = exigerRapportPersonnelModifiable_(
      auteur,
      ligneDemandee,
      rapportId
    );
    const ligne = rapport.ligne;
    const feuille = feuille_(CONFIG.RAPPORTS.SHEET);
    feuille.deleteRow(ligne);
    supprimerSuiviRapportId_(rapport.id);
    supprimerEtDecalerSuivisRapports_(ligne);
    ajouterHistoriqueRapportsLots_([{
      rapport: rapport,
      ancienStatut: rapport.statut,
      nouveauStatut: 'SUPPRIME',
      auteur: auteur.matricule
    }]);
    return reponseMesRapports_(auteur, 'Rapport supprimé.');
  });
}

function reponseMesRapports_(auteur, message) {
  const rapports = lireRapports_()
    .filter(function (rapport) {
      return normaliser_(rapport.nom) === normaliser_(auteur.matricule);
    })
    .map(function (rapport) {
      return {
        ligne: rapport.ligne,
        id: rapport.id,
        nom: rapport.nom,
        grade: rapport.grade,
        dateRapport: rapport.dateRapport,
        rapport: rapport.rapport,
        commentaire: rapport.commentaire,
        conclusion: rapport.conclusion,
        dateEnvoi: rapport.dateEnvoi,
        statut: rapport.statut,
        modifiable: rapport.statut === 'EN ATTENTE'
      };
    });

  return {
    success: true,
    message: message,
    nom: auteur.matricule,
    grade: gradeEffectifPublicPourMembre_(auteur),
    rapports: rapports
  };
}

function exigerRapportPersonnelModifiable_(auteur, ligne, rapportId) {
  const rapports = lireRapports_();
  const rapport = rapports.find(function (element) {
    return element.id === propre_(rapportId);
  });

  const rapportParLigne = rapport || rapports.find(function (element) {
    return element.ligne === ligne;
  });

  if (!rapportParLigne) throw new Error('Rapport introuvable. Actualisez la page.');
  if (normaliser_(rapportParLigne.nom) !== normaliser_(auteur.matricule)) {
    throw new Error('Accès refusé : ce rapport ne vous appartient pas.');
  }
  if (rapportParLigne.id !== propre_(rapportId)) {
    throw new Error('Ce rapport a changé. Actualisez la page avant de continuer.');
  }
  if (rapportParLigne.statut !== 'EN ATTENTE') {
    throw new Error(
      'Ce rapport a déjà été lu et validé. Il ne peut plus être modifié ou supprimé.'
    );
  }
  return rapportParLigne;
}

function identifiantRapportPersonnel_(rapport) {
  const source = [
    rapport.nom,
    rapport.dateEnvoi,
    rapport.dateRapport,
    rapport.rapport
  ].map(propre_).join('|');
  const empreinte = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    source,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(empreinte).replace(/=+$/g, '');
}

function ajouterRapport(p) {
  exigerConnexion_(p.identifiant);
  const matricule = p.personne || p.nom || p.matriculeRapport;
  const membre = exigerMembreParMatricule_(matricule);
  const dateRapport = dateISORequise_(p.dateRapport, 'La date du rapport');
  const rapport = limite_(p.rapport, 10000, 'Le rapport');
  const commentaire = limiteOptionnelle_(p.commentaire, 5000, 'Le commentaire');
  const conclusion = limiteOptionnelle_(p.conclusion, 5000, 'La conclusion');

  return verrou_(function () {
    const c = CONFIG.RAPPORTS;
    const feuille = feuille_(c.SHEET);
    const ligne = prochaineLigne_(feuille, c.START);
    const maintenant = new Date();

    feuille.getRange(ligne, c.MATRICULE).setValue(membre.matricule);
    feuille
      .getRange(ligne, c.DATE_RAPPORT)
      .setValue(dateRapport)
      .setNumberFormat('dd/MM/yyyy');
    feuille
      .getRange(ligne, c.GRADE)
      .setValue(exigerGradeEffectifPublicPourMembre_(membre, 'le rapport'));
    feuille.getRange(ligne, c.RAPPORT).setValue(rapport);
    feuille.getRange(ligne, c.COMMENTAIRE).setValue(commentaire);
    feuille.getRange(ligne, c.CONCLUSION).setValue(conclusion);
    feuille
      .getRange(ligne, c.ENVOYE_LE)
      .setValue(maintenant)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
    PropertiesService
      .getScriptProperties()
      .deleteProperty(cleSuiviRapport_(ligne));
    return {
      success: true,
      message: 'Rapport enregistre.',
      ligne: ligne,
      rapports: lireRapports_(),
      effectif: lireEffectif_().map(membreClient_)
    };
  });
}

function normaliserLienRapportDiscord_(lienBrut) {
  const lien = limite_(lienBrut, 500, 'Le lien du rapport Discord');
  const correspondance = lien.match(
    /^https:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/(\d+|@me)\/(\d+)\/(\d+)(?:[/?#].*)?$/i
  );
  if (!correspondance) {
    throw new Error(
      'Lien Discord invalide. Collez le lien direct du message depuis Discord.'
    );
  }
  return 'https://discord.com/channels/' +
    correspondance[1] + '/' + correspondance[2] + '/' + correspondance[3];
}

function ajouterRapportDiscord(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerOfficierGDA_(auteur, 'enregistrer un rapport Discord');
  const matricule = p.personne || p.nom || p.matriculeRapport;
  const membre = exigerMembreParMatricule_(matricule);
  const lienDiscord = normaliserLienRapportDiscord_(p.lienDiscord || p.lien);

  return verrou_(function () {
    const c = CONFIG.RAPPORTS;
    const feuille = feuille_(c.SHEET);
    const ligne = prochaineLigne_(feuille, c.START);
    const maintenant = new Date();
    const dateRapport = debutJour_(maintenant);
    const gradeArchive = exigerGradeEffectifPublicPourMembre_(
      membre,
      'le rapport Discord'
    );
    const contenuRapport = 'Rapport Discord\n' + lienDiscord;

    feuille.getRange(ligne, c.MATRICULE).setValue(membre.matricule);
    feuille
      .getRange(ligne, c.DATE_RAPPORT)
      .setValue(dateRapport)
      .setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.GRADE).setValue(gradeArchive);
    feuille.getRange(ligne, c.RAPPORT).setValue(contenuRapport);
    feuille.getRange(ligne, c.COMMENTAIRE).setValue('');
    feuille.getRange(ligne, c.CONCLUSION).setValue('');
    feuille
      .getRange(ligne, c.ENVOYE_LE)
      .setValue(maintenant)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
    PropertiesService
      .getScriptProperties()
      .deleteProperty(cleSuiviRapport_(ligne));

    SpreadsheetApp.flush();
    const rapportsApresAjout = lireRapports_();
    const rapportDiscord = rapportsApresAjout.find(function (rapport) {
      return rapport.ligne === ligne;
    });
    if (!rapportDiscord) {
      throw new Error('Le rapport Discord a ete ajoute mais reste introuvable.');
    }

    enregistrerSuiviRapport_(rapportDiscord.id, {
      statut: 'LU',
      traitePar: auteur.matricule,
      dateTraitement: dateHeureTexte_(maintenant),
      nom: rapportDiscord.nom,
      grade: rapportDiscord.grade,
      dateRapport: rapportDiscord.dateRapport,
      dateEnvoi: rapportDiscord.dateEnvoi
    });
    ajouterHistoriqueRapportsLots_([{
      rapport: rapportDiscord,
      ancienStatut: 'EN ATTENTE',
      nouveauStatut: 'LU',
      auteur: auteur.matricule
    }]);
    synchroniserNombreRapports_(membre.matricule);

    return {
      success: true,
      message: 'Rapport Discord ajoute dans les lus et valides.',
      statut: 'LU',
      id: rapportDiscord.id,
      ligne: ligne,
      rapports: lireRapports_(),
      effectif: lireEffectif_().map(membreClient_)
    };
  });
}

function changerStatutRapport(p) {
  const auteur = exigerConnexion_(p.identifiant);

  const nouveauStatut = normaliserStatutRapport_(p.statut);

  return verrou_(function () {
    const rapport = trouverRapportAction_(p);
    const ancienStatut = rapport.statut;

    if (ancienStatut === 'EN ATTENTE' && nouveauStatut === 'LU') {
      exigerOfficierGDA_(auteur, 'valider un rapport');
    } else {
      exigerPermissionGDA_(auteur, PERMISSIONS_GDA.RAPPORTS_GERER);
    }

    const transitionValide =
      (ancienStatut === 'EN ATTENTE' && nouveauStatut === 'LU') ||
      (ancienStatut === 'LU' && nouveauStatut === 'ARCHIVE') ||
      (ancienStatut === 'ARCHIVE' && nouveauStatut === 'LU');

    if (!transitionValide) {
      throw new Error(
        'Transition de rapport invalide : ' +
        ancienStatut + ' vers ' + nouveauStatut + '.'
      );
    }

    enregistrerSuiviRapport_(rapport.id, {
      statut: nouveauStatut,
      traitePar: auteur.matricule,
      dateTraitement: dateHeureTexte_(new Date()),
      nom: rapport.nom,
      grade: rapport.grade,
      dateRapport: rapport.dateRapport,
      dateEnvoi: rapport.dateEnvoi
    });
    ajouterHistoriqueRapportsLots_([{
      rapport: rapport,
      ancienStatut: ancienStatut,
      nouveauStatut: nouveauStatut,
      auteur: auteur.matricule
    }]);

    synchroniserNombreRapports_(rapport.nom);

    return {
      success: true,
      message: 'Statut du rapport mis à jour.',
      statut: nouveauStatut,
      id: rapport.id,
      ligne: rapport.ligne,
      effectif: lireEffectif_().map(membreClient_)
    };
  });
}

function archiverTousRapportsLus(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.RAPPORTS_GERER);

  return verrou_(function () {
    const rapportsLus = lireRapports_().filter(function (rapport) {
      return rapport.statut === 'LU';
    });
    const suivisAEnregistrer = [];
    const historiques = [];
    const dateTraitement = dateHeureTexte_(new Date());
    let total = 0;

    rapportsLus.forEach(function (rapport) {
      suivisAEnregistrer.push({
        id: rapport.id,
        statut: 'ARCHIVE',
        traitePar: auteur.matricule,
        dateTraitement: dateTraitement,
        nom: rapport.nom,
        grade: rapport.grade,
        dateRapport: rapport.dateRapport,
        dateEnvoi: rapport.dateEnvoi
      });
      historiques.push({
        rapport: rapport,
        ancienStatut: 'LU',
        nouveauStatut: 'ARCHIVE',
        auteur: auteur.matricule
      });
      total++;
    });

    if (total > 0) {
      enregistrerSuivisRapportsLots_(suivisAEnregistrer);
      ajouterHistoriqueRapportsLots_(historiques);
      synchroniserTousNombreRapports_();
    }

    return {
      success: true,
      total: total,
      message: total + ' rapport(s) archivé(s).',
      effectif: lireEffectif_().map(membreClient_)
    };
  });
}

function supprimerRapport(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.RAPPORTS_SUPPRIMER);

  return verrou_(function () {
    const rapport = trouverRapportAction_(p);
    const feuille = feuille_(CONFIG.RAPPORTS.SHEET);
    const ligne = rapport.ligne;

    feuille.deleteRow(ligne);
    supprimerSuiviRapportId_(rapport.id);
    supprimerEtDecalerSuivisRapports_(ligne);
    ajouterHistoriqueRapportsLots_([{
      rapport: rapport,
      ancienStatut: rapport.statut,
      nouveauStatut: 'SUPPRIME',
      auteur: auteur.matricule
    }]);
    synchroniserNombreRapports_(rapport.nom);

    return {
      success: true,
      message: 'Rapport supprimé définitivement.',
      id: rapport.id,
      ligne: ligne,
      effectif: lireEffectif_().map(membreClient_)
    };
  });
}

function lireRapports_() {
  const c = CONFIG.RAPPORTS;
  const feuille = feuille_(c.SHEET);
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return [];
  const suivis = lireSuivisRapports_();
  const suivisTampon = lireSuivisRapportsTampon_();

  const valeurs = feuille
    .getRange(c.START, 1, derniere - c.START + 1, c.ENVOYE_LE)
    .getValues();
  const stockage = PropertiesService.getScriptProperties();
  const migrationsTampon = [];
  const anciennesCles = [];

  const rapports = valeurs.map(function (r, i) {
    const ligne = c.START + i;
    const rapportBase = {
      ligne: ligne,
      nom: propre_(r[c.MATRICULE - 1]),
      grade: propre_(r[c.GRADE - 1]),
      dateRapport: dateTexte_(r[c.DATE_RAPPORT - 1]),
      rapport: propre_(r[c.RAPPORT - 1]),
      commentaire: propre_(r[c.COMMENTAIRE - 1]),
      conclusion: propre_(r[c.CONCLUSION - 1]),
      dateEnvoi: dateHeureTexte_(r[c.ENVOYE_LE - 1])
    };
    const id = identifiantRapportPersonnel_(rapportBase);
    const cleId = cleSuiviRapportId_(id);
    const cleLigne = cleSuiviRapport_(ligne);
    const suiviTampon = suivisTampon[id];
    const suiviParId = suivis[cleId];
    const suiviParLigne = suivis[cleLigne];
    let suivi = suiviTampon || suiviParId || suiviParLigne || {
      statut: 'EN ATTENTE',
      traitePar: '',
      dateTraitement: ''
    };

    // Repare un ancien suivi reste attache a une ligne reutilisee.
    // Un traitement anterieur a l'envoi ne peut pas concerner le rapport actuel.
    const dateEnvoi = dateOuNull_(r[c.ENVOYE_LE - 1]);
    const dateTraitement = dateOuNull_(suivi.dateTraitement);
    if (
      suivi.statut !== 'EN ATTENTE' &&
      dateEnvoi &&
      dateTraitement &&
      // Les dates de suivi sont stockées à la seconde alors que la date d'envoi
      // conserve ses millisecondes. Une validation immédiate peut donc sembler
      // antérieure de moins d'une seconde sans réellement l'être.
      dateTraitement.getTime() + 1000 < dateEnvoi.getTime()
    ) {
      suivi = {
        statut: 'EN ATTENTE',
        traitePar: '',
        dateTraitement: ''
      };
    }

    if (!suiviTampon || (
      suiviTampon.statut !== suivi.statut ||
      suiviTampon.traitePar !== suivi.traitePar ||
      suiviTampon.dateTraitement !== suivi.dateTraitement
    )) {
      migrationsTampon.push({
        id: id,
        statut: suivi.statut,
        traitePar: suivi.traitePar,
        dateTraitement: suivi.dateTraitement,
        nom: rapportBase.nom,
        grade: rapportBase.grade,
        dateRapport: rapportBase.dateRapport,
        dateEnvoi: rapportBase.dateEnvoi
      });
    }
    if (suiviParId) anciennesCles.push(cleId);
    if (suiviParLigne) anciennesCles.push(cleLigne);

    return Object.assign({}, rapportBase, {
      id: id,
      statut: suivi.statut,
      traitePar: suivi.traitePar,
      dateTraitement: suivi.dateTraitement
    });
  }).filter(r => r.nom && r.dateRapport && r.rapport);

  if (migrationsTampon.length) {
    enregistrerSuivisRapportsLots_(migrationsTampon, true);
  }
  anciennesCles.forEach(function (cle) {
    stockage.deleteProperty(cle);
  });

  return rapports;
}

function synchroniserNombreRapports_(matricule) {
  const membre = trouverMembre_(matricule);
  if (!membre) return;
  const total = lireRapports_().filter(
    rapport =>
      normaliser_(rapport.nom) === normaliser_(matricule) &&
      rapport.statut === 'LU'
  ).length;
  membre.feuille
    .getRange(membre.ligne, CONFIG.EFFECTIF.RAPPORTS)
    .setValue(total);
}

function synchroniserTousNombreRapports_() {
  const comptes = {};
  lireRapports_().forEach(function (rapport) {
    if (rapport.statut !== 'LU') return;
    const cle = normaliser_(rapport.nom);
    comptes[cle] = (comptes[cle] || 0) + 1;
  });

  const c = CONFIG.EFFECTIF;
  const feuille = feuille_(c.SHEET);
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return;

  const nombreLignes = derniere - c.START + 1;
  const matricules = feuille
    .getRange(c.START, c.MATRICULE, nombreLignes, 1)
    .getValues();
  const plageCompteurs = feuille
    .getRange(c.START, c.RAPPORTS, nombreLignes, 1);
  const valeurs = plageCompteurs.getValues();

  matricules.forEach(function (ligne, index) {
    const matricule = propre_(ligne[0]);
    if (!matricule || estLigneResumeEffectif_(matricule)) return;
    valeurs[index][0] = comptes[normaliser_(matricule)] || 0;
  });

  plageCompteurs.setValues(valeurs);
}

function normaliserStatutRapport_(statut) {
  const normalise = normaliser_(statut).replace(/-/g, ' ');
  if (normalise === 'EN ATTENTE' || normalise === 'ATTENTE') return 'EN ATTENTE';
  if (normalise === 'LU' || normalise === 'LUS' || normalise === 'VALIDE') return 'LU';
  if (normalise === 'ARCHIVE' || normalise === 'ARCHIVES') return 'ARCHIVE';
  throw new Error('Statut de rapport invalide.');
}

function cleSuiviRapport_(ligne) {
  return 'GDA_SUIVI_RAPPORT_' + Number(ligne);
}

function cleSuiviRapportId_(rapportId) {
  return 'GDA_SUIVI_RAPPORT_ID_' + propre_(rapportId);
}

function lireSuivisRapports_() {
  const proprietes = PropertiesService
    .getScriptProperties()
    .getProperties();
  const suivis = {};

  Object.keys(proprietes).forEach(function (cle) {
    if (!cle.startsWith('GDA_SUIVI_RAPPORT_')) return;

    try {
      const valeur = JSON.parse(proprietes[cle]);
      suivis[cle] = {
        statut: normaliserStatutRapport_(valeur.statut || 'EN ATTENTE'),
        traitePar: propre_(valeur.traitePar),
        dateTraitement: propre_(valeur.dateTraitement)
      };
    } catch (erreur) {
      /* Une propriété invalide est ignorée : le rapport revient en attente. */
    }
  });

  return suivis;
}

function feuilleStockageRapports_() {
  const c = CONFIG.STOCKAGE;
  let classeur;
  try {
    classeur = SpreadsheetApp.openById(c.SPREADSHEET_ID);
  } catch (erreur) {
    throw new Error(
      'Le classeur de stockage GDA est inaccessible. Vérifiez que le compte du déploiement possède les droits.'
    );
  }

  let feuille = classeur.getSheetByName(c.RAPPORTS_SHEET);
  if (!feuille) {
    const feuilles = classeur.getSheets();
    const premiereVide = feuilles.length === 1 && feuilles[0].getLastRow() === 0
      ? feuilles[0]
      : null;
    feuille = premiereVide
      ? premiereVide.setName(c.RAPPORTS_SHEET)
      : classeur.insertSheet(c.RAPPORTS_SHEET);
  }

  if (
    propre_(feuille.getRange(1, 1).getValue()) !== 'ID rapport' ||
    propre_(feuille.getRange(1, 9).getValue()) !== 'Date d’envoi'
  ) {
    feuille.getRange(1, 1, 1, 9).setValues([[
      'ID rapport',
      'Statut',
      'Traité par',
      'Date de traitement',
      'Dernière mise à jour',
      'Matricule',
      'Grade',
      'Date du rapport',
      'Date d’envoi'
    ]]);
    feuille.setFrozenRows(1);
  }
  return feuille;
}

function lireSuivisRapportsTampon_() {
  const c = CONFIG.STOCKAGE;
  const feuille = feuilleStockageRapports_();
  const derniere = feuille.getLastRow();
  if (derniere < c.RAPPORTS_START) return {};

  const valeurs = feuille
    .getRange(c.RAPPORTS_START, 1, derniere - c.RAPPORTS_START + 1, 9)
    .getValues();
  const suivis = {};

  valeurs.forEach(function (r, index) {
    const id = propre_(r[c.RAPPORT_ID - 1]);
    if (!id) return;
    let statut = 'EN ATTENTE';
    try {
      statut = normaliserStatutRapport_(r[c.RAPPORT_STATUT - 1] || 'EN ATTENTE');
    } catch (erreur) {
      statut = 'EN ATTENTE';
    }
    suivis[id] = {
      id: id,
      ligneStockage: c.RAPPORTS_START + index,
      statut: statut,
      traitePar: propre_(r[c.RAPPORT_AUTEUR - 1]),
      dateTraitement: dateHeureTexte_(r[c.RAPPORT_TRAITE_LE - 1])
    };
  });

  return suivis;
}

function enregistrerSuivisRapportsLots_(suivis, seulementAbsents) {
  if (!Array.isArray(suivis) || !suivis.length) return;
  const c = CONFIG.STOCKAGE;
  const feuille = feuilleStockageRapports_();
  const derniere = feuille.getLastRow();
  const valeurs = derniere >= c.RAPPORTS_START
    ? feuille.getRange(c.RAPPORTS_START, 1, derniere - c.RAPPORTS_START + 1, 9).getValues()
    : [];
  const indexParId = {};

  valeurs.forEach(function (r, index) {
    const id = propre_(r[c.RAPPORT_ID - 1]);
    if (id) indexParId[id] = index;
  });

  suivis.forEach(function (suivi) {
    const id = propre_(suivi && suivi.id);
    if (!id) return;
    const dateTraitement = dateOuNull_(suivi.dateTraitement);
    const ligne = [
      id,
      normaliserStatutRapport_(suivi.statut || 'EN ATTENTE'),
      propre_(suivi.traitePar),
      dateTraitement || '',
      new Date(),
      propre_(suivi.nom),
      propre_(suivi.grade),
      dateOuNull_(suivi.dateRapport) || '',
      dateOuNull_(suivi.dateEnvoi) || ''
    ];

    if (Object.prototype.hasOwnProperty.call(indexParId, id)) {
      if (seulementAbsents) return;
      valeurs[indexParId[id]] = ligne;
    } else {
      indexParId[id] = valeurs.length;
      valeurs.push(ligne);
    }
  });

  if (!valeurs.length) return;
  feuille
    .getRange(c.RAPPORTS_START, 1, valeurs.length, 9)
    .setValues(valeurs);
  feuille
    .getRange(c.RAPPORTS_START, c.RAPPORT_TRAITE_LE, valeurs.length, 2)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  feuille
    .getRange(c.RAPPORTS_START, c.RAPPORT_DATE, valeurs.length, 1)
    .setNumberFormat('dd/MM/yyyy');
  feuille
    .getRange(c.RAPPORTS_START, c.RAPPORT_ENVOYE_LE, valeurs.length, 1)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function feuilleHistoriqueRapports_() {
  const c = CONFIG.STOCKAGE;
  const classeur = SpreadsheetApp.openById(c.SPREADSHEET_ID);
  let feuille = classeur.getSheetByName(c.RAPPORTS_HISTORIQUE_SHEET);
  if (!feuille) feuille = classeur.insertSheet(c.RAPPORTS_HISTORIQUE_SHEET);

  if (propre_(feuille.getRange(1, 1).getValue()) !== 'Date de l’action') {
    feuille.getRange(1, 1, 1, 8).setValues([[
      'Date de l’action',
      'ID rapport',
      'Matricule',
      'Grade',
      'Ancien statut',
      'Nouveau statut',
      'Effectué par',
      'Date du rapport'
    ]]);
    feuille.setFrozenRows(1);
  }
  return feuille;
}

function ajouterHistoriqueRapportsLots_(actions) {
  if (!Array.isArray(actions) || !actions.length) return;
  const feuille = feuilleHistoriqueRapports_();
  const lignes = actions.map(function (action) {
    const rapport = action.rapport || {};
    return [
      new Date(),
      propre_(rapport.id),
      propre_(rapport.nom),
      propre_(rapport.grade),
      propre_(action.ancienStatut),
      propre_(action.nouveauStatut),
      propre_(action.auteur),
      dateOuNull_(rapport.dateRapport) || ''
    ];
  }).filter(function (ligne) {
    return ligne[1];
  });
  if (!lignes.length) return;

  const debut = Math.max(feuille.getLastRow() + 1, 2);
  feuille.getRange(debut, 1, lignes.length, 8).setValues(lignes);
  feuille.getRange(debut, 1, lignes.length, 1)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  feuille.getRange(debut, 8, lignes.length, 1)
    .setNumberFormat('dd/MM/yyyy');
}

function initialiserStockageGDA() {
  const suivi = feuilleStockageRapports_();
  const historique = feuilleHistoriqueRapports_();
  const journalActions = feuilleJournalActions_();
  const demandesAbsences = feuilleDemandesAbsences_();
  const parametres = feuilleParametresGDA_();
  const archivesInstructeur = feuilleArchivesInstructeur_();
  const rapportsInstructeur = feuilleRapportsInstructeur_();
  const suivisFormation = feuilleSuivisFormation_();
  const listeBlanche = feuilleListeBlancheGDA_();
  sauvegarderParametresGDA_();
  return 'Stockage GDA initialisé : ' +
    [
      suivi.getName(),
      historique.getName(),
      journalActions.getName(),
      demandesAbsences.getName(),
      parametres.getName(),
      archivesInstructeur.getName(),
      rapportsInstructeur.getName(),
      suivisFormation.getName(),
      listeBlanche.getName()
    ].join(', ') + '.';
}

/**
 * Analyse toutes les feuilles du classeur mémoire sans les modifier.
 */
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

function feuilleArchivesInstructeur_() {
  const c = ARCHIVES_INSTRUCTEUR;
  const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  let feuille = classeur.getSheetByName(CONFIG.STOCKAGE.ARCHIVES_INSTRUCTEUR_SHEET);
  if (!feuille) {
    feuille = classeur.insertSheet(CONFIG.STOCKAGE.ARCHIVES_INSTRUCTEUR_SHEET);
  }
  const entetes = [[
    'Identifiant', 'Matricule', 'Steam ID', 'Discord ID',
    'Nombre de rapports', 'Prises de service', 'Date de fin',
    'Instructeur', 'Gérant instruction', 'Commentaire', 'Sanction',
    'Résultat', 'Raison', 'Date d’import', 'Source'
  ]];
  if (propre_(feuille.getRange(1, c.ID).getValue()) !== 'Identifiant') {
    feuille.getRange(1, 1, 1, entetes[0].length).setValues(entetes);
    feuille.setFrozenRows(1);
    feuille.getRange(1, 1, 1, entetes[0].length).setFontWeight('bold');
  }
  feuille.getRange(1, c.DATE_FIN, Math.max(feuille.getMaxRows(), 2), 1)
    .setNumberFormat('dd/MM/yyyy');
  feuille.getRange(1, c.IMPORTE_LE, Math.max(feuille.getMaxRows(), 2), 1)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  return feuille;
}

function feuilleRapportsInstructeur_() {
  const c = RAPPORTS_INSTRUCTEUR;
  const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  let feuille = classeur.getSheetByName(CONFIG.STOCKAGE.RAPPORTS_INSTRUCTEUR_SHEET);
  if (!feuille) {
    feuille = classeur.insertSheet(CONFIG.STOCKAGE.RAPPORTS_INSTRUCTEUR_SHEET);
  }
  if (propre_(feuille.getRange(1, c.ID).getValue()) !== 'Identifiant') {
    feuille.getRange(1, 1, 1, c.ACTIF).setValues([[
      'Identifiant', 'Date d’envoi', 'Instructeur', 'Type',
      'Date du test ou de la formation', 'Personne formée',
      'Matricule définitif', 'Steam ID', 'Discord ID', 'Note sur 20',
      'Résultat', 'Remarque', 'Commentaire', 'Identifiant du dossier', 'Actif'
    ]]);
    feuille.setFrozenRows(1);
    feuille.getRange(1, 1, 1, c.ACTIF).setFontWeight('bold');
    feuille.getRange(2, c.CREE_LE, Math.max(feuille.getMaxRows() - 1, 1), 1)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
    feuille.getRange(2, c.DATE_EVENEMENT, Math.max(feuille.getMaxRows() - 1, 1), 1)
      .setNumberFormat('dd/MM/yyyy');
    feuille.getRange(
      2,
      c.MATRICULE_DEFINITIF,
      Math.max(feuille.getMaxRows() - 1, 1),
      3
    ).setNumberFormat('@');
  }
  if (propre_(feuille.getRange(1, c.DOSSIER_ID).getValue()) !== 'Identifiant du dossier') {
    feuille.getRange(1, c.DOSSIER_ID).setValue('Identifiant du dossier').setFontWeight('bold');
  }
  if (propre_(feuille.getRange(1, c.ACTIF).getValue()) !== 'Actif') {
    feuille.getRange(1, c.ACTIF).setValue('Actif').setFontWeight('bold');
  }
  return feuille;
}

function feuilleSuivisFormation_() {
  const c = SUIVIS_FORMATION;
  const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  let feuille = classeur.getSheetByName(CONFIG.STOCKAGE.SUIVIS_FORMATION_SHEET);
  if (!feuille) feuille = classeur.insertSheet(CONFIG.STOCKAGE.SUIVIS_FORMATION_SHEET);
  assurerDimensionsFeuille_(
    feuille,
    Math.max(feuille.getLastRow(), c.START),
    c.DATE_FIN_APRES_ABSENCE
  );
  if (propre_(feuille.getRange(1, c.ID).getValue()) !== 'Identifiant') {
    feuille.getRange(1, 1, 1, c.DATE_FIN_APRES_ABSENCE).setValues([[
      'Identifiant', 'Matricule', 'Steam ID', 'Discord ID',
      'Nombre de rapports', 'Prises de service', 'Date de fin',
      'Instructeur', 'Gérant', 'Commentaire', 'Sanction', 'Statut',
      'Date de création', 'Dernière modification', 'Source',
      'Jours absence registre compensés', 'Dernier gel manuel',
      'Jours gel manuel en cours', 'Date de fin initiale',
      'Date de fin après absence'
    ]]);
    feuille.setFrozenRows(1);
    feuille.getRange(1, 1, 1, c.DATE_FIN_APRES_ABSENCE).setFontWeight('bold');
    feuille.getRange(2, c.MATRICULE, Math.max(feuille.getMaxRows() - 1, 1), 3)
      .setNumberFormat('@');
    feuille.getRange(2, c.DATE_FIN, Math.max(feuille.getMaxRows() - 1, 1), 1)
      .setNumberFormat('dd/MM/yyyy');
    feuille.getRange(
      2,
      c.DATE_FIN_INITIALE,
      Math.max(feuille.getMaxRows() - 1, 1),
      2
    ).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(2, c.CREE_LE, Math.max(feuille.getMaxRows() - 1, 1), 2)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }
  if (propre_(feuille.getRange(1, c.ABSENCE_REGISTRE_COMPENSEE).getValue()) !==
      'Jours absence registre compensés') {
    feuille.getRange(1, c.ABSENCE_REGISTRE_COMPENSEE)
      .setValue('Jours absence registre compensés').setFontWeight('bold');
  }
  if (propre_(feuille.getRange(1, c.DERNIER_GEL_MANUEL).getValue()) !==
      'Dernier gel manuel') {
    feuille.getRange(1, c.DERNIER_GEL_MANUEL)
      .setValue('Dernier gel manuel').setFontWeight('bold');
    feuille.getRange(
      2,
      c.DERNIER_GEL_MANUEL,
      Math.max(feuille.getMaxRows() - 1, 1),
      1
    ).setNumberFormat('dd/MM/yyyy');
  }
  if (propre_(feuille.getRange(1, c.GEL_MANUEL_EN_COURS).getValue()) !==
      'Jours gel manuel en cours') {
    feuille.getRange(1, c.GEL_MANUEL_EN_COURS)
      .setValue('Jours gel manuel en cours').setFontWeight('bold');
  }
  if (propre_(feuille.getRange(1, c.DATE_FIN_INITIALE).getValue()) !==
      'Date de fin initiale') {
    feuille.getRange(1, c.DATE_FIN_INITIALE)
      .setValue('Date de fin initiale').setFontWeight('bold');
    feuille.getRange(
      2,
      c.DATE_FIN_INITIALE,
      Math.max(feuille.getMaxRows() - 1, 1),
      1
    ).setNumberFormat('dd/MM/yyyy');
  }
  if (propre_(feuille.getRange(1, c.DATE_FIN_APRES_ABSENCE).getValue()) !==
      'Date de fin après absence') {
    feuille.getRange(1, c.DATE_FIN_APRES_ABSENCE)
      .setValue('Date de fin après absence').setFontWeight('bold');
    feuille.getRange(
      2,
      c.DATE_FIN_APRES_ABSENCE,
      Math.max(feuille.getMaxRows() - 1, 1),
      1
    ).setNumberFormat('dd/MM/yyyy');
  }
  return feuille;
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

function feuilleParametresGDA_() {
  const c = CONFIG.STOCKAGE;
  const classeur = SpreadsheetApp.openById(c.SPREADSHEET_ID);
  let feuille = classeur.getSheetByName(c.PARAMETRES_SHEET);
  if (!feuille) feuille = classeur.insertSheet(c.PARAMETRES_SHEET);
  if (propre_(feuille.getRange(1, 1).getValue()) !== 'Clé') {
    feuille.getRange(1, 1, 1, 3).setValues([[
      'Clé', 'Valeur', 'Dernière mise à jour'
    ]]);
    feuille.setFrozenRows(1);
  }
  return feuille;
}

function estParametreGDASauvegardable_(cle) {
  return cle === CLE_PROPRIETAIRE_GDA ||
    cle === CLE_COPROPRIETAIRES_GDA ||
    cle === CLE_MODE_AUTONOME_MEMOIRE ||
    cle.startsWith('GDA_PERMISSIONS_');
}

function sauvegarderParametresGDA_() {
  const proprietes = PropertiesService.getScriptProperties().getProperties();
  const maintenant = new Date();
  const lignes = Object.keys(proprietes)
    .filter(estParametreGDASauvegardable_)
    .sort()
    .map(function (cle) {
      return [cle, proprietes[cle], maintenant];
    });
  const feuille = feuilleParametresGDA_();
  const derniere = feuille.getLastRow();
  if (derniere >= 2) {
    feuille.getRange(2, 1, derniere - 1, 3).clearContent();
  }
  if (lignes.length) {
    feuille.getRange(2, 1, lignes.length, 3).setValues(lignes);
    feuille.getRange(2, 3, lignes.length, 1)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }
  return lignes.length;
}

function sauvegarderParametresGDAEnSilence_() {
  try {
    sauvegarderParametresGDA_();
  } catch (erreur) {
    console.error('Sauvegarde des paramètres GDA impossible : ' + erreur.message);
  }
}

const CLE_FEUILLES_DISPONIBILITES_PLAINES = 'GDA_FEUILLES_DISPONIBILITES_PLAINES_V1';

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

function sauvegarderParametresGDA() {
  const total = sauvegarderParametresGDA_();
  return total + ' paramètre(s) GDA sauvegardé(s), hors secrets et sessions.';
}

function restaurerParametresGDA() {
  const feuille = feuilleParametresGDA_();
  const derniere = feuille.getLastRow();
  if (derniere < 2) return 'Aucun paramètre GDA à restaurer.';
  const valeurs = feuille.getRange(2, 1, derniere - 1, 2).getValues();
  const proprietes = {};
  valeurs.forEach(function (r) {
    const cle = propre_(r[0]);
    if (cle && estParametreGDASauvegardable_(cle)) {
      proprietes[cle] = String(r[1] == null ? '' : r[1]);
    }
  });
  if (Object.keys(proprietes).length) {
    PropertiesService.getScriptProperties().setProperties(proprietes, false);
  }
  return Object.keys(proprietes).length + ' paramètre(s) GDA restauré(s).';
}

/**
 * À exécuter une fois depuis l'éditeur Apps Script lié au document principal.
 * La synchronisation est ensuite lancée automatiquement toutes les 5 minutes.
 */
function installerSynchronisationDocumentPrincipalGDA() {
  throw new Error(
    'Synchronisation desactivee : le document memoire est desormais la source unique.'
  );
  /* Ancien installateur conservé temporairement pour faciliter l'audit. */
  const source = SpreadsheetApp.getActive();
  if (!source) {
    throw new Error('Ouvrez ce script depuis le document principal avant l’installation.');
  }
  if (source.getId() === CONFIG.STOCKAGE.SPREADSHEET_ID) {
    throw new Error('Ce script doit être exécuté depuis le document principal, pas le stockage.');
  }
  PropertiesService.getScriptProperties()
    .setProperty(CLE_SOURCE_PRINCIPALE_ID, source.getId());

  ScriptApp.getProjectTriggers().forEach(function (declencheur) {
    if (declencheur.getHandlerFunction() === FONCTION_SYNCHRONISATION_PRINCIPALE) {
      ScriptApp.deleteTrigger(declencheur);
    }
  });
  ScriptApp.newTrigger(FONCTION_SYNCHRONISATION_PRINCIPALE)
    .timeBased()
    .everyMinutes(5)
    .create();

  const resultat = synchroniserDocumentPrincipalGDA();
  return 'Synchronisation installée toutes les 5 minutes. ' +
    resultat.nouveauxMembres + ' nouveau(x) membre(s), ' +
    resultat.gradesMisAJour + ' grade(s) mis à jour et ' +
    resultat.nouveauxRapports + ' nouveau(x) rapport(s) importé(s).';
}

function supprimerSynchronisationDocumentPrincipalGDA() {
  let total = 0;
  ScriptApp.getProjectTriggers().forEach(function (declencheur) {
    if (declencheur.getHandlerFunction() === FONCTION_SYNCHRONISATION_PRINCIPALE) {
      ScriptApp.deleteTrigger(declencheur);
      total++;
    }
  });
  return total + ' déclencheur(s) de synchronisation supprimé(s).';
}

/** Coupe définitivement le lien avec l'ancien document principal. */
function activerModeAutonomeMemoireGDA() {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  try {
    const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
    const feuillesRequises = [
      CONFIG.EFFECTIF.SHEET,
      CONFIG.ABSENCES.SHEET,
      CONFIG.DEPARTS.SHEET,
      CONFIG.RAPPORTS.SHEET
    ];
    const absentes = feuillesRequises.filter(function (nom) {
      return !classeur.getSheetByName(nom);
    });
    if (absentes.length) {
      throw new Error(
        'Bascule annulee : feuille(s) absente(s) du document memoire : ' +
        absentes.join(', ') + '.'
      );
    }

    let declencheursSupprimes = 0;
    ScriptApp.getProjectTriggers().forEach(function (declencheur) {
      if (declencheur.getHandlerFunction() === FONCTION_SYNCHRONISATION_PRINCIPALE) {
        ScriptApp.deleteTrigger(declencheur);
        declencheursSupprimes++;
      }
    });

    const stockage = PropertiesService.getScriptProperties();
    stockage.deleteProperty(CLE_SOURCE_PRINCIPALE_ID);
    stockage.setProperty(CLE_MODE_AUTONOME_MEMOIRE, 'ACTIF');
    initialiserStockageGDA();
    sauvegarderParametresGDA_();

    const etat = feuillesRequises.map(function (nom) {
      const feuille = classeur.getSheetByName(nom);
      return nom + ' (' + Math.max(feuille.getLastRow() - 1, 0) + ' ligne(s))';
    });
    return 'Mode memoire autonome actif. ' + declencheursSupprimes +
      ' declencheur(s) supprime(s). ' + etat.join(', ') + '.';
  } finally {
    verrou.releaseLock();
  }
}

function verifierModeAutonomeMemoireGDA() {
  const stockage = PropertiesService.getScriptProperties();
  const declencheurPrincipal = ScriptApp.getProjectTriggers().some(function (declencheur) {
    return declencheur.getHandlerFunction() === FONCTION_SYNCHRONISATION_PRINCIPALE;
  });
  return {
    stockageActif: stockage.getProperty(CLE_MODE_AUTONOME_MEMOIRE) === 'ACTIF',
    sourcePrincipaleConfiguree: !!stockage.getProperty(CLE_SOURCE_PRINCIPALE_ID),
    synchronisationPrincipaleActive: declencheurPrincipal,
    spreadsheetId: CONFIG.STOCKAGE.SPREADSHEET_ID
  };
}

function synchroniserDocumentPrincipalGDA() {
  return {
    success: true,
    desactivee: true,
    nouveauxMembres: 0,
    gradesMisAJour: 0,
    nouveauxRapports: 0,
    message: 'Aucun acces au document principal : stockage memoire autonome.'
  };
  /* Ancienne synchronisation volontairement rendue inaccessible. */
  const verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  try {
    const source = ouvrirDocumentPrincipalSource_();
    const destination = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
    const effectif = synchroniserEffectifDepuisPrincipal_(source, destination);
    const rapports = synchroniserRapportsDepuisPrincipal_(source, destination);
    const resultat = {
      success: true,
      nouveauxMembres: effectif.nouveaux,
      gradesMisAJour: effectif.grades,
      nouveauxRapports: rapports.nouveaux,
      executeLe: dateHeureTexte_(new Date())
    };
    console.log(JSON.stringify(resultat));
    return resultat;
  } finally {
    verrou.releaseLock();
  }
}

function ouvrirDocumentPrincipalSource_() {
  throw new Error('Le document principal a ete deconnecte du site GDA.');
  /* Ancienne ouverture volontairement rendue inaccessible. */
  const id = propre_(PropertiesService.getScriptProperties()
    .getProperty(CLE_SOURCE_PRINCIPALE_ID));
  if (!id) {
    throw new Error(
      'Source principale non configurée. Exécutez installerSynchronisationDocumentPrincipalGDA().' 
    );
  }
  if (id === CONFIG.STOCKAGE.SPREADSHEET_ID) {
    throw new Error('La source principale ne peut pas être le classeur de stockage.');
  }
  return SpreadsheetApp.openById(id);
}

function synchroniserEffectifDepuisPrincipal_(source, destination) {
  const c = CONFIG.EFFECTIF;
  const feuilleSource = source.getSheetByName(c.SHEET);
  const feuilleDestination = destination.getSheetByName(c.SHEET);
  if (!feuilleSource || !feuilleDestination) {
    throw new Error('Feuille Effectif Global introuvable dans la source ou le stockage.');
  }
  const largeur = c.MEDAILLE - c.MATRICULE + 1;
  const derniereSource = feuilleSource.getLastRow();
  if (derniereSource < c.START) return { nouveaux: 0, grades: 0 };

  const plageSource = feuilleSource.getRange(
    c.START, c.MATRICULE, derniereSource - c.START + 1, largeur
  );
  const valeursSource = plageSource.getValues();
  const formatsSource = plageSource.getNumberFormats();
  const derniereDestination = feuilleDestination.getLastRow();
  const valeursDestination = derniereDestination >= c.START
    ? feuilleDestination.getRange(
        c.START, c.MATRICULE, derniereDestination - c.START + 1, largeur
      ).getValues()
    : [];
  const indexDestination = {};
  valeursDestination.forEach(function (ligne, index) {
    const nom = propre_(ligne[0]);
    if (nom && !estLigneResumeEffectif_(nom) && !indexDestination[normaliser_(nom)]) {
      indexDestination[normaliser_(nom)] = c.START + index;
    }
  });

  let nouveaux = 0;
  let grades = 0;
  valeursSource.forEach(function (ligne, index) {
    const nom = propre_(ligne[0]);
    const grade = propre_(ligne[c.GRADE - c.MATRICULE]);
    if (!nom || estLigneResumeEffectif_(nom)) return;
    const cle = normaliser_(nom);
    const ligneDestination = indexDestination[cle];
    if (ligneDestination) {
      if (grade) {
        const celluleGrade = feuilleDestination.getRange(ligneDestination, c.GRADE);
        if (normaliser_(celluleGrade.getValue()) !== normaliser_(grade)) {
          celluleGrade.clearDataValidations().setValue(grade);
          grades++;
        }
      }
      return;
    }

    const nouvelleLigne = prochaineLigne_(feuilleDestination, c.START);
    const plageDestination = feuilleDestination.getRange(
      nouvelleLigne, c.MATRICULE, 1, largeur
    );
    plageDestination.clearDataValidations();
    plageDestination.setValues([ligne]);
    plageDestination.setNumberFormats([formatsSource[index]]);
    indexDestination[cle] = nouvelleLigne;
    nouveaux++;
  });
  return { nouveaux: nouveaux, grades: grades };
}

function synchroniserRapportsDepuisPrincipal_(source, destination) {
  const c = CONFIG.RAPPORTS;
  const feuilleSource = source.getSheetByName(c.SHEET);
  const feuilleDestination = destination.getSheetByName(c.SHEET);
  if (!feuilleSource || !feuilleDestination) {
    throw new Error('Feuille Rapport GDA introuvable dans la source ou le stockage.');
  }
  const largeur = c.ENVOYE_LE - c.MATRICULE + 1;
  const idsExistants = {};
  const derniereDestination = feuilleDestination.getLastRow();
  if (derniereDestination >= c.START) {
    feuilleDestination.getRange(
      c.START, c.MATRICULE, derniereDestination - c.START + 1, largeur
    ).getValues().forEach(function (ligne) {
      const rapport = rapportSynchronisationDepuisValeurs_(ligne);
      if (rapport) idsExistants[cleRapportSynchronisation_(rapport)] = true;
    });
  }

  const derniereSource = feuilleSource.getLastRow();
  if (derniereSource < c.START) return { nouveaux: 0 };
  const plageSource = feuilleSource.getRange(
    c.START, c.MATRICULE, derniereSource - c.START + 1, largeur
  );
  const valeursSource = plageSource.getValues();
  const formatsSource = plageSource.getNumberFormats();
  let nouveaux = 0;

  valeursSource.forEach(function (ligne, index) {
    const rapport = rapportSynchronisationDepuisValeurs_(ligne);
    if (!rapport) return;
    const id = cleRapportSynchronisation_(rapport);
    if (idsExistants[id]) return;

    const nouvelleLigne = prochaineLigne_(feuilleDestination, c.START);
    const plageDestination = feuilleDestination.getRange(
      nouvelleLigne, c.MATRICULE, 1, largeur
    );
    plageDestination.clearDataValidations();
    plageDestination.setValues([ligne]);
    plageDestination.setNumberFormats([formatsSource[index]]);
    idsExistants[id] = true;
    nouveaux++;
  });
  return { nouveaux: nouveaux };
}

function rapportSynchronisationDepuisValeurs_(ligne) {
  const rapport = {
    nom: propre_(ligne[0]),
    dateRapport: dateTexte_(ligne[1]),
    grade: propre_(ligne[2]),
    rapport: propre_(ligne[3]),
    commentaire: propre_(ligne[4]),
    conclusion: propre_(ligne[5]),
    dateEnvoi: dateHeureTexte_(ligne[6])
  };
  return rapport.nom && rapport.rapport && rapport.dateEnvoi ? rapport : null;
}

/**
 * La date/heure d'envoi est l'identifiant immuable du rapport dans la boite
 * de reception principale. Le contenu n'entre volontairement pas dans la cle :
 * corriger un ancien texte ne doit jamais creer un second rapport au stockage.
 */
function cleRapportSynchronisation_(rapport) {
  return normaliser_(rapport.nom) + '|' + propre_(rapport.dateEnvoi);
}

/** Installe l'import automatique du classeur « Suive de forma ». */
function installerSynchronisationArchivesInstructeurGDA() {
  ScriptApp.getProjectTriggers().forEach(function (declencheur) {
    if (declencheur.getHandlerFunction() ===
        FONCTION_SYNCHRONISATION_ARCHIVES_INSTRUCTEUR) {
      ScriptApp.deleteTrigger(declencheur);
    }
  });
  ScriptApp.newTrigger(FONCTION_SYNCHRONISATION_ARCHIVES_INSTRUCTEUR)
    .timeBased()
    .everyMinutes(10)
    .create();
  const resultat = synchroniserArchivesInstructeurGDA();
  return 'Synchronisation Instructeur installée toutes les 10 minutes. ' +
    resultat.nouvelles + ' nouvelle(s) archive(s), ' +
    resultat.nouveauxSuivis + ' nouveau(x) suivi(s) importé(s).';
}

function supprimerSynchronisationArchivesInstructeurGDA() {
  let total = 0;
  ScriptApp.getProjectTriggers().forEach(function (declencheur) {
    if (declencheur.getHandlerFunction() ===
        FONCTION_SYNCHRONISATION_ARCHIVES_INSTRUCTEUR) {
      ScriptApp.deleteTrigger(declencheur);
      total++;
    }
  });
  return total + ' déclencheur(s) Archives Instructeur supprimé(s).';
}

function synchroniserArchivesInstructeurGDA() {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  try {
    const source = SpreadsheetApp.openById(
      ARCHIVES_INSTRUCTEUR.SOURCE_SPREADSHEET_ID
    );
    const feuilleSource = source.getSheetByName(ARCHIVES_INSTRUCTEUR.SOURCE_SHEET);
    if (!feuilleSource) {
      throw new Error('La feuille Archives est introuvable dans « Suive de forma ».');
    }
    const destination = feuilleArchivesInstructeur_();
    const idsExistants = {};
    const derniereDestination = destination.getLastRow();
    if (derniereDestination >= ARCHIVES_INSTRUCTEUR.START) {
      destination.getRange(
        ARCHIVES_INSTRUCTEUR.START,
        ARCHIVES_INSTRUCTEUR.ID,
        derniereDestination - ARCHIVES_INSTRUCTEUR.START + 1,
        1
      ).getValues().forEach(function (ligne) {
        const id = propre_(ligne[0]);
        if (id) idsExistants[id] = true;
      });
    }

    const derniereSource = feuilleSource.getLastRow();
    const effectifParMatricule = {};
    lireEffectif_().forEach(function (membre) {
      effectifParMatricule[normaliser_(membre.matricule)] = membre;
    });
    const valeurs = derniereSource >= ARCHIVES_INSTRUCTEUR.SOURCE_START
      ? feuilleSource.getRange(
          ARCHIVES_INSTRUCTEUR.SOURCE_START,
          1,
          derniereSource - ARCHIVES_INSTRUCTEUR.SOURCE_START + 1,
          12
        ).getValues()
      : [];
    const maintenant = new Date();
    const nouvelles = [];

    valeurs.forEach(function (ligne) {
      const matricule = propre_(ligne[0]);
      const resultat = normaliserResultatArchiveInstructeur_(ligne[10]);
      if (!matricule || !resultat) return;
      const id = identifiantArchiveInstructeurSource_(ligne, resultat);
      if (idsExistants[id]) return;
      const membre = effectifParMatricule[normaliser_(matricule)] || null;
      nouvelles.push([
        id,
        matricule,
        propre_(ligne[2]),
        membre ? propre_(membre.discordId) : '',
        nombre_(ligne[3]),
        nombre_(ligne[4]),
        dateOuNull_(ligne[5]) || '',
        propre_(ligne[6]),
        propre_(ligne[7]),
        propre_(ligne[8]),
        propre_(ligne[9]),
        resultat,
        propre_(ligne[11]),
        maintenant,
        'Suive de forma / Archives'
      ]);
      idsExistants[id] = true;
    });

    if (nouvelles.length) {
      const debut = prochaineLigne_(destination, ARCHIVES_INSTRUCTEUR.START);
      destination.getRange(debut, 1, nouvelles.length, 15).setValues(nouvelles);
      destination.getRange(debut, ARCHIVES_INSTRUCTEUR.DATE_FIN, nouvelles.length, 1)
        .setNumberFormat('dd/MM/yyyy');
      destination.getRange(debut, ARCHIVES_INSTRUCTEUR.IMPORTE_LE, nouvelles.length, 1)
        .setNumberFormat('dd/MM/yyyy HH:mm:ss');
    }
    const suivis = synchroniserSuivisFormationDepuisSource_(source);
    return {
      success: true,
      nouvelles: nouvelles.length,
      nouveauxSuivis: suivis.nouveaux,
      suivisMisAJour: suivis.misAJour
    };
  } finally {
    verrou.releaseLock();
  }
}

function synchroniserSuivisFormationDepuisSource_(source) {
  const c = SUIVIS_FORMATION;
  const feuilleSource = source.getSheetByName(c.SOURCE_SHEET);
  if (!feuilleSource) {
    throw new Error('La feuille Suivis Forma est introuvable dans « Suive de forma ».');
  }
  const destination = feuilleSuivisFormation_();
  const derniereDestination = destination.getLastRow();
  const index = {};
  if (derniereDestination >= c.START) {
    destination.getRange(c.START, 1, derniereDestination - c.START + 1, c.SOURCE)
      .getValues().forEach(function (ligne, position) {
        const matricule = propre_(ligne[c.MATRICULE - 1]);
        if (matricule) index[normaliser_(matricule)] = {
          ligne: c.START + position,
          valeurs: ligne
        };
      });
  }
  const discordParMatricule = {};
  lireEffectif_().forEach(function (membre) {
    if (membre.discordId) {
      discordParMatricule[normaliser_(membre.matricule)] = membre.discordId;
    }
  });
  const rapports = feuilleRapportsInstructeur_();
  if (rapports.getLastRow() >= RAPPORTS_INSTRUCTEUR.START) {
    rapports.getRange(
      RAPPORTS_INSTRUCTEUR.START,
      1,
      rapports.getLastRow() - RAPPORTS_INSTRUCTEUR.START + 1,
      RAPPORTS_INSTRUCTEUR.COMMENTAIRE
    ).getValues().forEach(function (ligne) {
      const matricule = propre_(ligne[RAPPORTS_INSTRUCTEUR.MATRICULE_DEFINITIF - 1]);
      const discordId = propre_(ligne[RAPPORTS_INSTRUCTEUR.DISCORD_ID - 1]);
      if (matricule && discordId) discordParMatricule[normaliser_(matricule)] = discordId;
    });
  }
  const derniereSource = feuilleSource.getLastRow();
  const lignesSource = derniereSource >= c.SOURCE_START
    ? feuilleSource.getRange(c.SOURCE_START, 1, derniereSource - c.SOURCE_START + 1, 11).getValues()
    : [];
  let nouveaux = 0;
  let misAJour = 0;
  const maintenant = new Date();
  lignesSource.forEach(function (ligne) {
    const matricule = propre_(ligne[0]);
    if (!matricule) return;
    const cle = normaliser_(matricule);
    const existant = index[cle];
    if (
      existant &&
      normaliser_(existant.valeurs[c.SOURCE - 1]).includes('SUPPRIME HTML')
    ) return;
    const statut = normaliserResultatArchiveInstructeur_(ligne[10]);
    const valeurExistante = function (colonne) {
      return existant ? existant.valeurs[colonne - 1] : '';
    };
    const valeurs = [
      existant ? propre_(existant.valeurs[c.ID - 1]) : identifiantSuiviFormation_(matricule),
      matricule,
      propre_(ligne[2]) || propre_(valeurExistante(c.STEAM_ID)),
      existant && propre_(existant.valeurs[c.DISCORD_ID - 1])
        ? propre_(existant.valeurs[c.DISCORD_ID - 1])
        : propre_(discordParMatricule[cle]),
      existant
        ? nombre_(valeurExistante(c.RAPPORTS))
        : nombre_(ligne[3]),
      existant
        ? nombre_(valeurExistante(c.PRISES_SERVICE))
        : nombre_(ligne[4]),
      dateOuNull_(ligne[5]) || dateOuNull_(valeurExistante(c.DATE_FIN)) || '',
      propre_(ligne[6]) || propre_(valeurExistante(c.INSTRUCTEUR)),
      propre_(ligne[7]) || propre_(valeurExistante(c.GERANT)),
      existant
        ? propre_(valeurExistante(c.COMMENTAIRE))
        : propre_(ligne[8]),
      propre_(ligne[9]) || propre_(valeurExistante(c.SANCTION)),
      statut || normaliserResultatArchiveInstructeur_(valeurExistante(c.STATUT)),
      existant ? existant.valeurs[c.CREE_LE - 1] : maintenant,
      maintenant,
      'Suive de forma / Suivis Forma'
    ];
    const numeroLigne = existant
      ? existant.ligne
      : prochaineLigne_(destination, c.START);
    destination.getRange(numeroLigne, 1, 1, c.SOURCE).setValues([valeurs]);
    destination.getRange(numeroLigne, c.MATRICULE, 1, 3).setNumberFormat('@');
    destination.getRange(numeroLigne, c.DATE_FIN).setNumberFormat('dd/MM/yyyy');
    destination.getRange(numeroLigne, c.CREE_LE, 1, 2)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
    if (existant) misAJour++;
    else {
      nouveaux++;
      index[cle] = { ligne: numeroLigne, valeurs: valeurs };
    }
  });
  return { nouveaux: nouveaux, misAJour: misAJour };
}

function identifiantSuiviFormation_(matricule) {
  const empreinte = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    'SUIVI|' + normaliser_(matricule),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(empreinte).replace(/=+$/g, '');
}

function identifiantArchiveInstructeurSource_(ligne, resultat) {
  const dateFin = dateTexte_(ligne[5]);
  const morceaux = [
    ARCHIVES_INSTRUCTEUR.SOURCE_SPREADSHEET_ID,
    propre_(ligne[0]),
    propre_(ligne[2]),
    dateFin,
    resultat
  ];
  if (!dateFin) {
    morceaux.push(
      propre_(ligne[3]),
      propre_(ligne[4]),
      propre_(ligne[6]),
      propre_(ligne[11])
    );
  }
  const empreinte = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    morceaux.join('|'),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(empreinte).replace(/=+$/g, '');
}

function normaliserResultatArchiveInstructeur_(valeur) {
  const resultat = normaliser_(valeur);
  if (resultat.includes('ACCEPT')) return 'ACCEPTE';
  if (resultat.includes('REFUS')) return 'REFUSE';
  return '';
}

function membrePeutAccederRapportsInstructeur_(membre) {
  const specialisation = normaliser_(membre && membre.specialisation);
  return membrePossedeRoleVisiteur_(membre) ||
    estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    specialisation.includes('GERANT GDA') ||
    specialisation.includes('RESPONSABLE INST') ||
    specialisation.includes('INSTRUCTEUR');
}

function membrePossedeRoleGestionInstructeur_(membre) {
  const specialisation = normaliser_(membre && membre.specialisation);
  return specialisation.includes('RESPONSABLE INST') ||
    specialisation.includes('INSTRUCTEUR EN CHEF');
}

function membreEstResponsableInstPrincipal_(membre) {
  const specialisation = normaliser_(membre && membre.specialisation);
  const coResponsable = specialisation.includes('CO-RESPONSABLE INST') ||
    specialisation.includes('CO RESPONSABLE INST');
  return specialisation.includes('RESPONSABLE INST') && !coResponsable;
}

function membrePeutConsulterSuivisFormation_(membre) {
  return estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    estOfficierGDA_(membre) ||
    membrePossedeRoleGestionInstructeur_(membre) ||
    utilisateurAPermission_(membre, PERMISSIONS_GDA.SUIVIS_DECIDER_TOUS);
}

function membrePeutAccederArchivesInstructeur_(membre) {
  return estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    estOfficierSuperieurGDA_(membre) ||
    membreEstResponsableInstPrincipal_(membre);
}

function membrePeutAdministrerSuivisFormation_(membre) {
  return estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    membrePossedeRoleGestionInstructeur_(membre);
}

function membrePeutDeciderSuiviFormation_(membre, suivi) {
  return estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    utilisateurAPermission_(membre, PERMISSIONS_GDA.SUIVIS_DECIDER_TOUS) ||
    (
      normaliser_(membre && membre.matricule) ===
        normaliser_(matriculeDepuisLibelleGerantSuivi_(suivi && suivi.gerant))
    );
}

function membrePeutRecevoirGeranceSuiviFormation_(membre) {
  return membrePeutAdministrerSuivisFormation_(membre) ||
    utilisateurAPermission_(membre, PERMISSIONS_GDA.SUIVIS_DECIDER_TOUS);
}

function membrePeutTransfererGeranceSuiviFormation_(membre, suivi) {
  return estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    normaliser_(membre && membre.matricule) ===
      normaliser_(matriculeDepuisLibelleGerantSuivi_(suivi && suivi.gerant));
}

function libelleGerantSuiviFormation_(membre) {
  const matricule = propre_(membre && membre.matricule);
  const specialisation = normaliser_(membre && membre.specialisation);
  if (specialisation.includes('CO-RESPONSABLE INST') ||
      specialisation.includes('CO RESPONSABLE INST')) {
    return 'Co-Resp ' + matricule;
  }
  if (specialisation.includes('RESPONSABLE INST')) {
    return 'Resp ' + matricule;
  }
  return 'Gérant — ' + matricule;
}

function matriculeDepuisLibelleGerantSuivi_(valeur) {
  return propre_(valeur)
    .replace(/^g[ée]rant\s*/i, '')
    .replace(/^(?:co[-\s]*resp(?:onsable)?|resp(?:onsable)?)\b\s*/i, '')
    .replace(/^(?:—|–|-|:|\|)\s*/, '')
    .trim();
}

function recupererArchivesInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  if (!membrePeutAccederArchivesInstructeur_(auteur)) {
    throw new Error('Accès réservé à la spécialisation Instructeur.');
  }
  const c = ARCHIVES_INSTRUCTEUR;
  const feuille = feuilleArchivesInstructeur_();
  const derniere = feuille.getLastRow();
  const archives = derniere < c.START ? [] : feuille.getRange(
    c.START, 1, derniere - c.START + 1, c.SOURCE
  ).getValues().map(function (ligne) {
    const dateFin = dateOuNull_(ligne[c.DATE_FIN - 1]);
    return {
      id: propre_(ligne[c.ID - 1]),
      matricule: propre_(ligne[c.MATRICULE - 1]),
      steamId: propre_(ligne[c.STEAM_ID - 1]),
      discordId: propre_(ligne[c.DISCORD_ID - 1]),
      nombreRapports: nombre_(ligne[c.RAPPORTS - 1]),
      prisesService: nombre_(ligne[c.PRISES_SERVICE - 1]),
      dateFin: dateTexte_(dateFin),
      instructeur: propre_(ligne[c.INSTRUCTEUR - 1]),
      gerant: propre_(ligne[c.GERANT - 1]),
      commentaire: propre_(ligne[c.COMMENTAIRE - 1]),
      sanction: propre_(ligne[c.SANCTION - 1]),
      resultat: normaliserResultatArchiveInstructeur_(ligne[c.RESULTAT - 1]),
      raison: propre_(ligne[c.RAISON - 1]),
      importeLe: dateHeureTexte_(ligne[c.IMPORTE_LE - 1]),
      source: propre_(ligne[c.SOURCE - 1]),
      tri: dateFin ? dateFin.getTime() : 0
    };
  }).filter(function (archive) {
    return archive.id && archive.matricule && archive.resultat;
  }).sort(function (a, b) {
    return b.tri - a.tri;
  }).map(function (archive) {
    delete archive.tri;
    return archive;
  });
  return {
    success: true,
    archives: archives,
    peutSupprimer: estProprietaireGDA_(auteur) || estCoproprietaireGDA_(auteur),
    acceptes: archives.filter(function (archive) {
      return archive.resultat === 'ACCEPTE';
    }).length,
    refuses: archives.filter(function (archive) {
      return archive.resultat === 'REFUSE';
    }).length
  };
}

function supprimerArchiveInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  if (!estProprietaireGDA_(auteur) && !estCoproprietaireGDA_(auteur)) {
    throw new Error('Suppression réservée au propriétaire et aux copropriétaires.');
  }
  const id = requis_(p.archiveId, 'L’archive');
  const c = ARCHIVES_INSTRUCTEUR;
  const feuille = feuilleArchivesInstructeur_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) throw new Error('Archive introuvable.');
  const valeurs = feuille.getRange(c.START, 1, derniere - c.START + 1, c.SOURCE)
    .getValues();
  const position = valeurs.findIndex(function (ligne) {
    return propre_(ligne[c.ID - 1]) === id;
  });
  if (position < 0) throw new Error('Archive introuvable. Actualisez la page.');
  const archive = valeurs[position];
  const resultat = normaliserResultatArchiveInstructeur_(archive[c.RESULTAT - 1]);
  if (!['ACCEPTE', 'REFUSE'].includes(resultat)) {
    throw new Error('Cette archive ne peut pas être supprimée avec cette fonction.');
  }
  const ligne = c.START + position;
  const source = propre_(archive[c.SOURCE - 1]);
  feuille.getRange(ligne, c.RESULTAT).setValue('SUPPRIME');
  feuille.getRange(ligne, c.IMPORTE_LE)
    .setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  feuille.getRange(ligne, c.SOURCE).setValue(
    (source ? source + ' / ' : '') +
    'SUPPRIME HTML PAR ' + auteur.matricule
  );
  return {
    success: true,
    id: id,
    message: propre_(archive[c.MATRICULE - 1]) + ' a été retiré des archives.'
  };
}

function exigerAccesRapportsInstructeur_(membre) {
  if (!membrePeutAccederRapportsInstructeur_(membre)) {
    throw new Error('Accès réservé à la spécialisation Instructeur.');
  }
}

function exigerConsultationSuivisFormation_(membre) {
  if (!membrePeutConsulterSuivisFormation_(membre)) {
    throw new Error('Accès refusé aux suivis de formation.');
  }
}

function membrePeutAdministrerRapportsInstructeur_(membre) {
  return estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    normaliser_(membre && membre.specialisation).includes('RESPONSABLE INST');
}

function verifierMatriculeRapportTestInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerAccesRapportsInstructeur_(auteur);
  const matricule = requis_(p.matricule, 'Le matricule définitif');
  const membre = trouverMembre_(matricule);
  return {
    success: true,
    matricule: matricule,
    disponible: !membre,
    message: membre
      ? 'Ce matricule est déjà présent dans l’effectif.'
      : 'Ce matricule est disponible.'
  };
}

function enregistrerRapportTestInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerAccesRapportsInstructeur_(auteur);
  const personneFormee = requis_(p.personneFormee, 'La personne formée');
  const matricule = requis_(p.matricule, 'Le matricule définitif');
  if (trouverMembre_(matricule)) {
    throw new Error('Ce matricule est déjà présent dans l’effectif. Vérifiez-en un autre.');
  }
  const dateTest = dateISORequise_(p.dateTest, 'La date du test');
  const steamId = requis_(p.steamId, 'Le Steam ID');
  const discordId = normaliserIdDiscord_(requis_(p.discordId, 'Le Discord ID'));
  if (!discordId) {
    throw new Error('Le Discord ID doit contenir entre 15 et 22 chiffres.');
  }
  const noteTexte = requis_(p.note, 'La note');
  const note = Number(noteTexte.replace(',', '.'));
  if (!Number.isFinite(note) || note < 0 || note > 20) {
    throw new Error('La note doit être comprise entre 0 et 20.');
  }
  const resultat = note >= 14 ? 'ACCEPTE' : 'REFUSE';
  const c = RAPPORTS_INSTRUCTEUR;
  const feuille = feuilleRapportsInstructeur_();
  const ligne = prochaineLigne_(feuille, c.START);
  const rapport = {
    id: Utilities.getUuid(),
    creeLe: new Date(),
    auteur: auteur.matricule,
    type: 'TEST',
    date: dateTest,
    personneFormee: personneFormee,
    matricule: matricule,
    steamId: steamId,
    discordId: discordId,
    note: note,
    resultat: resultat,
    remarque: propre_(p.remarque),
    commentaire: propre_(p.commentaire),
    dossierId: '',
    actif: true,
    actifDefini: true
  };
  rapport.dossierId = rapport.id;
  feuille.getRange(ligne, c.MATRICULE_DEFINITIF, 1, 3).setNumberFormat('@');
  feuille.getRange(ligne, 1, 1, c.ACTIF).setValues([[
    rapport.id,
    rapport.creeLe,
    rapport.auteur,
    rapport.type,
    rapport.date,
    rapport.personneFormee,
    rapport.matricule,
    rapport.steamId,
    rapport.discordId,
    rapport.note,
    rapport.resultat,
    rapport.remarque,
    rapport.commentaire,
    rapport.dossierId,
    true
  ]]);
  feuille.getRange(ligne, c.CREE_LE).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  feuille.getRange(ligne, c.DATE_EVENEMENT).setNumberFormat('dd/MM/yyyy');
  if (resultat === 'ACCEPTE') {
    creerSuiviEnAttenteDepuisRapport_(rapport);
  }
  return {
    success: true,
    message: 'Rapport Test enregistré et classé « ' +
      (resultat === 'ACCEPTE' ? 'Accepté' : 'Refusé') + ' ».',
    rapport: rapportInstructeurClient_(rapport)
  };
}

function enregistrerRapportFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerAccesRapportsInstructeur_(auteur);
  const matricule = requis_(p.matricule, 'La personne en attente');
  const suivi = lireSuivisFormationInstructeur_().find(function (element) {
    return !element.statut && !element.dateFin &&
      normaliser_(element.matricule) === normaliser_(matricule) &&
      normaliser_(element.source).includes('RAPPORT INSTRUCTEUR');
  });
  if (!suivi) {
    throw new Error('Cette personne n’est plus en attente de formation. Actualisez la page.');
  }
  if (trouverDernierRapportFormationInstructeur_(matricule, suivi.id)) {
    throw new Error('Un rapport Formation existe déjà pour cette personne.');
  }
  const dateFormation = dateISORequise_(p.dateFormation, 'La date de la formation');
  const steamId = requis_(p.steamId, 'Le Steam ID retapé');
  const discordId = normaliserIdDiscord_(requis_(p.discordId, 'Le Discord ID retapé'));
  if (!discordId) {
    throw new Error('Le Discord ID doit contenir entre 15 et 22 chiffres.');
  }
  const c = RAPPORTS_INSTRUCTEUR;
  const feuille = feuilleRapportsInstructeur_();
  const ligne = prochaineLigne_(feuille, c.START);
  const rapport = {
    id: Utilities.getUuid(),
    creeLe: new Date(),
    auteur: auteur.matricule,
    type: 'FORMATION',
    date: dateFormation,
    personneFormee: suivi.matricule,
    matricule: suivi.matricule,
    steamId: steamId,
    discordId: discordId,
    note: 0,
    resultat: 'ACCEPTE',
    remarque: '',
    commentaire: propre_(p.commentaire),
    dossierId: suivi.id,
    actif: true,
    actifDefini: true
  };
  feuille.getRange(ligne, c.MATRICULE_DEFINITIF, 1, 3).setNumberFormat('@');
  feuille.getRange(ligne, 1, 1, c.ACTIF).setValues([[
    rapport.id,
    rapport.creeLe,
    rapport.auteur,
    rapport.type,
    rapport.date,
    rapport.personneFormee,
    rapport.matricule,
    rapport.steamId,
    rapport.discordId,
    rapport.note,
    rapport.resultat,
    rapport.remarque,
    rapport.commentaire,
    rapport.dossierId,
    true
  ]]);
  feuille.getRange(ligne, c.CREE_LE).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  feuille.getRange(ligne, c.DATE_EVENEMENT).setNumberFormat('dd/MM/yyyy');
  return {
    success: true,
    message: 'Rapport Formation enregistré pour ' + suivi.matricule + '.',
    rapport: rapportInstructeurClient_(rapport)
  };
}

function recupererCandidatsRapportFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerAccesRapportsInstructeur_(auteur);
  const candidats = lireSuivisFormationInstructeur_().filter(function (suivi) {
    return !suivi.statut && !suivi.dateFin &&
      normaliser_(suivi.source).includes('RAPPORT INSTRUCTEUR') &&
      !trouverDernierRapportFormationInstructeur_(suivi.matricule, suivi.id);
  }).map(function (suivi) {
    return {
      matricule: propre_(suivi.matricule),
      steamId: propre_(suivi.steamId),
      discordId: propre_(suivi.discordId)
    };
  }).sort(function (a, b) {
    return normaliser_(a.matricule).localeCompare(normaliser_(b.matricule));
  });
  return {
    success: true,
    candidats: candidats
  };
}

function trouverDernierRapportFormationInstructeur_(matricule, dossierId) {
  const c = RAPPORTS_INSTRUCTEUR;
  const feuille = feuilleRapportsInstructeur_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return null;
  const valeurs = feuille.getRange(c.START, 1, derniere - c.START + 1, c.ACTIF)
    .getValues();
  const dossierLieExplicitement = propre_(dossierId) && valeurs.some(function (ligne) {
    return normaliser_(ligne[c.TYPE - 1]).includes('TEST') &&
      propre_(ligne[c.DOSSIER_ID - 1]) === propre_(dossierId);
  });
  for (let index = valeurs.length - 1; index >= 0; index--) {
    const ligne = valeurs[index];
    const dossierLigne = propre_(ligne[c.DOSSIER_ID - 1]);
    const actifBrut = ligne[c.ACTIF - 1];
    const actif = propre_(actifBrut) === '' || booleenOui_(actifBrut);
    if (
      actif &&
      normaliser_(ligne[c.TYPE - 1]).includes('FORMATION') &&
      normaliser_(ligne[c.MATRICULE_DEFINITIF - 1]) === normaliser_(matricule) &&
      (
        !propre_(dossierId) || dossierLigne === propre_(dossierId) ||
        (!dossierLieExplicitement && !dossierLigne)
      )
    ) {
      return {
        id: propre_(ligne[c.ID - 1]),
        creeLe: dateOuNull_(ligne[c.CREE_LE - 1]),
        auteur: propre_(ligne[c.AUTEUR - 1]),
        type: 'FORMATION',
        date: dateOuNull_(ligne[c.DATE_EVENEMENT - 1]),
        personneFormee: propre_(ligne[c.PERSONNE_FORMEE - 1]),
        matricule: propre_(ligne[c.MATRICULE_DEFINITIF - 1]),
        steamId: propre_(ligne[c.STEAM_ID - 1]),
        discordId: propre_(ligne[c.DISCORD_ID - 1]),
        note: nombre_(ligne[c.NOTE - 1]),
        resultat: normaliserResultatArchiveInstructeur_(ligne[c.RESULTAT - 1]),
        remarque: propre_(ligne[c.REMARQUE - 1]),
        commentaire: propre_(ligne[c.COMMENTAIRE - 1]),
        dossierId: dossierLigne,
        actif: actif
      };
    }
  }
  return null;
}

function recupererRapportsInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerAccesRapportsInstructeur_(auteur);
  return {
    success: true,
    rapports: lireRapportsInstructeur_(),
    peutAdministrer: membrePeutAdministrerRapportsInstructeur_(auteur)
  };
}

function lireRapportsInstructeur_() {
  const c = RAPPORTS_INSTRUCTEUR;
  const feuille = feuilleRapportsInstructeur_();
  const derniere = feuille.getLastRow();
  const rapports = derniere < c.START ? [] : feuille.getRange(
    c.START, 1, derniere - c.START + 1, c.ACTIF
  ).getValues().map(function (ligne) {
    const actifBrut = ligne[c.ACTIF - 1];
    const actifDefini = propre_(actifBrut) !== '';
    return rapportInstructeurClient_({
      id: propre_(ligne[c.ID - 1]),
      creeLe: dateOuNull_(ligne[c.CREE_LE - 1]),
      auteur: propre_(ligne[c.AUTEUR - 1]),
      type: propre_(ligne[c.TYPE - 1]),
      date: dateOuNull_(ligne[c.DATE_EVENEMENT - 1]),
      personneFormee: propre_(ligne[c.PERSONNE_FORMEE - 1]),
      matricule: propre_(ligne[c.MATRICULE_DEFINITIF - 1]),
      steamId: propre_(ligne[c.STEAM_ID - 1]),
      discordId: propre_(ligne[c.DISCORD_ID - 1]),
      note: nombre_(ligne[c.NOTE - 1]),
      resultat: propre_(ligne[c.RESULTAT - 1]),
      remarque: propre_(ligne[c.REMARQUE - 1]),
      commentaire: propre_(ligne[c.COMMENTAIRE - 1]),
      dossierId: propre_(ligne[c.DOSSIER_ID - 1]),
      actif: !actifDefini || booleenOui_(actifBrut),
      actifDefini: actifDefini
    });
  }).filter(function (rapport) {
    return rapport.id && rapport.type;
  }).sort(function (a, b) {
    return b.tri - a.tri;
  }).map(function (rapport) {
    delete rapport.tri;
    return rapport;
  });
  return rapports;
}

function trouverRapportInstructeurParId_(id) {
  const c = RAPPORTS_INSTRUCTEUR;
  const feuille = feuilleRapportsInstructeur_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return null;
  const valeurs = feuille.getRange(c.START, 1, derniere - c.START + 1, c.ACTIF)
    .getValues();
  const position = valeurs.findIndex(function (ligne) {
    return propre_(ligne[c.ID - 1]) === propre_(id);
  });
  if (position < 0) return null;
  return {
    feuille: feuille,
    ligne: c.START + position,
    valeurs: valeurs[position]
  };
}

function modifierRapportInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerAccesRapportsInstructeur_(auteur);
  if (!membrePeutAdministrerRapportsInstructeur_(auteur)) {
    throw new Error('Modification réservée à la propriété et aux Responsables INST.');
  }
  const trouve = trouverRapportInstructeurParId_(requis_(p.rapportId, 'Le rapport'));
  if (!trouve) throw new Error('Rapport introuvable. Actualisez la page.');
  const c = RAPPORTS_INSTRUCTEUR;
  const type = normaliser_(trouve.valeurs[c.TYPE - 1]).includes('FORMATION')
    ? 'FORMATION'
    : 'TEST';
  const dateEvenement = dateISORequise_(p.date, 'La date du rapport');
  const ancienMatricule = propre_(trouve.valeurs[c.MATRICULE_DEFINITIF - 1]);
  const personneFormee = type === 'FORMATION'
    ? propre_(trouve.valeurs[c.PERSONNE_FORMEE - 1])
    : requis_(p.personneFormee, 'La personne formée');
  const matricule = type === 'FORMATION'
    ? ancienMatricule
    : requis_(p.matricule, 'Le matricule');
  const steamId = propre_(p.steamId);
  const discordBrut = propre_(p.discordId);
  const discordId = discordBrut ? normaliserIdDiscord_(discordBrut) : '';
  if (discordBrut && !discordId) {
    throw new Error('Le Discord ID doit contenir entre 15 et 22 chiffres.');
  }
  let note = nombre_(trouve.valeurs[c.NOTE - 1]);
  let resultat = normaliserResultatArchiveInstructeur_(
    trouve.valeurs[c.RESULTAT - 1]
  );
  if (type === 'TEST') {
    const noteSaisie = Number(requis_(p.note, 'La note').replace(',', '.'));
    if (!Number.isFinite(noteSaisie) || noteSaisie < 0 || noteSaisie > 20) {
      throw new Error('La note doit être comprise entre 0 et 20.');
    }
    note = noteSaisie;
    resultat = note >= 14 ? 'ACCEPTE' : 'REFUSE';
  }
  trouve.feuille.getRange(
    trouve.ligne,
    c.DATE_EVENEMENT,
    1,
    c.COMMENTAIRE - c.DATE_EVENEMENT + 1
  ).setValues([[
    dateEvenement,
    personneFormee,
    matricule,
    steamId,
    discordId,
    note,
    resultat,
    propre_(p.remarque),
    propre_(p.commentaire)
  ]]);
  trouve.feuille.getRange(trouve.ligne, c.DATE_EVENEMENT).setNumberFormat('dd/MM/yyyy');
  trouve.feuille.getRange(trouve.ligne, c.MATRICULE_DEFINITIF, 1, 3).setNumberFormat('@');
  if (type === 'TEST') {
    const actifBrut = trouve.valeurs[c.ACTIF - 1];
    const actifDefini = propre_(actifBrut) !== '';
    synchroniserSuiviDepuisModificationRapportInstructeur_({
      id: propre_(trouve.valeurs[c.ID - 1]),
      type: type,
      matricule: matricule,
      ancienMatricule: ancienMatricule,
      steamId: steamId,
      discordId: discordId,
      resultat: resultat,
      remarque: propre_(p.remarque),
      commentaire: propre_(p.commentaire),
      dossierId: propre_(trouve.valeurs[c.DOSSIER_ID - 1]),
      actif: !actifDefini || booleenOui_(actifBrut)
    });
  }
  const actifBrut = trouve.valeurs[c.ACTIF - 1];
  const actifDefini = propre_(actifBrut) !== '';
  const rapport = rapportInstructeurClient_({
    id: propre_(trouve.valeurs[c.ID - 1]),
    creeLe: dateOuNull_(trouve.valeurs[c.CREE_LE - 1]),
    auteur: propre_(trouve.valeurs[c.AUTEUR - 1]),
    type: type,
    date: dateEvenement,
    personneFormee: personneFormee,
    matricule: matricule,
    steamId: steamId,
    discordId: discordId,
    note: note,
    resultat: resultat,
    remarque: propre_(p.remarque),
    commentaire: propre_(p.commentaire),
    dossierId: propre_(trouve.valeurs[c.DOSSIER_ID - 1]),
    actif: !actifDefini || booleenOui_(actifBrut),
    actifDefini: actifDefini
  });
  delete rapport.tri;
  return { success: true, message: 'Le rapport a été modifié.', rapport: rapport };
}

function supprimerRapportInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerAccesRapportsInstructeur_(auteur);
  if (!membrePeutAdministrerRapportsInstructeur_(auteur)) {
    throw new Error('Suppression réservée à la propriété et aux Responsables INST.');
  }
  const trouve = trouverRapportInstructeurParId_(requis_(p.rapportId, 'Le rapport'));
  if (!trouve) throw new Error('Rapport introuvable. Actualisez la page.');
  const matricule = propre_(
    trouve.valeurs[RAPPORTS_INSTRUCTEUR.MATRICULE_DEFINITIF - 1]
  );
  const type = normaliser_(trouve.valeurs[RAPPORTS_INSTRUCTEUR.TYPE - 1]);
  if (type.includes('TEST')) {
    neutraliserSuiviEnAttenteRapportInstructeur_(matricule, auteur.matricule);
  }
  trouve.feuille.deleteRow(trouve.ligne);
  return { success: true, message: 'Le rapport de ' + matricule + ' a été supprimé.' };
}

function synchroniserSuiviDepuisModificationRapportInstructeur_(rapport) {
  if (rapport.actif === false) return;
  const dossierId = propre_(rapport.dossierId);
  const suivi = lireSuivisFormationInstructeur_().find(function (element) {
    return !element.statut && !element.dateFin &&
      normaliser_(element.matricule) === normaliser_(rapport.ancienMatricule) &&
      (!dossierId || element.id === dossierId) &&
      normaliser_(element.source).includes('RAPPORT INSTRUCTEUR');
  });
  if (rapport.resultat !== 'ACCEPTE') {
    if (suivi) neutraliserSuiviEnAttenteRapportInstructeur_(
      suivi.matricule,
      'MODIFICATION RAPPORT'
    );
    return;
  }
  if (!suivi) {
    creerSuiviEnAttenteDepuisRapport_(rapport);
    return;
  }
  const trouve = trouverSuiviFormationParId_(suivi.id);
  if (!trouve) return;
  trouve.feuille.getRange(trouve.ligne, SUIVIS_FORMATION.MATRICULE, 1, 3)
    .setValues([[rapport.matricule, rapport.steamId, rapport.discordId]])
    .setNumberFormat('@');
  trouve.feuille.getRange(trouve.ligne, SUIVIS_FORMATION.MODIFIE_LE)
    .setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

function neutraliserSuiviEnAttenteRapportInstructeur_(matricule, auteur) {
  const suivi = lireSuivisFormationInstructeur_().find(function (element) {
    return !element.statut && !element.dateFin &&
      normaliser_(element.matricule) === normaliser_(matricule) &&
      normaliser_(element.source).includes('RAPPORT INSTRUCTEUR');
  });
  if (!suivi) return;
  const trouve = trouverSuiviFormationParId_(suivi.id);
  if (!trouve) return;
  desactiverRapportsInstructeurDossier_(suivi.id, suivi.matricule);
  trouve.feuille.deleteRow(trouve.ligne);
}

function rapportInstructeurClient_(rapport) {
  const dateEvenement = dateOuNull_(rapport.date);
  const creeLe = dateOuNull_(rapport.creeLe);
  return {
    id: propre_(rapport.id),
    auteur: propre_(rapport.auteur),
    type: normaliser_(rapport.type).includes('FORMATION') ? 'FORMATION' : 'TEST',
    date: dateEvenement
      ? Utilities.formatDate(
          dateEvenement,
          Session.getScriptTimeZone(),
          'dd/MM/yyyy'
        )
      : '',
    dateEnvoi: creeLe
      ? Utilities.formatDate(
          creeLe,
          Session.getScriptTimeZone(),
          'dd/MM/yyyy HH:mm:ss'
        )
      : '',
    creeLeMs: creeLe ? creeLe.getTime() : 0,
    personneFormee: propre_(rapport.personneFormee),
    matricule: propre_(rapport.matricule),
    steamId: propre_(rapport.steamId),
    discordId: propre_(rapport.discordId),
    note: nombre_(rapport.note),
    resultat: normaliserResultatArchiveInstructeur_(rapport.resultat),
    remarque: propre_(rapport.remarque),
    commentaire: propre_(rapport.commentaire),
    dossierId: propre_(rapport.dossierId),
    actif: rapport.actif !== false,
    actifDefini: rapport.actifDefini === true,
    tri: creeLe ? creeLe.getTime() : (dateEvenement ? dateEvenement.getTime() : 0)
  };
}

function recupererSuivisFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerConsultationSuivisFormation_(auteur);
  synchroniserGelAbsencesSuivisFormation_();
  separerCommentairesRapportsEtSuivisInstructeur_();
  const rapports = lireRapportsInstructeur_();
  const derniersArchivages = derniersArchivagesInstructeurParMatricule_();
  const derniersTestsAcceptes = {};
  rapports.forEach(function (rapport) {
    if (
      rapport.resultat !== 'ACCEPTE' || rapport.type !== 'TEST' ||
      rapport.actif === false
    ) return;
    const cle = normaliser_(rapport.matricule);
    if (
      !rapport.actifDefini && derniersArchivages[cle] &&
      nombre_(rapport.creeLeMs) <= derniersArchivages[cle]
    ) return;
    if (cle && !derniersTestsAcceptes[cle]) derniersTestsAcceptes[cle] = rapport;
  });
  Object.keys(derniersTestsAcceptes).forEach(function (cle) {
    creerSuiviEnAttenteDepuisRapport_(derniersTestsAcceptes[cle]);
  });
  const formationsParMatricule = {};
  const dossiersExplicites = {};
  rapports.forEach(function (rapport) {
    if (rapport.type === 'TEST' && propre_(rapport.dossierId)) {
      dossiersExplicites[propre_(rapport.dossierId)] = true;
    }
  });
  rapports.forEach(function (rapport) {
    if (rapport.type !== 'FORMATION' || rapport.actif === false) return;
    const cle = propre_(rapport.dossierId) || normaliser_(rapport.matricule);
    if (cle && !formationsParMatricule[cle]) formationsParMatricule[cle] = rapport;
  });
  const suivis = lireSuivisFormationInstructeur_();
  const instructeurs = lireEffectif_().filter(function (membre) {
    return normaliser_(membre.specialisation).includes('INSTRUCTEUR');
  }).map(function (membre) {
    return {
      nom: membre.matricule,
      specialisation: membre.specialisation
    };
  }).sort(function (a, b) {
    return normaliser_(a.nom).localeCompare(normaliser_(b.nom));
  });
  const gerants = lireEffectif_().filter(function (membre) {
    return propre_(membre.matricule) && membrePeutRecevoirGeranceSuiviFormation_(membre);
  }).map(function (membre) {
    return {
      nom: membre.matricule,
      libelle: libelleGerantSuiviFormation_(membre),
      grade: gradeEffectifPublicPourMembre_(membre)
    };
  }).sort(function (a, b) {
    return normaliser_(a.nom).localeCompare(normaliser_(b.nom));
  });
  return {
    success: true,
    suivis: suivis.filter(function (suivi) {
      return !suivi.statut && !!suivi.dateFin;
    }).map(function (suivi) {
      suivi.peutDecider = membrePeutDeciderSuiviFormation_(auteur, suivi);
      suivi.peutTransferer = membrePeutTransfererGeranceSuiviFormation_(auteur, suivi);
      return suivi;
    }),
    nouveauxArrivants: suivis.filter(function (suivi) {
      return !suivi.statut && !suivi.dateFin;
    }).map(function (suivi) {
      const formation = formationsParMatricule[suivi.id] ||
        (!dossiersExplicites[suivi.id]
          ? formationsParMatricule[normaliser_(suivi.matricule)]
          : null) || null;
      suivi.formationEffectuee = !!formation;
      suivi.steamIdFormation = formation ? propre_(formation.steamId) : '';
      suivi.discordIdFormation = formation ? propre_(formation.discordId) : '';
      suivi.identifiantsConformes = formation
        ? normaliser_(suivi.steamId) === normaliser_(formation.steamId) &&
          normaliser_(suivi.discordId) === normaliser_(formation.discordId)
        : false;
      return suivi;
    }),
    instructeurs: instructeurs,
    gerants: gerants,
    gerantConnecte: libelleGerantSuiviFormation_(auteur),
    peutModifier: membrePeutAdministrerSuivisFormation_(auteur),
    peutDeciderTous: utilisateurAPermission_(auteur, PERMISSIONS_GDA.SUIVIS_DECIDER_TOUS)
  };
}

function derniersArchivagesInstructeurParMatricule_() {
  const c = ARCHIVES_INSTRUCTEUR;
  const feuille = feuilleArchivesInstructeur_();
  const derniere = feuille.getLastRow();
  const resultat = {};
  if (derniere < c.START) return resultat;
  feuille.getRange(c.START, 1, derniere - c.START + 1, c.SOURCE)
    .getValues().forEach(function (ligne) {
      const statut = normaliserResultatArchiveInstructeur_(ligne[c.RESULTAT - 1]);
      const cle = normaliser_(ligne[c.MATRICULE - 1]);
      const date = dateOuNull_(ligne[c.IMPORTE_LE - 1]);
      if (!cle || !date || !['ACCEPTE', 'REFUSE'].includes(statut)) return;
      resultat[cle] = Math.max(resultat[cle] || 0, date.getTime());
    });
  return resultat;
}

function recupererMesSuivisInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  synchroniserGelAbsencesSuivisFormation_();
  const suivis = lireSuivisFormationInstructeur_().filter(function (suivi) {
    return !suivi.statut && !!suivi.dateFin;
  });
  synchroniserCompteursRapportsSuivisInstructeur_(suivis);
  return {
    success: true,
    suivis: suivis.filter(function (suivi) {
      return normaliser_(suivi.instructeur) === normaliser_(auteur.matricule);
    })
  };
}

function synchroniserGelAbsencesSuivisFormation_() {
  const cache = CacheService.getScriptCache();
  const cleCache = 'GDA_GEL_ABSENCES_SUIVIS_V3';
  if (cache.get(cleCache)) return 0;
  const verrou = LockService.getScriptLock();
  if (!verrou.tryLock(5000)) return 0;
  try {
    if (cache.get(cleCache)) return 0;
    const c = SUIVIS_FORMATION;
    const feuille = feuilleSuivisFormation_();
    const derniere = feuille.getLastRow();
    if (derniere < c.START) {
      cache.put(cleCache, '1', 60);
      return 0;
    }
    const valeurs = feuille.getRange(
      c.START,
      1,
      derniere - c.START + 1,
      c.DATE_FIN_APRES_ABSENCE
    ).getValues();
    const aujourdHui = debutJour_(new Date());
    const absencesLues = lireAbsences_();
    let modifications = 0;
    let ecritureRequise = false;
    valeurs.forEach(function (ligne) {
      const statut = normaliser_(ligne[c.STATUT - 1]);
      const dateFinStockee = dateOuNull_(ligne[c.DATE_FIN - 1]);
      const matricule = propre_(ligne[c.MATRICULE - 1]);
      if (statut || !dateFinStockee || !matricule) return;
      const debutSuivi = debutJour_(
        dateOuNull_(ligne[c.CREE_LE - 1]) || aujourdHui
      );
      const ancienneCompensationRegistre = Math.max(
        0,
        nombre_(ligne[c.ABSENCE_REGISTRE_COMPENSEE - 1])
      );
      const ancienneCompensationManuelle = Math.max(
        0,
        nombre_(ligne[c.GEL_MANUEL_EN_COURS - 1])
      );
      const dateFinInitialeStockee = dateOuNull_(
        ligne[c.DATE_FIN_INITIALE - 1]
      );
      const dateFinInitiale = dateFinInitialeStockee ||
        ajouterJoursCalendaires_(
          dateFinStockee,
          -(
            ancienneCompensationRegistre +
            ancienneCompensationManuelle +
            joursSanctionSuiviFormation_(ligne[c.SANCTION - 1])
          )
        );
      const dateFinAvecSanction = dateFinSuiviAvecSanction_(
        dateFinInitiale,
        ligne[c.SANCTION - 1]
      );
      const ajustements = calculerJoursAbsenceSuivi_(
        matricule,
        debutSuivi,
        absencesLues,
        aujourdHui
      );
      const dateFinApresAbsence = ajouterJoursCalendaires_(
        dateFinAvecSanction,
        ajustements.planifies
      );
      const ancienneDateApresAbsence = dateOuNull_(
        ligne[c.DATE_FIN_APRES_ABSENCE - 1]
      );
      const dateChangee =
        debutJour_(dateFinStockee).getTime() !==
          debutJour_(dateFinAvecSanction).getTime() ||
        !dateFinInitialeStockee ||
        !ancienneDateApresAbsence ||
        debutJour_(ancienneDateApresAbsence).getTime() !==
          debutJour_(dateFinApresAbsence).getTime();

      ligne[c.DATE_FIN - 1] = dateFinAvecSanction;
      ligne[c.ABSENCE_REGISTRE_COMPENSEE - 1] = ajustements.ecoules;
      ligne[c.DERNIER_GEL_MANUEL - 1] = '';
      ligne[c.GEL_MANUEL_EN_COURS - 1] = 0;
      ligne[c.DATE_FIN_INITIALE - 1] = dateFinInitiale;
      ligne[c.DATE_FIN_APRES_ABSENCE - 1] = dateFinApresAbsence;
      if (
        dateChangee ||
        ajustements.ecoules !== ancienneCompensationRegistre ||
        ancienneCompensationManuelle !== 0
      ) {
        ecritureRequise = true;
        modifications++;
      }
    });
    if (!ecritureRequise) {
      cache.put(cleCache, '1', 60);
      return modifications;
    }
    feuille.getRange(c.START, c.DATE_FIN, valeurs.length, 1)
      .setValues(valeurs.map(function (ligne) { return [ligne[c.DATE_FIN - 1]]; }))
      .setNumberFormat('dd/MM/yyyy');
    feuille.getRange(
      c.START,
      c.ABSENCE_REGISTRE_COMPENSEE,
      valeurs.length,
      c.DATE_FIN_APRES_ABSENCE - c.ABSENCE_REGISTRE_COMPENSEE + 1
    ).setValues(valeurs.map(function (ligne) {
      return [
        ligne[c.ABSENCE_REGISTRE_COMPENSEE - 1],
        ligne[c.DERNIER_GEL_MANUEL - 1],
        ligne[c.GEL_MANUEL_EN_COURS - 1],
        ligne[c.DATE_FIN_INITIALE - 1],
        ligne[c.DATE_FIN_APRES_ABSENCE - 1]
      ];
    }));
    feuille.getRange(c.START, c.DATE_FIN_INITIALE, valeurs.length, 2)
      .setNumberFormat('dd/MM/yyyy');
    cache.put(cleCache, '1', 60);
    return modifications;
  } finally {
    verrou.releaseLock();
  }
}

function calculerJoursAbsenceSuivi_(matricule, debutSuivi, absences, aujourdHui) {
  const cle = normaliser_(matricule);
  const debutReference = debutJour_(debutSuivi || aujourdHui || new Date());
  const jourCourant = debutJour_(aujourdHui || new Date());
  const intervallesEcoules = [];
  const intervallesPlanifies = [];

  (Array.isArray(absences) ? absences : []).forEach(function (absence) {
    if (normaliser_(absence.nom) !== cle) return;
    const debutBrut = dateOuNull_(absence.dateDebut);
    const finBrute = dateOuNull_(absence.dateFin);
    if (!debutBrut || !finBrute) return;
    let debut = debutJour_(debutBrut);
    const finExclusive = ajouterJoursCalendaires_(debutJour_(finBrute), 1);
    if (debut < debutReference) debut = debutReference;
    if (debut > jourCourant || finExclusive <= debut) return;

    intervallesPlanifies.push({ debut: debut, fin: finExclusive });
    const borneEcoulee = finExclusive < jourCourant
      ? finExclusive
      : jourCourant;
    if (borneEcoulee > debut) {
      intervallesEcoules.push({ debut: debut, fin: borneEcoulee });
    }
  });

  return {
    ecoules: totalJoursIntervallesAbsence_(intervallesEcoules),
    planifies: totalJoursIntervallesAbsence_(intervallesPlanifies)
  };
}

function totalJoursIntervallesAbsence_(intervalles) {
  if (!intervalles.length) return 0;
  const tries = intervalles.slice().sort(function (a, b) {
    return a.debut.getTime() - b.debut.getTime();
  });
  let total = 0;
  let debut = tries[0].debut;
  let fin = tries[0].fin;
  for (let index = 1; index < tries.length; index++) {
    const intervalle = tries[index];
    if (intervalle.debut <= fin) {
      if (intervalle.fin > fin) fin = intervalle.fin;
      continue;
    }
    total += Math.max(0, differenceJoursCalendaires_(debut, fin));
    debut = intervalle.debut;
    fin = intervalle.fin;
  }
  return total + Math.max(0, differenceJoursCalendaires_(debut, fin));
}

function differenceJoursCalendaires_(debut, fin) {
  const premier = debutJour_(debut);
  const dernier = debutJour_(fin);
  return Math.round((
    Date.UTC(dernier.getFullYear(), dernier.getMonth(), dernier.getDate()) -
    Date.UTC(premier.getFullYear(), premier.getMonth(), premier.getDate())
  ) / 86400000);
}

function ajouterJoursCalendaires_(date, jours) {
  const resultat = debutJour_(date);
  resultat.setDate(resultat.getDate() + Number(jours || 0));
  return resultat;
}

function synchroniserCompteursRapportsSuivisInstructeur_(suivis) {
  if (!suivis.length) return;
  const comptes = {};
  const configurationRapports = CONFIG.RAPPORTS;
  const feuilleRapports = feuille_(configurationRapports.SHEET);
  const derniereRapport = feuilleRapports.getLastRow();
  if (derniereRapport >= configurationRapports.START) {
    feuilleRapports.getRange(
      configurationRapports.START,
      configurationRapports.MATRICULE,
      derniereRapport - configurationRapports.START + 1,
      configurationRapports.RAPPORT - configurationRapports.MATRICULE + 1
    ).getValues().forEach(function (ligne) {
      const matricule = propre_(ligne[0]);
      const dateRapport = ligne[
        configurationRapports.DATE_RAPPORT - configurationRapports.MATRICULE
      ];
      const contenuRapport = propre_(ligne[
        configurationRapports.RAPPORT - configurationRapports.MATRICULE
      ]);
      if (!matricule || !dateRapport || !contenuRapport) return;
      const cle = normaliser_(matricule);
      comptes[cle] = (comptes[cle] || 0) + 1;
    });
  }
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return;
  const ids = feuille.getRange(c.START, c.ID, derniere - c.START + 1, 1).getValues();
  const lignesParId = {};
  ids.forEach(function (ligne, position) {
    lignesParId[propre_(ligne[0])] = c.START + position;
  });
  suivis.forEach(function (suivi) {
    const total = comptes[normaliser_(suivi.matricule)] || 0;
    if (total === nombre_(suivi.nombreRapports)) return;
    const ligne = lignesParId[suivi.id];
    if (!ligne) return;
    feuille.getRange(ligne, c.RAPPORTS).setValue(total);
    suivi.nombreRapports = total;
  });
}

function mettreAJourMonSuiviInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  const trouve = trouverSuiviFormationParId_(requis_(p.suiviId, 'Le suivi'));
  if (!trouve || !trouve.suivi || trouve.suivi.statut || !trouve.suivi.dateFin) {
    throw new Error('Ce suivi actif est introuvable.');
  }
  if (normaliser_(trouve.suivi.instructeur) !== normaliser_(auteur.matricule)) {
    throw new Error('Seul l’instructeur désigné peut modifier ce post-it.');
  }
  const c = SUIVIS_FORMATION;
  let prisesService = nombre_(trouve.suivi.prisesService);
  if (Object.prototype.hasOwnProperty.call(p, 'prisesService')) {
    const valeurDemandee = Number(p.prisesService);
    if (!Number.isFinite(valeurDemandee) || valeurDemandee < 0 || valeurDemandee > 999) {
      throw new Error('Le nombre de prises de service doit être compris entre 0 et 999.');
    }
    prisesService = Math.trunc(valeurDemandee);
    trouve.feuille.getRange(trouve.ligne, c.PRISES_SERVICE).setValue(prisesService);
  }
  const variation = Number(p.variationService || 0);
  if (variation === 1 || variation === -1) {
    prisesService = Math.max(0, prisesService + variation);
    trouve.feuille.getRange(trouve.ligne, c.PRISES_SERVICE).setValue(prisesService);
  }
  let commentaire = propre_(trouve.suivi.commentaire);
  if (Object.prototype.hasOwnProperty.call(p, 'commentaire')) {
    commentaire = propre_(p.commentaire);
    trouve.feuille.getRange(trouve.ligne, c.COMMENTAIRE).setValue(commentaire);
  }
  trouve.feuille.getRange(trouve.ligne, c.MODIFIE_LE)
    .setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  return {
    success: true,
    message: 'Le suivi de ' + trouve.suivi.matricule + ' a été mis à jour.',
    suivi: {
      id: trouve.suivi.id,
      matricule: trouve.suivi.matricule,
      nombreRapports: nombre_(
        trouve.feuille.getRange(trouve.ligne, c.RAPPORTS).getValue()
      ),
      prisesService: prisesService,
      commentaire: commentaire
    }
  };
}

function separerCommentairesRapportsEtSuivisInstructeur_() {
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return;
  const nombreLignes = derniere - c.START + 1;
  const commentaires = feuille.getRange(c.START, c.COMMENTAIRE, nombreLignes, 1)
    .getValues();
  const sources = feuille.getRange(c.START, c.SOURCE, nombreLignes, 1).getValues();
  let modification = false;
  sources.forEach(function (ligne, index) {
    const source = propre_(ligne[0]);
    const sourceNormalisee = normaliser_(source);
    if (!sourceNormalisee.includes('RAPPORT INSTRUCTEUR') ||
        sourceNormalisee.includes('COMMENTAIRE SEPARE')) return;
    commentaires[index][0] = '';
    sources[index][0] = source + ' / Commentaire séparé';
    modification = true;
  });
  if (!modification) return;
  feuille.getRange(c.START, c.COMMENTAIRE, nombreLignes, 1).setValues(commentaires);
  feuille.getRange(c.START, c.SOURCE, nombreLignes, 1).setValues(sources);
}

function creerSuiviEnAttenteDepuisRapport_(rapport) {
  if (
    !rapport || !rapport.matricule || rapport.resultat !== 'ACCEPTE' ||
    rapport.actif === false
  ) return null;
  const dossierId = propre_(rapport.dossierId) || propre_(rapport.id) || Utilities.getUuid();
  const suivisExistants = lireSuivisFormationInstructeur_();
  const memeDossier = suivisExistants.find(function (suivi) {
    return suivi.id === dossierId;
  });
  if (memeDossier) {
    if (memeDossier.statut) {
      lierRapportInstructeurAuDossier_(rapport.id, dossierId, false);
      return null;
    }
    return memeDossier;
  }
  const existant = suivisExistants.find(function (suivi) {
    return !suivi.statut &&
      normaliser_(suivi.matricule) === normaliser_(rapport.matricule);
  });
  if (existant) {
    lierRapportInstructeurAuDossier_(rapport.id, existant.id, true);
    return existant;
  }
  const suppressionsPrecedentes = suivisExistants.filter(function (suivi) {
    return suivi.statut === 'SUPPRIME' &&
      normaliser_(suivi.matricule) === normaliser_(rapport.matricule);
  });
  if (suppressionsPrecedentes.length) {
    const dateRapport = nombre_(rapport.creeLeMs) ||
      ((dateOuNull_(rapport.creeLe) || new Date(0)).getTime());
    const derniereSuppression = Math.max.apply(null, suppressionsPrecedentes.map(function (suivi) {
      return nombre_(suivi.modifieLeMs);
    }));
    if (!dateRapport || dateRapport <= derniereSuppression) return null;
    purgerSuivisSupprimesParMatricule_(rapport.matricule);
  }
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const ligne = prochaineLigne_(feuille, c.START);
  const maintenant = new Date();
  const id = dossierId;
  feuille.getRange(ligne, 1, 1, c.SOURCE).setValues([[
    id,
    rapport.matricule,
    propre_(rapport.steamId),
    propre_(rapport.discordId),
    0,
    0,
    '',
    '',
    '',
    '',
    '',
    '',
    maintenant,
    maintenant,
    'Rapport Instructeur ' + propre_(rapport.type) +
      ' / Dossier ' + dossierId + ' / Rapport ' + propre_(rapport.id) +
      ' / Commentaire séparé'
  ]]);
  feuille.getRange(ligne, c.MATRICULE, 1, 3).setNumberFormat('@');
  feuille.getRange(ligne, c.CREE_LE, 1, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  lierRapportInstructeurAuDossier_(rapport.id, id, true);
  return { id: id, matricule: rapport.matricule };
}

function lierRapportInstructeurAuDossier_(rapportId, dossierId, actif) {
  const trouve = trouverRapportInstructeurParId_(propre_(rapportId));
  if (!trouve) return false;
  trouve.feuille.getRange(
    trouve.ligne,
    RAPPORTS_INSTRUCTEUR.DOSSIER_ID,
    1,
    2
  ).setValues([[propre_(dossierId), actif !== false]]);
  return true;
}

function purgerSuivisSupprimesParMatricule_(matricule) {
  const cible = normaliser_(matricule);
  if (!cible) return 0;
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return 0;
  const valeurs = feuille.getRange(c.START, 1, derniere - c.START + 1, c.SOURCE)
    .getValues();
  let total = 0;
  for (let position = valeurs.length - 1; position >= 0; position--) {
    const statut = normaliser_(valeurs[position][c.STATUT - 1]);
    if (
      normaliser_(valeurs[position][c.MATRICULE - 1]) !== cible ||
      !statut.includes('SUPPRIME')
    ) continue;
    feuille.deleteRow(c.START + position);
    total++;
  }
  return total;
}

function demarrerSuiviFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerConsultationSuivisFormation_(auteur);
  if (!membrePeutAdministrerSuivisFormation_(auteur)) {
    throw new Error('Prise en charge réservée à la propriété et aux responsables Instructeur.');
  }
  const id = requis_(p.suiviId, 'Le suivi');
  const matricule = requis_(p.matricule, 'Le matricule définitif');
  const steamId = requis_(p.steamId, 'Le Steam ID');
  const discordId = normaliserIdDiscord_(requis_(p.discordId, 'Le Discord ID'));
  if (!discordId) {
    throw new Error('Le Discord ID doit contenir entre 15 et 22 chiffres.');
  }
  const instructeurNom = requis_(p.instructeur, 'L’instructeur en charge');
  const instructeur = trouverMembre_(instructeurNom);
  if (!instructeur || !normaliser_(instructeur.specialisation).includes('INSTRUCTEUR')) {
    throw new Error('La personne choisie ne possède pas la spécialisation Instructeur.');
  }
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) throw new Error('Suivi introuvable.');
  const ids = feuille.getRange(c.START, c.ID, derniere - c.START + 1, 1).getValues();
  const position = ids.findIndex(function (ligne) {
    return propre_(ligne[0]) === id;
  });
  if (position < 0) throw new Error('Suivi introuvable. Actualisez la page.');
  const ligne = c.START + position;
  if (dateOuNull_(feuille.getRange(ligne, c.DATE_FIN).getValue())) {
    throw new Error('Ce suivi a déjà été démarré.');
  }
  const matriculeActuel = propre_(feuille.getRange(ligne, c.MATRICULE).getValue());
  const formation = trouverDernierRapportFormationInstructeur_(matriculeActuel, id);
  if (!formation) {
    throw new Error('La prise en charge reste bloquée tant que le rapport Formation n’est pas enregistré.');
  }
  const steamTest = propre_(feuille.getRange(ligne, c.STEAM_ID).getValue());
  const discordTest = propre_(feuille.getRange(ligne, c.DISCORD_ID).getValue());
  const identifiantsDifferents =
    normaliser_(steamTest) !== normaliser_(formation.steamId) ||
    normaliser_(discordTest) !== normaliser_(formation.discordId);
  if (identifiantsDifferents && propre_(p.identifiantsConfirmes) !== '1') {
    throw new Error('Les identifiants Test et Formation diffèrent : le gérant doit confirmer les identifiants définitifs.');
  }
  const membreExistant = trouverMembre_(matricule);
  if (membreExistant) {
    throw new Error('Ce matricule est déjà présent dans l’effectif.');
  }
  if (lireSuivisFormationInstructeur_().some(function (suivi) {
    return !suivi.statut && suivi.id !== id &&
      normaliser_(suivi.matricule) === normaliser_(matricule);
  })) {
    throw new Error('Ce matricule possède déjà un autre dossier de suivi.');
  }
  const priseEnCharge = new Date();
  const dateFinInitiale = ajouterJoursCalendaires_(debutJour_(priseEnCharge), 7);
  const sanction = validerSanctionSuiviFormation_(p.sanction);
  const dateFin = dateFinSuiviAvecSanction_(dateFinInitiale, sanction);
  const ajoutEffectif = ajouterMembreProbatoireEffectif_(
    matricule,
    steamId,
    discordId,
    priseEnCharge
  );
  try {
    feuille.getRange(ligne, c.MATRICULE, 1, 3).setValues([[
      matricule,
      steamId,
      discordId
    ]]).setNumberFormat('@');
    const sourceSuivi = propre_(feuille.getRange(ligne, c.SOURCE).getValue());
    if (normaliser_(sourceSuivi).includes('RAPPORT INSTRUCTEUR') &&
        !normaliser_(sourceSuivi).includes('COMMENTAIRE SEPARE')) {
      feuille.getRange(ligne, c.COMMENTAIRE).clearContent();
      feuille.getRange(ligne, c.SOURCE)
        .setValue(sourceSuivi + ' / Commentaire séparé');
    }
    feuille.getRange(ligne, c.DATE_FIN).setValue(dateFin).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.DATE_FIN_INITIALE, 1, 2)
      .setValues([[dateFinInitiale, dateFin]])
      .setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.INSTRUCTEUR).setValue(instructeur.matricule);
    feuille.getRange(ligne, c.GERANT).setValue(libelleGerantSuiviFormation_(auteur));
    feuille.getRange(ligne, c.SANCTION).setValue(sanction);
    feuille.getRange(ligne, c.MODIFIE_LE)
      .setValue(priseEnCharge)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
    return {
      success: true,
      message: 'La période probatoire de ' + matricule +
        ' a été démarrée et le membre a été ajouté à l’effectif comme Caporal.'
    };
  } catch (erreur) {
    annulerEcritureGestionEnSilence_(ajoutEffectif);
    throw erreur;
  }
}

function trouverSuiviFormationParId_(id) {
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return null;
  const valeurs = feuille.getRange(c.START, 1, derniere - c.START + 1, c.SOURCE)
    .getValues();
  const position = valeurs.findIndex(function (ligne) {
    return propre_(ligne[c.ID - 1]) === propre_(id);
  });
  if (position < 0) return null;
  const ligne = c.START + position;
  const suivi = lireSuivisFormationInstructeur_().find(function (element) {
    return element.id === propre_(id);
  });
  return { feuille: feuille, ligne: ligne, suivi: suivi };
}

function modifierSuiviFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerConsultationSuivisFormation_(auteur);
  if (!membrePeutAdministrerSuivisFormation_(auteur)) {
    throw new Error('Modification réservée aux Responsables INST et à la propriété.');
  }
  const trouve = trouverSuiviFormationParId_(requis_(p.suiviId, 'Le suivi'));
  if (!trouve || !trouve.suivi) throw new Error('Suivi introuvable.');
  const c = SUIVIS_FORMATION;
  const matricule = requis_(p.matricule, 'Le matricule');
  if (lireSuivisFormationInstructeur_().some(function (suivi) {
    return !suivi.statut && suivi.id !== trouve.suivi.id &&
      normaliser_(suivi.matricule) === normaliser_(matricule);
  })) throw new Error('Ce matricule possède déjà un autre suivi.');
  const steamId = requis_(p.steamId, 'Le Steam ID');
  const discordId = normaliserIdDiscord_(requis_(p.discordId, 'Le Discord ID'));
  if (!discordId) throw new Error('Le Discord ID doit contenir entre 15 et 22 chiffres.');
  const sanction = validerSanctionSuiviFormation_(p.sanction);
  const ancienneSanction = trouve.feuille
    .getRange(trouve.ligne, c.SANCTION)
    .getValue();
  const dateFinActuelle = dateOuNull_(
    trouve.feuille.getRange(trouve.ligne, c.DATE_FIN).getValue()
  );
  const dateFinInitiale = dateOuNull_(
    trouve.feuille.getRange(trouve.ligne, c.DATE_FIN_INITIALE).getValue()
  ) || (dateFinActuelle
    ? ajouterJoursCalendaires_(
        dateFinActuelle,
        -joursSanctionSuiviFormation_(ancienneSanction)
      )
    : ajouterJoursCalendaires_(debutJour_(new Date()), 7));
  const dateFin = dateFinSuiviAvecSanction_(dateFinInitiale, sanction);
  const instructeurNom = requis_(p.instructeur, 'L’instructeur');
  const instructeur = trouverMembre_(instructeurNom);
  if (!instructeur || !normaliser_(instructeur.specialisation).includes('INSTRUCTEUR')) {
    throw new Error('L’instructeur choisi ne possède pas la spécialisation requise.');
  }
  const gerant = exigerMembreParMatricule_(
    matriculeDepuisLibelleGerantSuivi_(requis_(p.gerant, 'Le gérant'))
  );
  trouve.feuille.getRange(trouve.ligne, c.MATRICULE, 1, 10).setValues([[
    matricule,
    steamId,
    discordId,
    Math.max(0, nombre_(p.nombreRapports)),
    Math.max(0, nombre_(p.prisesService)),
    dateFin,
    instructeur.matricule,
    libelleGerantSuiviFormation_(gerant),
    propre_(p.commentaire),
    sanction
  ]]);
  trouve.feuille.getRange(trouve.ligne, c.MATRICULE, 1, 3).setNumberFormat('@');
  trouve.feuille.getRange(trouve.ligne, c.DATE_FIN).setNumberFormat('dd/MM/yyyy');
  trouve.feuille.getRange(trouve.ligne, c.DATE_FIN_INITIALE, 1, 2)
    .setValues([[dateFinInitiale, dateFin]])
    .setNumberFormat('dd/MM/yyyy');
  trouve.feuille.getRange(trouve.ligne, c.MODIFIE_LE)
    .setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  return { success: true, message: 'Le suivi de ' + matricule + ' a été modifié.' };
}

function supprimerSuiviFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerConsultationSuivisFormation_(auteur);
  if (!membrePeutAdministrerSuivisFormation_(auteur)) {
    throw new Error('Suppression réservée aux Responsables INST et à la propriété.');
  }
  const trouve = trouverSuiviFormationParId_(requis_(p.suiviId, 'Le suivi'));
  if (!trouve || !trouve.suivi) throw new Error('Suivi introuvable.');
  const matricule = trouve.suivi.matricule;
  desactiverRapportsInstructeurDossier_(trouve.suivi.id, matricule);
  trouve.feuille.deleteRow(trouve.ligne);
  return {
    success: true,
    message: 'Le dossier de ' + matricule + ' a été supprimé et ses rapports ont été désactivés.'
  };
}

function desactiverRapportsInstructeurDossier_(dossierId, matricule) {
  const idCible = propre_(dossierId);
  const matriculeCible = normaliser_(matricule);
  if (!idCible && !matriculeCible) return 0;
  const c = RAPPORTS_INSTRUCTEUR;
  const feuille = feuilleRapportsInstructeur_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return 0;
  const valeurs = feuille.getRange(c.START, 1, derniere - c.START + 1, c.ACTIF)
    .getValues();
  let total = 0;
  valeurs.forEach(function (ligne, position) {
    const idLigne = propre_(ligne[c.DOSSIER_ID - 1]);
    const correspond = idLigne
      ? idLigne === idCible
      : normaliser_(ligne[c.MATRICULE_DEFINITIF - 1]) === matriculeCible;
    if (!correspond) return;
    feuille.getRange(c.START + position, c.DOSSIER_ID, 1, 2)
      .setValues([[idCible || propre_(ligne[c.ID - 1]), false]]);
    total++;
  });
  return total;
}

function transfererGeranceSuiviFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerConsultationSuivisFormation_(auteur);
  const trouve = trouverSuiviFormationParId_(requis_(p.suiviId, 'Le suivi'));
  if (!trouve || !trouve.suivi) throw new Error('Suivi introuvable.');
  if (trouve.suivi.statut) throw new Error('Ce suivi est déjà terminé.');
  if (!membrePeutTransfererGeranceSuiviFormation_(auteur, trouve.suivi)) {
    throw new Error('Seul le gérant actuel peut transférer ce dossier.');
  }

  const nouveauGerant = exigerMembreParMatricule_(
    matriculeDepuisLibelleGerantSuivi_(requis_(p.nouveauGerant, 'Le nouveau gérant'))
  );
  if (!membrePeutRecevoirGeranceSuiviFormation_(nouveauGerant)) {
    throw new Error('Cette personne n’est pas habilitée à reprendre la gérance du suivi.');
  }
  if (
    normaliser_(nouveauGerant.matricule) ===
      normaliser_(matriculeDepuisLibelleGerantSuivi_(trouve.suivi.gerant))
  ) {
    throw new Error('Cette personne gère déjà le dossier.');
  }

  const nouveauLibelle = libelleGerantSuiviFormation_(nouveauGerant);
  trouve.feuille.getRange(trouve.ligne, SUIVIS_FORMATION.GERANT)
    .setValue(nouveauLibelle);
  trouve.feuille.getRange(trouve.ligne, SUIVIS_FORMATION.MODIFIE_LE)
    .setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  return {
    success: true,
    message: 'La gérance du suivi de ' + trouve.suivi.matricule +
      ' a été transférée à ' + nouveauLibelle + '.'
  };
}

function deciderSuiviFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerConsultationSuivisFormation_(auteur);
  const trouve = trouverSuiviFormationParId_(requis_(p.suiviId, 'Le suivi'));
  if (!trouve || !trouve.suivi) throw new Error('Suivi introuvable.');
  if (trouve.suivi.statut) throw new Error('Ce suivi est déjà terminé.');
  if (!membrePeutDeciderSuiviFormation_(auteur, trouve.suivi)) {
    throw new Error('Seul le gérant désigné peut accepter ou refuser cette personne.');
  }
  const decisionNormalisee = normaliser_(p.decision);
  const decision = decisionNormalisee.includes('ACCEPT')
    ? 'ACCEPTE'
    : decisionNormalisee.includes('REFUS')
      ? 'REFUSE'
      : '';
  if (!decision) throw new Error('Décision invalide.');
  const raison = propre_(p.raison);
  if (decision === 'REFUSE' && !raison) {
    throw new Error('La raison du refus est obligatoire.');
  }
  const maintenant = new Date();
  const ancienModifieLe = trouve.feuille
    .getRange(trouve.ligne, SUIVIS_FORMATION.MODIFIE_LE)
    .getValue();
  let archiveCree = null;
  let licenciementCree = null;
  let sauvegardeEffectif = null;
  let statutEcrit = false;

  try {
    archiveCree = archiverSuiviFormationTermine_(
      trouve.suivi,
      decision,
      raison,
      auteur.matricule
    );

    if (decision === 'REFUSE') {
      assurerFeuillesDisponibilitesMemoire_();
      const membre = trouverMembre_(trouve.suivi.matricule);
      const membreLicencie = membre || {
        matricule: trouve.suivi.matricule,
        grade: 'Caporal',
        steamId: trouve.suivi.steamId,
        discordId: trouve.suivi.discordId,
        medaille: ''
      };
      licenciementCree = enregistrerDepartDepuisGestion_(
        membreLicencie,
        raison,
        auteur.matricule,
        maintenant,
        ajouterDuree_(maintenant, '1 semaine'),
        'Licenciement'
      );
      if (membre) {
        sauvegardeEffectif = retirerMembreEffectif_(membre);
      }
    }

    trouve.feuille.getRange(trouve.ligne, SUIVIS_FORMATION.STATUT).setValue(decision);
    trouve.feuille.getRange(trouve.ligne, SUIVIS_FORMATION.MODIFIE_LE)
      .setValue(maintenant).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    statutEcrit = true;
    desactiverRapportsInstructeurDossier_(trouve.suivi.id, trouve.suivi.matricule);
    finaliserRetraitMembreEffectifEnSilence_(sauvegardeEffectif);
    sauvegardeEffectif = null;
    return {
      success: true,
      message: trouve.suivi.matricule + ' a été ' +
        (decision === 'ACCEPTE'
          ? 'accepté et conservé dans l’effectif.'
          : 'refusé, licencié et retiré de l’effectif.')
    };
  } catch (erreur) {
    if (statutEcrit) {
      trouve.feuille.getRange(trouve.ligne, SUIVIS_FORMATION.STATUT).clearContent();
      trouve.feuille.getRange(trouve.ligne, SUIVIS_FORMATION.MODIFIE_LE)
        .setValue(ancienModifieLe || '');
    }
    if (sauvegardeEffectif) restaurerMembreEffectifEnSilence_(sauvegardeEffectif);
    annulerEcritureGestionEnSilence_(licenciementCree);
    annulerEcritureGestionEnSilence_(archiveCree);
    throw erreur;
  }
}

function archiverSuiviFormationTermine_(suivi, decision, raison, auteur) {
  const c = ARCHIVES_INSTRUCTEUR;
  const feuille = feuilleArchivesInstructeur_();
  const id = 'SUIVI-' + propre_(suivi.id);
  if (feuille.getLastRow() >= c.START) {
    const existe = feuille.getRange(c.START, c.ID, feuille.getLastRow() - c.START + 1, 1)
      .getValues().some(function (ligne) { return propre_(ligne[0]) === id; });
    if (existe) return { annulable: false };
  }
  const ligne = prochaineLigne_(feuille, c.START);
  const morceauxDateFin = propre_(
    suivi.dateFinApresAbsence || suivi.dateFin
  ).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const dateFin = morceauxDateFin
    ? new Date(
        Number(morceauxDateFin[3]),
        Number(morceauxDateFin[2]) - 1,
        Number(morceauxDateFin[1])
      )
    : '';
  feuille.getRange(ligne, 1, 1, c.SOURCE).setValues([[
    id,
    suivi.matricule,
    suivi.steamId,
    suivi.discordId,
    suivi.nombreRapports,
    suivi.prisesService,
    dateFin,
    suivi.instructeur,
    suivi.gerant || auteur,
    suivi.commentaire,
    suivi.sanction,
    decision,
    raison,
    new Date(),
    'Suivi Formation HTML'
  ]]);
  feuille.getRange(ligne, c.DATE_FIN).setNumberFormat('dd/MM/yyyy');
  feuille.getRange(ligne, c.IMPORTE_LE).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  return {
    feuille: feuille,
    ligne: ligne,
    colonne: 1,
    largeur: c.SOURCE,
    annulable: true
  };
}

function ajouterSuiviFormationInstructeur(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerConsultationSuivisFormation_(auteur);
  if (!membrePeutAdministrerSuivisFormation_(auteur)) {
    throw new Error('Ajout réservé à la propriété et aux responsables Instructeur.');
  }
  const matricule = requis_(p.matricule, 'Le matricule');
  if (lireSuivisFormationInstructeur_().some(function (suivi) {
    return !suivi.statut &&
      normaliser_(suivi.matricule) === normaliser_(matricule);
  })) {
    throw new Error('Cette personne possède déjà un suivi de formation.');
  }
  const steamId = requis_(p.steamId, 'Le Steam ID');
  const discordId = normaliserIdDiscord_(requis_(p.discordId, 'Le Discord ID'));
  if (!discordId) throw new Error('Le Discord ID doit contenir entre 15 et 22 chiffres.');
  const maintenant = new Date();
  const dateFinInitiale = ajouterJoursCalendaires_(debutJour_(maintenant), 7);
  const sanction = validerSanctionSuiviFormation_(p.sanction);
  const dateFin = dateFinSuiviAvecSanction_(dateFinInitiale, sanction);
  const instructeur = propre_(p.instructeur) || auteur.matricule;
  const gerantSaisi = propre_(p.gerant);
  const gerantMembre = gerantSaisi
    ? trouverMembre_(matriculeDepuisLibelleGerantSuivi_(gerantSaisi))
    : auteur;
  if (gerantSaisi && !gerantMembre) {
    throw new Error('Le gérant indiqué est introuvable dans l’effectif.');
  }
  const gerant = libelleGerantSuiviFormation_(gerantMembre);
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const ligne = prochaineLigne_(feuille, c.START);
  const id = Utilities.getUuid();
  const ajoutEffectif = ajouterMembreProbatoireEffectif_(
    matricule,
    steamId,
    discordId,
    maintenant
  );
  try {
    feuille.getRange(ligne, 1, 1, c.SOURCE).setValues([[
      id,
      matricule,
      steamId,
      discordId,
      Math.max(0, nombre_(p.nombreRapports)),
      Math.max(0, nombre_(p.prisesService)),
      dateFin,
      instructeur,
      gerant,
      propre_(p.commentaire),
      sanction,
      '',
      maintenant,
      maintenant,
      propre_(p.rapportId) ? 'Rapport Instructeur' : 'Ajout manuel HTML'
    ]]);
    feuille.getRange(ligne, c.MATRICULE, 1, 3).setNumberFormat('@');
    feuille.getRange(ligne, c.DATE_FIN).setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.DATE_FIN_INITIALE, 1, 2)
      .setValues([[dateFinInitiale, dateFin]])
      .setNumberFormat('dd/MM/yyyy');
    feuille.getRange(ligne, c.CREE_LE, 1, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
    return {
      success: true,
      message: 'Le suivi de ' + matricule +
        ' a été ajouté et le membre est entré dans l’effectif comme Caporal.',
      suivi: lireSuivisFormationInstructeur_().filter(function (suivi) {
        return suivi.id === id;
      })[0]
    };
  } catch (erreur) {
    annulerEcritureGestionEnSilence_(ajoutEffectif);
    feuille.getRange(ligne, 1, 1, c.SOURCE).clearContent();
    throw erreur;
  }
}

function lireSuivisFormationInstructeur_() {
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return [];
  const aujourdHui = debutJour_(new Date());
  const absencesLues = lireAbsences_();
  const absentsRegistre = matriculesAbsentsActuels_(absencesLues);
  const absents = {};
  lireEffectif_().forEach(function (membre) {
    absents[normaliser_(membre.matricule)] =
      membreEstAbsentActuellement_(membre, absentsRegistre);
  });
  return feuille.getRange(
    c.START,
    1,
    derniere - c.START + 1,
    c.DATE_FIN_APRES_ABSENCE
  )
    .getValues().map(function (ligne) {
      const dateFinInitiale = dateOuNull_(ligne[c.DATE_FIN_INITIALE - 1]) ||
        dateOuNull_(ligne[c.DATE_FIN - 1]);
      const sanction = normaliserSanctionSuiviFormation_(ligne[c.SANCTION - 1]);
      const dateFin = dateFinInitiale
        ? dateFinSuiviAvecSanction_(dateFinInitiale, sanction)
        : null;
      const debutSuivi = dateOuNull_(ligne[c.CREE_LE - 1]) || aujourdHui;
      const ajustementsAbsence = calculerJoursAbsenceSuivi_(
        ligne[c.MATRICULE - 1],
        debutSuivi,
        absencesLues,
        aujourdHui
      );
      const dateFinApresAbsence = dateFin
        ? ajouterJoursCalendaires_(dateFin, ajustementsAbsence.planifies)
        : null;
      const dateFinCompteur = dateFin
        ? ajouterJoursCalendaires_(dateFin, ajustementsAbsence.ecoules)
        : null;
      const modifieLe = dateOuNull_(ligne[c.MODIFIE_LE - 1]);
      const statutBrut = normaliser_(ligne[c.STATUT - 1]);
      const statut = statutBrut.includes('SUPPRIME')
        ? 'SUPPRIME'
        : normaliserResultatArchiveInstructeur_(statutBrut);
      return {
        id: propre_(ligne[c.ID - 1]),
        matricule: propre_(ligne[c.MATRICULE - 1]),
        steamId: propre_(ligne[c.STEAM_ID - 1]),
        discordId: propre_(ligne[c.DISCORD_ID - 1]),
        nombreRapports: nombre_(ligne[c.RAPPORTS - 1]),
        prisesService: nombre_(ligne[c.PRISES_SERVICE - 1]),
        dateFin: dateFin
          ? Utilities.formatDate(dateFin, Session.getScriptTimeZone(), 'dd/MM/yyyy')
          : '',
        dateFinApresAbsence: dateFinApresAbsence
          ? Utilities.formatDate(
              dateFinApresAbsence,
              Session.getScriptTimeZone(),
              'dd/MM/yyyy'
            )
          : '',
        joursAbsencePlanifies: ajustementsAbsence.planifies,
        joursRestants: dateFinCompteur
          ? Math.max(
              0,
              Math.ceil((debutJour_(dateFinCompteur) - aujourdHui) / 86400000)
            )
          : 0,
        instructeur: propre_(ligne[c.INSTRUCTEUR - 1]),
        gerant: propre_(ligne[c.GERANT - 1]),
        commentaire: propre_(ligne[c.COMMENTAIRE - 1]),
        sanction: sanction,
        statut: statut,
        absent: absents[normaliser_(ligne[c.MATRICULE - 1])] === true,
        modifieLeMs: modifieLe ? modifieLe.getTime() : 0,
        source: propre_(ligne[c.SOURCE - 1]),
        tri: dateFin ? dateFin.getTime() : 0
      };
    }).filter(function (suivi) {
      return suivi.id && suivi.matricule;
    }).sort(function (a, b) {
      return a.tri - b.tri;
    }).map(function (suivi) {
      delete suivi.tri;
      return suivi;
    });
}

function matriculesSuivisProbatoiresActifs_() {
  const c = SUIVIS_FORMATION;
  const feuille = feuilleSuivisFormation_();
  const derniere = feuille.getLastRow();
  const resultat = {};
  if (derniere < c.START) return resultat;
  feuille.getRange(
    c.START,
    c.MATRICULE,
    derniere - c.START + 1,
    c.STATUT - c.MATRICULE + 1
  ).getValues().forEach(function (ligne) {
    const matricule = propre_(ligne[0]);
    const dateFin = dateOuNull_(ligne[c.DATE_FIN - c.MATRICULE]);
    const statut = propre_(ligne[c.STATUT - c.MATRICULE]);
    if (matricule && dateFin && !statut) {
      resultat[normaliser_(matricule)] = true;
    }
  });
  return resultat;
}

function etatStockageGDA() {
  const classeur = classeurDonneesGDA_();
  const resultat = {
    stockageActif: true,
    classeurId: classeur.getId(),
    classeurNom: classeur.getName(),
    feuilles: FEUILLES_DONNEES_GDA.map(function (nom) {
      return { nom: nom, presente: !!classeur.getSheetByName(nom) };
    })
  };
  console.log('STOCKAGE ACTIF : OUI');
  console.log('CLASSEUR UTILISÉ : ' + resultat.classeurNom);
  console.log('ID DU CLASSEUR : ' + resultat.classeurId);
  resultat.feuilles.forEach(function (feuille) {
    console.log(
      (feuille.presente ? 'OK' : 'MANQUANTE') + ' — ' + feuille.nom
    );
  });
  return resultat;
}

function enregistrerSuiviRapport_(rapportId, suivi) {
  enregistrerSuivisRapportsLots_([Object.assign({ id: rapportId }, suivi)]);
  PropertiesService
    .getScriptProperties()
    .deleteProperty(cleSuiviRapportId_(rapportId));
}

function supprimerSuiviRapportId_(rapportId) {
  const id = propre_(rapportId);
  if (!id) return;
  const suivi = lireSuivisRapportsTampon_()[id];
  if (suivi && suivi.ligneStockage) {
    feuilleStockageRapports_().deleteRow(suivi.ligneStockage);
  }
  PropertiesService
    .getScriptProperties()
    .deleteProperty(cleSuiviRapportId_(id));
}

function trouverRapportAction_(p) {
  const rapports = lireRapports_();
  const rapportId = propre_(p.rapportId);
  let rapport = rapportId
    ? rapports.find(function (element) { return element.id === rapportId; })
    : null;

  // Compatibilité temporaire avec une ancienne page HTML encore en cache.
  if (!rapport && propre_(p.ligne)) {
    const ligne = ligneRequise_(p.ligne, CONFIG.RAPPORTS.START);
    rapport = rapports.find(function (element) { return element.ligne === ligne; });
  }

  if (!rapport) {
    throw new Error('Rapport introuvable. Actualisez la page avant de continuer.');
  }
  return rapport;
}

function supprimerEtDecalerSuivisRapports_(ligneSupprimee) {
  const stockage = PropertiesService.getScriptProperties();
  const proprietes = stockage.getProperties();
  const prefixe = 'GDA_SUIVI_RAPPORT_';
  const aRecreer = {};

  Object.keys(proprietes).forEach(function (cle) {
    if (!cle.startsWith(prefixe)) return;

    const ligne = Number(cle.substring(prefixe.length));
    if (!Number.isFinite(ligne) || ligne < ligneSupprimee) return;

    stockage.deleteProperty(cle);

    if (ligne > ligneSupprimee) {
      aRecreer[cleSuiviRapport_(ligne - 1)] = proprietes[cle];
    }
  });

  if (Object.keys(aRecreer).length) {
    stockage.setProperties(aRecreer, false);
  }
}

function feuilleDemandesAbsences_() {
  const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  const nom = CONFIG.STOCKAGE.DEMANDES_ABSENCES_SHEET;
  let feuille = classeur.getSheetByName(nom);
  if (!feuille) feuille = classeur.insertSheet(nom);
  if (
    propre_(feuille.getRange(1, 1).getValue()) !== 'ID demande' ||
    propre_(feuille.getRange(1, 15).getValue()) !== 'Notification supprimée'
  ) {
    feuille.getRange(1, 1, 1, 15).setValues([[
      'ID demande', 'Créée le', 'Modifiée le', 'Matricule', 'Grade',
      'Date de début', 'Date de fin', 'Raison', 'Statut', 'Décidée par',
      'Décidée le', 'Motif du refus', 'Ligne registre',
      'Notification lue', 'Notification supprimée'
    ]]);
    feuille.setFrozenRows(1);
    feuille.getRange(1, 1, 1, 15).setFontWeight('bold');
  }
  return feuille;
}

function lireDemandesAbsence_() {
  const c = DEMANDES_ABSENCES;
  const feuille = feuilleDemandesAbsences_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return [];
  return feuille.getRange(c.START, 1, derniere - c.START + 1, c.NOTIFICATION_SUPPRIMEE)
    .getValues().map(function (r, index) {
      const statutBase = normaliser_(r[c.STATUT - 1]) || 'EN ATTENTE';
      const fin = dateOuNull_(r[c.DATE_FIN - 1]);
      const termineeParDate = statutBase === 'VALIDEE' && fin &&
        debutJour_(fin) < debutJour_(new Date());
      return {
        ligne: c.START + index,
        id: propre_(r[c.ID - 1]),
        dateCreation: dateHeureTexte_(r[c.CREE_LE - 1]),
        dateModification: dateHeureTexte_(r[c.MODIFIE_LE - 1]),
        nom: propre_(r[c.MATRICULE - 1]),
        grade: propre_(r[c.GRADE - 1]),
        dateDebut: dateTexte_(r[c.DATE_DEBUT - 1]),
        dateFin: dateTexte_(r[c.DATE_FIN - 1]),
        raison: propre_(r[c.RAISON - 1]),
        statutBase: statutBase,
        statut: termineeParDate ? 'TERMINEE' : statutBase,
        decidePar: propre_(r[c.DECIDE_PAR - 1]),
        dateDecision: dateHeureTexte_(r[c.DECIDE_LE - 1]),
        motifRefus: propre_(r[c.MOTIF_REFUS - 1]),
        ligneRegistre: nombre_(r[c.LIGNE_REGISTRE - 1]),
        notificationLue: booleenOui_(r[c.NOTIFICATION_LUE - 1]),
        notificationSupprimee: booleenOui_(r[c.NOTIFICATION_SUPPRIMEE - 1])
      };
    }).filter(function (demande) {
      return demande.id && demande.nom;
    });
}

function demandeAbsenceClient_(demande) {
  const aujourdHui = debutJour_(new Date());
  const debut = dateOuNull_(demande.dateDebut);
  const fin = dateOuNull_(demande.dateFin);
  return {
    id: demande.id,
    nom: demande.nom,
    grade: demande.grade,
    dateCreation: demande.dateCreation,
    dateModification: demande.dateModification,
    dateDebut: demande.dateDebut,
    dateFin: demande.dateFin,
    raison: demande.raison,
    statut: demande.statut,
    statutBase: demande.statutBase,
    decidePar: demande.decidePar,
    dateDecision: demande.dateDecision,
    motifRefus: demande.motifRefus,
    modifiable: demande.statutBase === 'EN ATTENTE',
    supprimableHistorique:
      demande.statutBase === 'REFUSEE' || demande.statut === 'TERMINEE',
    peutTerminer: demande.statutBase === 'VALIDEE' && !!debut && !!fin &&
      debutJour_(debut) <= aujourdHui && debutJour_(fin) >= aujourdHui
  };
}

function trouverDemandeAbsence_(id) {
  const cible = propre_(id);
  if (!cible) return null;
  return lireDemandesAbsence_().find(function (demande) {
    return demande.id === cible;
  }) || null;
}

function exigerDemandeAbsenceProprietaire_(id, auteur) {
  const demande = trouverDemandeAbsence_(requis_(id, 'L’identifiant de la demande'));
  if (!demande) throw new Error('Demande d’absence introuvable.');
  if (normaliser_(demande.nom) !== normaliser_(auteur.matricule)) {
    throw new Error('Accès refusé : cette demande ne vous appartient pas.');
  }
  return demande;
}

function reponseDemandesAbsenceMembre_(auteur, message) {
  const demandes = lireDemandesAbsence_().filter(function (demande) {
    return normaliser_(demande.nom) === normaliser_(auteur.matricule);
  }).map(demandeAbsenceClient_).sort(function (a, b) {
    return (dateOuNull_(b.dateCreation) || 0) - (dateOuNull_(a.dateCreation) || 0);
  });
  return {
    success: true,
    message: message,
    nom: auteur.matricule,
    grade: gradeEffectifPublicPourMembre_(auteur),
    demandes: demandes
  };
}

function ajouterAbsenceRegistreDepuisDemande_(demande, auteurDecision) {
  const c = CONFIG.ABSENCES;
  const feuille = feuille_(c.SHEET);
  const ligne = prochaineLigne_(feuille, c.START);
  const debut = dateISORequise_(demande.dateDebut, 'La date de début');
  const fin = dateISORequise_(demande.dateFin, 'La date de fin');
  ecrireNouvelleLigneAbsence_(feuille, ligne, {
    nom: demande.nom,
    grade: demande.grade,
    debut: debut,
    fin: fin,
    raison: demande.raison,
    auteur: auteurDecision
  });
  return ligne;
}

function ecrireNouvelleLigneAbsence_(feuille, ligne, absence) {
  const c = CONFIG.ABSENCES;
  const largeur = c.AUTEUR - c.MATRICULE + 1;
  const plage = feuille.getRange(ligne, c.MATRICULE, 1, largeur);

  // Certaines anciennes lignes vides conservent des listes déroulantes
  // obsolètes. Les données ont déjà été validées par le serveur : retirer ces
  // règles évite qu'un matricule valide soit refusé lors de l'écriture.
  plage.clearDataValidations();
  plage.setValues([[
    absence.nom,
    absence.grade,
    absence.debut,
    absence.fin,
    absence.raison,
    absence.fin < debutJour_(new Date()) ? 'TERMINE' : 'ACTIF',
    absence.auteur
  ]]);
  feuille.getRange(ligne, c.DATE_DEBUT, 1, 2).setNumberFormat('dd/MM/yyyy');
}

function trouverLigneRegistreDemandeAbsence_(demande) {
  const c = CONFIG.ABSENCES;
  const feuille = feuille_(c.SHEET);
  const ligne = Number(demande.ligneRegistre) || 0;
  if (ligne >= c.START && ligne <= feuille.getLastRow()) {
    const nom = propre_(feuille.getRange(ligne, c.MATRICULE).getValue());
    if (normaliser_(nom) === normaliser_(demande.nom)) return ligne;
  }
  const correspondance = lireAbsences_().find(function (absence) {
    return normaliser_(absence.nom) === normaliser_(demande.nom) &&
      absence.dateDebut === demande.dateDebut &&
      absence.raison === demande.raison;
  });
  return correspondance ? correspondance.ligne : 0;
}

function modifierNotificationsDemandesAbsence_(matricule, operation) {
  const feuille = feuilleDemandesAbsences_();
  lireDemandesAbsence_().forEach(function (demande) {
    if (
      normaliser_(demande.nom) === normaliser_(matricule) &&
      ['VALIDEE', 'REFUSEE'].includes(demande.statutBase) &&
      !demande.notificationSupprimee
    ) {
      operation(feuille, demande.ligne);
    }
  });
}

function dateAffichageCourte_(valeur) {
  const date = dateOuNull_(valeur);
  return date
    ? Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy')
    : 'date inconnue';
}

function verifierDureeDemandeAbsence_(debut, fin) {
  const premierJourMoisLimite = new Date(
    debut.getFullYear(),
    debut.getMonth() + 2,
    1
  );
  const dernierJourMoisLimite = new Date(
    premierJourMoisLimite.getFullYear(),
    premierJourMoisLimite.getMonth() + 1,
    0
  ).getDate();
  const limite = new Date(
    premierJourMoisLimite.getFullYear(),
    premierJourMoisLimite.getMonth(),
    Math.min(debut.getDate(), dernierJourMoisLimite)
  );
  if (fin > limite) {
    throw new Error('Une demande d’absence ne peut pas dépasser deux mois.');
  }
}

function recupererJournalActions(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.ADMINISTRATION_STAFF);
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.ADMINISTRATION_LOGS);

  const feuille = feuilleJournalActions_();
  const derniere = feuille.getLastRow();
  const total = Math.max(0, derniere - 1);
  if (!total) {
    return {
      success: true,
      total: 0,
      logs: [],
      peutSupprimer: estProprietaireOuCoproprietaireGDA_(auteur)
    };
  }

  // Les 1 000 dernières actions suffisent à l'interface et évitent de charger
  // inutilement toute la feuille lorsque le journal deviendra volumineux.
  const nombre = Math.min(total, 1000);
  const debut = derniere - nombre + 1;
  const valeurs = feuille.getRange(debut, 1, nombre, 7).getValues();
  const logs = valeurs.map(function (ligne, index) {
    return {
      ligne: debut + index,
      date: dateHeureTexte_(ligne[0]),
      auteur: propre_(ligne[1]),
      grade: propre_(ligne[2]),
      action: propre_(ligne[3]),
      cible: propre_(ligne[4]),
      details: propre_(ligne[5]),
      source: propre_(ligne[6])
    };
  }).filter(function (log) {
    return log.date && log.auteur && log.action;
  }).reverse();

  return {
    success: true,
    total: total,
    limite: 1000,
    logs: logs,
    peutSupprimer: estProprietaireOuCoproprietaireGDA_(auteur)
  };
}

function supprimerJournalAction(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerProprietaireOuCoproprietaireGDA_(auteur);
  const ligne = ligneRequise_(p.ligne, 2);

  return verrou_(function () {
    const feuille = feuilleJournalActions_();
    exigerLigne_(feuille, ligne, 2);
    feuille.deleteRow(ligne);
    return recupererJournalActions({ identifiant: auteur.matricule });
  });
}

function viderJournalActions(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerProprietaireOuCoproprietaireGDA_(auteur);

  return verrou_(function () {
    const feuille = feuilleJournalActions_();
    const derniere = feuille.getLastRow();
    if (derniere >= 2) {
      feuille.getRange(2, 1, derniere - 1, 7).clearContent();
    }
    return {
      success: true,
      total: 0,
      logs: [],
      peutSupprimer: true,
      message: 'Tous les logs ont été supprimés.'
    };
  });
}

function feuilleJournalActions_() {
  const classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  const nom = CONFIG.STOCKAGE.JOURNAL_ACTIONS_SHEET;
  let feuille = classeur.getSheetByName(nom);
  const nouvelleFeuille = !feuille;
  if (!feuille) feuille = classeur.insertSheet(nom);

  const cacheInitialisation = CacheService.getScriptCache();
  const cleInitialisation = 'GDA_JOURNAL_ACTIONS_INITIALISE_V2';
  if (nouvelleFeuille || !cacheInitialisation.get(cleInitialisation)) {
  if (
    propre_(feuille.getRange(1, 1).getValue()) !== 'Date de l’action' ||
    propre_(feuille.getRange(1, 7).getValue()) !== 'Source'
  ) {
    feuille.getRange(1, 1, 1, 7).setValues([[
      'Date de l’action',
      'Auteur',
      'Grade',
      'Action',
      'Cible',
      'Détails',
      'Source'
    ]]);
    feuille.setFrozenRows(1);
    feuille.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
    feuille
      .getRange(2, 1, Math.max(feuille.getMaxRows() - 1, 1), 1)
      .setNumberFormat('dd/MM/yyyy HH:mm:ss');
    cacheInitialisation.put(cleInitialisation, '1', 21600);
  }
  return feuille;
}

function enregistrerJournalActionEnSilence_(action, p, resultat) {
  const entree = construireJournalAction_(action, p || {}, resultat || {});
  if (!entree) return;

  try {
    const auteurNom = propre_(resultat && resultat.nouvelIdentifiantAuteur) ||
      propre_(p && p.identifiant) ||
      'Inconnu';
    const auteur = trouverMembre_(auteurNom);
    const feuille = feuilleJournalActions_();
    const verrou = LockService.getScriptLock();
    verrou.waitLock(5000);
    try {
      const ligne = Math.max(feuille.getLastRow() + 1, 2);
      feuille.getRange(ligne, 1, 1, 7).setValues([[
        new Date(),
        texteJournalAction_(auteurNom, 120),
        texteJournalAction_(
          auteur ? gradeEffectifPublicPourMembre_(auteur) : '',
          120
        ),
        texteJournalAction_(entree.action, 160),
        texteJournalAction_(entree.cible, 220),
        texteJournalAction_(entree.details, 1000),
        'Site HTML'
      ]]);
    } finally {
      verrou.releaseLock();
    }
  } catch (erreur) {
    // Une panne du journal ne doit jamais annuler une action métier réussie.
    console.error('Journal Actions : ' + (erreur && erreur.message ? erreur.message : erreur));
  }
}

function construireJournalAction_(action, p, resultat) {
  const rapportId = propre_(resultat.id || p.rapportId || p.id);
  const ligne = propre_(resultat.ligne || p.ligne);
  const ciblePersonne = propre_(
    p.personne || p.nom || p.matriculeRapport || p.nouvelIdentifiant
  );
  const message = propre_(resultat.message);

  switch (action) {
    case 'actualiserEffectifPublic':
      return journalAction_('Effectif public actualisé', 'Effectif public', message);
    case 'enregistrerNote':
      return journalAction_('Note modifiée', ciblePersonne, 'Contenu non recopié dans le journal');
    case 'modifierMembreEffectif':
      return journalAction_(
        'Effectif modifié',
        propre_(p.personne) === propre_(p.nom)
          ? propre_(p.nom)
          : propre_(p.personne) + ' → ' + propre_(p.nom),
        'Grade : ' + propre_(p.grade)
      );
    case 'ajouterMembreEffectif':
      return journalAction_(
        'Nouveau GDA ajouté',
        propre_(p.nom),
        'Grade : ' + propre_(p.grade) + ' — ajouté directement depuis l’effectif'
      );
    case 'ajouterAbsence':
      return journalAction_('Absence ajoutée', ciblePersonne, periodeJournal_(p.dateDebut, p.dateFin));
    case 'ajouterDemandeAbsence':
      return journalAction_('Demande d’absence envoyée', propre_(p.identifiant), periodeJournal_(p.dateDebut, p.dateFin));
    case 'modifierDemandeAbsence':
      return journalAction_('Demande d’absence modifiée', propre_(p.demandeId), periodeJournal_(p.dateDebut, p.dateFin));
    case 'supprimerDemandeAbsence':
      return journalAction_('Demande d’absence supprimée', propre_(p.demandeId), message);
    case 'terminerDemandeAbsence':
      return journalAction_('Absence terminée par le membre', propre_(p.demandeId), message);
    case 'traiterDemandeAbsence':
      return journalAction_('Demande d’absence traitée', propre_(p.demandeId), joindreJournal_([p.decision, p.motifRefus]));
    case 'modifierAbsence':
      return journalAction_('Absence modifiée', 'Ligne ' + ligne, periodeJournal_(p.dateDebut, p.dateFin));
    case 'retourAnticipe':
      return journalAction_('Retour anticipé enregistré', 'Absence ligne ' + ligne, message);
    case 'supprimerAbsence':
      return journalAction_(
        'Absence supprimée définitivement',
        propre_(resultat.nomSupprime) || ('Ligne ' + ligne),
        message
      );
    case 'ajouterDepart':
      return journalAction_('Départ ajouté', ciblePersonne, joindreJournal_([p.type, p.duree, p.dateDepart]));
    case 'modifierDepart':
      return journalAction_('Départ modifié', 'Ligne ' + ligne, joindreJournal_([p.type, p.statut, p.dateDepart, p.dateRetour]));
    case 'supprimerDepart':
      return journalAction_('Départ supprimé', 'Ligne ' + ligne, message);
    case 'ajouterRapport':
      return journalAction_('Rapport ajouté', ciblePersonne, propre_(p.dateRapport));
    case 'ajouterRapportDiscord':
      return journalAction_('Rapport Discord ajouté et validé', ciblePersonne, rapportId);
    case 'ajouterMonRapport':
      return journalAction_('Rapport envoyé', propre_(p.identifiant), propre_(p.dateRapport));
    case 'modifierMonRapport':
      return journalAction_('Rapport modifié', rapportId || ('Ligne ' + ligne), propre_(p.dateRapport));
    case 'supprimerMonRapport':
      return journalAction_('Rapport supprimé par son auteur', rapportId || ('Ligne ' + ligne), message);
    case 'changerStatutRapport':
      return journalAction_('Statut de rapport modifié', rapportId || ('Ligne ' + ligne), 'Nouveau statut : ' + propre_(resultat.statut || p.statut));
    case 'archiverTousRapportsLus':
      return journalAction_('Rapports archivés en lot', 'Rapports lus et validés', String(Number(resultat.total) || 0) + ' rapport(s)');
    case 'supprimerRapport':
      return journalAction_('Rapport supprimé définitivement', rapportId || ('Ligne ' + ligne), message);
    case 'appliquerGestionPersonnel':
      return journalAction_('Gestion du personnel', ciblePersonne, joindreJournal_([p.type, p.choix]));
    case 'modifierLogGestionPersonnel':
      return journalAction_('Historique du personnel modifié', propre_(p.personne) || ('Ligne ' + ligne), propre_(p.type));
    case 'supprimerLogGestionPersonnel':
      return journalAction_('Historique du personnel supprimé', 'Ligne ' + ligne, message);
    case 'enregistrerPermissions':
      return journalAction_('Permissions modifiées', ciblePersonne, propre_(p.permissions) || 'Aucune permission');
    case 'ajouterListeBlanche':
      return journalAction_('Liste blanche - ajout', ciblePersonne, 'Discord ID : ' + propre_(p.discordId));
    case 'modifierListeBlanche':
      return journalAction_('Liste blanche - modification', ciblePersonne, 'Identifiant : ' + propre_(p.id));
    case 'supprimerListeBlanche':
      return journalAction_('Liste blanche - suppression', propre_(p.id), message);
    case 'definirDefcon':
      return journalAction_(
        'Niveau DEFCON modifié',
        Number(p.niveau) ? 'DEFCON ' + Number(p.niveau) : 'Aucun DEFCON',
        message
      );
    case 'definirCoproprietaire':
      return journalAction_('Co-propriétaire modifié', ciblePersonne, resultat.coproprietaire ? 'Ajouté' : 'Retiré');
    case 'transfererPropriete':
      return journalAction_('Propriété transférée', ciblePersonne, message);
    default:
      return null;
  }
}

function journalAction_(action, cible, details) {
  return {
    action: propre_(action),
    cible: propre_(cible) || '—',
    details: propre_(details) || '—'
  };
}

function periodeJournal_(debut, fin) {
  return joindreJournal_([
    propre_(debut) ? 'Du ' + propre_(debut) : '',
    propre_(fin) ? 'au ' + propre_(fin) : ''
  ]);
}

function joindreJournal_(valeurs) {
  return (valeurs || []).map(propre_).filter(Boolean).join(' · ');
}

function texteJournalAction_(valeur, maximum) {
  let texte = propre_(valeur).slice(0, maximum);
  if (/^[=+@-]/.test(texte)) texte = "'" + texte;
  return texte;
}

function exigerGestionListeBlancheGDA_(membre) {
  if (!estProprietaireGDA_(membre) &&
      !estCoproprietaireGDA_(membre) &&
      !membrePossedeRoleStaffTotal_(membre)) {
    throw new Error('La gestion de la liste blanche est réservée au propriétaire, aux co-propriétaires et au Staff.');
  }
}

function exigerSuppressionListeBlancheGDA_(membre) {
  if (!estProprietaireGDA_(membre) && !estCoproprietaireGDA_(membre)) {
    throw new Error('La suppression dans la liste blanche est réservée au propriétaire et aux co-propriétaires.');
  }
}

function entreeListeBlancheParIdGDA_(id) {
  const cible = propre_(id);
  return lireListeBlancheGDA_().find(function (entree) {
    return entree.id === cible;
  }) || null;
}

function verifierIdentiteListeBlancheGDA_(identifiant, discordId, idIgnore) {
  const nom = requis_(identifiant, 'L’identifiant').slice(0, 80);
  const discord = normaliserIdDiscord_(requis_(discordId, 'Le Discord ID'));
  if (!discord) throw new Error('Le Discord ID doit contenir entre 15 et 22 chiffres.');
  const membreMemeIdentifiant = lireEffectif_().find(function (membre) {
    return normaliser_(membre.matricule) === normaliser_(nom);
  });
  if (membreMemeIdentifiant) {
    const discordEffectif = normaliserIdDiscord_(membreMemeIdentifiant.discordId);
    if (discordEffectif && discordEffectif !== discord) {
      throw new Error('Le Discord ID doit correspondre à celui enregistré dans l’effectif.');
    }
  } else {
    const discordAutreMembre = lireEffectif_().find(function (membre) {
      return normaliserIdDiscord_(membre.discordId) === discord;
    });
    if (discordAutreMembre) {
      throw new Error('Ce Discord ID appartient déjà à une autre personne de l’effectif.');
    }
  }
  const doublon = lireListeBlancheGDA_().find(function (entree) {
    return entree.id !== propre_(idIgnore) && (
      normaliser_(entree.identifiant) === normaliser_(nom) ||
      entree.discordId === discord
    );
  });
  if (doublon) throw new Error('Cet identifiant ou ce Discord ID existe déjà dans la liste blanche.');
  return { identifiant: nom, discordId: discord };
}

function permissionsListeBlancheGDA_(valeur) {
  const permissions = propre_(valeur).split(',').map(propre_).filter(Boolean);
  const autorisees = toutesPermissionsGDA_();
  const invalides = permissions.filter(function (permission) {
    return !autorisees.includes(permission);
  });
  if (invalides.length) throw new Error('Permission inconnue : ' + invalides.join(', '));
  if (permissions.includes(PERMISSIONS_GDA.ROLE_VISITEUR)) {
    return [PERMISSIONS_GDA.ROLE_VISITEUR];
  }
  return permissions.filter(function (permission, index) {
    return permissions.indexOf(permission) === index;
  });
}

function recupererListeBlanche(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerGestionListeBlancheGDA_(auteur);
  return {
    success: true,
    permissions: toutesPermissionsGDA_().map(function (cle) {
      return { cle: cle, libelle: LIBELLES_PERMISSIONS_GDA[cle] };
    }),
    personnes: lireListeBlancheGDA_().map(function (entree) {
      const membre = membreDepuisListeBlancheGDA_(entree);
      return {
        id: entree.id,
        identifiant: entree.identifiant,
        discordId: entree.discordId,
        creeLe: entree.creeLe,
        modifieLe: entree.modifieLe,
        permissions: permissionsBrutesMembre_(membre),
        roleVisiteur: permissionsBrutesMembre_(membre)
          .includes(PERMISSIONS_GDA.ROLE_VISITEUR),
        roleStaff: membrePossedeRoleStaffTotal_(membre)
      };
    }).sort(function (a, b) {
      return normaliser_(a.identifiant).localeCompare(normaliser_(b.identifiant));
    })
  };
}

function ajouterListeBlanche(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerGestionListeBlancheGDA_(auteur);
  const identite = verifierIdentiteListeBlancheGDA_(p.nouvelIdentifiant, p.discordId, '');
  const maintenant = new Date();
  const feuille = feuilleListeBlancheGDA_();
  const ligne = prochaineLigne_(feuille, LISTE_BLANCHE_GDA.START);
  const id = Utilities.getUuid();
  feuille.getRange(ligne, 1, 1, LISTE_BLANCHE_GDA.MODIFIE_LE).setValues([[
    id, identite.identifiant, identite.discordId, maintenant, maintenant
  ]]);
  feuille.getRange(ligne, LISTE_BLANCHE_GDA.IDENTIFIANT, 1, 2).setNumberFormat('@');
  feuille.getRange(ligne, LISTE_BLANCHE_GDA.CREE_LE, 1, 2)
    .setNumberFormat('dd/MM/yyyy HH:mm:ss');
  const membre = membreDepuisListeBlancheGDA_({
    id: id,
    identifiant: identite.identifiant,
    discordId: identite.discordId
  });
  const permissions = permissionsListeBlancheGDA_(p.permissions);
  if (permissions.length) enregistrerPermissionsMembre_(membre, permissions);
  return { success: true, message: identite.identifiant + ' a Ã©tÃ© ajoutÃ© Ã  la liste blanche.' };
}

function modifierListeBlanche(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerGestionListeBlancheGDA_(auteur);
  const entree = entreeListeBlancheParIdGDA_(requis_(p.id, 'Lâ€™entrÃ©e'));
  if (!entree) throw new Error('EntrÃ©e introuvable dans la liste blanche.');
  const identite = verifierIdentiteListeBlancheGDA_(p.nouvelIdentifiant, p.discordId, entree.id);
  const feuille = feuilleListeBlancheGDA_();
  feuille.getRange(entree.ligne, LISTE_BLANCHE_GDA.IDENTIFIANT, 1, 2)
    .setValues([[identite.identifiant, identite.discordId]]).setNumberFormat('@');
  feuille.getRange(entree.ligne, LISTE_BLANCHE_GDA.MODIFIE_LE)
    .setValue(new Date()).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  const membre = membreDepuisListeBlancheGDA_({
    id: entree.id,
    identifiant: identite.identifiant,
    discordId: identite.discordId
  });
  const permissions = permissionsListeBlancheGDA_(p.permissions);
  enregistrerPermissionsMembre_(membre, permissions);
  return { success: true, message: identite.identifiant + ' a Ã©tÃ© modifiÃ©.' };
}

function supprimerListeBlanche(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerSuppressionListeBlancheGDA_(auteur);
  const entree = entreeListeBlancheParIdGDA_(requis_(p.id, 'Lâ€™entrÃ©e'));
  if (!entree) throw new Error('EntrÃ©e introuvable dans la liste blanche.');
  feuilleListeBlancheGDA_().deleteRow(entree.ligne);
  const stockage = PropertiesService.getScriptProperties();
  stockage.deleteProperty('GDA_PERMISSIONS_LB_' + entree.id);
  sauvegarderParametresGDAEnSilence_();
  return { success: true, message: entree.identifiant + ' a Ã©tÃ© retirÃ© de la liste blanche.' };
}

function recupererAdministration(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.ADMINISTRATION_STAFF);
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.ADMINISTRATION_PERMISSIONS);
  const rangAspirant = rangGradeGestion_('Aspirant');

  return {
    success: true,
    auteurProprietaire: estProprietaireGDA_(auteur),
    auteurCoproprietaire: estCoproprietaireGDA_(auteur),
    proprietaireNom: obtenirNomProprietaireGDA_(),
    permissions: toutesPermissionsGDA_().map(function (cle) {
      return {
        cle: cle,
        libelle: LIBELLES_PERMISSIONS_GDA[cle]
      };
    }),
    utilisateurs: lireEffectif_().filter(function (membre) {
      // La gestion des droits est réservée aux Aspirants et grades supérieurs.
      const rang = rangGradeGestion_(membre.grade);
      return propre_(membre.matricule) &&
        propre_(membre.grade) &&
        rang >= 0 &&
        rang <= rangAspirant;
    }).map(function (membre) {
      const acces = obtenirAccesMembre_(membre);
      return {
        nom: membre.matricule,
        grade: gradeEffectifPublicPourMembre_(membre),
        gradeEffectifOfficier: membre.grade,
        proprietaire: acces.proprietaire,
        coproprietaire: acces.coproprietaire,
        permissions: acces.permissions,
        externe: false
      };
    }).sort(function (a, b) {
      const rangA = rangGradeGestion_(a.gradeEffectifOfficier);
      const rangB = rangGradeGestion_(b.gradeEffectifOfficier);
      if (rangA !== rangB) return rangA - rangB;
      return normaliser_(a.nom).localeCompare(normaliser_(b.nom));
    })
  };
}

function definirCoproprietaire(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerProprietaireGDA_(auteur);
  const membre = exigerMembreParMatricule_(p.personne);

  if (estProprietaireGDA_(membre)) {
    throw new Error('Le propriétaire est déjà titulaire de tous les droits.');
  }

  const rang = rangGradeGestion_(membre.grade);
  const rangAspirant = rangGradeGestion_('Aspirant');
  if (rang < 0 || rang > rangAspirant) {
    throw new Error('Un co-propriétaire doit être Aspirant ou d’un grade supérieur.');
  }

  const actif = normaliser_(p.actif) === 'TRUE' || propre_(p.actif) === '1';
  let coproprietaires = obtenirCoproprietairesGDA_();
  const cible = normaliser_(membre.matricule);

  coproprietaires = coproprietaires.filter(function (nom) {
    return normaliser_(nom) !== cible;
  });
  if (actif) coproprietaires.push(membre.matricule);

  enregistrerCoproprietairesGDA_(coproprietaires);
  return {
    success: true,
    message: actif
      ? membre.matricule + ' est maintenant co-propriétaire.'
      : membre.matricule + ' n’est plus co-propriétaire.',
    coproprietaire: actif,
    permissions: obtenirAccesMembre_(membre).permissions
  };
}

function transfererPropriete(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerProprietaireGDA_(auteur);
  const nouveau = exigerMembreParMatricule_(p.personne);

  if (estProprietaireGDA_(nouveau)) {
    throw new Error('Cette personne est déjà propriétaire.');
  }

  const rang = rangGradeGestion_(nouveau.grade);
  const rangAspirant = rangGradeGestion_('Aspirant');
  if (rang < 0 || rang > rangAspirant) {
    throw new Error('La propriété ne peut être transmise qu’à un Aspirant ou à un grade supérieur.');
  }

  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    // Nouvelle vérification sous verrou pour empêcher deux transferts simultanés.
    exigerProprietaireGDA_(auteur);
    const ancienNom = obtenirNomProprietaireGDA_();
    let coproprietaires = obtenirCoproprietairesGDA_().filter(function (nom) {
      return normaliser_(nom) !== normaliser_(nouveau.matricule) &&
        normaliser_(nom) !== normaliser_(ancienNom);
    });

    PropertiesService.getScriptProperties().setProperties({
      [CLE_PROPRIETAIRE_GDA]: nouveau.matricule,
      [CLE_COPROPRIETAIRES_GDA]: JSON.stringify(coproprietaires)
    }, false);
    sauvegarderParametresGDAEnSilence_();

    return {
      success: true,
      message: nouveau.matricule + ' est maintenant propriétaire.',
      proprietaireNom: nouveau.matricule,
      permissionsAuteur: obtenirAccesMembre_(auteur).permissions
    };
  } finally {
    verrou.releaseLock();
  }
}

function enregistrerPermissions(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.ADMINISTRATION_STAFF);
  exigerPermissionGDA_(auteur, PERMISSIONS_GDA.ADMINISTRATION_PERMISSIONS);

  const membre = exigerMembreParMatricule_(p.personne);
  const demandees = propre_(p.permissions)
    .split(',')
    .map(propre_)
    .filter(Boolean);
  const autorisees = toutesPermissionsGDA_();
  const invalides = demandees.filter(
    permission => !autorisees.includes(permission)
  );

  if (invalides.length) {
    throw new Error('Permission inconnue : ' + invalides.join(', '));
  }

  const uniques = demandees.filter(
    (permission, index) => demandees.indexOf(permission) === index
  );
  enregistrerPermissionsMembre_(membre, uniques);

  return {
    success: true,
    message: 'Permissions mises à jour pour ' + membre.matricule + '.',
    permissions: obtenirAccesMembre_(membre).permissions
  };
}

function recupererGestionPersonnel(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerAccesGestionPersonnel_(auteur);
  const effectif = lireEffectif_();
  return {
    success: true,
    membres: effectif
      .filter(function (membre) {
        return utilisateurPeutCiblerGestionPersonnel_(auteur, membre);
      })
      .map(membreGestionClient_),
    logs: lireLogsGestion_(),
    grades: REFERENTIEL_GESTION.grades,
    sanctions: REFERENTIEL_GESTION.sanctions,
    dureesBlacklist: REFERENTIEL_GESTION.dureesBlacklist,
    medailles: REFERENTIEL_GESTION.medailles,
    specialisations: REFERENTIEL_GESTION.specialisations,
    specialisationsModifiables: specialisationsModifiablesGestion_(auteur),
    peutModifierHistorique: utilisateurAPermission_(
      auteur,
      PERMISSIONS_GDA.PERSONNEL_HISTORIQUE_MODIFIER
    ),
    peutSupprimerHistorique: utilisateurAPermission_(
      auteur,
      PERMISSIONS_GDA.PERSONNEL_HISTORIQUE_SUPPRIMER
    )
  };
}

function appliquerGestionPersonnel(p) {
  const auteur = exigerConnexion_(p.identifiant);
  assurerFeuillesDisponibilitesMemoire_();
  exigerAccesGestionPersonnel_(auteur);
  const membre = exigerMembreParMatricule_(p.personne);
  exigerAutoriteGestionPersonnel_(auteur, membre);
  const type = typeGestion_(p.type);
  const raison = limite_(p.raison, 2000, 'La raison');
  const choixDemande = propre_(p.choix);
  const ancienGrade = exigerGradeEffectifPublicPourMembre_(
    membre,
    'l’action de gestion du personnel'
  );

  return verrou_(function () {
    let choixJournal = choixDemande;

    if (type === 'Promotion') {
      const nouveauGrade = validerGradeGestion_(choixDemande);
      const rangActuel = rangGradeGestion_(membre.grade);
      const nouveauRang = rangGradeGestion_(nouveauGrade);
      if (rangActuel === -1 || nouveauRang === -1 || nouveauRang >= rangActuel) {
        throw new Error('La promotion doit mener vers un grade supérieur.');
      }
      appliquerNouveauGrade_(membre, nouveauGrade);
      choixJournal = nouveauGrade;
    } else if (type === 'Rétrogradation') {
      const nouveauGrade = validerGradeGestion_(choixDemande);
      const rangActuel = rangGradeGestion_(membre.grade);
      const nouveauRang = rangGradeGestion_(nouveauGrade);
      if (rangActuel === -1 || nouveauRang === -1 || nouveauRang <= rangActuel) {
        throw new Error('La rétrogradation doit mener vers un grade inférieur.');
      }
      appliquerNouveauGrade_(membre, nouveauGrade);
      choixJournal = nouveauGrade;
    } else if (type === 'Sanction') {
      const sanction = validerValeurReferentiel_(
        choixDemande,
        REFERENTIEL_GESTION.sanctions,
        'Sanction invalide.'
      );
      const celluleSanction = membre.feuille
        .getRange(membre.ligne, CONFIG.EFFECTIF.SANCTION);

      celluleSanction.setValue(sanction);

      choixJournal = sanction;
    } else if (type === 'Médaille') {
      const medaille = validerMedailleGestion_(choixDemande);
      const existantes = decouperValeurs_(membre.medaille);
      if (existantes.some(v => cleMedaille_(v) === cleMedaille_(medaille))) {
        throw new Error('Cette personne possède déjà cette médaille.');
      }
      ecrireMedaillesCellule_(
        membre.feuille.getRange(membre.ligne, CONFIG.EFFECTIF.MEDAILLE),
        ajouterValeurListe_(membre.medaille, medaille)
      );
      choixJournal = medaille;
    } else if (type === 'Spécialisation') {
      choixJournal = appliquerSpecialisationsGestion_(
        auteur,
        membre,
        p.choix
      );
    } else if (type === 'Départ' || type === 'Licenciement') {
      const horodatageAction = new Date();
      const dateDepartJour = propre_(p.dateDepart)
        ? dateISORequise_(p.dateDepart, 'La date de départ')
        : debutJour_(horodatageAction);
      const dateDepart = appliquerHeureDate_(dateDepartJour, horodatageAction);
      const dateRetour = propre_(p.dateRetour)
        ? appliquerHeureDate_(dateISORequise_(p.dateRetour, 'La date de retour'), dateDepart)
        : ajouterDuree_(dateDepart, '1 semaine');
      if (dateRetour < ajouterDuree_(dateDepart, '1 semaine')) {
        throw new Error('La date de retour doit être située au moins 7 jours après la date de départ.');
      }
      choixJournal = type + ' enregistré — retour autorisé le ' +
        dateAffichageCourte_(dateRetour);
      const logCree = ajouterLogGestion_({
        personne: membre.matricule,
        grade: ancienGrade,
        type: type,
        choix: choixJournal,
        raison: raison,
        auteur: auteur.matricule,
        date: horodatageAction
      });
      let departCree = null;
      let sauvegardeEffectif = null;
      try {
        departCree = enregistrerDepartDepuisGestion_(
          membre,
          raison,
          auteur.matricule,
          dateDepart,
          dateRetour,
          type
        );
        sauvegardeEffectif = retirerMembreEffectif_(membre);
        const reponse = reponseGestionMutation_(
          type + ' enregistré pour ' + membre.matricule +
          ' et personne retirée de l’effectif.',
          auteur
        );
        finaliserRetraitMembreEffectifEnSilence_(sauvegardeEffectif);
        sauvegardeEffectif = null;
        return reponse;
      } catch (erreur) {
        if (sauvegardeEffectif) {
          restaurerMembreEffectifEnSilence_(sauvegardeEffectif);
        }
        annulerEcritureGestionEnSilence_(departCree);
        annulerEcritureGestionEnSilence_(logCree);
        throw erreur;
      }
    } else if (type === 'Blacklist') {
      const horodatageAction = new Date();
      const duree = validerValeurReferentiel_(
        choixDemande,
        REFERENTIEL_GESTION.dureesBlacklist,
        'Durée de blacklist invalide.'
      );
      choixJournal = 'Blacklist — ' + duree;
      const logCree = ajouterLogGestion_({
        personne: membre.matricule,
        grade: ancienGrade,
        type: type,
        choix: choixJournal,
        raison: raison,
        auteur: auteur.matricule,
        date: horodatageAction
      });
      let departCree = null;
      let sauvegardeEffectif = null;
      try {
        departCree = enregistrerBlacklistDepuisGestion_(
          membre,
          duree,
          raison,
          auteur.matricule,
          horodatageAction
        );
        sauvegardeEffectif = retirerMembreEffectif_(membre);
        const reponse = reponseGestionMutation_(
          'Blacklist enregistrée pour ' + membre.matricule +
          ' et personne retirée de l’effectif.',
          auteur
        );
        finaliserRetraitMembreEffectifEnSilence_(sauvegardeEffectif);
        sauvegardeEffectif = null;
        return reponse;
      } catch (erreur) {
        if (sauvegardeEffectif) restaurerMembreEffectifEnSilence_(sauvegardeEffectif);
        annulerEcritureGestionEnSilence_(departCree);
        annulerEcritureGestionEnSilence_(logCree);
        throw erreur;
      }
    }

    ajouterLogGestion_({
      personne: membre.matricule,
      grade: ancienGrade,
      type: type,
      choix: choixJournal,
      raison: raison,
      auteur: auteur.matricule
    });

    return reponseGestionMutation_(
      type + ' enregistré(e) pour ' + membre.matricule + '.',
      auteur
    );
  });
}

function modifierLogGestionPersonnel(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerPermissionGDA_(
    auteur,
    PERMISSIONS_GDA.PERSONNEL_HISTORIQUE_MODIFIER
  );

  const c = HISTORIQUE_GESTION_PERSONNEL;
  const ligne = ligneRequise_(p.ligne, c.START);
  const date = dateHeureLocaleGestionRequise_(p.date);
  const personne = limite_(requis_(p.personne, 'La personne'), 120, 'La personne');
  const grade = validerGradeGestion_(p.grade);
  const type = typeJournalFeuille_(p.type);
  const choix = limite_(requis_(p.choix, 'La décision'), 500, 'La décision');
  const raison = limite_(requis_(p.raison, 'La raison'), 2000, 'La raison');
  const rempliPar = limite_(requis_(p.auteur, 'Le nom de l’auteur'), 120, 'Le nom de l’auteur');

  return verrou_(function () {
    const feuille = feuilleHistoriqueGestionPersonnel_();
    if (ligne > feuille.getLastRow()) {
      throw new Error('Cette ligne d’historique n’existe plus.');
    }
    const existante = feuille
      .getRange(ligne, c.PERSONNE, 1, c.TYPE - c.PERSONNE + 1)
      .getValues()[0];
    if (!propre_(existante[0]) || !propre_(existante[c.TYPE - c.PERSONNE])) {
      throw new Error('Cette ligne ne contient pas un historique valide.');
    }

    feuille.getRange(ligne, c.DATE, 1, c.AUTEUR - c.DATE + 1).setValues([[
      date,
      personne,
      grade,
      type,
      choix,
      raison,
      rempliPar
    ]]);
    return reponseHistoriqueGestionMutation_('Ligne d’historique modifiée.');
  });
}

function supprimerLogGestionPersonnel(p) {
  const auteur = exigerConnexion_(p.identifiant);
  exigerPermissionGDA_(
    auteur,
    PERMISSIONS_GDA.PERSONNEL_HISTORIQUE_SUPPRIMER
  );

  const c = HISTORIQUE_GESTION_PERSONNEL;
  const ligne = ligneRequise_(p.ligne, c.START);
  return verrou_(function () {
    const feuille = feuilleHistoriqueGestionPersonnel_();
    if (ligne > feuille.getLastRow()) {
      throw new Error('Cette ligne d’historique n’existe plus.');
    }
    const personne = propre_(feuille.getRange(ligne, c.PERSONNE).getValue());
    const type = propre_(feuille.getRange(ligne, c.TYPE).getValue());
    if (!personne || !type) {
      throw new Error('Cette ligne ne contient pas un historique valide.');
    }
    feuille.deleteRow(ligne);
    return reponseHistoriqueGestionMutation_('Ligne d’historique supprimée.');
  });
}

function reponseHistoriqueGestionMutation_(message) {
  SpreadsheetApp.flush();
  return {
    success: true,
    message: message,
    logs: lireLogsGestion_()
  };
}

function dateHeureLocaleGestionRequise_(valeur) {
  const texte = requis_(valeur, 'La date');
  const correspondance = texte.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!correspondance) {
    throw new Error('La date de l’historique est invalide.');
  }
  const date = new Date(
    Number(correspondance[1]),
    Number(correspondance[2]) - 1,
    Number(correspondance[3]),
    Number(correspondance[4]),
    Number(correspondance[5]),
    Number(correspondance[6] || 0)
  );
  if (isNaN(date)) throw new Error('La date de l’historique est invalide.');
  return date;
}

function exigerAccesGestionPersonnel_(membre) {
  if (!estOfficierGDA_(membre)) {
    throw new Error(
      'Accès refusé : la gestion du personnel est réservée aux officiers.'
    );
  }
}

function utilisateurPeutCiblerGestionPersonnel_(auteur, cible) {
  if (membrePossedeRoleVisiteur_(auteur) ||
      estProprietaireOuCoproprietaireGDA_(auteur) ||
      membrePossedeRoleStaffTotal_(auteur)) return true;
  const rangAuteur = rangGradeGestion_(auteur && auteur.grade);
  const rangCible = rangGradeGestion_(cible && cible.grade);
  return rangAuteur >= 0 && rangCible >= rangAuteur;
}

function exigerAutoriteGestionPersonnel_(auteur, cible) {
  if (!utilisateurPeutCiblerGestionPersonnel_(auteur, cible)) {
    throw new Error(
      'Accès refusé : vous ne pouvez pas gérer une personne ayant un grade supérieur au vôtre.'
    );
  }
}

function estOfficierGDA_(membre) {
  if (membrePossedeRoleVisiteur_(membre)) return true;
  if (membrePossedeRoleStaffTotal_(membre)) return true;
  const rang = rangGradeGestion_(membre && membre.grade);
  const rangAspirant = rangGradeGestion_('Aspirant');
  return rang >= 0 && rang <= rangAspirant;
}

function estOfficierSuperieurGDA_(membre) {
  if (membrePossedeRoleVisiteur_(membre)) return true;
  if (membrePossedeRoleStaffTotal_(membre)) return true;
  const rang = rangGradeGestion_(membre && membre.grade);
  const rangViceCommandant = rangGradeGestion_('Vice-Commandant');
  return rang >= 0 && rang <= rangViceCommandant;
}

function exigerOfficierGDA_(membre, action) {
  if (!estOfficierGDA_(membre)) {
    throw new Error(
      'Accès refusé : seuls les officiers peuvent ' + action + '.'
    );
  }
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

function reponseDisponibilitesMutation_(message, auteur) {
  const toutes = lireAbsences_();
  synchroniserPresencesEffectifDepuisAbsences_(
    feuille_(CONFIG.EFFECTIF.SHEET),
    matriculesAbsentsActuels_(toutes)
  );
  return {
    success: true,
    message: message,
    actives: toutes.filter(function (absence) { return absence.statut === 'ACTIF'; }),
    historiques: toutes.filter(function (absence) { return absence.statut !== 'ACTIF'; }),
    demandesEnAttente: lireDemandesAbsence_().filter(function (demande) {
      return demande.statutBase === 'EN ATTENTE';
    }).map(demandeAbsenceClient_).sort(function (a, b) {
      return (dateOuNull_(b.dateCreation) || 0) - (dateOuNull_(a.dateCreation) || 0);
    }),
    peutGerer: utilisateurAPermission_(auteur, PERMISSIONS_GDA.ABSENCES_GERER),
    peutModifier: utilisateurPeutModifierDisponibilites_(auteur),
    peutSupprimer: utilisateurPeutModifierSupprimerDisponibilites_(auteur)
  };
}

function utilisateurPeutModifierSupprimerDisponibilites_(membre) {
  return estProprietaireOuCoproprietaireGDA_(membre) || utilisateurAPermission_(
    membre,
    PERMISSIONS_GDA.DISPONIBILITES_MODIFIER_SUPPRIMER
  );
}

function utilisateurPeutModifierDisponibilites_(membre) {
  return utilisateurAPermission_(membre, PERMISSIONS_GDA.ABSENCES_GERER) ||
    utilisateurPeutModifierSupprimerDisponibilites_(membre);
}

function exigerPermissionModificationDisponibilites_(membre) {
  if (!utilisateurPeutModifierDisponibilites_(membre)) {
    throw new Error(
      'Accès refusé : permission requise — ' +
      LIBELLES_PERMISSIONS_GDA.disponibilites_modifier_supprimer + '.'
    );
  }
}

function exigerPermissionModifierSupprimerDisponibilites_(membre) {
  if (!utilisateurPeutModifierSupprimerDisponibilites_(membre)) {
    throw new Error(
      'Accès refusé : permission requise — ' +
      LIBELLES_PERMISSIONS_GDA.disponibilites_modifier_supprimer + '.'
    );
  }
}

function reponseDepartsMutation_(message) {
  SpreadsheetApp.flush();
  const entrees = lireDeparts_();
  return {
    success: true,
    message: message,
    departs: entrees.filter(function (entree) {
      return normaliser_(entree.type) === 'DEPART';
    }),
    licenciements: entrees.filter(function (entree) {
      return normaliser_(entree.type) === 'LICENCIEMENT';
    }),
    blacklists: entrees.filter(function (entree) {
      return normaliser_(entree.type) === 'BLACKLIST';
    })
  };
}

function reponseGestionMutation_(message, auteur) {
  SpreadsheetApp.flush();
  const effectif = lireEffectif_();
  const entrees = lireDeparts_();
  const auteurActualise = effectif.find(function (membre) {
    return normaliser_(membre.matricule) ===
      normaliser_(auteur && auteur.matricule);
  });
  return {
    success: true,
    message: message,
    membres: effectif
      .filter(function (membre) {
        return utilisateurPeutCiblerGestionPersonnel_(auteur, membre);
      })
      .map(membreGestionClient_),
    logs: lireLogsGestion_(),
    effectif: effectif.map(membreClient_),
    specialisationAuteur: auteurActualise
      ? auteurActualise.specialisation
      : propre_(auteur && auteur.specialisation),
    departs: entrees.filter(function (entree) {
      return normaliser_(entree.type) === 'DEPART';
    }),
    licenciements: entrees.filter(function (entree) {
      return normaliser_(entree.type) === 'LICENCIEMENT';
    }),
    blacklists: entrees.filter(function (entree) {
      return normaliser_(entree.type) === 'BLACKLIST';
    })
  };
}

function membreGestionClient_(membre) {
  return {
    nom: membre.matricule,
    grade: gradeEffectifPublicPourMembre_(membre),
    gradeEffectifOfficier: membre.grade,
    sanction: membre.sanction,
    medailles: normaliserListeMedailles_(membre.medaille),
    specialisations: specialisationsMembreGestion_(membre)
  };
}

function lireLogsGestion_() {
  const c = HISTORIQUE_GESTION_PERSONNEL;
  const feuille = feuilleHistoriqueGestionPersonnel_();
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return [];

  const valeurs = feuille
    .getRange(c.START, 1, derniere - c.START + 1, c.AUTEUR)
    .getValues();

  return valeurs.map((r, i) => ({
    ligne: c.START + i,
    date: dateHeureTexte_(r[c.DATE - 1]),
    personne: propre_(r[c.PERSONNE - 1]),
    grade: propre_(r[c.GRADE - 1]),
    type: propre_(r[c.TYPE - 1]),
    choix: choixHistoriqueGestionClient_(
      r[c.TYPE - 1],
      r[c.CHOIX - 1]
    ),
    raison: propre_(r[c.RAISON - 1]),
    auteur: propre_(r[c.AUTEUR - 1])
  })).filter(log => log.personne && log.type);
}

function choixHistoriqueGestionClient_(type, choix) {
  const typeNormalise = normaliser_(type);
  const valeur = propre_(choix);
  const valeurDatesFrancaises = valeur.replace(
    /\b(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2})?)?\b/g,
    '$3/$2/$1'
  );
  if (typeNormalise === 'MEDAILLE') {
    return libelleMedailleParDefaut_(valeurDatesFrancaises);
  }
  if (
    (typeNormalise === 'BLACKLIST' || /^BL(?:\s|\-|$)/.test(typeNormalise)) &&
    valeurDatesFrancaises &&
    !normaliser_(valeurDatesFrancaises).includes('BLACKLIST')
  ) {
    return 'Blacklist — ' + valeurDatesFrancaises
      .replace(/^BL(?:\s|\-|$)*/i, '')
      .trim();
  }
  return valeurDatesFrancaises;
}

function ajouterLogGestion_(log) {
  const c = HISTORIQUE_GESTION_PERSONNEL;
  const feuille = feuilleHistoriqueGestionPersonnel_();
  const ligne = prochaineLigne_(feuille, c.START);
  const largeur = c.AUTEUR - c.DATE + 1;
  assurerDimensionsFeuille_(feuille, ligne, c.AUTEUR);
  const plage = feuille.getRange(ligne, c.DATE, 1, largeur);
  const type = typeJournalFeuille_(log.type);
  try {
    // Les anciennes lignes vides peuvent conserver des validations prévues
    // pour d’autres formulaires. Les valeurs sont déjà validées par le serveur.
    plage.clearDataValidations();
    plage.setValues([[
      dateOuNull_(log.date) || new Date(),
      log.personne,
      log.grade,
      type,
      log.choix,
      log.raison,
      log.auteur
    ]]);
    return {
      feuille: feuille,
      ligne: ligne,
      colonne: c.DATE,
      largeur: largeur
    };
  } catch (erreur) {
    plage.clearContent();
    throw erreur;
  }
}

function feuilleHistoriqueGestionPersonnel_() {
  const c = HISTORIQUE_GESTION_PERSONNEL;
  let classeur;
  try {
    classeur = SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
  } catch (erreur) {
    throw new Error(
      'Le classeur mémoire GDA est inaccessible pour l’historique du personnel.'
    );
  }

  const nom = CONFIG.STOCKAGE.HISTORIQUE_GESTION_PERSONNEL_SHEET;
  let feuille = classeur.getSheetByName(nom);
  const nouvelleFeuille = !feuille;
  if (!feuille) feuille = classeur.insertSheet(nom);

  assurerDimensionsFeuille_(feuille, c.START, c.AUTEUR);
  const entetes = [[
    'Date', 'Personne', 'Grade', 'Type', 'Choix', 'Raison', 'Rempli par'
  ]];
  if (
    propre_(feuille.getRange(1, c.DATE).getValue()) !== 'Date' ||
    propre_(feuille.getRange(1, c.AUTEUR).getValue()) !== 'Rempli par'
  ) {
    const plageEntetes = feuille.getRange(1, c.DATE, 1, c.AUTEUR);
    plageEntetes.clearDataValidations();
    plageEntetes.setValues(entetes);
    plageEntetes.setFontWeight('bold');
    feuille.setFrozenRows(1);
  }

  if (nouvelleFeuille) {
    migrerAncienHistoriqueGestionPersonnelEnSilence_(feuille);
  }
  return feuille;
}

function migrerAncienHistoriqueGestionPersonnelEnSilence_(destination) {
  try {
    const sourceConfig = CONFIG.LOGS;
    const source = feuille_(sourceConfig.SHEET);
    const derniere = source.getLastRow();
    if (derniere < sourceConfig.START) return;

    const largeur = sourceConfig.AUTEUR - sourceConfig.DATE + 1;
    const anciennesLignes = source
      .getRange(
        sourceConfig.START,
        sourceConfig.DATE,
        derniere - sourceConfig.START + 1,
        largeur
      )
      .getValues()
      .filter(function (ligne) {
        return propre_(ligne[sourceConfig.PERSONNE - sourceConfig.DATE]) &&
          propre_(ligne[sourceConfig.TYPE - sourceConfig.DATE]);
      });

    if (!anciennesLignes.length) return;
    assurerDimensionsFeuille_(
      destination,
      HISTORIQUE_GESTION_PERSONNEL.START + anciennesLignes.length - 1,
      HISTORIQUE_GESTION_PERSONNEL.AUTEUR
    );
    destination
      .getRange(
        HISTORIQUE_GESTION_PERSONNEL.START,
        HISTORIQUE_GESTION_PERSONNEL.DATE,
        anciennesLignes.length,
        HISTORIQUE_GESTION_PERSONNEL.AUTEUR
      )
      .setValues(anciennesLignes);
  } catch (erreur) {
    console.warn(
      'Ancien historique de gestion non migré : ' +
      (erreur && erreur.message ? erreur.message : erreur)
    );
  }
}

function appliquerNouveauGrade_(membre, grade) {
  ecrireGradeCellule_(
    membre.feuille.getRange(membre.ligne, CONFIG.EFFECTIF.GRADE),
    grade
  );
  membre.feuille
    .getRange(membre.ligne, CONFIG.EFFECTIF.PROMO_RETRO)
    .setValue(new Date())
    .setNumberFormat('dd/MM/yyyy');
}

function ecrireGradeCellule_(cellule, gradeDemande) {
  const grade = validerGradeGestion_(gradeDemande);
  const validation = SpreadsheetApp
    .newDataValidation()
    .requireValueInList(REFERENTIEL_GESTION.grades.slice(), true)
    .setAllowInvalid(false)
    .build();
  cellule.setDataValidation(validation);
  cellule.setValue(grade);
}

function enregistrerDepartDepuisGestion_(membre, raison, auteur, dateDepart, dateRetour, typeSortie) {
  const c = CONFIG.DEPARTS;
  const feuille = feuille_(c.SHEET);
  const debut = dateOuNull_(dateDepart) || debutJour_(new Date());
  const fin = dateOuNull_(dateRetour) || ajouterDuree_(debut, '1 semaine');
  const type = typeDepart_(typeSortie || 'Départ');
  const largeur = c.MEDAILLES - c.MATRICULE + 1;
  assurerDimensionsFeuille_(
    feuille,
    Math.max(feuille.getLastRow(), c.START),
    c.MEDAILLES
  );
  const ligneExistante = trouverDepartGestionExistantRecent_(
    feuille,
    membre.matricule,
    raison,
    auteur,
    debut,
    type
  );
  if (ligneExistante) {
    feuille.getRange(ligneExistante, c.DATE_DEBUT).setValue(debut);
    feuille.getRange(ligneExistante, c.DATE_FIN).setValue(fin);
    appliquerFormuleStatutDepart_(feuille, ligneExistante);
    return {
      feuille: feuille,
      ligne: ligneExistante,
      colonne: c.MATRICULE,
      largeur: largeur,
      annulable: false
    };
  }
  const ligne = prochaineLigne_(feuille, c.START);
  assurerDimensionsFeuille_(feuille, ligne, c.MEDAILLES);
  const plage = feuille.getRange(ligne, c.MATRICULE, 1, largeur);
  try {
    plage.clearDataValidations();
    plage.setValues([[
      membre.matricule,
      exigerGradeEffectifPublicPourMembre_(membre, 'le dossier de départ'),
      type,
      membre.steamId,
      membre.discordId,
      debut,
      fin,
      raison,
      '',
      auteur,
      membre.medaille
    ]]);
    appliquerFormuleStatutDepart_(feuille, ligne);
    return {
      feuille: feuille,
      ligne: ligne,
      colonne: c.MATRICULE,
      largeur: largeur,
      annulable: true
    };
  } catch (erreur) {
    plage.clearContent();
    throw erreur;
  }
}

function trouverDepartGestionExistantRecent_(feuille, matricule, raison, auteur, date, typeSortie) {
  const c = CONFIG.DEPARTS;
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return 0;
  const valeurs = feuille.getRange(
    c.START,
    c.MATRICULE,
    derniere - c.START + 1,
    c.AUTEUR - c.MATRICULE + 1
  ).getValues();
  const jour = debutJour_(date).getTime();
  for (let index = valeurs.length - 1; index >= 0; index--) {
    const ligne = valeurs[index];
    const dateDepart = dateOuNull_(ligne[c.DATE_DEBUT - c.MATRICULE]);
    if (
      normaliser_(ligne[0]) === normaliser_(matricule) &&
      typeDepartOuVide_(ligne[c.TYPE - c.MATRICULE]) === typeSortie &&
      dateDepart && debutJour_(dateDepart).getTime() === jour &&
      normaliser_(ligne[c.RAISON - c.MATRICULE]) === normaliser_(raison) &&
      normaliser_(ligne[c.AUTEUR - c.MATRICULE]) === normaliser_(auteur)
    ) {
      return c.START + index;
    }
  }
  return 0;
}

function retirerMembreEffectif_(membre) {
  const c = CONFIG.EFFECTIF;
  const colonneDebut = 2;
  const largeur = c.MEDAILLE - colonneDebut + 1;
  assurerDimensionsFeuille_(membre.feuille, membre.ligne, c.MEDAILLE);
  const plage = membre.feuille.getRange(
    membre.ligne,
    colonneDebut,
    1,
    largeur
  );
  const sauvegarde = {
    feuille: membre.feuille,
    ligne: membre.ligne,
    colonne: colonneDebut,
    largeur: largeur,
    valeurs: plage.getValues(),
    formules: plage.getFormulas(),
    validations: plage.getDataValidations()
  };
  plage.clearContent();
  return sauvegarde;
}

function finaliserRetraitMembreEffectifEnSilence_(sauvegarde) {
  if (!sauvegarde) return;
  try {
    const feuille = sauvegarde.feuille;
    const ligne = sauvegarde.ligne;
    const valeurs = feuille.getRange(ligne, 2, 1, CONFIG.EFFECTIF.MEDAILLE - 1)
      .getDisplayValues()[0];
    if (valeurs.every(function (valeur) { return propre_(valeur) === ''; })) {
      feuille.deleteRow(ligne);
    }
    mettreAJourCompteursEffectif_(feuille);
  } catch (erreur) {
    console.error(
      'Nettoyage de la ligne retirée impossible : ' +
      (erreur && erreur.message ? erreur.message : erreur)
    );
  }
}

function restaurerMembreEffectifEnSilence_(sauvegarde) {
  if (!sauvegarde) return;
  try {
    const plage = sauvegarde.feuille.getRange(
      sauvegarde.ligne,
      sauvegarde.colonne,
      1,
      sauvegarde.largeur
    );
    plage.clearDataValidations();
    plage.setValues(sauvegarde.valeurs);
    (sauvegarde.formules[0] || []).forEach(function (formule, index) {
      if (formule) plage.getCell(1, index + 1).setFormula(formule);
    });
    plage.setDataValidations(sauvegarde.validations);
  } catch (erreur) {
    console.error(
      'Restauration effectif impossible : ' +
      (erreur && erreur.message ? erreur.message : erreur)
    );
  }
}

function annulerEcritureGestionEnSilence_(ecriture) {
  if (!ecriture || ecriture.annulable === false) return;
  try {
    ecriture.feuille.getRange(
      ecriture.ligne,
      ecriture.colonne,
      1,
      ecriture.largeur
    ).clearContent();
  } catch (erreur) {
    console.error(
      'Annulation d’écriture impossible : ' +
      (erreur && erreur.message ? erreur.message : erreur)
    );
  }
}

function enregistrerBlacklistDepuisGestion_(membre, sanction, raison, auteur, horodatage) {
  const c = CONFIG.DEPARTS;
  const feuille = feuille_(c.SHEET);
  const ligne = prochaineLigne_(feuille, c.START);
  const debut = dateOuNull_(horodatage) || new Date();
  const fin = calculerFinBlacklistGestion_(debut, sanction);
  const largeur = c.MEDAILLES - c.MATRICULE + 1;
  assurerDimensionsFeuille_(feuille, ligne, c.MEDAILLES);
  const plage = feuille.getRange(ligne, c.MATRICULE, 1, largeur);
  try {
    plage.clearDataValidations();
    plage.setValues([[
      membre.matricule,
      exigerGradeEffectifPublicPourMembre_(membre, 'le dossier de blacklist'),
      normaliser_(sanction) === 'PERMANENT' ? 'BL PERM' : 'BL ' + sanction,
      membre.steamId,
      membre.discordId,
      debut,
      fin,
      raison,
      '',
      auteur,
      membre.medaille
    ]]);
    appliquerFormuleStatutDepart_(feuille, ligne);
    return { feuille: feuille, ligne: ligne, colonne: c.MATRICULE, largeur: largeur, annulable: true };
  } catch (erreur) {
    plage.clearContent();
    throw erreur;
  }
}

function calculerFinBlacklistGestion_(debut, sanction) {
  const texte = normaliser_(sanction);
  if (texte.includes('PERM')) return 'Permanent';

  const correspondance = texte.match(/(\d+)/);
  const nombre = correspondance ? Number(correspondance[1]) : 0;
  if (!nombre) throw new Error('Durée de blacklist invalide.');

  const fin = new Date(debut.getTime());
  if (texte.includes('SEMAINE')) {
    fin.setDate(fin.getDate() + nombre * 7);
    return fin;
  }
  if (texte.includes('MOIS')) {
    fin.setMonth(fin.getMonth() + nombre);
    return fin;
  }
  throw new Error('Durée de blacklist invalide.');
}

function typeGestion_(valeur) {
  const n = normaliser_(valeur);
  if (n === 'PROMO' || n === 'PROMOTION') return 'Promotion';
  if (n === 'RETROGRADATION' || n === 'RETRO') return 'Rétrogradation';
  if (n === 'SANCTION') return 'Sanction';
  if (n === 'DEPART') return 'Départ';
  if (n === 'LICENCIEMENT') return 'Licenciement';
  if (n === 'BLACKLIST' || /^BL(?:\s|\-|$)/.test(n)) return 'Blacklist';
  if (n === 'MEDAILLE') return 'Médaille';
  if (n === 'SPECIALISATION') return 'Spécialisation';
  throw new Error('Type de gestion invalide.');
}

function typeJournalFeuille_(valeur) {
  const n = normaliser_(valeur);
  if (n === 'PROMO' || n === 'PROMOTION') return 'PROMO';
  if (n === 'RETRO' || n === 'RETROGRADATION') return 'RETRO';
  if (n === 'SANCTION') return 'SANCTION';
  if (n === 'DEPART') return 'Départ';
  if (n === 'LICENCIEMENT') return 'Licenciement';
  if (n === 'BLACKLIST' || /^BL(?:\s|\-|$)/.test(n)) return 'Blacklist';
  if (n === 'MEDAILLE') return 'Médaille';
  if (n === 'SPECIALISATION') return 'Spécialisation';
  if (n === 'RETOUR') return 'RETOUR';
  throw new Error('Type de journal invalide.');
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

function validerGradeGestion_(grade) {
  return validerValeurReferentiel_(
    grade,
    REFERENTIEL_GESTION.grades,
    'Grade invalide.'
  );
}

function validerMedailleGestion_(medaille) {
  const cle = cleMedaille_(medaille);
  const trouve = REFERENTIEL_GESTION.medailles.find(function (candidate) {
    return cleMedaille_(candidate) === cle;
  });
  if (!trouve) throw new Error('Médaille invalide.');
  return trouve;
}

function validerValeurReferentiel_(valeur, liste, erreur) {
  const cible = normaliser_(valeur);
  const trouve = liste.find(v => normaliser_(v) === cible);
  if (!trouve) throw new Error(erreur);
  return trouve;
}

function decouperValeurs_(valeur) {
  return propre_(valeur)
    .split(/[,;\n]+/)
    .map(propre_)
    .filter(Boolean);
}

function normaliserListeMedailles_(valeur) {
  return decouperValeurs_(valeur).map(libelleMedailleParDefaut_);
}

function fusionnerMedaillesEffectif_(referentiel, valeursBrutes) {
  const resultat = [];
  const cles = [];
  const toutes = referentiel.concat(
    valeursBrutes.reduce(function (accumulateur, valeur) {
      return accumulateur.concat(normaliserListeMedailles_(valeur));
    }, [])
  );
  toutes.forEach(function (valeur) {
    const propre = libelleMedailleParDefaut_(valeur);
    const cle = cleMedaille_(propre);
    if (propre && !cles.includes(cle)) {
      cles.push(cle);
      resultat.push(propre);
    }
  });
  return resultat;
}

function optionsValidationCellule_(cellule) {
  const regle = cellule.getDataValidation();
  if (!regle) return [];
  const criteres = regle.getCriteriaValues();
  const source = criteres && criteres[0];
  if (Array.isArray(source)) return source.map(propre_).filter(Boolean);
  if (source && typeof source.getDisplayValues === 'function') {
    return source.getDisplayValues().reduce(function (liste, ligne) {
      return liste.concat(ligne.map(propre_).filter(Boolean));
    }, []);
  }
  return [];
}

function libelleMedailleParDefaut_(medaille) {
  const libelles = {
    BRAVOURE: '🏅 | Croix de la Bravoure',
    MERITE: '🏅 | Médaille du Mérite',
    ACTIVITE: "🏅 | Médaille de l'Activité",
    ANCIENNETE: "🏅 | Médaille de l'Ancienneté",
    VETERAN: '🏅 | Médaille du Vétéran',
    DEFENSE: '🏅 | Médaille de la Défense',
    MEDECIN: '🏅 | Insigne Médecin',
    GSPR: '🏅 | Insigne GSPR',
    INSTRUCTEUR: '🏅 | Insigne Instructeur',
    'ANCIEN GERANT': '⚜️ | Ancien Gérant'
  };
  return libelles[cleMedaille_(medaille)] || propre_(medaille);
}

function ecrireMedaillesCellule_(cellule, valeursDemandees) {
  const options = optionsValidationCellule_(cellule);
  const finales = [];
  const cles = [];

  decouperValeurs_(valeursDemandees).forEach(function (medaille) {
    const cle = cleMedaille_(medaille);
    if (!cle || cles.includes(cle)) return;
    const option = options.find(function (candidate) {
      return cleMedaille_(candidate) === cle;
    });
    finales.push(option || libelleMedailleParDefaut_(medaille));
    cles.push(cle);
  });

  const valeurFinale = finales.join(', ');
  const regle = cellule.getDataValidation();
  try {
    cellule.setValue(valeurFinale);
    SpreadsheetApp.flush();
  } catch (erreurValidation) {
    // Les menus déroulants à choix multiples peuvent refuser une écriture
    // automatisée bien que chaque élément soit autorisé individuellement.
    cellule.clearDataValidations();
    cellule.setValue(valeurFinale);
    SpreadsheetApp.flush();
    if (regle) cellule.setDataValidation(regle);
  }
}

function validerSpecialisationsGestion_(valeur) {
  const texte = limiteOptionnelle_(valeur, 1500, 'La spécialisation');
  if (!texte) return '';
  const finales = [];
  decouperValeurs_(texte).forEach(function (specialisation) {
    const valide = validerValeurReferentiel_(
      specialisation,
      REFERENTIEL_GESTION.specialisations,
      'Spécialisation invalide.'
    );
    if (!finales.some(function (existante) {
      return normaliser_(existante) === normaliser_(valide);
    })) finales.push(valide);
  });
  const cleInstructeur = cleSpecialisationGestion_('Instructeur');
  const cleMedecin = cleSpecialisationGestion_('Médecin');
  const cleCombinaison = cleSpecialisationGestion_(
    'Instructeur et Médecin'
  );
  const aInstructeur = finales.some(function (specialisation) {
    return cleSpecialisationGestion_(specialisation) === cleInstructeur;
  });
  const aMedecin = finales.some(function (specialisation) {
    return cleSpecialisationGestion_(specialisation) === cleMedecin;
  });
  const aCombinaison = finales.some(function (specialisation) {
    return cleSpecialisationGestion_(specialisation) === cleCombinaison;
  });
  if (aCombinaison || (aInstructeur && aMedecin)) {
    const sansDoublons = finales.filter(function (specialisation) {
      const cle = cleSpecialisationGestion_(specialisation);
      return cle !== cleInstructeur &&
        cle !== cleMedecin &&
        cle !== cleCombinaison;
    });
    const combinaison = REFERENTIEL_GESTION.specialisations.find(
      function (specialisation) {
        return cleSpecialisationGestion_(specialisation) === cleCombinaison;
      }
    );
    if (combinaison) sansDoublons.push(combinaison);
    return sansDoublons.join(', ');
  }
  return finales.join(', ');
}

function cleSpecialisationGestion_(valeur) {
  return normaliser_(valeur)
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function specialisationsMembreGestion_(membre) {
  const finales = [];
  decouperValeurs_(membre && membre.specialisation).forEach(function (valeur) {
    const cle = cleSpecialisationGestion_(valeur);
    const option = REFERENTIEL_GESTION.specialisations.find(function (candidate) {
      return cleSpecialisationGestion_(candidate) === cle;
    });
    if (option && !finales.some(function (existante) {
      return cleSpecialisationGestion_(existante) === cle;
    })) {
      finales.push(option);
    }
  });
  return finales;
}

function membrePossedeSpecialisationGestion_(membre, specialisation) {
  const cible = cleSpecialisationGestion_(specialisation);
  return specialisationsMembreGestion_(membre).some(function (valeur) {
    return cleSpecialisationGestion_(valeur) === cible;
  });
}

function specialisationsModifiablesGestion_(auteur) {
  const autorisees = [];
  function ajouter(libelle) {
    const option = REFERENTIEL_GESTION.specialisations.find(function (candidate) {
      return cleSpecialisationGestion_(candidate) ===
        cleSpecialisationGestion_(libelle);
    });
    if (option && !autorisees.some(function (existante) {
      return cleSpecialisationGestion_(existante) ===
        cleSpecialisationGestion_(option);
    })) {
      autorisees.push(option);
    }
  }

  const privilegie =
    estProprietaireGDA_(auteur) ||
    estCoproprietaireGDA_(auteur) ||
    membrePossedeRoleStaffTotal_(auteur);

  // Tous les officiers peuvent gérer les spécialisations opérationnelles.
  ['Instructeur', 'Médecin', 'Instructeur et Médecin'].forEach(ajouter);

  const rangAuteur = rangGradeGestion_(auteur && auteur.grade);
  const rangCapitaine = rangGradeGestion_('Capitaine');
  if (privilegie ||
      (rangAuteur >= 0 && rangAuteur <= rangCapitaine)) {
    [
      'Responsable MDC',
      'CO-Responsable MDC',
      'Responsable INST',
      'CO-Responsable INST',
      'Instructeur en chef'
    ].forEach(ajouter);
  }

  if (membrePossedeSpecialisationGestion_(auteur, 'Responsable MDC')) {
    ajouter('CO-Responsable MDC');
  }
  if (membrePossedeSpecialisationGestion_(auteur, 'Responsable INST')) {
    ajouter('CO-Responsable INST');
    ajouter('Instructeur en chef');
  }
  if (membrePossedeSpecialisationGestion_(auteur, 'CO-Responsable INST')) {
    ajouter('Instructeur en chef');
  }
  if (membrePossedeSpecialisationGestion_(auteur, 'Gérant GDA')) {
    ajouter('CO-Gérant GDA');
  }

  // L'attribution de Gérant GDA est exclusivement administrative.
  if (privilegie) ajouter('Gérant GDA');

  return autorisees;
}

function appliquerSpecialisationsGestion_(auteur, membre, valeurDemandee) {
  const actuelles = specialisationsMembreGestion_(membre);
  const valeurValidee = validerSpecialisationsGestion_(valeurDemandee);
  const demandees = valeurValidee
    ? decouperValeurs_(valeurValidee)
    : [];
  const modifiables = specialisationsModifiablesGestion_(auteur);
  const clesModifiables = modifiables.map(cleSpecialisationGestion_);

  REFERENTIEL_GESTION.specialisations.forEach(function (option) {
    const cle = cleSpecialisationGestion_(option);
    const etaitCochee = actuelles.some(function (valeur) {
      return cleSpecialisationGestion_(valeur) === cle;
    });
    const seraCochee = demandees.some(function (valeur) {
      return cleSpecialisationGestion_(valeur) === cle;
    });
    if (etaitCochee !== seraCochee && !clesModifiables.includes(cle)) {
      throw new Error(
        'Vous n’êtes pas autorisé à modifier la spécialisation « ' +
        option +
        ' ».'
      );
    }
  });

  ecrireSpecialisationsCellule_(
    membre.feuille.getRange(
      membre.ligne,
      CONFIG.EFFECTIF.SPECIALISATION
    ),
    demandees.join(', ')
  );

  return demandees.length
    ? demandees.join(', ')
    : 'Aucune spécialisation';
}

function ecrireSpecialisationsCellule_(cellule, valeursDemandees) {
  const valeurFinale = validerSpecialisationsGestion_(valeursDemandees);
  const regle = cellule.getDataValidation();
  try {
    cellule.setValue(valeurFinale);
    SpreadsheetApp.flush();
  } catch (erreurValidation) {
    cellule.clearDataValidations();
    cellule.setValue(valeurFinale);
    SpreadsheetApp.flush();
    if (regle) cellule.setDataValidation(regle);
  }
}

function ajouterValeurListe_(valeurActuelle, nouvelleValeur) {
  const valeurs = decouperValeurs_(valeurActuelle);
  if (!valeurs.some(v => normaliser_(v) === normaliser_(nouvelleValeur))) {
    valeurs.push(nouvelleValeur);
  }
  return valeurs.join(', ');
}

function cleMedaille_(valeur) {
  const n = normaliser_(valeur);
  if (n.includes('ANCIEN') && n.includes('GERANT')) return 'ANCIEN GERANT';
  const categories = [
    'BRAVOURE', 'MERITE', 'ACTIVITE', 'ANCIENNETE', 'VETERAN', 'DEFENSE',
    'MEDECIN', 'GSPR', 'INSTRUCTEUR', 'HONNEUR'
  ];
  return categories.find(categorie => n.includes(categorie)) || n;
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

function membreClient_(m) {
  return {
    nom: m.matricule,
    grade: gradeEffectifPublicPourMembre_(m),
    gradeEffectifOfficier: m.grade,
    steamId: m.steamId,
    discordId: m.discordId,
    dateEntree: m.dateEntree,
    datePromotionRetro: m.datePromotionRetro,
    presence: m.presence,
    specialisation: m.specialisation,
    nombreRapports: m.nombreRapports,
    sanction: m.sanction,
    medaille: normaliserListeMedailles_(m.medaille)
      .join('; '),
    recommandation: m.recommandation,
    observation: m.observation,
    notes: m.notes
  };
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

function membreEstAbsentActuellement_(membre, absentsActuels) {
  if (!membre) return false;
  return normaliser_(membre.presence).includes('ABS') ||
    !!(absentsActuels && absentsActuels[normaliser_(membre.matricule)]);
}

function completerHorairesDepartsDepuisLogs_() {
  const cache = CacheService.getScriptCache();
  const cleCache = 'GDA_HORAIRES_DEPARTS_REPARES_V1';
  if (cache.get(cleCache)) return;

  const verrou = LockService.getScriptLock();
  if (!verrou.tryLock(2000)) return;
  try {
    const c = CONFIG.DEPARTS;
    const feuilleDeparts = feuille_(c.SHEET);
    const derniereDepart = feuilleDeparts.getLastRow();
    const h = HISTORIQUE_GESTION_PERSONNEL;
    const feuilleLogs = feuilleHistoriqueGestionPersonnel_();
    const derniereLog = feuilleLogs.getLastRow();
    if (derniereDepart < c.START || derniereLog < h.START) {
      cache.put(cleCache, '1', 21600);
      return;
    }

    const departs = feuilleDeparts
      .getRange(c.START, 1, derniereDepart - c.START + 1, c.AUTEUR)
      .getValues();
    const logs = feuilleLogs
      .getRange(h.START, 1, derniereLog - h.START + 1, h.AUTEUR)
      .getValues();

    for (let index = 0; index < departs.length; index++) {
      const ligne = departs[index];
      const debut = dateOuNull_(ligne[c.DATE_DEBUT - 1]);
      const type = typeDepartOuVide_(ligne[c.TYPE - 1]);
      if (!debut || !type || !dateSansHeure_(debut)) continue;

      const nom = normaliser_(ligne[c.MATRICULE - 1]);
      const raison = normaliser_(ligne[c.RAISON - 1]);
      const auteur = normaliser_(ligne[c.AUTEUR - 1]);
      let dateLog = null;

      for (let logIndex = logs.length - 1; logIndex >= 0; logIndex--) {
        const log = logs[logIndex];
        const horodatage = dateOuNull_(log[h.DATE - 1]);
        if (
          horodatage &&
          memeJour_(horodatage, debut) &&
          normaliser_(log[h.PERSONNE - 1]) === nom &&
          typeDepartOuVide_(log[h.TYPE - 1]) === type &&
          normaliser_(log[h.RAISON - 1]) === raison &&
          normaliser_(log[h.AUTEUR - 1]) === auteur
        ) {
          dateLog = horodatage;
          break;
        }
      }

      if (!dateLog) continue;
      const debutCorrige = appliquerHeureDate_(debut, dateLog);
      const valeurFin = ligne[c.DATE_FIN - 1];
      const fin = dateOuNull_(valeurFin);
      feuilleDeparts.getRange(c.START + index, c.DATE_DEBUT).setValue(debutCorrige);
      if (fin && dateSansHeure_(fin)) {
        feuilleDeparts
          .getRange(c.START + index, c.DATE_FIN)
          .setValue(appliquerHeureDate_(fin, dateLog));
      }
    }
    SpreadsheetApp.flush();
    cache.put(cleCache, '1', 21600);
  } finally {
    verrou.releaseLock();
  }
}

function lireDeparts_() {
  const c = CONFIG.DEPARTS;
  const feuille = feuille_(c.SHEET);
  const derniere = feuille.getLastRow();
  if (derniere < c.START) return [];
  assurerDimensionsFeuille_(feuille, derniere, c.MEDAILLES_RESTAUREES_LE);
  const valeurs = feuille
    .getRange(c.START, 1, derniere - c.START + 1, c.MEDAILLES_RESTAUREES_LE)
    .getValues();
  const aujourdHui = debutJour_(new Date());
  return valeurs.map((r, i) => {
    const typeBrut = propre_(r[c.TYPE - 1]);
    const type = typeDepartOuVide_(typeBrut);
    const debut = dateOuNull_(r[c.DATE_DEBUT - 1]);
    const valeurFin = r[c.DATE_FIN - 1];
    let fin = dateOuNull_(valeurFin);
    if (!fin && debut && (type === 'Départ' || type === 'Licenciement')) {
      fin = ajouterDuree_(debut, '1 semaine');
    }
    const statutFeuille = normaliser_(r[c.STATUT - 1]);
    const permanent =
      type === 'Blacklist' &&
      (
        normaliser_(typeBrut).includes('PERM') ||
        normaliser_(valeurFin) === 'PERMANENT'
      );
    const statut = permanent
      ? 'PERMANENT'
      : (
          statutFeuille === 'ACTIF' ||
          statutFeuille === 'INACTIF'
            ? statutFeuille
            : (
                fin && debutJour_(fin) >= aujourdHui
                  ? 'ACTIF'
                  : 'INACTIF'
              )
        );
    return {
      ligne: c.START + i,
      nom: propre_(r[c.MATRICULE - 1]),
      grade: propre_(r[c.GRADE - 1]),
      type: type,
      steamId: propre_(r[c.STEAM_ID - 1]),
      discordId: propre_(r[c.DISCORD_ID - 1]),
      dateDepart: dateHeureTexte_(debut),
      dateRetour: dateHeureTexte_(fin),
      raison: propre_(r[c.RAISON - 1]),
      peutRevenir:
        !permanent &&
        Boolean(fin) &&
        debutJour_(fin) < aujourdHui,
      decision: propre_(r[c.AUTEUR - 1]),
      statut: statut,
      permanent: permanent,
      medailles: normaliserListeMedailles_(r[c.MEDAILLES - 1]).join('; '),
      medaillesRestaureesLe: dateHeureTexte_(
        r[c.MEDAILLES_RESTAUREES_LE - 1]
      ),
      joursRestants: permanent || !fin ? 0 : Math.max(0, differenceJours_(aujourdHui, fin))
    };
  }).filter(e => e.nom && e.type);
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

function utilisateurPeutModifierEffectif_(membre) {
  return utilisateurAPermission_(
    membre,
    PERMISSIONS_GDA.EFFECTIF_MODIFIER
  );
}

function exigerPermissionModificationEffectif_(membre) {
  exigerPermissionGDA_(
    membre,
    PERMISSIONS_GDA.EFFECTIF_MODIFIER
  );
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
function restaurerMiloCommeProprietaire() {
  const milo = exigerMembreParMatricule_('Milo');
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const coproprietaires = obtenirCoproprietairesGDA_().filter(function (nom) {
      return normaliser_(nom) !== normaliser_(milo.matricule);
    });
    PropertiesService.getScriptProperties().setProperties({
      [CLE_PROPRIETAIRE_GDA]: milo.matricule,
      [CLE_COPROPRIETAIRES_GDA]: JSON.stringify(coproprietaires)
    }, false);
    sauvegarderParametresGDAEnSilence_();
    return {
      success: true,
      proprietaire: milo.matricule,
      message: milo.matricule + ' est de nouveau propriétaire principal.'
    };
  } finally {
    verrou.releaseLock();
  }
}

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

function enregistrerCoproprietairesGDA_(liste) {
  const uniques = [];
  (liste || []).forEach(function (nom) {
    const propre = propre_(nom);
    if (!propre || uniques.some(function (existant) {
      return normaliser_(existant) === normaliser_(propre);
    })) return;
    uniques.push(propre);
  });
  PropertiesService.getScriptProperties()
    .setProperty(CLE_COPROPRIETAIRES_GDA, JSON.stringify(uniques));
  sauvegarderParametresGDAEnSilence_();
}

function estCoproprietaireGDA_(membre) {
  if (membre && membre.externe === true) return false;
  const cible = normaliser_(membre && membre.matricule);
  return !!cible && obtenirCoproprietairesGDA_().some(function (nom) {
    return normaliser_(nom) === cible;
  });
}

function estProprietaireOuCoproprietaireGDA_(membre) {
  return estProprietaireGDA_(membre) ||
    estCoproprietaireGDA_(membre) ||
    membrePossedeRoleStaffTotal_(membre);
}

function exigerProprietaireOuCoproprietaireGDA_(membre) {
  if (!estProprietaireOuCoproprietaireGDA_(membre)) {
    throw new Error(
      'Accès refusé : cette action est réservée au propriétaire et aux co-propriétaires.'
    );
  }
}

function exigerProprietaireGDA_(membre) {
  if (!estProprietaireGDA_(membre)) {
    throw new Error('Accès refusé : seul le propriétaire actuel peut effectuer cette action.');
  }
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

function permissionsBrutesMembre_(membre) {
  const brut = PropertiesService.getScriptProperties()
    .getProperty(clePermissionsIdentite_(membre));
  let permissions = [];
  if (brut) {
    try {
      permissions = JSON.parse(brut);
    } catch (erreur) {
      permissions = [];
    }
  }
  if (Array.isArray(permissions) && permissions.includes('administration')) {
    permissions = permissions.concat([
      PERMISSIONS_GDA.ADMINISTRATION_STAFF,
      PERMISSIONS_GDA.ADMINISTRATION_PERMISSIONS,
      PERMISSIONS_GDA.ADMINISTRATION_LOGS
    ]);
  }
  const autorisees = toutesPermissionsGDA_();
  return Array.isArray(permissions)
    ? permissions.filter(function (permission, index) {
        return autorisees.includes(permission) && permissions.indexOf(permission) === index;
      })
    : [];
}

function membrePossedeRoleStaffTotal_(membre) {
  return permissionsBrutesMembre_(membre)
    .includes(PERMISSIONS_GDA.ROLE_STAFF_TOTAL);
}

function membrePossedeRoleVisiteur_(membre) {
  return permissionsBrutesMembre_(membre)
    .includes(PERMISSIONS_GDA.ROLE_VISITEUR);
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

function enregistrerPermissionsMembre_(membre, permissions) {
  if (estProprietaireGDA_(membre) || estCoproprietaireGDA_(membre)) {
    throw new Error('Les permissions d’un propriétaire ou co-propriétaire sont permanentes.');
  }

  PropertiesService
    .getScriptProperties()
    .setProperty(
      clePermissionsIdentite_(membre),
      JSON.stringify(permissions)
    );
  sauvegarderParametresGDAEnSilence_();
}

function migrerPermissionsMembre_(ancienNom, nouveauNom) {
  if (normaliser_(ancienNom) === normaliser_(nouveauNom)) return;
  const stockage = PropertiesService.getScriptProperties();
  const ancienneCle = clePermissionsMembre_(ancienNom);
  const valeur = stockage.getProperty(ancienneCle);
  if (valeur) {
    stockage.setProperty(clePermissionsMembre_(nouveauNom), valeur);
    stockage.deleteProperty(ancienneCle);
  }

  if (normaliser_(obtenirNomProprietaireGDA_()) === normaliser_(ancienNom)) {
    stockage.setProperty(CLE_PROPRIETAIRE_GDA, nouveauNom);
  }
  const coproprietaires = obtenirCoproprietairesGDA_().map(function (nom) {
    return normaliser_(nom) === normaliser_(ancienNom) ? nouveauNom : nom;
  });
  enregistrerCoproprietairesGDA_(coproprietaires);
}

function exigerMembreParMatricule_(matricule) {
  const membre = trouverMembre_(requis_(matricule, 'Le matricule de la personne'));
  if (!membre) throw new Error('Personne introuvable dans lâ€™effectif ou la liste blanche.');
  return membre;
}

function classeurDonneesGDA_() {
  return SpreadsheetApp.openById(CONFIG.STOCKAGE.SPREADSHEET_ID);
}

function feuille_(nom) {
  const feuille = classeurDonneesGDA_().getSheetByName(nom);
  if (!feuille) throw new Error('Feuille introuvable : ' + nom);
  return feuille;
}

function prochaineLigne_(feuille, minimum) {
  const ligne = Math.max(feuille.getLastRow() + 1, minimum);
  assurerDimensionsFeuille_(feuille, ligne, 1);
  return ligne;
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

function typeDepart_(valeur) {
  const type = typeDepartOuVide_(valeur);
  if (!type) throw new Error('Type de depart invalide.');
  return type;
}

/**
 * Place en colonne J la formule de statut adaptee au numero de ligne.
 * setFormula utilise les noms anglais ; Sheets les affiche ensuite dans
 * la langue configuree pour le classeur.
 */
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

function typeDepartOuVide_(valeur) {
  const n = normaliser_(valeur);
  if (n === 'DEPART') return 'Départ';
  if (n === 'LICENCIEMENT') return 'Licenciement';
  if (
    n === 'BLACKLIST' ||
    n.includes('BLACKLIST') ||
    /^BL(?:\s|\-|$)/.test(n)
  ) return 'Blacklist';
  return '';
}

function statutDepart_(valeur) {
  const n = normaliser_(valeur);
  if (['ACTIF', 'INACTIF', 'PERMANENT', 'RETOUR-AUTORISE'].includes(n)) return n;
  throw new Error('Statut de depart invalide.');
}

function ajouterDuree_(date, duree) {
  const resultat = new Date(date.getTime());
  const nombre = parseInt(duree, 10);
  const texte = normaliser_(duree);
  if (!nombre || (!texte.includes('SEMAINE') && !texte.includes('MOIS'))) throw new Error('Duree de blacklist invalide.');
  if (texte.includes('SEMAINE')) resultat.setDate(resultat.getDate() + nombre * 7);
  else resultat.setMonth(resultat.getMonth() + nombre);
  return resultat;
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

function limite_(valeur, maximum, libelle) {
  const texte = requis_(valeur, libelle);
  if (texte.length > maximum) throw new Error(libelle + ' depasse ' + maximum + ' caracteres.');
  return texte;
}

function limiteOptionnelle_(valeur, maximum, libelle) {
  const texte = propre_(valeur);
  if (texte.length > maximum) throw new Error(libelle + ' depasse ' + maximum + ' caracteres.');
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

function booleenOui_(valeur) {
  return ['OUI', 'TRUE', 'VRAI', '1', 'AUTORISE'].includes(normaliser_(valeur));
}

function dateISORequise_(valeur, libelle) {
  const texte = requis_(valeur, libelle);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texte)) throw new Error(libelle + ' est invalide.');
  const p = texte.split('-').map(Number);
  const date = new Date(p[0], p[1] - 1, p[2]);
  if (date.getFullYear() !== p[0] || date.getMonth() !== p[1] - 1 || date.getDate() !== p[2]) throw new Error(libelle + ' est invalide.');
  return date;
}

function dateISOOptionnelle_(valeur) {
  const texte = propre_(valeur);
  return texte ? dateISORequise_(texte, 'La date') : '';
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

function appliquerHeureDate_(date, sourceHeure) {
  const resultat = new Date(date.getTime());
  const source = dateOuNull_(sourceHeure) || new Date();
  resultat.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds()
  );
  return resultat;
}

function dateSansHeure_(date) {
  return date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0 &&
    date.getMilliseconds() === 0;
}

function memeJour_(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function debutJour_(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function differenceJours_(debut, fin) {
  return Math.ceil((debutJour_(fin) - debutJour_(debut)) / 86400000);
}
