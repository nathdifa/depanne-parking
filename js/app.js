let map;
let nodes;
let polygons;
let parkings;
let machines;

const zones = {
    'DPA1/Red': 'Rouge',
    'DPA2/Orange': 'Orange',
    'DPA3/Green': 'Verte',
    'Blue': 'Bleue (disque)'
};

const tagNames = [
    ['charge', 'Prix'],
    ['capacity', 'Places'],
    ['maxstay', 'Durée maximale'],
    ['surface', 'Revêtement']
];

window.onload = function () {
  init();
};

async function init() {
    document.getElementById('title').innerText = 'De Panne Parking';

    map = L.map('map').setView([51.097, 2.587], 15);
    map.setMinZoom(14);
    map.setMaxZoom(20);

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
            if (map.hasLayer(GRB)) {
                map.removeLayer(GRB);
            }
            layerControl.removeLayer(GRB);
        }
    });

    nodes = L.layerGroup();
    polygons = L.layerGroup();

    map.addLayer(nodes);
    map.addLayer(polygons);

    let pos = await get_pos();
    if (pos) { 
        let posMarker = L.circleMarker(pos, {
            radius: 8,
            color: 'white',
            weight: 2, 
            fillColor: '#4285F4',
            fillOpacity: 1
        });
        nodes.addLayer(posMarker);
    }

    loadData();
};

function loadData() {
    fetch('data/data.json').then(function (res) {
        return res.json();
    }).then(function (data) {
        console.log(data)
        parkings = data.parkings;
        machines = data.machines;
        
        showData();
    })
};

function showData() {
    for (let i = 0; i < parkings.length; i++) {
        let parking = parkings[i];
        let colour = getColour(parking.tags);

        let rings = parking.geometry.rings;
        let polygon = L.polygon(rings, {
            color: colour,
            weight: 2, 
            fillColor: colour,
            fillOpacity: .35
        });
        polygon.bindPopup(makeParkingPopup(parking.tags));
        polygons.addLayer(polygon);
    }

    for (let i = 0; i < machines.length; i++) {
        let machine = machines[i];
        
        let marker = L.circleMarker([machine.lat, machine.lon], {
            radius: 8,
            color: 'black',
            weight: 2, 
            fillColor: 'white',
            fillOpacity: .75
        });
        marker.bindPopup();
        nodes.addLayer(marker);
    }
};

function getColour(tags) {
    if (tags.fee) {
        switch (tags.zone) {
            case 'DPA1/Red':
                return '#D50000';
            
            case 'DPA2/Orange':
                return '#FF5C00';

            case 'DPA3/Green':
                return '#107C41';

            case 'Blue':
                return '#007FFF';
        }
    };
    return '#4A5568';
};

function makeParkingPopup(tags) {
    let html = "<div class='popup-parking'>";
    const capacityStr = tags?.capacity ? ` (${tags.capacity} places)` : '';
    let content = new Map();

    html += "<h3> Parking" + (tags.name ?? '') + capacityStr + "</h3>";

    if (!tags) return;

    if ('fee' in tags) {
        content.set("Payant", tags.fee === 'yes' ? 'Oui' : 'Non');
    } else {
        content.set("Payant", 'Inconnu');
    };

    if (tags.zone && zones[tags.zone]) {
        content.set("Zone", zones[tags.zone]);
    };

    for (const [key, label] of tagNames) {
        if (tags[key]) {
            content.set(label, tags[key]);
        }
    };

    for ([key, val] of content) {
        html += "<div class='ligne-popup'><span>" + key + "</span><span>" + val + "</span></div>";
    };

    if (tags.zone) {
        let zone = tags.zone.slice(0, 4)
        html += `<div class="start-stop"> <button type="button" class="button1" onClick="startSms(${zone})">START</button>`
        html += '<button type="button" class="button1" onClick="stopSms()">STOP</button> </div>'
        html += "</div>";
    };
    return html;
};

function get_pos() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log("La géolocalisation ne fonctionne pas sur votre appareil.");
            return null;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                resolve([lat, lon]); 
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        alert("Vous n'avez pas activé la géolocalisation.");
                        break;
                    default:
                        console.log("Erreur de géolocalisation.");
                }
                return null;
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

async function centre_pos() {
    let pos = await get_pos();
    if (pos) { map.setView(pos, 19) }
}

function startSms(zone) {
    let plate = prompt("Entrez votre plaque d'immatriculation (sans tirets)", '1ABC123');
    if (plate == null || plate == '') {
        alert("Numéro invalide");
    } else {
        let body = encodeURIComponent(zone + ' ' + plate);

        window.location.href = 'sms:4411?body=' + body
    }
}

function stopSms() {
    let body = encodeURIComponent('Q');

    window.location.href = 'sms:4411?body=' + body
}