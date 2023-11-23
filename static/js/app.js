const westMids = [52.489471, -1.898575];
let zoomLevel = 8;

const jsonFile = "../static/ofsted_data.json";

d3.json(jsonFile).then((data) => {
    console.log(data);
});

