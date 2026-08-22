(function () {
  "use strict";

  const groupes = [
    ["Statut", [
      ["personnel", "Personnel", "♙", "rouge"], ["shield", "Disponibilités", "♢", "bleu"],
      ["report", "Rapports", "▤", "vert"], ["calendar", "Calendrier / Mission", "▦", "orange"],
      ["performance", "Performance", "↗", "cyan"], ["objective", "Objectif", "☆", "jaune"],
      ["active-personnel", "Personnel actif", "♟", "violet"],
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
      ["edit", "Édition", "✎", "violet"], ["network", "Réseau", "⌘", "vert"],
      ["scan", "Scan", "⌗", "orange"], ["laboratory", "Laboratoire", "♜", "bleu"],
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
      ["field-operations", "Opérations terrain", "▱", "vert"], ["fuel", "Carburant", "▥", "cyan"],
      ["equipment", "Équipement", "⚒", "rose"], ["grade", "Grade", "✪", "bleu"],
      ["distinction", "Distinctions", "♜", "jaune"], ["planning", "Planning", "▦", "vert"],
      ["delay", "Délai", "⌛", "violet"],
      ["control", "Contrôle", "✋", "bleu"], ["ethics", "Éthique", "⚖", "orange"],
      ["environment", "Environnement", "♧", "vert"], ["partners", "Partenaires", "♧", "rose"],
      ["wellbeing", "Bien-être", "♡", "cyan"]
    ]]
  ];

  const parCode = {};
  const atlas = {
    personnel:[101,112], shield:[272,112], report:[445,112], calendar:[613,112],
    "active-personnel":[788,112], performance:[947,112], objective:[1094,112], operations:[1259,112], clock:[1425,112],
    alert:[89,355], info:[226,355], success:[356,355], waiting:[480,355], maintenance:[608,355], security:[730,355], update:[852,355],
    announcement:[1003,355], reminder:[1113,355], "follow-up":[1228,355], surveillance:[1340,355], new:[1452,355],
    danger:[80,566], lock:[183,566], protection:[290,566], system:[397,566], database:[500,566], server:[601,566], folder:[706,566],
    message:[808,566], location:[912,566], search:[1015,566], filters:[1124,566], statistics:[1228,566], analysis:[1338,566], backup:[1446,566],
    upload:[80,670], download:[183,670], file:[289,670], documents:[397,670], edit:[500,670], confidential:[601,670], identity:[705,670],
    access:[807,670], network:[912,670], global:[1017,670], link:[1124,670], communication:[1227,670], connection:[1338,670], signal:[1447,670],
    scan:[80,770], history:[183,770], sync:[290,770], verified:[398,770], error:[500,770], help:[602,770], training:[706,770],
    rewards:[807,770], energy:[912,770], resources:[1017,770], laboratory:[1124,770], health:[1228,770], incident:[1338,770], climate:[1447,770],
    deployment:[80,866], "field-operations":[183,866], transport:[290,866], fuel:[397,866], equipment:[500,866], grade:[602,866],
    distinction:[705,866], planning:[807,866], delay:[912,866], control:[1016,866], ethics:[1123,866], environment:[1228,866], partners:[1338,866], wellbeing:[1447,866]
  };
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
    const position = atlas[icone.code] || atlas.info;
    const fondX = ((position[0] - 40) / (1536 - 80) * 100).toFixed(4);
    const fondY = ((position[1] - 40) / (1024 - 80) * 100).toFixed(4);
    return `<span class="gda-icone gda-icone-image ${echapper(classe || "")}" data-icone="${echapper(icone.code)}" title="${echapper(icone.libelle)}" aria-hidden="true" style="background-position:${fondX}% ${fondY}%"></span>`;
  };
})();
