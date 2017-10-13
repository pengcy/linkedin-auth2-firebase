'use strict';

// Initializes the Demo.
function Demo() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    this.signInButton = document.getElementById('demo-sign-in-button');
    this.signOutButton = document.getElementById('demo-sign-out-button');
    this.nameContainer = document.getElementById('demo-name-container');

    this.deleteButton = document.getElementById('demo-delete-button');
    this.profilePic = document.getElementById('demo-profile-pic');
    
    // Bind events.
    this.signInButton.addEventListener('click', this.onSignInButtonClick.bind(this));
    this.signOutButton.addEventListener('click', this.onSignOutButtonClick.bind(this));
    this.deleteButton.addEventListener('click', this.onDeleteAccountButtonClick.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
  }.bind(this));
}

// Triggered on Firebase auth state change.
Demo.prototype.onAuthStateChanged = function(user) {
  // Skip token refresh.
  if(user && user.uid === this.lastUid) return;
  console.log(user);

  if (user) {
    this.lastUid = user.uid;
    this.profilePic.src = user.photoURL;
    this.nameContainer.innerText = user.displayName;
    this.linkedinTokenRef = firebase.database().ref('/linkedinAccessToken/' + user.uid);
  } else {
    this.lastUid = null;
    this.profilePic.src = '';
    this.nameContainer.innerText = '';
  }
};

// Initiates the sign-in flow using LinkedIn sign in in a popup.
Demo.prototype.onSignInButtonClick = function() {
  // Open the Auth flow as a popup.
  window.open('/redirect', 'firebaseAuth', 'height=500,width=800');
};

// Signs-out of Firebase.
Demo.prototype.onSignOutButtonClick = function() {
  firebase.auth().signOut();
};

// Deletes the user's account.
Demo.prototype.onDeleteAccountButtonClick = function() {
  this.linkedinTokenRef.remove().then(function() {
    firebase.auth().currentUser.delete().then(function () {
      window.alert('Account deleted');
    }).catch(function (error) {
      if (error.code === 'auth/requires-recent-login') {
        window.alert('You need to have recently signed-in to delete your account. Please sign-in and try again.');
        firebase.auth().signOut();
      }
    });
  });
};

// Load the demo.
new Demo();
