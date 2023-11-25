function regionUpdate(region){

    const jsonFile = "../static/ofsted_data.json"  

    var container = L.DomUtil.get('map-id');
    if(container != null){
        container._leaflet_id = null;
    }
        // https://stackoverflow.com/a/50034912/21871037

    d3.select("#reset").attr("hidden", null);

    // lowercase and space removed region
    let reg_file = region.toLowerCase().replaceAll(" ","_");

    // load in promises
    Promise.all([
        d3.json(jsonFile),
        d3.json(`../static/geojson/${reg_file}.geojson`)        
    ])
    .then(([data, geoData]) => {

        // Create prim and secon arrays
        let primary_markers = [];
        let secondary_markers = [];
        
        // Create all markers
        for (let i = 0; i < data.length; i++){
            if (data[i].Local_authority === region){
                // Create marker
                let marker = L.marker([data[i].lat, data[i].lon])
                .bindPopup(`<h6>${data[i].School_name}</h6></hr>\
                <b>URN:</b> ${data[i].URN}</br>\
                <b>Ofsted Rating:</b> ${data[i].Overall_effectiveness}</br>\
                <a target="_blank" href=${data[i].Web_Link}>Ofsted Reports</a>`);
                
                // Push to array
                if (data[i].Ofsted_phase === "Primary"){
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

        updateMap(primary, secondary, region_geo, lat_lon)

    })

}

function updateMap(prime, secon, reg, lat_lon){

    // Create the tile layer that will be the background of our map.
    let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // Create the map object with options.
    let myMap = L.map("map-id", {
        center : lat_lon,
        zoom: 10,
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

}