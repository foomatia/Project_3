
from types import prepare_class
import numpy as np
import pandas as pd

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func
from flask import Flask, render_template
import json
 


from flask import Flask, jsonify


#################################################
# Database Setup
#################################################
engine = create_engine("sqlite:///ofsted_results.sqlite")

# reflect an existing database into a new model
Base = automap_base()
# reflect the tables
Base.prepare(autoload_with=engine)

# Save reference to the table
School = Base.classes.ofsted_data

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
        f"/extract"
    )

@app.route("/extract")
def extract():
    # Create our session (link) from Python to the DB
    session = Session(engine)

    # Query all schools
    results = session.query(School.Web_Link, School.URN, School.School_name, School.Ofsted_phase, School.Local_authority, School.Postcode, 
                            School.Total_number_of_pupils, School.Inspection_start_date, School.Inspection_end_date, School.Publication_date,
                            School.Overall_effectiveness, School.Category_of_concern,
                            School.Quality_of_education, School.Behaviour_and_attitudes, School.Personal_development, School.Effectiveness_of_leadership_and_management,
                            School.lat, School.lon).all()

    session.close()

    # Create a dictionary from the row data and append to a list of all_schools
    all_schools = []
    for Web_Link, URN, School_name, Ofsted_phase, Local_authority, Postcode, lat, lon in results:
        school_dict = {}
        school_dict["Web_Link"] = Web_Link
        school_dict["URN"] = URN
        school_dict["School_name"] = School_name
        school_dict["Ofsted_phase"] = Ofsted_phase
        school_dict["Local_authority"] = Local_authority
        school_dict["Postcode"] = Postcode
        school_dict["Latitude"] = lat 
        school_dict["Longitude"] = lon
        all_schools.append(school_dict)


    file2 = open('static/allschools_JSON.json', 'w')
    file2.write(json.dumps(all_schools))
    file2.close

    #pclasslist = [a['pclass'] for a in all_schools]
    #pclass_dict = {
    #"pclassind":list(pd.Series(pclasslist).value_counts().index),
    #"pclassvc" :list(pd.Series(pclasslist).value_counts())
    #}

    #file4 = open('static/pclass_JSON.json', 'w')
    #file4.write(json.dumps(pclass_dict))
    #file4.close

    return render_template('home.html')

if __name__ == '__main__':
    app.run(debug=True)
