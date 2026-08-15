(function initialiserGestionnaireThemesGDA() {
  "use strict";

  const THEME_PAR_DEFAUT = "gda-classique";
  const CLE_THEME_CACHE = "gdaThemeGlobalActif";
  let themesDisponibles = [
    {
      id: THEME_PAR_DEFAUT,
      nom: "GDA Classique",
      description: "Interface officielle actuelle de l’intranet GDA."
    },
    {
      id: "theme-test",
      nom: "Thème Test",
      description: "Interface PC moderne, aérée et organisée en cartes."
    }
  ];

  function identifiantThemeValide(valeur) {
    return /^[a-z0-9][a-z0-9-]{0,63}$/.test(String(valeur || ""));
  }

  function appliquerThemeGDA(theme) {
    const demande = identifiantThemeValide(theme) ? String(theme) : THEME_PAR_DEFAUT;
    const actif = themesDisponibles.some(function(item) { return item.id === demande; })
      ? demande
      : THEME_PAR_DEFAUT;
    const precedent = document.documentElement.dataset.gdaTheme || "";
    document.documentElement.dataset.gdaTheme = actif;
    try { localStorage.setItem(CLE_THEME_CACHE, actif); } catch (erreur) { /* Cache facultatif. */ }
    if (precedent !== actif) {
      window.dispatchEvent(new CustomEvent("gda-theme-modifie", { detail: { theme: actif } }));
    }
    return actif;
  }

  window.enregistrerThemesDisponiblesGDA = function(themes) {
    if (Array.isArray(themes) && themes.length) {
      const valides = themes.filter(function(theme) {
        return theme && identifiantThemeValide(theme.id) && String(theme.nom || "").trim();
      });
      if (valides.length) themesDisponibles = valides;
    }
    return themesDisponibles.slice();
  };
  window.obtenirThemesDisponiblesGDA = function() { return themesDisponibles.slice(); };
  window.appliquerThemeGDA = appliquerThemeGDA;

  let themeMemorise = THEME_PAR_DEFAUT;
  try { themeMemorise = localStorage.getItem(CLE_THEME_CACHE) || THEME_PAR_DEFAUT; } catch (erreur) { /* Cache facultatif. */ }
  appliquerThemeGDA(themeMemorise);
})();
