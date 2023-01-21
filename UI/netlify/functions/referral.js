const { GoogleSpreadsheet } = require("google-spreadsheet");
const { verify } = require('web3-token');
const doc = new GoogleSpreadsheet(
  "1MWYi073C26msolePW9iJGgVxGz61uvQc42iZ-GZh-nM"
);
const creds = {
  type: "service_account",
  project_id: "layerremails",
  private_key_id: "3155fb0dd9717c40a69d312be7ebb9bac62a7b93",
  private_key: process.env.SHEETS_KEY,
  client_email: "email-72@layerremails.iam.gserviceaccount.com",
  client_id: "110035954507978935773",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/email-72%40layerremails.iam.gserviceaccount.com",
};

exports.handler = async function (event) {
  const { address, error } = auth(event, ["POST"]);
  if (error) return error;
  const { referrer } = event.queryStringParameters;
  if (!address || !referrer || address === referrer) {
    return {
      statusCode: 400,
      body: "Missing address or referrer",
    };
  }
  try {
    await doc.useServiceAccountAuth(creds);
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: "Failed to open tracking sheet :(",
    };
  }
  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    await sheet.addRow({ address, referrer, time: new Date(Date.now()).toString() });
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: "Failed to add row to tracking sheet :(",
    };
  }
  return {
    statusCode: 200,
    body: "success",
  };
};

const auth = (event, methods) => {
  const token = /^Bearer (.*)$/.exec(event.headers.authorization)?.[1];
  if (!token)
    return {
      error: {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
      },
    };

  try {
    const { address, body } = verify(
      token,
      process.env.VERIFY_DOMAIN && {
        domain: process.env.VERIFY_DOMAIN,
      },
    );
    if (!address)
      return {
        error: {
          statusCode: 401,
          body: JSON.stringify({ message: 'Unauthorized' }),
        },
      };
    if (methods && !methods.includes(event.httpMethod))
      return {
        error: {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method Not Allowed' }),
        },
      };

    return { address };
  } catch (e) {
    return {
      error: {
        statusCode: 401,
        body: JSON.stringify({ message: e.message }),
      },
    };
  }
};