const westMids = [52.478861, -2.256306];
let zoomLevel = 8;

const jsonFile = "../static/ofsted_data.json";


/////////////////////////////////////////////////////////////////
// Dashboard Initialization
/////////////////////////////////////////////////////////////////


// Function to initialize the dashboard
function init(){

    // Hide unrequired DIVs
    d3.select("#reset").attr("hidden", "hidden");
    d3.select("#school").attr("hidden", "hidden");
    d3.select("#sm-school").attr("hidden","hidden");
    d3.select("#hide-hr").attr("hidden", "hidden");
    d3.select("#hide-table").attr("hidden", "hidden");

    // Fetch the JSON data
    d3.json(jsonFile).then((data) => {

        // Select the postcode dd menu
        let county_dd = d3.selectAll("#a_region").html("");

        // Add Select a Region
        county_dd.append("option").attr("value","").text("Select a Region");

        // Loop through the data and create an array of each postcode
        let counties = [];
        for (let i = 0; i < data.length; i++){
            counties.push(data[i].Local_authority);
        };

        // Get unique postcodes
        let unique_counties = [...new Set(counties)];
            // https://stackoverflow.com/a/14438954/21871037
        unique_counties.sort();

        // Append the beginning of the postcodes
        for (i=0; i < unique_counties.length; i++){
            county_dd.append("option").attr("value", unique_counties[i]).text(unique_counties[i]);            
        };
    });

    initMarkers();

    genBarChart();
    genPieChart();

};

// Function to gen initMap
function initMap(primary, secondary, westmids, county){

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
        Primary: primary,
        Secondary: secondary
    };

    // Create the map object with options.
    let myMap = L.map("map-id", {
        center : westMids,
        zoom: zoomLevel,
        layers: [street]
  });


    // Create individual Conditionals Layers
    let layer1 = primary;
    let layer2 = secondary;
    let layer3 = westmids;
    let layer4 = county;

    // Create Conditionals LayerGroup
    let layerGroup = L.layerGroup.conditional()
                                .addConditionalLayer((level) => level <= 9, layer3)
                                .addConditionalLayer((level) => level >= 9 && level <= 12, layer4)
                                .addConditionalLayer((level) => level >= 12, layer1)
                                .addConditionalLayer((level) => level >= 12, layer2)                                
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

// Function to gen initMarkers
function initMarkers(){

    Promise.all([
    d3.json(jsonFile),
    d3.json("../static/geojson/west_mids.geojson"),
    d3.json("https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/CTYUA_Apr_2019_UGCB_Great_Britain_2022/FeatureServer/0/query?outFields=%2A&where=ctyua19cd%3D%27E08000025%27+OR+ctyua19cd%3D%27E10000028%27+OR+ctyua19cd%3D%27E10000031%27+OR+ctyua19cd%3D%27E10000034%27+OR+ctyua19cd%3D%27E06000051%27+OR+ctyua19cd%3D%27E08000028%27+OR+ctyua19cd%3D%27E08000026%27++++OR+ctyua19cd%3D%27E08000030%27+OR+ctyua19cd%3D%27E08000027%27+OR+ctyua19cd%3D%27E06000019%27+OR+ctyua19cd%3D%27E08000031%27+OR+ctyua19cd%3D%27E06000021%27+OR+ctyua19cd%3D%27E08000029%27+OR+ctyua19cd%3D%27E06000020%27&f=geojson&geometryType=esriGeometryPolygon")
    ])
    .then(([response, geoData, geoCounty]) => {
        //console.log(geoData.features[0].geometry.coordinates);

        // Initialize an array for the primary and secondary markers
        let primary_markers = [];
        let secondary_markers = [];

        // Loop through data and populate the arrays
        for (i=0; i < response.length; i++){
            let marker = L.marker([response[i].lat, response[i].lon])
                .bindPopup(`<h6>${response[i].School_name}</h6></hr>\
                <b>URN:</b> ${response[i].URN}</br>\
                <b>Ofsted Rating:</b> ${response[i].Overall_effectiveness}</br>\
                <a target="_blank" href=${response[i].Web_Link}>Ofsted Reports</a>`);
        
            if (response[i].Ofsted_phase === "Primary"){
                primary_markers.push(marker);
            } else {
                secondary_markers.push(marker);
            }
        }

        // Create the West Midlands polygon using the geoJSON data
        let westmids_poly = L.geoJSON(geoData,{
            style: {
                color: "purple",
                weight: 1.5,
                opacity: 1,
                fillColor: "rgb(126,185,229)",
                fillOpacity: 0.25
            }
        })
            .bindPopup("<h6>West Midlands Region</h6>");


        // Create the county polygons and bind the county name to each polygon
        function onEachFeature(feature, layer) {
            layer.bindPopup(`<small>${feature.properties.ctyua19nm}</small>`);
        }

        let county_poly = L.geoJSON(geoCounty,{
            onEachFeature : onEachFeature,
            style:{
                color: "black",
                weight: 1,
                opacity: 1,
                fillColor: "blue",
                fillOpacity: 0.25
            }
        });
        
        //let westmids_poly = L.layerGroup(westmids);
        let primary = L.layerGroup(primary_markers);
        let secondary = L.layerGroup(secondary_markers);

        initMap(primary, secondary, westmids_poly, county_poly);
    });
};

/////////////////////////////////////////////////////////////////
// Plot Generating Functions
/////////////////////////////////////////////////////////////////

// Generate BarChart
function genBarChart(){

    // Call JSON
    d3.json("../static/ofstedcounts_JSON.json").then((data) => {
        //console.log(data);

        let primary = data.Primary;
        let secondary = data.Secondary;

        let barTrace1 = {
            x : primary.Grades,
            y : primary.Values,
            type: "bar",
            name: "Primary"
        };

        let barTrace2 = {
            x : secondary.Grades,
            y : secondary.Values,
            type: "bar",
            name: "Secondary"
        };

        // Create array
        let barData = [barTrace1,barTrace2];

        // Apply layout
        let barLayout = {
            title: "School Count per Ofsted Grade in West Midlands Region",
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
            plot_bgcolor:"#EAEEE8",
            xaxis:{
                categoryorder: "array",
                categoryarray: ["Outstanding", "Good", "Requires Improvement", "Inadequate"]
            }
        };

        // Render the plot
        Plotly.newPlot("bar", barData, barLayout, {displayModeBar: false});
    
    })

    
};

// Generate Pie Chart
function genPieChart(){

    // Call JSON
    d3.json("../static/ofstedphase_JSON.json").then((data) => {
        //console.log(data);

        let phase = data.Phase;
        let count = data.Count;

        let pieTrace = {
            values : count,
            labels : phase,
            type: "pie",
            textinfo: "label+value"
        };

        // Create array
        let pieData = [pieTrace];

        // Apply layout
        let pieLayout = {
            title: "Ofsted School Phases",
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

init();