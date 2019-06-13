var AWS = require('aws-sdk')
var sqs = new AWS.SQS({
    apiVersion: '2012-11-05'
});


function updateDynamodb(AlarmName, AlarmDescription) {
    var params = {
        MessageBody: `{"username":"${AlarmName}","message":"${AlarmDescription}"}`,
        QueueUrl: process.env.QueueUrl
        
    };

    sqs.sendMessage(params, function(err, data) {
        console.log("Sending Github event data to be updated in dynamo");
        console.log(params)
        if (err) {
            console.log("Error", err);
        }
        else {
            console.log("Success", data.MessageId);
        }
    });
}
exports.handler = (event, context, callback) => {

    var EventSource = event.Subject;
    var messagebody = event.Message
    var messagejson = JSON.parse(messagebody)
    var AlarmDescription = messagejson.AlarmDescription;
    var AlarmName = messagejson.AlarmName;
    updateDynamodb(AlarmName, AlarmDescription);
 
};
