/** Transparent day math for the Florida desk.
 *  Workbook reference figures are the published v1.1 Base case.
 *  The slider day is a sketch. It is not the spreadsheet's full engine. */

export type PackId = "orlando" | "villages" | "metro";

export type FleetInput = {
  pack: PackId;
  driven: number;
  robotaxi: number;
  tripsPerVeh: number;
  fare: number;
  netTake: number;
  tripMiles: number;
  deadhead: number;
  wage: number;
  load: number;
  energyPerMile: number;
  maintPerMile: number;
  insuranceYear: number;
  fixedMonth: number;
  vehiclePrice: number;
  weekend: boolean;
  noShow: number;
  utilization: number;
  shape?: number[];
};

export type HourRow = {
  hour: number;
  demand: number;
  trips: number;
  unmet: number;
  revenue: number;
  energy: number;
  maint: number;
  labor: number;
  fixed: number;
  fee: number;
  contrib: number;
  drivers: number;
  cabin: number;
  charge: number;
  dispatch: number;
  remote: number;
};

const RAW: Record<PackId, number[]> = {
  orlando: [1, 1, 1, 1, 1, 2, 3, 4, 6, 6, 5, 5, 5, 5, 5, 6, 8, 8, 7, 6, 5, 4, 3, 2],
  villages: [1, 1, 1, 1, 2, 3, 5, 8, 9, 8, 6, 5, 5, 6, 8, 9, 8, 6, 4, 3, 2, 2, 1, 1],
  metro: [1, 1, 1, 1, 2, 4, 8, 9, 7, 4, 3, 3, 3, 4, 5, 8, 9, 8, 6, 4, 3, 2, 2, 1],
};

export const packs: { id: PackId; label: string; note: string }[] = [
  {
    id: "orlando",
    label: "Orlando fence",
    note: "Semoran / Lee Vista shape from the 15-minute readout. Morning pull-out, evening spike, quiet night.",
  },
  {
    id: "villages",
    label: "Wildwood / Villages",
    note: "Assumed. Daytime errands and an early dinner. Thin nightlife. Not measured.",
  },
  {
    id: "metro",
    label: "Florida metro",
    note: "Assumed. Commuter peaks, a smaller midday, a real evening. Not a named city.",
  },
];

export const workbook = {
  version: "Fleet model v1.1 · 9 Sep 2026",
  scenario: "Base · Purchase · In-house",
  y1Revenue: 971353,
  y1Ebitda: -309405,
  y1Net: -409805,
  y5Revenue: 3633169,
  y5Ebitda: 903271,
  y5Driven: 16,
  y5Robotaxi: 20,
  days: 340,
  sheetDriverHours: 10.5,
  networkFee: 0.22,
  residual: 0.32,
  apr: 0.075,
  termMonths: 60,
  loanShare: 0.8,
};

export const defaults: FleetInput = {
  pack: "orlando",
  driven: 10,
  robotaxi: 0,
  tripsPerVeh: 16,
  fare: 18.41,
  netTake: 0.9,
  tripMiles: 4.89,
  deadhead: 0.3,
  wage: 18.5,
  load: 0.28,
  energyPerMile: 0.05768,
  maintPerMile: 0.105344,
  insuranceYear: 5400,
  fixedMonth: 10700,
  vehiclePrice: 47990,
  weekend: false,
  noShow: 0,
  utilization: 1,
};

function shape(pack: PackId, custom?: number[]) {
  const raw = custom && custom.length === 24 ? custom : RAW[pack];
  const total = raw.reduce((sum, value) => sum + value, 0) || 1;
  return raw.map((value) => value / total);
}

function payment(principal: number, apr: number, months: number) {
  const monthly = apr / 12;
  if (principal <= 0) return 0;
  return (principal * monthly) / (1 - (1 + monthly) ** -months);
}

function onClock(hour: number, count: number, start: number, end: number) {
  return hour >= start && hour < end ? count : 0;
}

