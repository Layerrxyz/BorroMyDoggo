const { GoogleSpreadsheet } = require("google-spreadsheet");
const { verify } = require('web3-token');
const doc = new GoogleSpreadsheet(
  "1MWYi073C26msolePW9iJGgVxGz61uvQc42iZ-GZh-nM"
);
const creds = {
  type: "service_account",
  project_id: "layerremails",
  private_key_id: "3155fb0dd9717c40a69d312be7ebb9bac62a7b93",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCdkIW9bZExYlQV\n/+9RXGlYbDzdDyvJE4Lg/5QuTwMj2URTM27HJfcJuEWV4Uh5vGsORI3f0TWxTi2H\numw+9v6hnymJkjbJgkncGo3CAVrQbyPOHBJVcZs6z5awZ+HD23dK3GGht6Ya3Snf\nlepBmqgOPE/Nu3b0fXihflfHMh+pEF18PRIKfBurwP8QlXxpxvTzxa/no7y7HeTY\nCUR/cz9GaxJ8oOnkMgiRIP8pfJQPIcVo1ocmM+i3NBQ4MCchbCePXk+qCNhsqGJM\n/am8/ecdwPpgCYh6/ytV8Z5yjSGxDyNSKjoeXNGHPz79UX3FuugWsF1v3VZcK0gv\nv1/S+AcdAgMBAAECggEACFrir0ib6N2jw3uL91P/pWKD7bLsFEsBEdOWSh2tdx1X\nwVOvsvFhQqDaARhuQpT1APot+Gl8aoz7NBXKFKKonkMK2FJ/rjrG64bK7+J+LCGg\nk+wq0AtopaXerIxYTThE1fGOtHJruplHVaWk7i/4a7IosdTtegnHN5pept+SYeFj\ndsKDeJUZRdUez5uh/Ga0TSoCAdIM1sgPDD+thVuJU+0KktgegesfuWqCbKCP7CkT\nCWnFztN1WnR3Q+rbUa48YaMigJKf01Ml2MSzZMNXPTj4fuy6Lh/cfXkXyjiO4YDL\ncDIFP6EsfSJi20l58UwBDPQILDRccQXRCJNEkonDYQKBgQDPaaw/tDSXNzSoZ+zv\nrGKQO6cyAStPdHo0ifl2Bj3dzKC7YwqQvAfstYpTFpChxOiBJ0pPARdBUMLd8JU0\nVhyL4kWi/T/DWrKBTDs0eRvSK6RAo63s9njjLF+PsPbuwsCJ87A4YPaCfUy3Fdjw\nVD5YHlN801WDwtUdh9PAKit1zQKBgQDCeYCvJHOnWm3qlkIo+DmBUss/2YaPE4Xn\nT3gla7YStJwUDFZ9vcgiqzwGtZN+uql+anh/XChEf5AvN2bym3YOlEUYydMuljRP\nYnkysuE8CG3/1hNCnULFcV0fMoPP2KLtB34vcDENV+UM/iXMA6rfVeyaElG6p2mJ\nWUKfwnWGkQKBgG0BgYhdYgJS/ja/n7N6qrZY048hNCzm707rcJLJxvvpjlPNQoE8\ngQGzi0YNpueOAA/YoWISFbG7Cx7vUMsXspsFyUlWxYsbAJOZh8gVGj0DuKhMHZ1b\nD79806BGBhEHg3889lE7DHMZ/RZ/werUq4tOLNx+iQPdgnmpp+znfL3FAoGBAIgl\nueJjmZgq5dKaeRznkpKoHOTJa7uUxmTGrO09uAzmZnJepNqI16j1yiNEUUsicPCw\np0U6hnJV/+IeXjMwhPj18l3FRdRSkbKV1RWaR7bYi/HUtE0pfYpur+vcWI1VM9LP\nMRcS6zRVOWTcNCfc1W5fYDII6zDKbUcbt1nTMKYRAoGBAIbu8NtvGSB1lurGNbwN\nI+9CIVDUhoAh9w2IYqGknXlTIJNy45JfvvYkwtObYx8CEfCeksoR2uUUP4ofu11m\n/EGcCVdWuM76kw/t8sE951tiCX9tOro0SQD0++FlMb6H7EgUCANu3ewKnEiZPSK/\nWs5jHh6KnRgcFdnEJPisa53t\n-----END PRIVATE KEY-----\n",
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