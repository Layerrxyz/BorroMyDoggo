const { GoogleSpreadsheet } = require("google-spreadsheet");
const { verify } = require('web3-token');
const doc = new GoogleSpreadsheet(
  "1MWYi073C26msolePW9iJGgVxGz61uvQc42iZ-GZh-nM"
);
const creds = {
  type: "service_account",
  project_id: "layerremails",
  private_key_id: "95c51ec66b989c902fd1c3762c7d33c8462b09a5",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD2ki8mJ0U4tCIM\nTabB8KbKWdGRTQMMYciTAKLBjxUhWNyQeyAMFRZh+UkXm5A3cy6twUyz7Kc1FKCR\nr5kXvbZl93mrmfBQ8mt/3ccxXwvGtIA+RF2gANy7fL6p4BuF7jXsmNRz9keAFojV\nMbm1M5Ad7qtZCpzNGK92CqvC9oVIUQrRx57dLSaHtKSkO/UfQfxHalhKVn595KNT\nTPxCPw2NNcYJykdaVO4ImLizyvXOt8/lr52GXcBCv0J0HnbH3pjwFXNIAObykK5f\nbb8FAlGPSjrHMrsx89mMlepTZP1E7g4CUiSN9j5bzucALjOTrOCDPWRgpAG+Njfw\nw8cbeK03AgMBAAECggEAJGUQe4+5WnTQP8OodSD55Y1bbxiQdh/q1LP30h02D72H\nlPXvlYj5TE3Y+ZiXMXAZeEE7eqVYSu/4AXkLXmM8zJE6TteCjtgxgOax87olSVe0\nRDygGzF1Y2E23Wk8dsjiAcHPPiyggioRWXKlCDeLsrdbaGG2Ilnd8E0D7Fup8bHm\netCCslfnOWLGCeKQhttd211SkkuX77+1WTN1qFQmQJjQtsXSG9S1UFYjasv5ClfM\nKy8VCctmsFkMEOFIVja3YCu1ia6McQyLEstrgpVLBi9hEfksmdM8vNCoZBeIDi7b\n4Eu14Y3LpIgLwk+0LvyyfV7z1/zlX2ITVcQ92aGTMQKBgQD/JSd0K9agaIb3NtPg\nJ7dLqtmXT4mJIGIrhpXG48gCzPGjud5xuEsFvmM/JyJVcuomvyXOkX2xBCV+ywvU\nhQKeWYYgsEIIoAWetOd/t7WpCC9kfJ3B3iLFUasWRof9aUV0e28kMx5Jl7h03pG3\nKTpaRpqWvYXKCunqwaXGrtGvZwKBgQD3Za0AZNCFeqABEBQPlWcTrHPNyQEPXtDW\ns8B85MnVJ6IIktWsiyOPea/I8X1ZR/JGAOL1viz26uAYRJfBaNIQ0ieXXMtsIKHl\nfJihuL+rEaIq39Use4D74b/bxWmSlRFotbnOL2y0kZo+CmPaYnVX6ORZWxA1Y//5\nMPsbEFkBsQKBgQDsNXh2O5Oiw8KXoiG7Numh2tVBGPiKg/l+tEV7cSudNCFNY2lF\nvMlv0tfNAqztkMqn/nTA7b8An4cbAF2+bTmEYfsjzioEFCm/yVk8y1YZ3CMME7Z1\nYfKs3LPYlomVmN0dPp0hVVXn6ddyEw+yEzAbnZvGjEUNTNdMZ+TSsMwdZwKBgQDt\nJ+K3xey+h9ZqLmeMqMOu8FnyowUJHvNDXfzfvNJeKygA4AFE7fygxR3lmtl2hKmS\nwbbPrAaejHlVyitPlJQK2+poBuRaOs33l4EZRmk2LCkwwHExuxLiYn3wx0V05sFR\nhyMerAeg8RLS9lLSPiAOrYp4vfrDs6Dl2DZes0UfgQKBgHA0HuIzWUmQbnlHdSl0\nxyM0eJ9wjTERNyDm25Fqb9iAAzqIR778U+LCUyLnvGgDTCW80sr2OpV243NsNTkS\nrC/TMHpLWXn76Z7RBmPeB/kyHmH9VbB1Zj8l5h7kcKznlTgvE0m1anMU2DBx67n6\njHRXJiJHXtQIW4BhfPTdY3JP\n-----END PRIVATE KEY-----\n",
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
