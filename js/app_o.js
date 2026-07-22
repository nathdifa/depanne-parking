var map;
var groupePoints;
var groupePolygones;
var parkings = [];
var filtreActuel = "tous";
var texteRecherche = "";

window.onload = function () {
  demarrer();
};

function demarrer() {
  document.getElementById("titre").innerText = CONFIG.nomDuSite;

  map = L.map("carte").setView(CONFIG.centreCarte, CONFIG.zoomDepart);
  map.setMinZoom(CONFIG.zoomMin);
  map.setMaxZoom(CONFIG.zoomMax);

  const osm = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 20,
      maxNativeZoom: 20
  }).addTo(map);

  const sat = L.tileLayer('https://geo.api.vlaanderen.be/OMWRGBMRVL/wmts?layer=omwrgbmrvl&style=&tilematrixset=GoogleMapsVL&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}', {
      attribution: '© Digitaal Vlaanderen',
      maxZoom: 20,
  });

  const GRB = L.tileLayer('https://geo.api.vlaanderen.be/GRB/wmts?layer=grb_sel&style=&tilematrixset=GoogleMapsVL&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}', {
      attribution: '© Digitaal Vlaanderen',
      maxZoom: 20,
      opacity: 0.75
  });

  const baseLayers = {
      "Carte": osm,
      "Satellite": sat
  };

  const optLayers = {
      "Tracés": GRB
  };


  const layerControl = L.control.layers(baseLayers).addTo(map);

  map.on('baselayerchange', function(event) {
      if (event.name === "Satellite") {
          layerControl.addOverlay(GRB, "Tracés");
      } else {
          // Si on repasse sur le premier calque, on retire l'overlay de la carte ET du menu
          if (map.hasLayer(GRB)) {
              map.removeLayer(GRB);
          }
          layerControl.removeLayer(GRB);
      }
  });

  if (CONFIG.clusterActif) {
    groupePoints = L.markerClusterGroup();
  } else {
    groupePoints = L.layerGroup();
  }
  groupePolygones = L.layerGroup();

  map.addLayer(groupePoints);
  map.addLayer(groupePolygones);

  chargerLesDonnees();
}

function chargerLesDonnees() {
  fetch(CONFIG.fichierDeDonnees)
    .then(function (reponse) {
      return reponse.json();
    })
    .then(function (donnees) {
      parkings = donnees.parkings;
      afficherLesParkings();
    })
}

function estAccesInterdit(tags) {
  var acces = tags.access;
  if (!acces) return false;
  return CONFIG.accesInterdits.indexOf(acces.toLowerCase()) !== -1;
}

function estPayant(tags) {
  if (!tags.fee) return null;
  var val = tags.fee.toLowerCase();
  if (val === "yes") return true;
  if (val === "no") return false;
  return null;
}

function couleurDuParking(tags) {
  var payant = estPayant(tags);
  if (payant === true) return CONFIG.couleurPayant;
  if (payant === false) return CONFIG.couleurGratuit;
  return CONFIG.couleurInconnu;
}

function contenuPopup(tags) {
  var html = "<div class='popup-parking'>";
  html += "<h3>" + (tags.name || "Parking") + "</h3>";

  for (var cle in tags) {
    if (cle === "name") continue;
    html += "<div class='ligne-popup'><span>" + cle + "</span><span>" + tags[cle] + "</span></div>";
  }

  html += "</div>";
  return html;
}

/*function passeLesFiltres(parking) {
  var tags = parking.tags;

  if (estAccesInterdit(tags)) return false;

  var payant = estPayant(tags);
  if (filtreActuel === "gratuit" && payant !== false) return false;
  if (filtreActuel === "payant" && payant !== true) return false;

  if (texteRecherche !== "") {
    var nom = (tags.name || "").toLowerCase();
    if (nom.indexOf(texteRecherche) === -1) return false;
  }

  return true;
}*/

function afficherLesParkings() {
  groupePoints.clearLayers();
  groupePolygones.clearLayers();

  var nombreAffiche = 0;

  for (var i = 0; i < parkings.length; i++) {
    var parking = parkings[i];

    if (!passeLesFiltres(parking)) continue;
    nombreAffiche++;

    var couleur = couleurDuParking(parking.tags);

    if (parking.geometry.type === "point") {
      var marqueur = L.circleMarker([parking.lat, parking.lon], {
        radius: 8,
        color: "white",
        weight: 2,
        fillColor: couleur,
        fillOpacity: 0.9
      });
      marqueur.bindPopup(contenuPopup(parking.tags));
      groupePoints.addLayer(marqueur);
    } else {
      var anneaux = parking.geometry.rings;
      var polygone = L.polygon(anneaux, {
        color: couleur,
        weight: 2,
        fillColor: couleur,
        fillOpacity: 0.35
      });
      polygone.bindPopup(contenuPopup(parking.tags));
      groupePolygones.addLayer(polygone);
    }
  }
}

function filtrer(nom, bouton) {
  filtreActuel = nom;

  var boutons = document.getElementsByClassName("button1");
  for (var i = 0; i < boutons.length; i++) {
    boutons[i].classList.remove("actif");
  }
  bouton.classList.add("actif");

  afficherLesParkings();
}