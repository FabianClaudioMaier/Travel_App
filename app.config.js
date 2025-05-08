// app.config.js
require('dotenv').config(); // lädt .env nach process.env

module.exports = ({ config }) => {
  return {
    // `config` ist hier schon das, was vorher unter `expo` in app.json war
    ...config,

    "plugins": [
        "expo-asset"
    ],

    extra: {
      // alle alten Felder in extra (z.B. eas.projectId) beibehalten
      ...config.extra,
      // und deinen API‑Key hinzufügen
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? ''
    }
  };
};
