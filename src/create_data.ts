import * as csvParser from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';

const convertCSVToJSON = async (filePath: string) => {
  const results: {
    [key: string]: {
      city_code: string;
      city_name: string;
      mesh_code: string;
      notes: string;
    }[];
  } = {};
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const meshCode = row['基準メッシュ・コード'];
        if (!results[meshCode]) {
          results[meshCode] = [];
        }
        results[meshCode].push({
          city_code: row['都道府県市区町村コード'],
          city_name: row['市区町村名'],
          mesh_code: meshCode,
          notes: row['備考'],
        });
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const splitJsonByMeshPrefix = async (
  inputFilePath: string,
  outputDir: string
) => {
  const jsonData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));
  const groupedData: { [prefix: string]: { [key: string]: any } } = {};

  Object.keys(jsonData).forEach((meshCode) => {
    const prefix = meshCode.substring(0, 4); // take the first 4 characters
    if (!groupedData[prefix]) {
      groupedData[prefix] = {};
    }
    groupedData[prefix][meshCode] = jsonData[meshCode];
  });

  // Write the grouped data to separate JSON files
  Object.keys(groupedData).forEach((prefix) => {
    const outputFilePath = `${outputDir}/mesh_data_${prefix}.json`;
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(groupedData[prefix], null, 2)
    );
    console.log(`JSON file created: ${outputFilePath}`);
  });
};

const main = async () => {
  console.log('Starting conversion...');
  const outputJsonFile = path.join(__dirname, 'data', 'mesh_data.json');
  let finalData: any = {};

  for (let i = 1; i <= 47; i++) {
    const formattedI = String(i).padStart(2, '0');
    const filePath = `data/code/${formattedI}.csv`;

    try {
      const jsonData: any = await convertCSVToJSON(filePath);
      finalData = { ...finalData, ...jsonData };
    } catch (error) {
      console.error('Error while converting CSV to JSON:', error);
    }
  }

  // fix the mesh data based on GSI's data
  let fixedNum = 0;
  const diffJsonFile = path.join(__dirname, 'data', 'fix_data.json');
  const gsiData = JSON.parse(fs.readFileSync(diffJsonFile, 'utf8'));
  const gsiDataMap = gsiData.reduce((acc: any, item: any) => {
    const { resultsLocal, resultsGsi } = item;
    const {
      results: { mesh_code },
    } = resultsLocal;
    const {
      results: { muniCd },
    } = resultsGsi;
    acc[mesh_code] = muniCd;
    return acc;
  }, {});
  // write the corrected data to the finalData
  Object.keys(finalData).forEach((meshCode) => {
    if (gsiDataMap[meshCode]) {
      const cities = finalData[meshCode];
      console.log('Correcting mesh code:', meshCode, cities);
      // find city data that has the same city code as the GSI data
      const city = cities.find(
        (data: any) => data.city_code === gsiDataMap[meshCode]
      );
      if (city) {
        city.smallest = true;
        fixedNum++;
      }
    }
  });

  console.log('=======Fixed:', fixedNum);

  // Write the combined data to the output JSON file
  fs.writeFileSync(outputJsonFile, JSON.stringify(finalData, null, 2));
  console.log(`JSON file created: ${outputJsonFile}`);

  // Split the JSON data by mesh code prefix
  const outputDir = path.join(__dirname, 'data');
  await splitJsonByMeshPrefix(outputJsonFile, outputDir);

  // remove the combined JSON file
  fs.unlinkSync(outputJsonFile);

  console.log('Conversion completed.');
};

main();
