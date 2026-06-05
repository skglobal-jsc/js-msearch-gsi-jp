import { latLonToJMACode } from './m_jma_geocode';

const parseNumberArg = (value: string | undefined, fallback: number): number => {
  const parsed = value ? Number(value) : fallback;
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number argument: "${value}"`);
  }
  return parsed;
};

const run = async (): Promise<void> => {
  const lat = parseNumberArg(process.argv[2], 35.71278973783185);
  const lon = parseNumberArg(process.argv[3], 139.7674203291535);

  console.log(`Testing latLonToJMACode with lat=${lat}, lon=${lon}`);
  const result = await latLonToJMACode(lat, lon);
  console.log(JSON.stringify(result, null, 2));
};

run().catch((error: unknown) => {
  console.error('Failed to run latLonToJMACode test.');
  console.error(error);
  process.exit(1);
});
