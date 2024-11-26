from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from modelfile import NERModel
import uvicorn
 
# Load the NER model
ner = NERModel()
 
# Define the request body structure
class Text(BaseModel):
    text: str
 
# Initialize the FastAPI application
app = FastAPI()
 
# Allow Cross-Origin Resource Sharing (CORS)
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your allowed domains
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # List of specific HTTP methods to allow
    allow_headers=["Authorization", "Content-Type", "Origin", "X-Auth-Token"],  # Specify allowed headers
    allow_credentials=True  # Include credentials like cookies or Authorization headers
)
# API root
@app.get("/")
def get_root():
    return {"message": "This is the RESTful API for your NER application"}
 
 
 
# POST endpoint for predicting entities
@app.post("/predict")
async def predict_entities(text: Text):
    entities = ner.predict_entities(text.text)
 
    # Separate valid predictions and other predictions
    valid_predictions = []
    other_predictions = []
 
    for item in entities:
        if item['entity'] in ["ACCOUNTNUMBER", "CREDITCARDNUMBER", "SSN", "PHONEIMEI"]:
            if ner.match_pattern(item['entity'], item['word']):
                valid_predictions.append(f"Token: {item['word']}, Entity: {item['entity']}")
        else:
            if item['entity'] is not None:
                other_predictions.append(f"Token: {item['word']}, Entity: {item['entity']}")
 
    # Combine valid predictions and other predictions
    final_output = valid_predictions + other_predictions
 
    # Log the results for debugging
    print("Final Entity Predictions:")
    if final_output:
        for output in final_output:
            print(output)
    else:
        print("No valid entities found.")
 
    # Return the response
    return {
        "original": text.text,
        "entities": final_output
    }
 
# Run the app
if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)