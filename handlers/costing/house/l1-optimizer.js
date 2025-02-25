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

const computeScriptInputs = (constituentsInputData) => {
    const quantities = [];
    const costs = [];
    const preferenceLevels = [];

    // Process each constituent in the order defined by template
    templateData.constituentList.forEach(constituent => {
        const constituentData = constituentsInputData[constituent];
        
        // Add quantity to quantities array
        quantities.push(constituentData.quantity);

        // Get costs for this constituent up to selected spec level
        const constituentCosts = [];
        const constituentPreferences = [];
        
        // Add costs and preferences up to selected spec level (inclusive)
        for (let specLevel = 1; specLevel <= constituentData.specLevel; specLevel++) {
            constituentCosts.push(getSpecRate(constituent, specLevel));
            
            const levelsBelow = constituentData.specLevel - specLevel;
            const preference = levelsBelow === 0 
                ? 1 
                : 1 / Math.pow(constituentData.priorityLevel, levelsBelow);
            
            constituentPreferences.push(preference);
        }

        costs.push(constituentCosts);
        preferenceLevels.push(constituentPreferences);
    });

    return {
        quantities,
        costs,
        preferenceLevels,
        budget: constituentsInputData.BUDGET
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
        
        const scriptInputs = computeScriptInputs(constituentsInputData);

        // Mock response for testing
        const mockResult = {};
        templateData.constituentList.forEach(constituent => {
            mockResult[constituent] = 1;
        });

        return response.status(200).send(mockResult);
    } catch (error) {
        console.error('Error in handler:', error);
        return response.status(500).send({
            error: 'Internal server error',
            message: error.message
        });
    }
};

module.exports = handler;
