const serverless = require('serverless-http');
const express = require('express');
const app = express();
var AWS = require("aws-sdk");
var dateFormat = require('dateformat');
app.use(express.json());

app.get('/list-lambdas', function (req, res) {
    console.log("In list-lambdas route");
    var awsAccessKey = req.get("awsAccessKey");
    var awsSecretAccessKey = req.get("awsSecretAccessKey");
    var awsRegion = req.get("awsRegion");
    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    });

    var lambda = new AWS.Lambda();
    var params = {
        FunctionVersion: "ALL",
        //Marker: '',
        // MaxItems: 10
    };
    var results = [];

    lambda.listFunctions(params, function (err, data) {
        if (err) console.log("ERROR");
        else
            for (var index = 0; index < data["Functions"].length; ++index) {
                var functionName = data["Functions"][index]["FunctionName"];
                var functionArn = data["Functions"][index]["FunctionArn"];
                var functionRuntime = data["Functions"][index]["Runtime"];
                var functionRole = data["Functions"][index]["Role"];
                var functionDescription = data["Functions"][index]["Description"];
                var functionLastModified = data["Functions"][index]["LastModified"];
                functionLastModified = dateFormat(new Date(functionLastModified), "mm-dd-yyyy h:MM:ss");
                var functionEnvironment = data["Functions"][index]["Environment"];
                if (functionEnvironment == null) {
                    functionEnvironment = "No Enviormental Variables Found";
                } else {
                    functionEnvironment = data["Functions"][index]["Environment"];
                }
                var result = {
                    "functionName": `${functionName}`,
                    "functionArn": `${functionArn}`,
                    "functionRuntime": `${functionRuntime}`,
                    "functionRole": `${functionRole}`,
                    "functionDescription": `${functionDescription}`,
                    "functionLastModified": `${functionLastModified}`,
                    "functionEnvironment": `${functionEnvironment}`
                };
                if (data["Functions"][index]["Version"] == '$LATEST') {
                    results.push(result);
                }

            }
            res.status(200).json(results);
    });
});

app.post('/get-lambda-concurrency', function (req, res) {
    console.log("in get-lambda-concurrency route")
    var FunctionName = req.body.FunctionName;
    var awsAccessKey = req.get("awsAccessKey");
    var awsSecretAccessKey = req.get("awsSecretAccessKey");
    var awsRegion = req.get("awsRegion");
    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    });

    var lambda = new AWS.Lambda();
    var params = {

    };
    lambda.getAccountSettings(params, function (err, data) {

        if (err) console.log("ERR 1");
        else
            var UnreservedConcurrentExecutions = data.AccountLimit.UnreservedConcurrentExecutions;
        getLambdaConcurrency(UnreservedConcurrentExecutions);
    });

    function getLambdaConcurrency(UnreservedConcurrentExecutions) {
        var params = {
            FunctionName: FunctionName
            // Qualifier: '1'
        };
        lambda.getFunction(params, function (err, data) {
            if (err) console.log("ERR 2", err);
            else
            if (data.Concurrency == undefined) {
                var results = {
                    "ReservedConcurrentExecutions": "Unreserved",
                    "UnreservedConcurrentExecutions": `${UnreservedConcurrentExecutions}`
                };
            } else {
                var ReservedConcurrentExecutions = data.Concurrency.ReservedConcurrentExecutions;
                var results = {
                    "ReservedConcurrentExecutions": `${ReservedConcurrentExecutions}`,
                    "UnreservedConcurrentExecutions": `${UnreservedConcurrentExecutions}`
                };
                console.log(results);
            }
            if (err) {
                if (err.statusCode == undefined) {
                    res.status(400).json({
                        error: err.message
                    });
                } else {
                    res.status(err.statusCode).json({
                        error: err.message
                    });
                }
            } else {
                console.log(data);
                res.status(200).json(results);
            }
        });
    }
});

