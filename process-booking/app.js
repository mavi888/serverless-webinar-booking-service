const AWSXRay = require("aws-xray-sdk");
// const AWS = require('aws-sdk');

const AWS = AWSXRay.captureAWS(require("aws-sdk"));
const documentClient = new AWS.DynamoDB.DocumentClient();
const { metricScope, Unit } = require("aws-embedded-metrics");

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE;

exports.lambdaHandler = metricScope((metrics) => async (event, context) => {
  console.log(event);

  let response;

  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    switch (message.type) {
      case "createbooking":
        const booking = message.data;
        response = await processBooking(booking);

        metrics.putDimensions({ Service: "ProcessBooking" });
        metrics.putMetric("propertyId", booking.propertyId, Unit.Count);
        metrics.setProperty("bookingId", booking.id);
        metrics.setProperty("userId", booking.userId);
        break;

      default:
        const bookingError = "wrong type " + message.type;
        console.log("error: " + bookingError);
        throw new Error(bookingError); // For Lambda Destinations
    }
  }

  console.log(response);
  return response; // For Lambda Destinations
});

async function processBooking(booking) {
  console.log("process booking");
  console.log(BOOKINGS_TABLE);

  const data = await documentClient
    .put({
      TableName: BOOKINGS_TABLE,
      Item: booking,
    })
    .promise();

  const response = "booking id: " + booking.id + " " + data;

  return response;
}
