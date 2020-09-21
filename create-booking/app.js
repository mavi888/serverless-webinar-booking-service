const AWSXRay = require("aws-xray-sdk");
// const AWS = require('aws-sdk');

const AWS = AWSXRay.captureAWS(require("aws-sdk"));
const sqs = new AWS.SQS();
const { metricScope, Unit } = require("aws-embedded-metrics");
const uuidv4 = require("uuid/v4");
const moment = require("moment");

/*const booking = {
  userId: event.queryStringParameters.userId,
  propertyId: event.queryStringParameters.propertyId,
  startBookingDate: event.queryStringParameters.startBookingDate,
  endBookingDate: event.queryStringParameters.endBookingDate,
};*/

const BOOKINGS_QUEUE_URL = process.env.BOOKINGS_QUEUE_URL;

exports.lambdaHandler = metricScope((metrics) => async (event, context) => {
  console.log(event);

  const booking = JSON.parse(event.body);

  booking.id = uuidv4();

  //get booked days
  const b = moment(booking.startBookingDate);
  const a = moment(booking.endBookingDate);
  const days = a.diff(b, "days");

  console.log(days);

  metrics.putDimensions({ Service: "CreateBooking" });
  metrics.putMetric("days", days, Unit.Count);
  metrics.setProperty("bookingId", booking.id);
  metrics.setProperty("userId", booking.userId);
  metrics.setProperty("propertyId", booking.propertyId);

  await createBooking(booking);

  response = {
    statusCode: 200,
    body: JSON.stringify({
      message: "booking id: " + booking.id,
    }),
  };

  return response;
});

async function createBooking(booking) {
  const message = JSON.stringify({
    type: "createbooking",
    data: booking,
  });

  const data = await sqs
    .sendMessage({
      MessageBody: message,
      QueueUrl: BOOKINGS_QUEUE_URL,
    })
    .promise();

  console.log(data);
}
