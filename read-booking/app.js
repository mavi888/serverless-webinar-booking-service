const AWSXRay = require("aws-xray-sdk");
// const AWS = require('aws-sdk');

const AWS = AWSXRay.captureAWS(require("aws-sdk"));
const documentClient = new AWS.DynamoDB.DocumentClient();

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;

exports.lambdaHandler = async (event, context) => {
  console.log(event);

  let response;

  const bookingId = event.pathParameters.id;

  if (bookingId == null || bookingId.length == 0) {
    response = {
      statusCode: 400,
      body: "wrong booking id",
    };
  } else {
    const booking = await readBooking(bookingId);

    if (booking == null) {
      response = {
        statusCode: 404,
        body: "booking not found",
      };
    } else {
      response = {
        statusCode: 200,
        body: JSON.stringify({ booking: booking }),
      };
    }
  }

  return response;
};

async function readBooking(bookingId) {
  let data = await documentClient
    .get({
      TableName: BOOKINGS_TABLE,
      Key: { id: bookingId },
    })
    .promise();

  console.log(data);

  const booking = data.Item;

  return booking;
}
