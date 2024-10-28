# F1 Position Tracker

This project is a Deno application that fetches the latest positions of Formula 1 drivers and sets their corresponding colors on a Govee device based on their performance.

## Features

- Fetches the latest driver positions from the OpenF1 API.
- Retrieves driver information and associates it with their positions.
- Sets the color of a Govee device based on the driver's team color.
- Automatically updates every time the application is run, ensuring the latest data is used.

## Requirements

- Deno (version 1.0 or higher)
- Govee API key (set as an environment variable)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Set up your environment variable for the Govee API key:
   ```bash
   export GOVEE_API_KEY=<your-govee-api-key>
   ```

3. Run the application:
   ```bash
   deno run --allow-env --allow-net main.ts
   ```

## Code Overview

### Main Functions

- `hexToIntColor(hex: string): number`
  - Converts a hex color string to an integer.

- `setHexColor(segments: number[], color: number)`
  - Sends a request to the Govee API to set the color of specified segments.

- `getLatestPositions()`
  - Fetches the latest positions of drivers from the OpenF1 API.

- `getDrivers()`
  - Retrieves driver information from the OpenF1 API.

- `main()`
  - The main function that orchestrates fetching positions, checking their recency, and updating the Govee device.

## Usage

Run the application to see the latest driver positions and update the Govee device colors accordingly. The application will exit if the latest position is older than 2 hours.

## License

This project is licensed under the MIT License.
