// request will have  QUANTITIES, SPEC_CHOSEN, PREFERENCE_LEVEL and BUDGET
// spawn python script

// -- python:
// csv parser will get me OPTIONLIST --> RATES
// write result 

const { spawn } = require('child_process');
const path = require('path');
const { parseCSV } = require('./l1-utils');

let templateData = null;

const getSpecRate = (constituent, specLevel) => {
    const specData = templateData.constituents[constituent].specs.find(item => item.spec === specLevel);
    return specData ? specData.rate : null;
};

const computeScriptInputs = (constituentsInputData, targetBudget) => {
    const quantities = [];
    const rates = [];
    const preferenceLevels = [];

    // Process each constituent in the order defined by template
    templateData.constituentList.forEach(constituent => {
        const constituentData = constituentsInputData[constituent];
        
        // Add quantity to quantities array
        quantities.push(constituentData.quantity);

        // Get costs for this constituent up to selected spec level
        const constituentRates = [];
        const constituentPreferences = [];
        
        for (let specLevel = 1; specLevel <= constituentData.specLevel; specLevel++) {
            constituentRates.push(getSpecRate(constituent, specLevel));
            
            const levelsBelow = constituentData.specLevel - specLevel;
            const preference = levelsBelow === 0 
                ? 1.0 
                : 1.0 / Math.pow(2, levelsBelow);
            
            constituentPreferences.push(preference);
        }

        rates.push(constituentRates);
        preferenceLevels.push(constituentPreferences);
    });

    return {
        quantities,
        rates,
        preferenceLevels,
        budget: targetBudget
    };
};

const validateConstituentsData = (constituentsInputData) => {
    // Check if all required constituents are present and validate their data
    for (const constituent of templateData.constituentList) {
        const data = constituentsInputData[constituent];
        
        if (!data) {
            console.error(`Missing required constituent: ${constituent}`);
            return false;
        }
        
        if (!Number.isInteger(data.specLevel) || data.specLevel < 1 || data.specLevel > 9) {
            console.error(`Invalid specLevel for ${constituent}. Must be single digit (1-9)`);
            return false;
        }
        if (!Number.isInteger(data.priorityLevel) || data.priorityLevel < 0 || data.priorityLevel > 9) {
            console.error(`Invalid priorityLevel for ${constituent}. Must be single digit (0-9)`);
            return false;
        }
        if (!Number.isInteger(data.quantity)) {
            console.error(`Invalid quantity for ${constituent}. Must be an integer`);
            return false;
        }
    }

    return true;
};

function runOptimizer(inputData) {
  return new Promise((resolve, reject) => {
    // Convert input data to JSON string
    const inputJson = JSON.stringify(inputData);
    
    // Spawn Python process
    const pythonProcess = spawn('python3', [
      path.join(process.cwd(), 'scripts/optimizer.py'),
      inputJson
    ]);
    
    let resultData = '';
    let debugData = '';
    
    // Collect stdout (result data)
    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });
    
    // Collect stderr (debug logs)
    pythonProcess.stderr.on('data', (data) => {
      debugData += data.toString();
      // Optionally log debug messages to console
      console.log('Python Debug:', data.toString().trim());
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}`));
      }
      
      try {
        const result = JSON.parse(resultData);
        
        // Create a simple mapping of constituent names to their selected choices
        const constituentChoices = {};
        if (result.choices && templateData.constituentList) {
          result.choices.forEach((choice, index) => {
            if (index < templateData.constituentList.length) {
              constituentChoices[templateData.constituentList[index]] = choice + 1;
            }
          });
        }
        
        resolve({
          choices: constituentChoices,
          debugLogs: debugData,
          cost: result.cost,
          preferences: result.preferences
        });
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });
    
    // Handle potential errors
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

const handler = async (req, response) => {
    try {
        const { constituentsInputData, targetBudget } = req.body;
        
        if (!constituentsInputData || !targetBudget) {
            return response.status(400).send({
                error: 'Missing constituentsInputData or targetBudget in request body',
                message: 'Invalid request format'
            });
        }

        templateData = parseCSV();
        if (templateData === null) {
            return response.status(500).send({
                error: 'Failed to parse template',
                message: 'Something went wrong'
            });
        }
        
        // Validate input data before processing
        if (!validateConstituentsData(constituentsInputData)) {
            return response.status(400).send({
                error: 'Invalid input data',
                message: 'Something went wrong'
            });
        }
        
        const scriptInputs = computeScriptInputs(constituentsInputData, targetBudget);
        console.log('scriptInputs', scriptInputs);
        
        try {
            const result = await runOptimizer(scriptInputs, templateData.constituentList);
            console.log('Optimization Result:', result.choices);
            console.log('Debug Logs:', result.debugLogs);
            return response.status(200).send(result.choices);
        } catch (error) {
            console.error('Error in optimizer:', error);
            return response.status(500).send({
                error: 'Internal server error',
                message: error.message
            });
        }
    } catch (error) {
        console.error('Error in handler:', error);
        return response.status(500).send({
            error: 'Internal server error',
            message: error.message
        });
    }
};

module.exports = handler;
