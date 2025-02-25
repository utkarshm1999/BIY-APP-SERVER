const { parse } = require('csv-parse/sync');
const fs = require('fs');
const path = require('path');

const parseCSV = () => {
  const filePath = path.join(process.cwd(), 'data', 'l1-template.csv');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  const rawData = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    rtrim: true,
  });

  // Filter valid rows and format initial data
  const validRows = rawData
    .filter(row => 
      row.Constituent?.trim() && // Check Constituent is non-empty
      /^[1-9]$/.test(row.Spec) && // Check Spec is single digit 1-9
      Number.isInteger(parseFloat(row.Rate)) && // Check Rate is valid integer
      parseFloat(row.Rate) > 0 // Ensure Rate is positive
    )
    .map(row => ({
      constituent: row.Constituent.trim(),
      spec: parseFloat(row.Spec) || 0,
      rate: parseFloat(row.Rate) || 0,
      inclusion: row.Inclusion?.split('\n').filter(Boolean).map(item => item.trim()) || [],
      specification: row.Specification?.split('\n').filter(Boolean).map(item => item.trim()) || []
    }));

  // Get unique constituent list
  const constituentList = [...new Set(validRows.map(row => row.constituent))];

  // Group specs by constituent
  const constituents = validRows.reduce((acc, row) => {
    if (!acc[row.constituent]) {
      acc[row.constituent] = {
        specs: []
      };
    }

    acc[row.constituent].specs.push({
      spec: row.spec,
      rate: row.rate,
      inclusion: row.inclusion,
      specification: row.specification
    });

    return acc;
  }, {});

  // Sort specs for each constituent by spec value
  Object.values(constituents).forEach(constituent => {
    constituent.specs.sort((a, b) => a.spec - b.spec);
  });

  return {
    constituentList,
    constituents
  };
};

module.exports = {
  parseCSV
};
