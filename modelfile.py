import re
import requests
import json
import torch
 
class NERModel:
    def __init__(self):
        # Use CUDA if available, otherwise CPU
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
 
        # Define the API Gateway URL (update this with your actual API Gateway URL)
        self.api_url = "https://f8q0uyl35f.execute-api.us-east-1.amazonaws.com/ETHIX4AI/dev_api"
 
    def predict_entities(self, text):
        # Prepare payload for API request
        payload = {"text": text}
       
        # Set headers for API Gateway
        headers = {"Content-Type": "application/json"}
       
        # Send a POST request to the API
        try:
            response = requests.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()  # Raise error for 4xx/5xx status codes
        except requests.RequestException as e:
            print("API request failed:", e)
            return []  # Return empty list on error
 
        # Parse JSON response if successful
        result = response.json().get('response', [])
       
        # Filter and format results with a score threshold
        entities = [
            (item["word"], item["entity"], item["score"])
            for item in result if item["score"] >= 0.7  # Keep predictions with ≥ 70% confidence
        ]
 
        # Initialize formatted output
        formatted_output = []
        for word, label, score in entities:
            if word in ["[CLS]", "[SEP]"]:
                continue
            elif word.startswith("##"):
                # Append subword to previous word
                formatted_output[-1]["word"] += word[2:]
            else:
                label = label.replace('B-', '').replace('I-', '')  # Remove prefix from labels
                if formatted_output and formatted_output[-1]["entity"] == label:
                    formatted_output[-1]["word"] += " " + word  # Append word to previous if label matches
                else:
                    formatted_output.append({"word": word, "entity": label if label != 'O' else None, "score": score})
 
        return formatted_output
 
    def match_pattern(self, entity, token):
        # Patterns for validating detected entities
        patterns = {
            'ACCOUNTNUMBER': r'^\d{8,12}$',        # Account number: 8-12 digits
            'CREDITCARDNUMBER': r'^\d{16}$',    # Credit card number: 13-16 digits
            'SSN': r'^\d{9}$',
            'PHONEIMEI': r'^\d{15}$',              # IMEI: 15 digits
            'IBAN': r'^[A-Z]{2}\d{2}[A-Z0-9]{15,30}$',  # IBAN format
            'PASSWORD': r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
            'ZIPCODE' : r'^\d{5}$'
        }
       
        pattern = patterns.get(entity)
        return re.match(pattern, token) is not None if pattern else False
 
if __name__ == "__main__":
    ner_model = NERModel()
    text = "my password is somisetty@2435"
    # Get the entity predictions from API Gateway
    predictions = ner_model.predict_entities(text)
 
    # Separate valid and other predictions based on pattern matching
    valid_predictions = []
    other_predictions = []
 
    for item in predictions:
        if item['entity'] in ["ACCOUNTNUMBER", "CREDITCARDNUMBER", "PHONEIMEI", "IBAN", "SSN","ZIPCODE"]:
            if ner_model.match_pattern(item['entity'], item['word']):
                valid_predictions.append(
                    f"Token: {item['word']}, Entity: {item['entity']}, Score: {item['score']:.2f}"
                )
        else:
            if item['entity'] is not None:
                other_predictions.append(
                    f"Token: {item['word']}, Entity: {item['entity']}, Score: {item['score']:.2f}"
                )
 
    # Combine valid predictions and other predictions
    final_output = valid_predictions + other_predictions
 
    # Print the results
    print("Final Entity Predictions with Scores:")
    if final_output:
        for output in final_output:
            print(output)
    else:
        print("No valid entities found.")
 