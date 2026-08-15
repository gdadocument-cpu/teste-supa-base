(function () {
  "use strict";

  const groupes = [
    ["Statut", [
      ["personnel", "Personnel", "♙", "rouge"], ["shield", "Disponibilités", "♢", "bleu"],
      ["report", "Rapports", "▤", "vert"], ["calendar", "Calendrier / Mission", "▦", "orange"],
      ["performance", "Performance", "↗", "cyan"], ["objective", "Objectif", "☆", "jaune"],
      ["operations", "Opérations", "⌾", "rose"], ["clock", "Temps / Délai", "◷", "cyan"]
    ]],
    ["Annonces", [
      ["alert", "Urgent / Alerte", "△", "rouge"], ["info", "Information", "i", "bleu"],
      ["success", "Succès", "✓", "vert"], ["waiting", "En attente", "◷", "orange"],
      ["maintenance", "Maintenance", "⌕", "violet"], ["security", "Sécurité", "!", "jaune"],
      ["update", "Mise à jour", "▤", "rose"], ["announcement", "Annonce", "◁", "cyan"],
      ["reminder", "Rappel", "♢", "vert"], ["follow-up", "À suivre", "⚑", "bleu"],
      ["surveillance", "Surveillance", "◉", "violet"], ["new", "Nouveau", "⇩", "jaune"]
    ]],
    ["Système et données", [
      ["danger", "Danger", "△", "rouge"], ["lock", "Verrouillage", "▣", "bleu"],
      ["protection", "Protection", "◉", "vert"], ["system", "Système", "⚙", "orange"],
      ["database", "Données", "▱", "violet"], ["server", "Serveurs", "▥", "cyan"],
      ["folder", "Dossiers", "□", "jaune"], ["file", "Fichier", "▤", "rose"],
      ["documents", "Documents", "▧", "cyan"], ["backup", "Sauvegarde", "☁", "jaune"],
      ["upload", "Téléversement", "↥", "bleu"], ["download", "Téléchargement", "↧", "vert"],
      ["sync", "Synchronisation", "↻", "bleu"], ["history", "Historique", "↶", "violet"]
    ]],
    ["Communication", [
      ["message", "Messages", "✉", "rose"], ["location", "Localisation", "⌖", "cyan"],
      ["search", "Recherche", "⌕", "vert"], ["filters", "Filtres", "☷", "bleu"],
      ["statistics", "Statistiques", "◔", "violet"], ["analysis", "Analyses", "▥", "orange"],
      ["global", "Global", "◎", "orange"], ["link", "Lien", "⌁", "violet"],
      ["communication", "Communication", "☵", "cyan"], ["connection", "Connexion", "⌁", "vert"],
      ["signal", "Signal", "⌁", "rouge"], ["confidential", "Confidentiel", "⊘", "jaune"]
    ]],
    ["Personnel et activité", [
      ["identity", "Identification", "◉", "rouge"], ["access", "Accès", "⚿", "bleu"],
      ["verified", "Vérifié", "✓", "vert"], ["error", "Erreur", "×", "rose"],
      ["help", "Aide", "?", "jaune"], ["training", "Formation", "◇", "cyan"],
      ["rewards", "Récompenses", "♙", "violet"], ["energy", "Énergie", "ϟ", "vert"],
      ["resources", "Ressources", "⬡", "orange"], ["health", "Santé", "⌁", "vert"],
      ["incident", "Incident", "△", "rose"], ["climate", "Climatisation", "✳", "bleu"],
      ["deployment", "Déploiement", "✈", "violet"], ["transport", "Transport", "▰", "orange"],
      ["equipment", "Équipement", "⚒", "rose"], ["grade", "Grade", "✪", "bleu"],
      ["distinction", "Distinctions", "♜", "jaune"], ["planning", "Planning", "▦", "vert"],
      ["control", "Contrôle", "✋", "bleu"], ["ethics", "Éthique", "⚖", "orange"],
      ["environment", "Environnement", "♧", "vert"], ["partners", "Partenaires", "♧", "rose"],
      ["wellbeing", "Bien-être", "♡", "cyan"]
    ]]
  ];

  const parCode = {};
  groupes.forEach(function (groupe) {
    groupe[1].forEach(function (icone) {
      parCode[icone[0]] = { code: icone[0], libelle: icone[1], symbole: icone[2], couleur: icone[3], groupe: groupe[0] };
    });
  });

  function echapper(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  window.GDA_ICONES = { groupes: groupes, parCode: parCode };
  window.iconeGDA = function (code, classe) {
    const icone = parCode[code] || parCode.info;
    return `<span class="gda-icone gda-icone-${echapper(icone.couleur)} ${echapper(classe || "")}" data-icone="${echapper(icone.code)}" title="${echapper(icone.libelle)}" aria-hidden="true"><span>${echapper(icone.symbole)}</span></span>`;
  };
})();
