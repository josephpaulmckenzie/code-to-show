function insert_leads_into_sf(username, password, security_token, client_id, client_secret, redirect){
var sf = require('node-salesforce');
var security_token = security_token;
var password = password;
var username = username;
var client_id = client_id ;
var client_secret = client_secret;
var redirect_uri = redirect;

var time = new Date().toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");

var conn = new sf.Connection({
  oauth2 : {
    // you can change loginUrl to connect to sandbox or prerelease env. 
    // loginUrl : 'https://test.salesforce.com', 
    clientId : client_id,
    clientSecret : client_secret,
    redirectUri : redirect_uri
  }
});
conn.login(username, password + security_token, function(err, userInfo) {
  if (err) { return console.error(err); }
  // Now you can get the access token and instance URL information. 
  // Save them to establish connection next time. 
  accessToken = conn.accessToken;

  instanceUrl = conn.instanceUrl;
  // logged in user property 
  // console.log("User ID: " + userInfo.id);
  // console.log("Org ID: " + userInfo.organizationId);

  conn.sobject("Lead").create({ Company : 'LambdaTest', LastName : time, 'Note' : "Testing notes with all the data we need from rubicon" }, function(err, ret) {
    if (err || !ret.success) { return console.error(err, ret); }
    console.log("Created record id : " + ret.id);
  });

});
}

function get_today(){
//get today's date in the format I want
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10) {
        dd='0'+dd
    } 
    if(mm<10) {
        mm='0'+mm
    } 

    return mm+'/'+dd+'/'+yyyy;
}



function get_today(){
//get today's date in the format I want
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();
    if(dd<10) {
        dd='0'+dd
    } 
    if(mm<10) {
        mm='0'+mm
    } 

    return mm+'/'+dd+'/'+yyyy;
}

function get_clients_from_dynamo(){
    var AWS = require("aws-sdk");
    today = get_today();
    AWS.config.update({
        region: "us-west-2",
        //endpoint: "http://localhost:8000"
    });

    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: "client_credentials",
        ProjectionExpression: "#dt, client_id, credentials.salesforce_username, credentials.salesforce_password, credentials.salesforce_security_token, credentials.salesforce_client_id, credentials.salesforce_client_secret, credentials.salesforce_redirect_uri",
        FilterExpression: "#dt < :today",
        ExpressionAttributeNames: {
            "#dt": "update_date",
        },
        ExpressionAttributeValues: {
             ":today":today
        }
    };

    console.log("Scanning client_credentials table.");
    docClient.scan(params, onScan);
}

function onScan(err, data) {
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        // print all the movies
        console.log("Scan succeeded.");
        data.Items.forEach(function(client) {
           console.log(
                client.update_date + ": ",
                client.client_id, "- username:", client.credentials.salesforce_username
                );
           insert_leads_into_sf(client.credentials.salesforce_username, client.credentials.salesforce_password, client.credentials.salesforce_security_token, client.credentials.salesforce_client_id, client.credentials.salesforce_client_secret, client.credentials.salesforce_redirect_uri); 
        });

        // continue scanning if we have more movies, because
        // scan can retrieve a maximum of 1MB of data
        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
}

exports.handler = function(event, context, callback) {
    console.log("test_string = " + event.key1);
    get_clients_from_dynamo();
    
    callback(null, "success message");

}


