# M3 Project Documentation

## Group Information
* Group 4 - Team 13
* Project Topic: **Reiseplanner**

## Implementation Details

### Technical Stack
* Framework: Expo 53 - React Native Android
* API-Version:	Android API 36

### Testing Environment
* Tested Devices: 
  * Medium Phone - API 30
  * Pixel 5 - API 30
  * Pixel 6 - API 36

### Dependencies
* External Libraries and Frameworks:
    * APIs
      * Google Maps Routes API
      * Custom Flight Route API (Team-developed): [API Documentation](https://hci-backend-541730464130.europe-central2.run.app/docs)
    * Datasets (Used to develop the Flight Route API)
      * [Flight Route Database - Kaggle Dataset](https://www.kaggle.com/datasets/open-flights/flight-route-database)
      * [Airports, Train Stations, and Ferry Terminals - Kaggle Dataset](https://www.kaggle.com/datasets/open-flights/airports-train-stations-and-ferry-terminals)
      * [Airline Database - Kaggle Dataset](https://www.kaggle.com/datasets/open-flights/airline-database)
   * Libraries
      To see all the implemented libraries check the **package.json**. This are the main libraries used in this project:
      * nativewind - tailwind
      * axios
      * uuid
      * react-native-community/datetimepicker
      * react-native-picker/picker
      * react-native-step-indicator
      * react-native-maps
      * react-native-swiper
      * expo-image-picker

### Development
* Development Duration: 60 Hours

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```

2. Start the application
   ```bash
   npx expo start
   ```

The application can be run on:
- Android emulator
- Development build
- Expo Go (development sandbox)

## Project Structure
The application code is located in the **app** directory and uses file-based routing.