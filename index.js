'use strict';
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const admin = require('firebase-admin');
const axios = require('axios');
const {dialogflow} = require('actions-on-google');
admin.initializeApp();
//admin.firestore.settings({timestampInSnapshots:true});

const db = admin.firestore();
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  
  function welcome(agent) {
    agent.add("Hello! Welcome to IIMS!What would you like to do? \n "+
			  "I could help you with the enquiry and update of Inventory" );
}
  
  function addVehicleHandler (agent) {
    let vehicleName = agent.parameters.vehicles;
    let modelValue = agent.parameters.model;
    let quantityValue = agent.parameters.quantity;
    db.collection('Inventory').add({ vehiclename: vehicleName, model:modelValue });
    db.collection('Inventory Stock').add({ vehiclename: vehicleName , quantity: quantityValue});
   // db.collection('Inventory').doc('Vehicles').add({name: vehicleName });
    agent.add(`${vehicleName} with ${modelValue} added successfully`);
  }
  
  function updatevehicleHandler(agent) {
      let vehicleName = agent.parameters.vehicles;
      let modelValue = agent.parameters.model;
      let quantityValue = agent.parameters.quantity;
	  db.collection('Inventory').where('vehiclename', '==', vehicleName).update({ 'model': modelValue });
      db.collection('Inventory Stock').where('vehiclename', '==', vehicleName).update({ 'quantity': quantityValue });
      agent.add(`${vehicleName}'s model updated to ${modelValue} successfully`);
  }

 /* function getVehicleHandler(agent) {
    let vehicleName = agent.parameters.vehicles;
    
    // Assuming you have initialized and connected to your Firestore database
    let inventoryCollection = db.collection('Inventory');
    
    // Create a reference to the specific vehicle document
    let vehicleRef = inventoryCollection.where('vehiclename', '==', vehicleName);
    
    return vehicleRef.get()
        .then((snapshot) => {
            if (snapshot.empty) {
                agent.add(`No information found for ${vehicleName}.`);
            } else {
                // Assuming you want to get the first document that matches the query
                let vehicleData = snapshot.docs[0].data();
                let model = vehicleData.model;
                agent.add(`Vehicle: ${vehicleName}, Model: ${model}`);
            }
        })
        .catch((error) => {
            console.error("Error getting vehicle information:", error);
            agent.add("An error occurred while fetching vehicle information.");
        });
}*/
  
  function getVehicleQuantityHandler(agent) {
    let vehicleName = agent.parameters.vehicles;

    // Assuming you have initialized and connected to your Firestore database
    let inventoryCollection = db.collection('Inventory Stock');

    // Create a reference to the specific vehicle document
    let vehicleRef = inventoryCollection.where('vehiclename', '==', vehicleName);

    return vehicleRef.get()
        .then((snapshot) => {
            if (snapshot.empty) {
                agent.add(`No information found for ${vehicleName}.`);
            } else {
                // Assuming you want to get the first document that matches the query
                let vehicleData = snapshot.docs[0].data();
                let quantity = vehicleData.quantity; // Assuming 'quantity' is the field name
                agent.add(`The Vehicle ${vehicleName} with Quantity of ${quantity}`);
            }
        })
        .catch((error) => {
            console.error("Error getting vehicle information:", error);
            agent.add("An error occurred while fetching vehicle information.");
        });
}
  
    function getVehicleHandler(agent) {
    let vehicleName = agent.parameters.vehicles;

    // Assuming you have initialized and connected to your Firestore database
    let inventoryCollection = db.collection('Inventory');

    // Create a reference to the specific vehicle document
    let vehicleRef = inventoryCollection.where('vehiclename', '==', vehicleName);

    return vehicleRef.get()
        .then((snapshot) => {
            if (snapshot.empty) {
                agent.add(`No information found for ${vehicleName}.`);
            } else {
                // Assuming you want to get the first document that matches the query
                let vehicleData = snapshot.docs[0].data();
                let model = vehicleData.model; // Assuming 'model' is the field name
                agent.add(`The Vehicle ${vehicleName} is the ${model} model`);
            }
        })
        .catch((error) => {
            console.error("Error getting vehicle information:", error);
            agent.add("An error occurred while fetching vehicle information.");
        });
}
  
  function addVehicle (agent) {
    // Get parameter from Dialogflow with the string to add to the database
    const vehicleNameValue = agent.parameters.vehicles;

    // Get the database collection 'dialogflow' and document 'agent' and store
    
   // const dialogflowAgentRef = db.collection('Inventory').doc('Vehicles');
    const dialogflowAgentRef = db.collection('Inventory').doc('Vehicles');
    return db.runTransaction(t => {
      t.set(dialogflowAgentRef, {name: vehicleNameValue});
      return Promise.resolve('Write complete');
    }).then(doc => {
    //  agent.add(`Wrote "${databaseEntry}" to the Firestore database.`);
      agent.add(`${vehicleNameValue} added successfully`);
    }).catch(err => {
      console.log(`Error writing to Firestore: ${err}`);
      agent.add(`Failed to write "${vehicleNameValue}" to the Firestore database.`);
    });
  }
  
  function updateVehicleModelHandler(agent) {
    let vehicleName = agent.parameters.vehicles;
    let newModelValue = agent.parameters.model;
    // Query for the document
    const inventoryRef = db.collection('Inventory').where('vehiclename', '==', vehicleName);
    return inventoryRef.get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                agent.add(`${vehicleName} not found in the Inventory.`);
            } else {
                const vehicleDocRef = querySnapshot.docs[0].ref;
                // Update the 'model' field with the new value
                return vehicleDocRef.update({
                    model: newModelValue
                })
                .then(() => {
                    agent.add(`${vehicleName}'s model updated to ${newModelValue} successfully`);
                })
                .catch((error) => {
                    console.error("Error updating document: ", error);
                    agent.add("An error occurred while updating the vehicle's model.");
                });
            }
        })
        .catch((error) => {
            console.error("Error querying for document: ", error);
            agent.add("An error occurred while updating the vehicle's model.");
        });
}

    function updateVehicleQuantityHandler(agent) {
    let vehicleName = agent.parameters.vehicles;
    let newQuantityValue = agent.parameters.quantity;
    // Query for the document
    const inventoryRef = db.collection('Inventory Stock').where('vehiclename', '==', vehicleName);
    return inventoryRef.get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                agent.add(`${vehicleName} not found in the Inventory.`);
            } else {
                const vehicleDocRef = querySnapshot.docs[0].ref;
                // Update the 'quantity' field with the new value
                return vehicleDocRef.update({
                    quantity: newQuantityValue
                })
                .then(() => {
                    agent.add(`${vehicleName}'s car quantity updated to ${newQuantityValue} successfully`);
                })
                .catch((error) => {
                    console.error("Error updating document: ", error);
                    agent.add("An error occurred while updating the vehicle's model.");
                });
            }
        })
        .catch((error) => {
            console.error("Error querying for document: ", error);
            agent.add("An error occurred while updating the vehicle's quantity.");
        });
}
  
  function deleteVehicleHandler(agent) {
    let vehicleName = agent.parameters.vehicles;

    // Query for the document
    const inventoryRef = db.collection('Inventory').where('vehiclename', '==', vehicleName);

    return inventoryRef.get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                agent.add(`${vehicleName} not found in the Inventory.`);
            } else {
                // Delete the first matching document
                const vehicleDocRef = querySnapshot.docs[0].ref;
                return vehicleDocRef.delete()
                    .then(() => {
                        agent.add(`${vehicleName} has been deleted successfully.`);
                    })
                    .catch((error) => {
                        console.error("Error deleting document: ", error);
                        agent.add("An error occurred while deleting the vehicle.");
                    });
            }
        })
        .catch((error) => {
            console.error("Error querying for document: ", error);
            agent.add("An error occurred while deleting the vehicle.");
        });
}
  
  function readFromDb (agent) {
    // Get the database collection 'dialogflow' and document 'agent'.doc('Vehicles');
    const dialogflowAgentDoc = db.collection('Inventory');

    // Get the value of 'entry' in the document and send it to the user
    return dialogflowAgentDoc.get()
      .then(doc => {
        if (!doc.exists) {
          agent.add('No data found in the database!');
        } else {
          agent.add(doc.data().vehiclename);
        }
        return Promise.resolve('Read complete');
      }).catch(() => {
        agent.add('Error reading entry from the Inventory database.');
     //   agent.add('Please add a entry to the database first by saying, "Write <your phrase> to the database"');
      });
  }
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  //intentMap.set('AddInventoryIntent', addVehicleHandler);
 // intentMap.set('getVehicleNames', readFromDb);
  intentMap.set('addVehicleName', addVehicleHandler);
  intentMap.set('updatevehiclename', updateVehicleModelHandler);
  intentMap.set('updatevehiclequantity', updateVehicleQuantityHandler);
  intentMap.set('getVehicleNames', getVehicleHandler);
  intentMap.set('getVehicleQuantity', getVehicleQuantityHandler);
  intentMap.set('deleteVechicleName', deleteVehicleHandler);
  
  agent.handleRequest(intentMap);
});