export function runDay(input: FleetInput) {
  const weights = shape(input.pack, input.shape);
  const vehicles = Math.max(0, input.driven + input.robotaxi);
  const dayTrips = vehicles * input.tripsPerVeh * input.utilization;
  const weekend = input.weekend ? 1.25 : 1;
  const show = Math.max(0, 1 - input.noShow);
  const wave = (count: number) => Math.max(0, Math.round(count * show));
  const driverWave = wave(input.driven);
  const cabinWave = wave(Math.ceil(input.driven * 0.4));
  const chargeCount = vehicles > 0 ? wave(Math.max(1, Math.ceil(vehicles / 10))) : 0;
  const dispatchCount = input.driven > 0 ? wave(Math.max(1, Math.ceil(input.driven / 10))) : 0;
  const remoteCount = input.robotaxi > 0 ? wave(Math.max(1, Math.ceil(input.robotaxi / 20))) : 0;
  const fixedDay =
    (input.insuranceYear * vehicles + 8500 + input.fixedMonth * 12) / workbook.days;
  const debtDay =
    (payment(input.vehiclePrice * workbook.loanShare * vehicles, workbook.apr, workbook.termMonths) * 12) /
    workbook.days;

  const hours: HourRow[] = weights.map((weight, hour) => {
    const drivers = onClock(hour, driverWave, 6, 14) + onClock(hour, driverWave, 14, 23);
    const cabin = onClock(hour, cabinWave, 6, 14) + onClock(hour, cabinWave, 14, 23);
    const charge = onClock(hour, chargeCount, 0, 12) + onClock(hour, chargeCount, 12, 24);
    const dispatch = onClock(hour, dispatchCount, 6, 22);
    const remote = onClock(hour, remoteCount, 6, 23);
    const charging = hour < 6;
    const drivenReady = charging ? 0 : Math.min(input.driven, drivers);
    const robotReady = !charging && (input.robotaxi === 0 || remote > 0) ? input.robotaxi : 0;
    const ready = drivenReady + robotReady;
    const demand = dayTrips * weight;
    const capShare = vehicles > 0 ? ready / vehicles : 0;
    const trips = Math.min(demand, demand * capShare);
    const unmet = Math.max(0, demand - trips);
    const drivenTrips = vehicles > 0 ? trips * (drivenReady / Math.max(ready, 1)) : 0;
    const robotTrips = trips - drivenTrips;
    const miles = trips * input.tripMiles * (1 + input.deadhead);
    const revenue = trips * input.fare * input.netTake;
    const fee = robotTrips * input.fare * workbook.networkFee;
    const energy = miles * input.energyPerMile;
    const maint = miles * input.maintPerMile;
    const labor =
      (drivers * input.wage + cabin * 16 + charge * 28 + dispatch * 22 + remote * 32) *
      (1 + input.load) *
      weekend;
    const fixed = fixedDay / 24;
    const contrib = revenue - fee - energy - maint - labor - fixed;
    return {
      hour,
      demand,
      trips,
      unmet,
      revenue,
      energy,
      maint,
      labor,
      fixed,
      fee,
      contrib,
      drivers,
      cabin,
      charge,
      dispatch,
      remote,
    };
  });

  const sum = (key: keyof HourRow) => hours.reduce((total, row) => total + Number(row[key]), 0);
  const sheetDriver = input.driven * workbook.sheetDriverHours * input.wage * (1 + input.load) * weekend;
  const sheetDispatch =
    (0.4 * input.driven / 10) * 22 * (2080 / workbook.days) * (1 + input.load);
  const sheetClean =
    (0.5 * input.driven / 10) * 16 * (2080 / workbook.days) * (1 + input.load);
  const sheetLabor = sheetDriver + sheetDispatch + sheetClean;
  const sheetRevenue = dayTrips * input.fare * input.netTake;
  const sheetMiles = dayTrips * input.tripMiles * (1 + input.deadhead);
  const sheetVariable = sheetMiles * (input.energyPerMile + input.maintPerMile);
  const sheetFee = input.robotaxi > 0 ? dayTrips * (input.robotaxi / Math.max(vehicles, 1)) * input.fare * workbook.networkFee : 0;
  const sheetEbitda = sheetRevenue - sheetFee - sheetVariable - sheetLabor - fixedDay;

  return {
    hours,
    debtDay,
    sheet: {
      revenue: sheetRevenue,
      labor: sheetLabor,
      variable: sheetVariable,
      fixed: fixedDay,
      fee: sheetFee,
      ebitda: sheetEbitda,
    },
    sim: {
      revenue: sum("revenue"),
      labor: sum("labor"),
      energy: sum("energy"),
      maint: sum("maint"),
      fixed: sum("fixed"),
      fee: sum("fee"),
      ebitda: sum("contrib"),
      trips: sum("trips"),
      unmet: sum("unmet"),
    },
  };
}
