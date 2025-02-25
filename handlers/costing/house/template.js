const { parseCSV } = require('./l1-utils');

const handler = async (req, response) => {
  try {
    const template = parseCSV();
    return response.send(template);
  } catch (error) {
    console.error('Error processing template:', error);
    return response.status(500).send({
      error: 'Failed to process house template',
      message: error.message
    });
  }
};

module.exports = handler; 