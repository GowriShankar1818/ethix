console.log("Content script loaded!");
// Code to disable PASTE option in ChatGPT
// ---------------------------------------------------------------------------
// Initializes listeners for paste, Ctrl+V prevention, and "send" button clicks

function initializeListeners() {
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('keydown', handleKeydown);
    checkSendButton(); 
    checkEnterKey();
}

function handlePaste(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    chrome.runtime.sendMessage({ type: 'pasteBlockWarning' });
}

function handleKeydown(event) {
    if (event.ctrlKey && event.key === 'v') {
        event.preventDefault();
        event.stopImmediatePropagation();
        chrome.runtime.sendMessage({ type: 'pasteBlockWarning' });
    }
}
// --------------------------------------------------------------------------------
// Simulating click event through script
// --------------------------------------------------------------
function simulateClick(element, originalEvent) {
    
    const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(event);
     
}

function clickSendButton() {
    const sendButton = document.querySelector('[data-testid="send-button"]'); // Adjust selector as needed
    if (sendButton) {    
        simulateClick(sendButton, event);
        console.log('Send button clicked.');
    } else {

        console.log('Send button not found.');
    }  
}

function checkSendButton() {
    const sendButton = document.querySelector('[data-testid="send-button"]');
    if (sendButton) {       
        sendButton.addEventListener('click', handleSendButtonClick);      
    } else {
        setTimeout(checkSendButton, 1000);
    }
}

function checkEnterKey() {
    var textarea = document.getElementById("prompt-textarea");
    
    try {
        textarea.addEventListener("keydown", keyPress, true);
    } catch (event) {
        textarea.attachEvent("onkeydown", keyPress);
    }
}

function keyPress(event) {   
    if (event.key === 'Enter') {
        handleEnterKey(event);
    } else {
        return;
    }
}

// function to fetch the text from text area
// ---------------------------------------------------------
function _getSelectedTextFromTab() {
    var selection = window.getSelection().toString();
    const selection_value = document.getElementById("prompt-textarea").value;
    if (selection == "") {
        return selection_value;
    } else {
        return selection;
    }
};

function waitForElem(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

let hasReturnedNERResult = false;

async function handleSendButtonClick(event) {
   
    console.log('hasreturned: ' + hasReturnedNERResult);
    if (!hasReturnedNERResult) {
        // the below two lines are common for both PII and Non PII 
        // For Non PII, stopImmediatePropagation is still active even though 
        // when we call handleSendButtonClick 2nd time in else coondition. 
        event.preventDefault();
        event.stopImmediatePropagation(); 
                 
        console.log('Starting NER check...');
        try {
            const result = await getNERResult(); 
            console.log('NER check result:', result); 
           
            if (result) {
                console.log('Sensitive info detected. Preventing action.');                       
            } else {
                console.log('No sensitive info. Proceeding with action.');
                
                hasReturnedNERResult = true; // Mark NER check as complete
                clickSendButton(event);             
                //handleSendButtonClick(event);
            }
        } catch (error) {
            console.error('Error during NER check:', error);          
        }

    }  
};


// Function to handle the Enter key press
async function handleEnterKey(event) {
    if (event.key === 'Enter') {
        console.log('Enter key pressed');
        
        console.log('hasReturnedNERResult:', hasReturnedNERResult);
        if (!hasReturnedNERResult) {
            // Prevent the default action and stop propagation for NER check
            event.preventDefault();
            event.stopImmediatePropagation();

            console.log('Starting NER check...');
            try {
                // var ptag2 = document.getElementsByTagName('p')[0].innerHTML;
                // console.log('p tag2: ' + ptag2);
                const result2 = await getNERResult(); // Perform NER check
                console.log('NER check result:', result2);

                if (result2) {
                    console.log('Sensitive info detected. Preventing action.');
                    // Handle sensitive info case here (e.g., show a warning)
                } else {
                    console.log('No sensitive info. Proceeding with action.');
                    
                    hasReturnedNERResult = true; // Mark NER check as complete
                    clickSendButton(event); // Call the action function
                }
            } catch (error) {
                console.error('Error during NER check:', error);
            }
        }
    }
}

// Attach the function to the keydown event
document.onkeydown = handleEnterKey;

function observeDOMChanges() {
    const targetNode = document.body;
    //const targetNode = document.getElementById("prompt-textarea");

    const config = {attributes:true, childList: true, subtree: true }; // Watch for added/removed nodes or subtree changes
    
    const observer = new MutationObserver((mutationsList) => {
        //we need to set here hasReturnedNERResult to False.
        hasReturnedNERResult = false;       
        for (let mutation of mutationsList) {        
            if (mutation.type === 'childList' ) {
                console.log("Page modified, re-adding listeners...");                         
                initializeListeners(); // Your custom function to reset event listeners
            }
            // } else  if (mutation.type === 'attributes' ) {
            //     console.log("Page modified attributes, re-adding listeners...");                         
            //     initializeListeners(); // Your custom function to reset event listeners
                
            // }
        }
    });    
    observer.observe(targetNode, config);
};
   observeDOMChanges();

// ------------------------------------------------------------

// Inject _getSelectedTextFromTab into current page and 
// populate the textarea for user input in the popup with the selected text
async function getSelectedText() {
    // Get information about the currently active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let tab = tabs[0];

        // Inject JavaScript into the active tab to get the text selected by the user
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id }, 
                // function: _getSelectedTextFromTab,             // Specify a target to inject JavaScript
                function: _getSelectedTextFromTab,      // Function to be injected into the target
            },
            ([res]) => {
                // If selection is not empty, populate the input textarea
                if (res["result"] !== "") {
                    // var ac=res["result"];
                    document.getElementById("input_text").value = res["result"];
                    // Automatically call the getNERResult function
                    getNERResult();
                }
            }
        );
    });
};