app.post('/update-lambda-concurrency', function (req, res) {
    console.log("In update-lambda-concurrency route");
    var FunctionName = req.body.FunctionName;
    var ReservedConcurrentExecutions = req.body.ReservedConcurrentExecutions;
    var awsAccessKey = req.get("awsAccessKey");
    var awsSecretAccessKey = req.get("awsSecretAccessKey");
    var awsRegion = req.get("awsRegion");
    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    });
    var lambda = new AWS.Lambda();
    var params = {
        FunctionName: FunctionName,
        ReservedConcurrentExecutions: ReservedConcurrentExecutions
    };
    lambda.putFunctionConcurrency(params, function (err, data) {
        if (err) {
            if (err.statusCode == undefined) {
                res.status(400).json({
                    error: err.message
                });
            } else {
                res.status(err.statusCode).json({
                    error: err.message
                });
            }
        } else {
            console.log(data);
            res.status(200).json(data);
        }
    });
});

app.post('/update-lambda-description', function (req, res) {
    console.log("In update-lambda-description Route");
    var FunctionName = req.body.FunctionName;
    var Description = req.body.lambdaDescription;
    console.log("FunctionName",FunctionName);
    console.log("Description",Description);

    var awsAccessKey = req.get("awsAccessKey");
    var awsSecretAccessKey = req.get("awsSecretAccessKey");
    var awsRegion = req.get("awsRegion");
    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    });
    var lambda = new AWS.Lambda();

    var params = {
        FunctionName: FunctionName,
        Description: Description
    };
    lambda.updateFunctionConfiguration(params, function (err, data) {

        if (err) {
            if (err.statusCode == undefined) {
                res.status(400).json({
                    error: err.message
                });
            } else {
                res.status(err.statusCode).json({
                    error: err.message
                });
            }
        } else {
            console.log(data)
            res.status(200).json(data);
        }
    });
});

app.post('/get-lambda-envs', function (req, res) {
    console.log("In get-lambda-envs Route");
    var FunctionName = req.body.FunctionName;
    var awsAccessKey = req.get("awsAccessKey");
    var awsSecretAccessKey = req.get("awsSecretAccessKey");
    var awsRegion = req.get("awsRegion");
    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    });
    var lambda = new AWS.Lambda();

    var params = {
        FunctionName: FunctionName
        // Qualifier: '1'
    };
    lambda.getFunction(params, function (err, data) {
        if (err) {
            if (err.statusCode == undefined) {
                res.status(400).json({
                    error: err.message
                });
            } else {
                res.status(err.statusCode).json({
                    error: err.message
                });
            }
        } else {
            var envs = [];
            if (data.Configuration.Environment == undefined) {
                envs.push({
                    "": ""
                });
            } else {
                envs.push(data.Configuration.Environment.Variables);
            }
            res.status(200).json(envs);
        }
    });
});

app.post('/update-lambda-envs', function (req, res) {
    console.log("In update-lambda-envs Route");
    var FunctionName = req.body.FunctionInfo;
    FunctionName = JSON.parse(FunctionName);
    FunctionName = FunctionName.FunctionName;
    console.log("FN",FunctionName);
    var envs = req.body.envs;
    console.log("typeof envs 1",typeof envs);
    envs = JSON.parse(envs);
    console.log("typeof envs 2",typeof envs);

    console.log("ENVS",envs);
    var awsAccessKey = req.get("awsAccessKey");
    var awsSecretAccessKey = req.get("awsSecretAccessKey");
    var awsRegion = req.get("awsRegion");
    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    });
    var lambda = new AWS.Lambda();

    var params = {
        FunctionName: FunctionName,
        Environment: {
            Variables: envs
        }
    };

    lambda.updateFunctionConfiguration(params, function (err, data) {
        if (err) {
            if (err.statusCode == undefined) {
                res.status(400).json({
                    error: err.message
                });
            } else {
                res.status(err.statusCode).json({
                    error: err.message
                });
            }
        } else {
            res.status(200).json(data);
        }
    });
});

