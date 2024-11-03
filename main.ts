import { uniqBy } from "https://deno.land/x/composable@1.106.2/utils/unique.ts";
import { sortBy } from "https://deno.land/std@0.224.0/collections/mod.ts";

type Position = {
  session_key: number;
  meeting_key: number;
  driver_number: number;
  date: string;
  position: number;
};

type Driver = {
  broadcast_name: string;
  country_code: string;
  driver_number: number;
  first_name: string;
  full_name: string;
  headshot_url: string;
  last_name: string;
  meeting_key: number;
  name_acronym: string;
  session_key: number;
  team_colour: string;
  team_name: string;
};

const MISSING_COLORS = {
  LAW: "#6692FF",
  COL: "#64C4FF",
  BEA: "#B6BABD",
} as const;

function hexToIntColor(hex: string): number {
  // Ensure hex is in the correct format
  if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
    throw new Error(`Invalid hex color format, ${hex}`);
  }

  // Remove the leading '#' if present
  hex = hex.replace("#", "");

  // Convert hex color to integer
  return parseInt(hex, 16);
}

async function setHexColor(segments: number[], color: number) {
  console.log(`Setting color for segments: ${segments} to ${color}`);
  const requestBody = {
    requestId: "1",
    payload: {
      sku: "H6061",
      device: Deno.env.get("GOVEE_DEVICE_ID"),
      capability: {
        type: "devices.capabilities.segment_color_setting",
        instance: "segmentedColorRgb",
        value: {
          segment: segments,
          rgb: color,
        },
      },
    },
  };

  const url = "https://openapi.api.govee.com/router/api/v1/device/control";

  const apiKey = Deno.env.get("GOVEE_API_KEY");

  if (!apiKey) {
    throw new Error("GOVEE_API_KEY environment variable is not set");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Govee-API-Key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok || response.status !== 200) {
    throw new Error(`Error calling Govee API: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(`Error calling Govee API: ${data.message}`);
  }

  console.log(`Successfully set color for segments: ${segments} to ${color}`);
  return data;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function getLatestPositions() {
  const url = new URL("https://api.openf1.org/v1/position");
  url.searchParams.append("session_key", "latest");
  const response = await fetch(url.toString());
  const data: Position[] = await response.json();
  const sortedData = sortBy(data, (d) => d.date, { order: "desc" });
  const uniquePositions = uniqBy(sortedData, "driver_number");
  return uniquePositions;
}

async function getDrivers() {
  const url = new URL("https://api.openf1.org/v1/drivers");
  url.searchParams.append("session_key", "latest");
  const response = await fetch(url.toString());
  const data: Driver[] = await response.json();
  return data;
}

async function updatePositions() {
  const positions = await getLatestPositions();

  // get latest position date
  const latestPositionDate = new Date(positions[0].date);

  // if latest position date is older than 2 hours exit
  if (latestPositionDate.getTime() < Date.now() - 2 * 60 * 60 * 1000) {
    console.log("Latest position is older than 2 hours, skipping update");
    return;
  }

  const drivers = await getDrivers();

  const colorsToChange = positions
    .filter((p) => p.position <= 10)
    .reduce((acc, p) => {
      const driver = drivers.find((d) => d.driver_number === p.driver_number);

      if (!driver) {
        throw new Error(
          `Driver not found for driver number: ${p.driver_number}`,
        );
      }

      const color = driver.team_colour ??
        MISSING_COLORS[driver.name_acronym as keyof typeof MISSING_COLORS];

      return {
        ...acc,
        [color]: [
          ...(acc[driver.team_colour] || []),
          10 - p.position,
        ],
      };
    }, {} as Record<string, number[]>);

  for (const [teamColour, positions] of Object.entries(colorsToChange)) {
    const color = hexToIntColor(teamColour);
    await setHexColor(positions, color);
    // wait 1 second since the goovee api sometimes freaks out if we call it too fast
    await sleep(500);
  }
}

Deno.cron("Update F1 Positions", "* * * * 6-1", updatePositions);

// await updatePositions();
