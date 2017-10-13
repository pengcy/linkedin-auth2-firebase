'use strict'
const https = require('https');
const crypto = require('crypto');

// credentials
const config = require('./config.json');
const credentials = {
  client: {
    id: config.linkedin.clientId,
    secret: config.linkedin.clientSecret
  },
  auth: {
    tokenHost: config.auth.tokenHost,
    tokenPath: config.auth.tokenPath
  }
};
const oauth2 = require('simple-oauth2').create(credentials);

// firebase
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});


function redirect(req, res) {
	const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
	console.log('Setting state cookie for verification:', state);
	const secureCookie = req.get('host').indexOf('localhost:') !== 0;
	console.log('Need a secure cookie (i.e. not on localhost)?', secureCookie);
	res.cookie('state', state, {maxAge: 3600000, secure: secureCookie, httpOnly: true});


	var redirectUri = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${credentials.client.id}&redirect_uri=${req.protocol}://${req.get('host')}/linkedin-callback&state=${state}&scope=r_basicprofile`;
	console.log('Redirecting to:', redirectUri);
	res.redirect(redirectUri);
}


function linkedinCallback(req, res) {
	console.log('Received state cookie:', req.cookies.state);
	console.log('Received state query parameter:', req.query.state);
	if (!req.cookies.state) {
		res.status(400).send('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
	} else if (req.cookies.state !== req.query.state) {
		res.status(400).send('State validation failed');
	}
	console.log('Received auth code:', req.query.code);
	oauth2.authorizationCode.getToken({
		code: req.query.code,
		redirect_uri: `${req.protocol}://${req.get('host')}/linkedin-callback`
	}).then(results => {
		console.log('Auth code exchange result received:', results);

		getUserData(results.access_token)
		.then(userData => {
			console.log(userData);
			// Create a Firebase Account and get the custom Auth Token.
			createFirebaseAccount(userData.id, userData.formattedName, userData.pictureUrl, results.access_token)
			.then(firebaseToken => {
		  		// Serve an HTML page that signs the user in and updates the user profile.
				res.send(signInFirebaseTemplate(firebaseToken, userData.formattedName, userData.pictureUrl, userData.headline, results.access_token));
			});
		});
	});
}

function getUserData(accessToken) {

	return new Promise((resolve, reject) => {
		var options = {        
		        hostname: 'api.linkedin.com',
		        port: 443,
		        path: '/v1/people/~:(id,headline,email-address,formatted-name,phone-numbers,picture-url)?format=json',
		        method: 'GET',
		        headers:{
		            Authorization: 'Bearer ' + accessToken            
		       }
		};
		console.log(options);
		var getReq = https.request(options, function(res) {

	    	console.log("\nstatus code: ", res.statusCode);
	    	res.on('data', function(response) {
	        	try {
	        		var resObj = JSON.parse(response);
	    			console.log("response: ", resObj);
	        		if (res.statusCode == 200) {
	        			resolve(resObj);
	        		} else {
	        			reject(resObj);
	        		}
	        	} catch (err) {
	    			reject(err);
	        	}
	       	});
	    });
	 
	    getReq.end();
	    getReq.on('error', function(err) {
	    	reject(err);
	    }); 

	});

}


function createFirebaseAccount(linkedinID, displayName, photoURL, accessToken) {
  // The UID we'll assign to the user.
  const uid = `linkedin:${linkedinID}`;

  // Save the access token to the Firebase Realtime Database.
  const databaseTask = admin.database().ref(`/linkedinAccessToken/${uid}`)
      .set(accessToken);

  // Create or update the user account.
  const userCreationTask = admin.auth().updateUser(uid, {
    photoURL: photoURL,
    displayName: displayName
  }).catch(error => {
    // If user does not exists we create it.
    if (error.code === 'auth/user-not-found') {
      return admin.auth().createUser({
        uid: uid,
        photoURL: photoURL,
        displayName: displayName
      });
    }
    throw error;
  });

  // Wait for all async task to complete then generate and return a custom auth token.
  return Promise.all([userCreationTask, databaseTask]).then(() => {
    // Create a Firebase custom auth token.
    const token = admin.auth().createCustomToken(uid);
    console.log('Created Custom token for UID "', uid, '" Token:', token);
    return token;
  });
}



// Template for signing user into firebase through the provided token and close the popup windown
function signInFirebaseTemplate(token) {
  return `
    <script src="https://www.gstatic.com/firebasejs/4.5.1/firebase.js"></script>
    <script>
      var token = '${token}';
      var config = {
        apiKey: '${config.firebase.apiKey}'
      };
      var app = firebase.initializeApp(config);
      app.auth().signInWithCustomToken(token).then(function() {
        window.close();
      });
    </script>`;
}

exports.setApp = function(app) {
	app.get('/redirect', redirect);
	app.get('/linkedin-callback', linkedinCallback);
}