app.post('/invoke-lambda', function (req, res) {
    console.log("In Route invoke-lambda ");
    var FunctionName = JSON.parse(req.body.FunctionInfo);
    FunctionName = FunctionName.FunctionName;
    var testEvent = JSON.parse(req.body.testEvent);
    testEvent = JSON.stringify(testEvent);

    var awsAccessKey = req.get("awsAccessKey");
    var awsSecretAccessKey = req.get("awsSecretAccessKey");
    var awsRegion = req.get("awsRegion");
    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    });
    var lambda = new AWS.Lambda();
    var params = {
        FunctionName: FunctionName,
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: `${testEvent}`
    };

    lambda.invoke(params, function (err, data) {
        if (err) {
            if (err.statusCode == undefined) {
                console.log("IN 400 undefined");
                res.status(400).json({
                    error: err.message
                });
            } else {
                console.log("IN error");

                res.status(err.statusCode).json({
                    error: err.message
                });
            }
        } else {
            res.status(200).json(data.Payload);
            console.log("Payload",data.Payload);
        }
    });
});

app.post('/get-cloudwatch-logs', function (req, res) {
    console.log("In Route get-cloudwatch-logs");
    var logGroupName = req.body.logGroupName;
    var awsAccessKey = req.get("awsAccessKey");
    var awsSecretAccessKey = req.get("awsSecretAccessKey");
    var awsRegion = req.get("awsRegion");
    AWS.config.update({
        region: `${awsRegion}`,
        accessKeyId: `${awsAccessKey}`,
        secretAccessKey: `${awsSecretAccessKey}`
    });

    var cwl = new AWS.CloudWatchLogs({
        apiVersion: '2014-03-28'
    });

    var params = {
        logGroupName: `/aws/lambda/${logGroupName}`,
        descending: true, //|| false,
        limit: 1,
        // logStreamNamePrefix: 'STRING_VALUE',
        // nextToken: 'STRING_VALUE',
        orderBy: 'LastEventTime' // | LogStreamName 
    };
    cwl.describeLogStreams(params, function (err, data) {
        if (err) res.status(404).json([{
            "timestamp": "",
            "message": "No Logs found for selected Lambda"
        }]);
        else
            for (var index = 0; index < data["logStreams"].length; index++) {

                var logStreamName = data.logStreams[index].logStreamName;
                var creationTime = data.logStreams[index].creationTime;
                creationTime = dateFormat(new Date(creationTime), "mm-dd-yyyy h:MM:ss");
                var firstEventTimestamp = data.logStreams[index].firstEventTimestamp;
                firstEventTimestamp = dateFormat(new Date(firstEventTimestamp), "mm-dd-yyyy h:MM:ss");
                var lastEventTimestamp = data.logStreams[index].lastEventTimestamp;
                lastEventTimestamp = dateFormat(new Date(lastEventTimestamp), "mm-dd-yyyy h:MM:ss");
                getCloudwatchLogs(logGroupName, logStreamName);
            }
    });


    function getCloudwatchLogs(logGroupName, logStreamName) {
        var results = [];

        var params = {
            logGroupName: `/aws/lambda/${logGroupName}`,
            logStreamName: logStreamName
        };

        cwl.getLogEvents(params, function (err, data) {
            if (err) {
                if (err.statusCode == undefined) {
                    res.status(400).json({
                        error: err.message
                    });
                } else {
                    res.status(err.statusCode).json({
                        error: err.message
                    });
                }
            } else {
                console.log("data", data)
                for (var index = 0; index < data.events.length; index++) {
                    var timestamp = data.events[index].timestamp;
                    timestamp = dateFormat(new Date(timestamp), "mm-dd-yyyy h:MM:ss");
                    var message = data.events[index].message;
                    var result = {
                        "timestamp": `${timestamp}`,
                        "message": `${message}`
                    };
                    results.push(result);
                }
                res.status(200).json(results);
            }
        });
    }

});

// Uncomment For Local 
// app.listen(3000, () => console.log(`listening on port 3000!`));

// Comment out for local
module.exports.handler = serverless(app);