function regionUpdate(region){

    // Check if the dropdown region selected is not empty
    if (region != "") {

    const jsonFile = "../static/ofsted_data.json"  

    // Clear the current map contents ready to be re-initialized
    var container = L.DomUtil.get('map-id');
    if(container != null){
        container._leaflet_id = null;
    }
        // https://stackoverflow.com/a/50034912/21871037

    d3.select("#reset").attr("hidden", null);
    d3.select("#school").attr("hidden", null);
    d3.select("#sm-school").attr("hidden", null);

    // lowercase and space removed region
    let reg_file = region.toLowerCase().replaceAll(" ","_");

    // load in promises
    Promise.all([
        d3.json(jsonFile),
        d3.json(`../static/geojson/${reg_file}.geojson`)        
    ])
    .then(([data, geoData]) => {

        let regionOnly = data.filter((data) => data.Local_authority === region);

        // Populate school dropdown

        // Create a list for SchoolNames
        let school_nmes = [];

        // Loop and append schools
        for (let school in regionOnly){
            school_nmes.push(regionOnly[school].School_name);
        }

        let school_nmes_sorted = school_nmes.sort();
        
        // Clear the current list
        d3.select("#school").html("");

        for (let school in school_nmes_sorted){
            d3.select("#school").append("option").attr("value", `${school_nmes_sorted[school]}`).text(`${school_nmes_sorted[school]}`);
        };

        // Create prim and secon arrays
        let primary_markers = [];
        let secondary_markers = [];
        
        // Create all markers
        for (let i = 0; i < regionOnly.length; i++){
            if (regionOnly[i].Local_authority === region){
                // Create marker
                let marker = L.marker([regionOnly[i].lat, data[i].lon])
                .bindPopup(`<h6>${regionOnly[i].School_name}</h6></hr>\
                <b>URN:</b> ${regionOnly[i].URN}</br>\
                <b>Ofsted Rating:</b> ${regionOnly[i].Overall_effectiveness}</br>\
                <a target="_blank" href=${regionOnly[i].Web_Link}>Ofsted Reports</a>`);
                
                // Push to array
                if (regionOnly[i].Ofsted_phase === "Primary"){
                    primary_markers.push(marker);
                } else {
                    secondary_markers.push(marker);
                }
            }
        }

        // Create primary secondary layerGroups
        let primary = L.layerGroup(primary_markers);
        let secondary = L.layerGroup(secondary_markers);

        // Create the geoJson poly
        let region_geo = L.geoJSON(geoData,{
            style:{
                color: "purple",
                weight: 1.5,
                opacity: 1,
                fillColor: "rgb(126,185,229)",
                fillOpacity: 0.25
            }
        })
            .bindPopup(`<h6>${region}</h6>`);
        
        // Store region lat, long
        let lat_lon = [geoData.features[0].properties.lat, geoData.features[0].properties.long];        

        updateMap(primary, secondary, region_geo, lat_lon);
        genRegionBarPieChart(region);

    })

}

function updateMap(prime, secon, reg, lat_lon){

    // Create the tile layer that will be the background of our map.
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // Create a baseMaps object to hold the lightmap layer.
    let baseMaps = {
        Street : street
    };

    // Create an overlayMaps object to hold the markers layers.
    let overlayMaps = {
        Primary: prime,
        Secondary: secon
    };

    // Create the map object with options.
    let myMap = L.map("map-id", {
        center : lat_lon,
        zoom: 9,
        layers: [street]
  });

    // Create individual Conditionals Layers
    let layer1 = prime;
    let layer2 = secon;
    let layer3 = reg;
    
    // Create Conditionals LayerGroup
    let layerGroup = L.layerGroup.conditional()
                                .addConditionalLayer((level) => level <= 11, layer3)
                                .addConditionalLayer((level) => level >= 11, layer1)
                                .addConditionalLayer((level) => level >= 11, layer2)
                                .addTo(myMap);

    // Set up a zoom handler to update conditional layers when the user zooms.
    var zoomHandler = function(event) {
        var zoomLevel = myMap.getZoom();        
        layerGroup.updateConditionalLayers(zoomLevel);
     }
     myMap.on('zoomend', zoomHandler);
 
    // Set initial state of conditional layers
    layerGroup.updateConditionalLayers(myMap.getZoom());

    // Create a layer control, and pass it baseMaps and overlayMaps. Add the layer control to the map.
    L.control.layers(baseMaps, overlayMaps,{
        collapsed:false,
        hideSingleBase: true,
    }).addTo(myMap);

    };

};

