var AWS = require("aws-sdk");
var TASK_QUEUE_URL = process.env.TASK_QUEUE_URL;
var AWS_REGION = process.env.AWS_REGION;
var sqs = new AWS.SQS({
    region: AWS_REGION
});

function dsld(DSLD_ID) {
    var request = require('request');
    request(`https://www.dsld.nlm.nih.gov/dsld/api/label/${DSLD_ID}`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var product_info = JSON.parse(body);
            var product_name = product_info['Product_Name'];
            var product_brand = product_info['Brand'];
            var product_manufac = product_info['Brand'];
            var keywords = product_name + ", " + product_brand + ", " + product_manufac;
            var product_upc = product_info['SKU'].replace(/ /g, '');
            var dsld_statements = product_info['statements'];
            var Statement_of_Identity = product_info['Statement_of_Identity'];
            var dsld_ingredients = product_info['ingredients'];
            var DSLD_ID = product_info['DSLD_ID'];
            var dsld_precautions_statment = [];
            var SuggestedUsage = [];
            var Formulation = [];
            var ProductSpecificInformation = [];
            var SealsandSymbols = [];
            var dsld_fdadiscl = [];
            var dsld_other = [];
            var product_ingredients = [];
            for (var i = 0, len = dsld_statements.length; i < len; i++) {
                if (dsld_statements[i]['Statement_Type'] == 'Precautions') {
                    // console.log("dsld_precautions",JSON.stringify(dsld_precautions[i]['Statement'],null,20));
                    dsld_precautions_statment.push(dsld_statements[i]['Statement'].replace(/"/g,'\""'));
                }
                if (dsld_statements[i]['Statement_Type'] == 'Suggested/Recommended/Usage/Directions') {
                    SuggestedUsage.push(dsld_statements[i]['Statement'].replace(/"/g,'\""'));
                }
                if (dsld_statements[i]['Statement_Type'] == 'Formulation') {
                    Formulation.push(dsld_statements[i]['Statement'].replace(/"/g,'\""'));
                }
                if (dsld_statements[i]['Statement_Type'] == 'Product Specific Information') {
                    ProductSpecificInformation.push(dsld_statements[i]['Statement'].replace(/"/g,'\""'));
                }
                if (dsld_statements[i]['Statement_Type'] == 'Seals/Symbols') {
                    SealsandSymbols.push(dsld_statements[i]['Statement'].replace(/"/g,'\""'));
                }
                if (dsld_statements[i]['Statement_Type'] == 'FDA Disclaimer Statement') {
                    dsld_fdadiscl.push(dsld_statements[i]['Statement'].replace(/"/g,'\""'));
                }
                if (dsld_statements[i]['Statement_Type'] == 'Other') {
                    dsld_other.push(dsld_statements[i]['Statement'].replace(/"/g,'\""'));
                }
            }

            for (var index = 0, dsldingred = dsld_ingredients.length; index < dsldingred; index++) {
                product_ingredients.push(dsld_ingredients[index]['Dietary_Ingredient_Synonym_Source'].trim());
            }

            // console.log("dsld_precautions",JSON.stringify(product_info,null,20));
            console.log(product_info);
        
            update_database_with_dsld(DSLD_ID, product_name, product_brand, product_manufac, product_upc, dsld_precautions_statment, SuggestedUsage, Statement_of_Identity, Formulation, ProductSpecificInformation, SealsandSymbols, dsld_fdadiscl, dsld_other, keywords, product_ingredients);

            
        }
    });
}


function update_database_with_dsld(DSLD_ID, product_name, product_brand, product_manufac, product_upc, dsld_precautions_statment, SuggestedUsage, Statement_of_Identity, Formulation, ProductSpecificInformation, SealsandSymbols, dsld_fdadiscl, dsld_other, keywords, product_ingredients) {

    console.log(`Sending ${DSLD_ID} To SQS`);
    var params = {
        MessageDeduplicationId: `"${DSLD_ID}"`,
        DelaySeconds: 0,
        MessageBody: `{"DSLD_ID":"${DSLD_ID}","product_name": "${product_name}","product_brand":"${product_brand}","product_manufac":"${product_manufac}","product_upc":"${product_upc}","dsld_precautions_statment":"${dsld_precautions_statment}","SuggestedUsage":"${SuggestedUsage}","Statement_of_Identity":"${Statement_of_Identity}","Formulation":"${Formulation}","ProductSpecificInformation":"${ProductSpecificInformation}","SealsandSymbols":"${SealsandSymbols}","dsld_precautions_statment":"${dsld_precautions_statment}","dsld_fdadiscl":"${dsld_fdadiscl}","dsld_other":"${dsld_other}","keywords":"${keywords}","product_ingredients":"${product_ingredients}"}`,
        QueueUrl: process.env.QUEUEURL,
        MessageGroupId: "DSLD_ID"
    };


    sqs.sendMessage(params, function (err, data) {
        console.log(params);
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.MessageId);
        }
    });
}



function deleteMessage(receiptHandle, cb) {
    console.log("Delete message from SQS");
    sqs.deleteMessage({
        ReceiptHandle: receiptHandle,
        QueueUrl: TASK_QUEUE_URL
    }, cb);
}

function work(content, cb) {
    console.log("Content",content);
    var parsed = JSON.parse(content);

    console.log(parsed, "Parsed");
    var DSLD_ID = parsed.DSLD_ID;
    dsld(DSLD_ID);
    cb();
}

var lastReqId;

exports.handler = function (event, context, callback) {

    if (lastReqId == context.awsRequestId) {
        deleteMessage(event.ReceiptHandle, callback);
        return context.succeed(); // abort
    } else {
        lastReqId = context.awsRequestId; // keep request id for next invokation
    }

    work(event.Body, function (err) {
        if (err) {
            callback(err);
        } else {
            deleteMessage(event.ReceiptHandle, callback);
        }
    });
};

// dsld("29280")