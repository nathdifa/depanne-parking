// ici on met toutes les valeurs qu'on veut pouvoir changer facilement

const CONFIG = {

  nomDuSite: "De Panne Parking",

  centreCarte: [51.0951, 2.6015],
  zoomDepart: 13,
  zoomMin: 11,
  zoomMax: 20,
  calques: [
    {
      nom: "Standard",
      type: "xyz",
      url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    {
      nom: "Satellite",
      type: "xyz",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri"
    },
    {
      nom: "Humanitaire",
      type: "xyz",
      url: "https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, tuiles HOT'
    },
    {
      nom: "Orthophoto (WMS)",
      type: "wms",
      url: "https://geo.api.vlaanderen.be/GRB-selectie/wms",
      couche: "grb_sel",
      format: "image/png",
      transparent: false,
      attribution: "Informatie Vlaanderen"
    },
    {
      nom: "Orthophoto (WMTS)",
      type: "wmts",
      url: "https://geo.api.vlaanderen.be/GRB/wmts",
      couche: "grb_sel",
      tileMatrixSet: "GoogleMapsVL",
      format: "image/png",
      version: "1.0.0",
      style: "GRB-Selectie",
      attribution: "Informatie Vlaanderen"
    }
  ],

  fichierDeDonnees: "data/parkings.json",

  couleurGratuit: "#3a8e5c",
  couleurPayant: "#e8622e",
  couleurInconnu: "#8a8478",

  accesInterdits: ["private", "customers"],

  clusterActif: true

};