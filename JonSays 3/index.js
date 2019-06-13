'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var languageStrings = {
    "en": {
        "translation": {
            "FACTS": [
                "Google it."
            ],
            "SKILL_NAME" : "Jon's Facts of Life",
            "GET_FACT_MESSAGE" : "",
            "HELP_MESSAGE" : "You can say What would Jon say, or, you can say exit... What can I help you with?",
            "HELP_REPROMPT" : "What can I help you with?",
            "STOP_MESSAGE" : "Goodbye!"
        }
    },
    "en-US": {
        "translation": {
            "FACTS": [
              "Google it.",
							"I like man buns",
							"You're Fired",
							"Ye ol' chestnuts",
							"I'm Bringing the British prespective to America",
							"biscuits",
							"Hey Joe. Before I forget, there is a big box of meaty stuff in the office fridge for the pups.",
							"That's Rubbish",
							"I'm just Brutish",
							"Where are the tests?",
							"TEST,TEST,TEST",
							"Learn to indent",
							"It's You're not youre!",
							"I'm Sorry Amanda you're right",
							"You're right Amanda",
							"That's Bollocks",
							"Fancy a beer?",
							"Fuck off the lot of you"
            ],
            "SKILL_NAME" : "American Jon sayings"
        }
    },
    "en-GB": {
        "translation": {
            "FACTS": [
           
              "Google it.",
							"I like man buns",
							"You're Fired",
							"Ye ol' chestnuts",
							"I'm Bringing the British prespective to America",
							"biscuits",
							"Hey Joe. Before I forget, there is a big box of meaty stuff in the office fridge for the pups.",
							"That's Rubbish",
							"I',m just Brutish",
							"Where are the tests?",
							"TEST,TEST,TEST",
							"Learn to indent",
							"It's You're not youre!",
							"I'm sorry amanda you're right",
							"You're right Amanda",
							"That's Bollocks",
							"Fancy a beer?",
							"Fuck off the lot of you"
							
								
            ],
            "SKILL_NAME" : "British Jon sayings"
        }
    },
 };

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetNewFactIntent': function () {
        this.emit('GetFact');
    },
    'GetFact': function () {
        // Get a random space fact from the space facts list
        // Use this.t() to get corresponding language data
        var factArr = this.t('FACTS');
        var factIndex = Math.floor(Math.random() * factArr.length);
        var randomFact = factArr[factIndex];

        // Create speech output
        var speechOutput = this.t("GET_FACT_MESSAGE") + randomFact;
        this.emit(':tellWithCard', speechOutput, this.t("SKILL_NAME"), randomFact)
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    }
};