//base_url = "https://ec2instance.ethix4ai.com:8080";
base_url = "http://127.0.0.1:8000";
async function doPost(url, body, callback) {
    const postNERResultPromise = new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true); // true for asynchronous
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            }
        };
        xhr.onerror = function () {
            reject({
                isError: true,
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.send(body);
    });
    return await postNERResultPromise;
}


// Obtain the NER result from the API server
async function getNERResult() {
    let hasPiiInContent = null;

    const nerResultElem = document.getElementById("ner_result");
    console.log("Value from nerResultElem: " +nerResultElem);
    
    if (nerResultElem) {
        nerResultElem.style.display = "none";
    }

    // this I guess is part of popup.html, might not be useful in our case
    let error_box = document.getElementById("error_box");
    let text = document.getElementById("input_text")?.value;
    
    console.log("Value from text: " +text);
    
    // let text = selectedText;
    let loading_text = document.getElementById("loading_text");
    console.log("Value from loading_text: " +loading_text);
    // If there is no input text in input area of popup.html, throws error 
    if (text == "" && error_box) {
        error_box.innerHTML = "No text available to detect entities! Please enter something";
        error_box.style.display = "block";
    }
    else {
        if (error_box && loading_text && document.getElementById("loading")) {
            error_box.style.display = "none";
            console.log("Value from Confidential: ");
    
            // Start displaying the spinner
            loading_text.innerHTML = "Confidential results are on way...";
            document.getElementById("loading").style.display = "block";

        }
        //text = document.getElementById("prompt-textarea").value;

        text = document.getElementById("prompt-textarea").innerText;
        console.log("textValue1:" +text);
        

        // sCreate the JSON request body as specified in the API endpoint
        var body = JSON.stringify({
            text: text
        })
        console.log("Value from json body text: " +text);
    
        
        let ner_url = `${base_url}/predict/`;    // POST endpoint to be hit
        console.log("Value from prompt-ner_url: " +ner_url);

        try {
            
            
            let res = await doPost(ner_url, body);
            console.log("Response from Python res: " +res);

            // REQUIRES VALIDATION OF ELEMENT: document.getElementById("loading").style.display = "none";
            // NOTE (DM): ^^ might be able use the waitForElem() if you keep it.

            if (res.isError) {
                hasPiiInContent = true; // might not want to be true
                piiCheckPromise.resolve(piiCheckPromise);
                error_box.innerHTML = "Sorry! Error in detecting entities in input text";
                error_box.style.display = "block";
            } else {
                // DELETE? : piiCheckPromise.resolve(hasPiiInContent); // This should fire the .then in _getSelectedTextFromTab 

                res = JSON.parse(res);
                hasPiiInContent = res['entities'] && res['entities'] !== "" && Array.isArray(res['entities']) && res['entities'].length > 0;
                let entities = JSON.stringify(res["entities"], null, 2);
                var outputArray = JSON.parse(entities);
                if (outputArray.length !== 0) {
                    chrome.runtime.sendMessage({
                        type: 'showNotification',
                        text: 'Entities detected: ' + entities
                    });
                } else {
                 
                }
                // Populate the output textarea with the detected entities
                // REQUIRES VALIDATION OF ELEMENT'S EXISTANCE
                //document.getElementById("ner_text").value = entities;
                // Display the output in the popup
                // REQUIRES VALIDATION OF ELEMENT'S EXISTANCE
                // document.getElementById("ner_result").style.display = "block";
            }
            // });
        } catch (error) {
            console.error("Error:", error);
            if (outputArray.length === 0) {
                return false;
            } else {

                return true;
            } // Has PII, stop default
        }
        return hasPiiInContent;
    }
}


// document.getElementById("submit_text").addEventListener("click", getNERResult);
//let hasPiiInContent = false;
//const piiCheckPromise = new Promise((resolve) => null, (reject) => reject);
//     (resolve, reject) => {
//     if (resolve) {
//         resolve();
//     }
// });
