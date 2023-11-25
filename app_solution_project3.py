
from types import prepare_class
import numpy as np
import pandas as pd

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text, func
from flask import Flask, render_template
import json
 


from flask import Flask, jsonify


#################################################
# Database Setup
#################################################
# Create the engine
engine = create_engine("sqlite:///ofsted_results.sqlite")

# # reflect an existing database into a new model
# Base = automap_base()
# # reflect the tables
# Base.prepare(autoload_with=engine)

# # Save reference to the table
# School = Base.classes.ofsted_data

#################################################
# Flask Setup
#################################################
app = Flask(__name__)


#################################################
# Flask Routes
#################################################

@app.route("/")
def welcome():
    """List all available api routes."""
    return (
        f"Available Routes:<br/>"
        f"/dashboard"
    )


@app.route("/dashboard")
def dashboard():
    # Create our session (link) from Python to the DB
    session = Session(engine)

    # Get the data from the db
    data = session.execute(text('SELECT * FROM ofsted_data')).fetchall()

    # create a DF of the data
    ofsted_data = pd.DataFrame(data)

    session.close()

    # Convert the df to a JSON file
    ofsted_data.to_json("static/ofsted_data.json", orient='records', indent=4)

    # Web_Link, URN, School_name, Ofsted_phase, Local_authority, Postcode, lat, lon

    web_link = list(ofsted_data["Web_Link"])
    urn = list(ofsted_data["URN"])
    school_name = list(ofsted_data["School_name"])
    ofsted_phase = {
        "Phase": list(ofsted_data["Ofsted_phase"].value_counts().index),
        "Count": list(ofsted_data["Ofsted_phase"].value_counts())
        }
    local_auth = list(ofsted_data["Local_authority"])
    postcode = list(ofsted_data["Postcode"])
    lat = list(ofsted_data["lat"])
    lon = list(ofsted_data["lon"])
    ofsted_ratings_count = {
        "Grades" : list(ofsted_data["Overall_effectiveness"].value_counts().index),
        "Values" : list(ofsted_data["Overall_effectiveness"].value_counts())
        }

    file1 = open('static/weblink_JSON.json', 'w')
    file1.write(json.dumps(web_link))
    file1.close

    file2 = open('static/urn_JSON.json', 'w')
    file2.write(json.dumps(urn))
    file2.close

    file3 = open('static/schoolname_JSON.json', 'w')
    file3.write(json.dumps(school_name))
    file3.close

    file4 = open('static/ofstedphase_JSON.json', 'w')
    file4.write(json.dumps(ofsted_phase))
    file4.close

    file5 = open('static/localauth_JSON.json', 'w')
    file5.write(json.dumps(local_auth))
    file5.close

    file6 = open('static/postcode_JSON.json', 'w')
    file6.write(json.dumps(postcode))
    file6.close    

    file7 = open('static/lat_JSON.json', 'w')
    file7.write(json.dumps(lat))
    file7.close

    file8 = open('static/lon_JSON.json', 'w')
    file8.write(json.dumps(lon))
    file8.close

    file9 = open('static/ofstedcounts_JSON.json', 'w')
    file9.write(json.dumps(ofsted_ratings_count))
    file9.close

    #pclasslist = [a['pclass'] for a in all_schools]
    #pclass_dict = {
    #"pclassind":list(pd.Series(pclasslist).value_counts().index),
    #"pclassvc" :list(pd.Series(pclasslist).value_counts())
    #}

    #file4 = open('static/pclass_JSON.json', 'w')
    #file4.write(json.dumps(pclass_dict))
    #file4.close

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
