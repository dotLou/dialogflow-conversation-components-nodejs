// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const functions = require('firebase-functions');
const axios = require('axios');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {
  dialogflow,
  BasicCard,
  BrowseCarousel,
  BrowseCarouselItem,
  Button,
  Carousel,
  Image,
  LinkOutSuggestion,
  List,
  MediaObject,
  Suggestions,
  SimpleResponse,
  Table,
 } = require('actions-on-google');

const LOGIN_INFO = {
  url: 'https://qlik-hybrid.auth0.com/oauth/token',
  clientId: 'UVFPtkQjfXPBmK582vF3ISEETp0oU5e5',
  clientSecret: '2TOjO18EttZZFZY2RbaFJ6wGnln58MtL1OvNs_Wz31O3RD4zEKzvAvjG7ixOk-7n',
};

const qcsCommands = {
  login: function login() {
    return axios.post(LOGIN_INFO.url, `grant_type=client_credentials&audience=qlik.api` , {
      auth: {
        username: LOGIN_INFO.clientId,
        password: LOGIN_INFO.clientSecret,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(response => {
      console.log(response.data);
      return response.data.access_token;
    });
  }
};
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

function promiseHandler(agent, pr) {
  return pr.catch((e) => {
    console.error(e);
    let conv = agent.conv()
    if (conv) {
      conv.ask('Something went wrong: ' + e.message);
      agent.add(conv);
      return;
    }
    agent.add('Something went wrong: ' + e.message);
  })
}
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my QCS!`);
  }

  function showToken(agent) {
    const pr = qcsCommands.login().then((qcsToken) => {
      let conv = agent.conv()
      if (conv) { // google assistant flow
        conv.ask('Your QCS token is: ')
	    conv.ask(new BasicCard({
          text: qcsToken,
          title: 'QCS Token',
        }));
        agent.add(conv)
      } else {
        agent.add('Your QCS Token is ' + qcsToken);
      }
    });

    return promiseHandler(agent, pr);
  }
 
  function showCollections(agent) {
    let conv = agent.conv()
    if (conv) { // google assistant flow
        conv.ask('Sure, here are some collections:')
        // conv.ask('Fancy Collection')
        // conv.ask('Business and finance')
        conv.ask(new List({
            title: 'collections',
            items: {
              0: {
                title: 'Finance and Business'
              },
              1: {
                title: 'Health'
              },
            }
        }))
        agent.add(conv)
    } else {
        agent.add('PROOUT')
    }
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/dialogflow-fulfillment-nodejs/tree/master/samples/actions-on-google
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('show collections', showCollections);
  intentMap.set('show token', showToken);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});