function genRegionBarPieChart(region){

    const jsonFile = "../static/ofsted_data.json"

    d3.json(jsonFile).then((data) => {

        let regionOnly = data.filter((data) => data.Local_authority === region);
        
        // Create Object for Primary/Secondary Graders
        let grades = {
            "Primary":{
                "Good": 0,
                "Outstanding": 0,
                "Requires Improvement": 0,
                "Inadequate": 0
            },
            "Secondary":{
                "Good": 0,
                "Outstanding": 0,
                "Requires Improvement": 0,
                "Inadequate": 0
            }
        }

        // Create phase counters
        let prime_count = 0;
        let secon_count = 0;

        for (let school in regionOnly){
            if (regionOnly[school].Ofsted_phase === "Primary") {
                prime_count += 1;
                if (regionOnly[school].Overall_effectiveness === "Good") {
                    grades.Primary.Good += 1;
                } else if (regionOnly[school].Overall_effectiveness === "Outstanding"){
                    grades.Primary.Outstanding += 1;
                } else if (regionOnly[school].Overall_effectiveness === "Inadequate"){
                    grades.Primary.Inadequate +=1;                    
                } else {grades.Primary["Requires Improvement"] += 1;}
            } else {
                secon_count += 1;
                if (regionOnly[school].Overall_effectiveness === "Good") {
                    grades.Secondary.Good += 1;
                } else if (regionOnly[school].Overall_effectiveness === "Outstanding"){
                    grades.Secondary.Outstanding += 1;
                } else if (regionOnly[school].Overall_effectiveness === "Inadequate"){
                    grades.Secondary.Inadequate +=1;                    
                } else {grades.Secondary["Requires Improvement"] += 1;}
            }
        };


        // Generate the Bar Chart
        let barTrace1 = {
            x : Object.keys(grades.Primary),
            y : Object.values(grades.Primary),
            type: "bar",
            name: "Primary"
        };

        let barTrace2 = {
            x : Object.keys(grades.Secondary),
            y : Object.values(grades.Secondary),
            type: "bar",
            name: "Secondary"
        };

        // Create array
        let barData = [barTrace1,barTrace2];

        // Apply layout
        let barLayout = {
            title: `School Count per Ofsted Grade in ${region} Region`,
            barmode: "stack",
            width: 600,
            height: 450,
            margin:{
                t : 50,
                b: 50,
                r : 10,
                l: 50
            },
            legend:{
                orientation:"v",
                xanchor:"right",
                yanchor:"top",
                x:0.99,
                y: 0.75,
                traceorder: "normal"
            },
            paper_bgcolor:"#EAEEE8",
            plot_bgcolor:"#EAEEE8"
        };

        // Render the plot
        Plotly.newPlot("bar", barData, barLayout, {displayModeBar: false});

        // Generate the Pie Chart
        let pieTrace = {
            values : [prime_count,secon_count],
            labels : ["Primary", "Secondary"],
            type: "pie",
            textinfo: "label+value"
        };

        // Create array
        let pieData = [pieTrace];

        // Apply layout
        let pieLayout = {
            title: `Ofsted School Phases in ${region}`,
            width: 500,
            height: 450,
            margin:{
                t : 50,
                b: 30,
                r : 10,
                l: 50
            },
            paper_bgcolor:"#EAEEE8",
            plot_bgcolor:"#EAEEE8"
        };

        // Render the plot
        Plotly.newPlot("pie", pieData, pieLayout, {displayModeBar: false});

    })

};

function schoolSelected(school){

    const jsonFile = "../static/ofsted_data.json";

    d3.json(jsonFile).then((data) => {

        // Get School Details
        let school_details = data.filter((data) => data.School_name === school);

        // // Get map reference
        // let myMap = mapsPlaceholder.pop();

        // // Pan Map to lat,lng
        // myMap.panTo([school_details.lat,school_details.lon]);

    })

}