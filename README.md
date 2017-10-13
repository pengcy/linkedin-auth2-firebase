# Use LinkedIn Sign In with Firebase

This sample is based off from this [Instagram Sample](https://github.com/firebase/custom-auth-samples/tree/master/instagram)


### LinkedIn app's creation and setup

 1. Register an LinkedIn app on [LinkedIn for Developers](https://www.linkedin.com/developer/apps).
 1. Once Your app is created make sure you specify your app's callback URL in the list of **Valid redirect URIs** of your LinkedIn app. You should whitelist `http://localhost:3030/linkedin-callback` for local development.
 1. Copy the **Client ID** and the **Client Secret** of your LinkedIn app and copy it into `config_.json` in place of the placeholders, and rename the file to config.json


### Firebase app creation and setup

 1. Create a Firebase project using the [Firebase Developer Console](https://console.firebase.google.com).
 1. **For the web app:** Copy the Web initialisation snippet from **Firebase Console > Overview > Add Firebase to your web app** and paste it in `public/index.html` in lieu of the placeholders (where the `TODO(DEVELOPER)` is located).
 1. **For the server:** From the Firebase initialization snippet copy the `apiKey` value and paste it in `config.json` as the value of `firebase.apiKey` in lieu of the placeholder.

Create and provide a Service Account's keys:
 1. Create a Service Accounts file as described in the [Server SDK setup instructions](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
 1. Save the Service Account credential file as `service-account.json`

Deploy your security rules:
 1. Run `firebase use --add` and choose your Firebase project. This will configure the Firebase CLI to use the correct
    project locally.
 1. Run `firebase deploy` to deploy the security rules of the Realtime Database


## Run the sample locally

You can run the sample web app locally by running the following in a command line window.
`
npm install
node app.js
`

Then open `http://localhost:3030` in your browser.



# Oauth 2 flows
1. When you click the **Sign in with Linkedin** button, it goes to localhost:8080/redirect on a new browser window
2. The server process this request and **redirects to the linkedin oauth endpoint**, https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${credentials.client.id}&redirect_uri=${req.protocol}://${req.get('host')}/linkedin-callback&state=${state}&scope=r_basicprofile
3. If the user has already granted the linkedin service to the web app, it will redirect back to the specified redirect uri. Otherwise, it will ask the uesr to grant the permissions the web app is asking for.
4. After the user granted the permissions and gets **redirected back with the authorization code** to the web server. i.e. localhost:3030/linkedin-callback?code=faskldjfioajglakjsdfagoijefaj
5. The web server will then **use the authorization code to exchange for an access token** from linkedin.
6. After the linkedin access token is retrieved, the web server will make a **call to linkedin again with the access token to retrieve user profile data**.
7. Now the web server has the LinkedIn access token and the user profile data, it then send those to **firebase for creating an account in firebase**.
8. Firebase will create the user and **return a firebase access token** back to the web app server.
9. The web app server then **sends the firebase access token to the web browser**, alone with javascript code that initializes firebase on the browser, and then closes the popup window it was launched when the sign in button was clicked.
10. Now the web browser has the firebase access token which can be used to identify the user, and it can use it to retrieve user profile.

### LinkedIn Reference:
https://developer.linkedin.com/docs/oauth2

### Note for LinkedIn mobile access token
[Android LinkedIn SDK produces unusable access tokens](https://stackoverflow.com/a/30082316/2069407)

[Mobile vs. server-side access tokens](https://developer.linkedin.com/docs/android-sdk-auth)

It is important to note that access tokens that are acquired via the Mobile SDK are only useable with the Mobile SDK, and cannot be used to make server-side REST API calls.

Similarly, access tokens that you already have stored from your users that authenticated using a server-side REST API call will not work with the Mobile SDK.



