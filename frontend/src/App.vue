<template>
  <div id="app">
    <div id="map"></div>
    <div id="controls">
      <PlusButton @click="showModal = true" />
    </div>
    <div v-if="showModal" class="modal">  
      <div v-for="(category, index) in categories" :key="index" class="category"> 
        <h3>{{ category.name }}</h3>
        <div class="button-scroll">
          <div class="button-grid">
            <button 
              v-for="option in category.options"
              :key="option"
              :class="{'selected': isSelected(option)}" 
              @click="toggleOption(option)"> 
              {{ option }}
            </button>
          </div>
        </div>
      </div>
      <div class="button-group">
        <button @click="showModal = false">Abbrechen</button>
        <button @click="submitReport">Ausführen</button>
      </div>
    </div>
  </div>
</template>



<script>
import { ref, onMounted } from 'vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import PlusButton from './components/PlusButton.vue';

export default {
  components: {
    PlusButton
  },
  setup() {
    const map = ref(null);
    const currentLocationCircle = ref(null);
    const currentLocation = ref(null);
    const selectedOptions = ref([]);
    const showModal = ref(false);
    const categories = ref([
      { name: 'Überwachung', options: ['Mobiler Blitzer', 'Polizei Kontrolle', 'Stationärer Blitzer'] },
      { name: 'Einschränkungen', options: ['steiler Bordstein', 'schlechter Weg', 'Option 15', 'Option 16', 'Option 19', 'Option 12'] },
      { name: 'Öffentlichkeit', options: ['Toilette', 'Parkplatz', 'Müllcontainer', 'Baustelle', 'Option 17', 'Option 18'] }
    ]);

    const initializeMap = () => {
      map.value = L.map('map').setView([51.505, -0.09], 13); // Setzt die Karte auf eine vordefinierte Position

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map.value);

      map.value.locate({ setView: true, maxZoom: 16 }); // aktuelle Position herausfinden

      map.value.on('locationfound', onLocationFound); //Event Listener, warten auf Koordinaten 
    };

    const onLocationFound = (e) => { 
      currentLocation.value = e.latlng;
      if (currentLocationCircle.value) { 
        currentLocationCircle.value.setLatLng(e.latlng); //überprüfung ob sich der standort geändert hat 
      } else {
        currentLocationCircle.value = L.circle(e.latlng, {
          color: 'green',
          fillColor: '#3f3',
          fillOpacity: 0.5,
          radius: 10
        }).addTo(map.value);
      }
    };
    //laden der Reports (Axios benutzen)
    const loadReports = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/reports');
        response.data.forEach(report => {
          addMarker(report);
        });
      } catch (error) {
        console.error('Fehler beim Laden der Berichte:', error);
      }
    };

      // Verfahren mit mehreren Auswahlmöglichkeiten von Buttons (Buttons drücken, wird zurückgenommen oder erneut gedrückt)
    const toggleOption = (option) => {
      if (isSelected(option)) {
        selectedOptions.value = selectedOptions.value.filter(opt => opt !== option); //wenn Ausgewählt => filter: neues Array wird erstellt, ohne deren option
      } else {
        selectedOptions.value.push(option); //Wenn nicht ausgewählt: wird diese zu selectedOptions hinzugefügt
      }
    };
      // Überprüft ob eine Option ausgewählt ist oder nicht. Gibt den Wert der option zurück
    const isSelected = (option) => {
      return selectedOptions.value.includes(option);
    };

    const submitReport = async () => { 
      if (selectedOptions.value.length > 0 && currentLocation.value) { //Bedingung, dass Code nur ausgeführt wird, wenn mindestens eine Option ausgewählt wurde 
        try {
          const selectedTypes = selectedOptions.value.join(', '); //Zusammenfügen der Bewertungen (Bsp: Schlagloch, Baustelle)
          const report = {
            type: selectedTypes,
            latitude: currentLocation.value.lat, //aktuelle Position latitude
            longitude: currentLocation.value.lng //aktuelle Position longitude
          };
          const response = await axios.post('http://localhost:3001/api/reports', report);
          addMarker(response.data); //Marker für die geladenen Reports erstellen 
          showModal.value = false; // der Wert des Fenster wird auf false gesetzt => schließen des Fensters
        } catch (error) { //Falls Fehler entstehen 
          console.error('Fehler beim Senden des Berichts:', error);
        }
      }
    };

    const addMarker = (report) => { //Aufbau des Markers (Anforderungen: Bewertung, Koordinaten)
      const type = `<strong>Bewertung:</strong> ${report.type}`;
      const latitude = `<strong>Lat:</strong> ${report.latitude.toFixed(3)}`;
      const longitude = `<strong>Long:</strong> ${report.longitude.toFixed(3)}`;

      const popupContent = `${type}<br>${latitude}<br>${longitude}`;

      L.circle([report.latitude, report.longitude], {  //Bewertung Circle erstellen
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
        radius: 5 // Kleinerer Radius für den Kreis der geposteten Berichte
      }).addTo(map.value)
        .bindPopup(popupContent);
    };
      //Die reports werden erst geladen (synchron), wenn die Karte geladen ist (initialisiert). LivecycleHooks
    onMounted(async () => {  
      initializeMap();
      await loadReports();
    });

    // Workaround for map loading issues (Lösung für eine Fehlermeldung)
    L.Popup.prototype._animateZoom = function (e) {
      if (!this._map) {
        return;
      }
      var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
        anchor = this._getAnchor();
      L.DomUtil.setPosition(this._container, pos.add(anchor));
    };

    return {
      map,
      currentLocationCircle,
      currentLocation,
      selectedOptions,
      showModal,
      categories,
      toggleOption,
      isSelected,
      submitReport
    };
  }
};
</script>

<style>
#map {
  height: 100vh;
  width: 100vw;
  position: relative;
}
#controls {
  position: absolute;
  top: 20px;
  right: 10px;
  z-index: 1000; /* Ensures the button is above the map */
}
.modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #f2f7f3;
  padding: 20px;
  border: 1px solid black;
  border-radius: 10px;
  z-index: 1000; /* Ensures the modal is above the map */
  max-height: 80%;
  overflow-y: auto; /* Adding scrollbar */
}
.category {
  font-family: sans-serif;
  margin-bottom: 20px;
}
.category h3 {
  margin-bottom: 10px;
}
.button-scroll {
  overflow-x: auto; /* Adding horizontal scrollbar */
}
.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
}
button {
  border-radius: 5px;
  margin: 5px;
  padding: 10px 15px;
  border: none;
  background-color: #abc4b0;
  color: white;
  cursor: pointer;
}
button:hover {
  background-color: #709779;
}
button.selected {
  background-color: #709779; 
}
.button-group {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.button-group button {
  background-color: #92cace;
  margin: 0 10px;
}
.button-group button:hover{
  background-color: #5eabb2;
}
</style>
