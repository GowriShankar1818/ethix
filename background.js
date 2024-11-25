chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'showNotification') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: "notification.png", // replace with your icon
            title: `Warning!  Warning!  Warning!`,
            // message: request.text,
            message:"Oops! It looks like you've included some sensitive information. No worries, Genesis has got your back! Why not try rephrasing it?",
            priority: 2
        });
    }

    if (request.type === 'pasteBlockWarning') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: "notification.png", // replace with your icon
            title: `Warning!  Warning!  Warning!`,
            // message: request.text,
            message:"Pasting is disabled",
            priority: 2
        });
    }

    /*if (request.type === 'rightClickWarning') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: "notification.png", // replace with your icon
            title: `Warning!  Warning!  Warning!`,
            // message: request.text,
            message:"Oops! It looks like you've included some sensitive information. No worries, Genesis has got your back! Why not try rephrasing it?",
            priority: 2
        });
    }*/


});

// chrome.webNavigation.onCompleted.addListener((details) => {
//     if (details.url.includes('chatgpt.com')) {
//       chrome.scripting.executeScript({
//         target: {tabId: details.tabId},
//         files: ['content.js']
//       });
//     }
//   }, {url: [{hostContains: 'chatgpt.com'}]});
  