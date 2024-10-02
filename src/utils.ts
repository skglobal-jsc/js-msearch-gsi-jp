/**
 * Converts geographical coordinates to Tokyo coordinates.
 *
 * This function adjusts the given latitude (N) and longitude (E) to the Tokyo coordinate system.
 *
 * @param lat - The latitude in degrees.
 * @param lon - The longitude in degrees.
 * @returns An object containing the converted Tokyo coordinates:
 * - `Ntokyo`: The converted latitude in Tokyo coordinate system.
 * - `Etokyo`: The converted longitude in Tokyo coordinate system.
 */
export function convertToTokyoCoordinates(
  lat: number,
  lon: number
): { Ntokyo: number; Etokyo: number } {
  const Ntokyo = lat + 0.00010696 * lat - 0.000017467 * lon - 0.004602;
  const Etokyo = lon + 0.000046047 * lat + 0.000083049 * lon - 0.010041;
  return { Ntokyo, Etokyo };
}

/**
 * Calculates the mesh code based on the given Tokyo coordinates.
 * This function is refer from https://museum.bunmori.tokushima.jp/ogawa/map/meshtolatlon.html
 *
 * @param Ntokyo - The northern coordinate in Tokyo.
 * @param Etokyo - The eastern coordinate in Tokyo.
 * @returns An object containing the mesh code and its components:
 * - `meshCode`: The full mesh code.
 * - `meshCode12`: The first two digits of the mesh code.
 * - `meshCode34`: The third and fourth digits of the mesh code.
 * - `prefix`: The first four digits of the mesh code.
 */
export function calculateMeshCode(Ntokyo: number, Etokyo: number): {
  meshCode: string;
  meshCode12: number;
  meshCode34: number;
  prefix: string;
} {
  const mesh12 = Math.floor((Ntokyo * 60) / 40);
  const mesh12a = (Ntokyo * 60) % 40;
  const mesh5 = Math.floor(mesh12a / 5);
  const mesh5a = mesh12a % 5;
  const mesh7 = Math.floor((mesh5a * 60) / 30);

  const mesh34 = Math.floor(Etokyo - 100);
  const mesh34a = Etokyo - mesh34 - 100;
  const mesh6 = Math.floor((mesh34a * 60) / 7.5);
  const mesh6a = (mesh34a * 60) % 7.5;
  const mesh8 = Math.floor((mesh6a * 60) / 45);

  console.log(mesh12, mesh34, mesh5, mesh6, mesh7, mesh8);
  const prefix = `${mesh12}${mesh34}`;
  const meshCode = `${prefix}${mesh5}${mesh6}${mesh7}${mesh8}`;
  return {
    meshCode: meshCode,
    meshCode12: mesh12,
    meshCode34: mesh34,
    prefix,
  }
}
