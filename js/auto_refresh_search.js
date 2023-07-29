// Sending messages from Content Script
var msg = 'Looking for it...';
var keepRefreshing = true;
// Change the name of the task you wish to search for here
var targetString = 'Urban images annotation'; 
var targetString_noHIT = 'There are no more of these HITs available';
var visibleNumOfHIT = '';
var visibleTime = 0;
// This address needs to be replaced with the target preview page
var targetHITPreviewPage = "https://worker.mturk.com/requesters/A2GF0GIXGI9VKH/projects?ref=w_pl_prvw";

function myRefresh() {
  // Simulate a mouse click:
  window.location.href = targetHITPreviewPage;
  // window.location.reload();
  lookForBatch();
}

// Check if the frameset contains the target batch
function lookForBatch() {
  if (window.document.activeElement.innerText.indexOf(targetString) !== -1) {
    msg = 'Preview Page Available';

    visibleTime = getCurrentTime();

    // Stops refreshing when target is found, currently unavailable
    keepRefreshing = false;

    // Record the visible HIT in the task search list after each refresh
    visibleNumOfHIT = document.getElementsByClassName('p-x-sm column task-column hidden-sm-down text-xs-right')[0].innerText
    // Record the number of HITs in the Preview page after each page refresh
    // var targetDOM = document.getElementsByClassName('col-xs-3 col-sm-2')[0]
    // visibleNumOfHIT = targetDOM.getElementsByClassName('detail-bar-value')[0].innerText
    // console.log(visibleNumOfHIT)
    // Only send a Message to Extension when the target is found
    sendMessageToExtension();
  }
  else {
    msg = 'No more HIT available';
    visibleTime = getCurrentTime();
    visibleNumOfHIT = 0;
    sendMessageToExtension();
  }
}

function sendMessageToExtension() {
  chrome.runtime.sendMessage({ message: msg, keepRefreshing: keepRefreshing, visibleNumOfHIT: visibleNumOfHIT, visibleTime: visibleTime }, function (response) {
    console.log(response);
  });
}

// Get the current time in milliseconds
function getCurrentTime() {
  var myDate = new Date().getTime();
  return myDate;
}

myRefresh();
