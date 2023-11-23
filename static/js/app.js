const westMids = [52.478861, -2.256306];
let zoomLevel = 7.25;

const jsonFile = "../static/ofsted_data.json";

// d3.json(jsonFile).then((data) => {
//     // print the first 5 entries
//     for (let x = 0; x < 5; x++){
//         console.log(data[x].Postcode);
//     }
//     //console.log(data);
// });

// Function to initialize the dashboard
function init(){

    // Fetch the JSON data
    d3.json(jsonFile).then((data) => {

        // Select the postcode dd menu
        let pc_dd = d3.selectAll("#pc_region");

        // Loop through the data and create an array of each postcode
        let postcodes = [];
        for (let i = 0; i < data.length; i++){
            postcodes.push(data[i].Postcode.split(" ")[0]);
        };

        // Get unique postcodes
        let unique_pcs = [...new Set(postcodes)];
            // https://stackoverflow.com/a/14438954/21871037
        unique_pcs.sort();

        // Append the beginning of the postcodes
        for (i=0; i < unique_pcs.length; i++){
            pc_dd.append("option").attr("value", unique_pcs[i]).text(unique_pcs[i]);            
        };
    });
}

// Function to gen initMap
function initMap(primary, secondary, westmids_poly){

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
        West_Midlands: westmids_poly,
        Primary: primary,
        Secondary: secondary
    };

    // Create the map object with options.
    let myMap = L.map("map-id", {
        center : westMids,
        zoom: zoomLevel,
        layers: [street, westmids_poly]
  });

    // Create a layer control, and pass it baseMaps and overlayMaps. Add the layer control to the map.
    L.control.layers(baseMaps, overlayMaps,{
        collapsed:false
    }).addTo(myMap);
};

// Function to gen initMarkers
function initMarkers(){

    Promise.all([
    d3.json(jsonFile),
    d3.json("../static/west_mids.geojson")
    ])
    .then(([response,geoData]) => {
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

        let westmids = L.geoJSON(geoData,{
            style: {
                color: "blue",
                fillColor: "blue",
                fillOpacity: 1
            }
        });
        
        let westmids_poly = L.layerGroup(westmids);
        let primary = L.layerGroup(primary_markers);
        let secondary = L.layerGroup(secondary_markers);

        initMap(primary, secondary, westmids_poly);
    });
};

function genBarChart(){

    // Call JSON
    d3.json("../static/ofstedcounts_JSON.json").then((data) => {
        //console.log(data);

        let grades = data.Grades;
        let values = data.Values

        let barTrace = {
            x : grades,
            y : values,
            type: "bar"
        };

        // Create array
        let barData = [barTrace];

        // Apply layout
        let barLayout = {
            title: "School Count per Grade",
            width: "50%",
            margin:{
                t : 30,
                b: 30,
                r : 10,
                l: 50
            }
        };

        // Render the plot
        Plotly.newPlot("bar", barData, barLayout, {displayModeBar: false});
    
    })

    
};

genBarChart();

initMarkers();

//initMap();

init();