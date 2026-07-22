import { latLonToJMACode } from './m_jma_geocode';

const parseNumberArg = (value: string | undefined, fallback: number): number => {
  const parsed = value ? Number(value) : fallback;
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number argument: "${value}"`);
  }
  return parsed;
};

const run = async (): Promise<void> => {
  const lat = parseNumberArg(process.argv[2], 38.55152666499528);
  const lon = parseNumberArg(process.argv[3], 140.0293767375801);

  console.log(`Testing latLonToJMACode with lat=${lat}, lon=${lon}`);
  const result = await latLonToJMACode(lat, lon);
  console.log(JSON.stringify(result, null, 2));
};

run().catch((error: unknown) => {
  console.error('Failed to run latLonToJMACode test.');
  console.error(error);
  process.exit(1);
});
