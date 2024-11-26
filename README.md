# Project Genesis

## Launch Server
- Run ```pip install -r requirements.txt```
- Run ```python main.py```

## Launch JS
- Open popup.html in Chrome to verify page loads correctly

## Build Extension in Browser
NOTE: this will not work if you have \_\_pycache\_\_ in the same folder. The directory structure must be adjusted to resolve this.

- Navigate to chrome://extensions
- Enable "Developer Mode"
- Click "Load Unpacked" and select the folder with your extension files
- The extension will appear in your extensions menu at the top right of the browser

## Debug Extensions
- Right-click on the extension
- Select "Inspect pop-up window" and a debug console should open
- For further information, see https://developer.chrome.com/docs/extensions/get-started/tutorial/debug

This is a test update.