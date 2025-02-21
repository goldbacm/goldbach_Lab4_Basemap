//declare map variable globally so all functions have access
var map;
var minValue;

//creating map for the proportional symbols    
var map = L.map('coolmap').setView([44.0, -120.5], 7);

//adding mapbox baselayer
L.tileLayer('https://api.mapbox.com/styles/v1/goldbacm/cm7f8ha3f00e801so1tf4a7el/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ29sZGJhY20iLCJhIjoiY202emRva2NrMDNyZzJqcHFxZDQ0NTNoZyJ9.lKgXi4ZsYvYAM9v89YCPng', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                     'Imagery &copy; <a href="https://www.mapbox.com">Mapbox</a>',
        maxZoom: 16
    }).addTo(map);

    //lets get the data and do some fun things with it
    //the goal is to 1) show the commodities 2) create popups for more info and 3) create a toggle legend
    fetch('/data/Mine_Locations.geojson')
    .then(response => response.json())
    .then(data => {
        // Function to handle each feature and bind the popups
        function onEachFeature(feature, layer) {
            const commodity = feature.properties.Commodity;
            const type = feature.properties.Type;
            const county = feature.properties.County;

            // Bind a popup that shows commodity and type information
            layer.bindPopup(`
                <b>Commodity: ${commodity}</b><br>
                <b>Type: ${type}</b><br>
                <b>County: ${county}</b><br>
            `);
        }

        // Group GeoJSON features by commodity
        const layers = {};
        const legendItems = {}; // To store legend items for toggling

        // Function to determine the color based on "Commodity" property
        function getColor(commodity) {
            switch (commodity) {
                case 'gold':
                    return 'gold';
                case 'silver':
                    return 'silver';
                case 'iron':
                    return 'red';
                case 'salt':
                    return 'white';
                case 'clays, silica sand':
                    return 'purple';     
                default:
                    return 'pink'; // Default color if commodity doesn't match
            }
        }

        // Function to style each feature
        function style(feature) {
            const commodity = feature.properties.Commodity;
            return {
                color: getColor(commodity), // Apply color based on commodity
                radius: 5,  // Size of the circle
                weight: 2,  // Border thickness
                opacity: 1, // Opacity of the circle
                fillOpacity: 0.6 // Fill opacity
            };
        }

        // Loop through the GeoJSON data and create a layer for each commodity
        data.features.forEach(feature => {
            const commodity = feature.properties.Commodity;
            
            // Create a new layer group for each commodity if it doesn't exist
            if (!layers[commodity]) {
                layers[commodity] = L.layerGroup(); // Create a new layer group for each commodity
            }
            
            // Create circle marker for each feature and add it to the appropriate layer
            const marker = L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], style(feature));

            // Add the marker to the appropriate commodity layer
            layers[commodity].addLayer(marker);

            // Store the color for the legend
            if (!legendItems[commodity]) {
                legendItems[commodity] = getColor(commodity); // Get the color for the legend
            }

            // Add popup functionality
            onEachFeature(feature, marker);
        });

        // Create a control to toggle visibility of each commodity layer
        const layerControl = L.control.layers(null, {}, { collapsed: false }).addTo(map);

        // Create a rectangular bar at the top of the map
        layerControl.setPosition('topleft');
        const controlContainer = layerControl.getContainer();
        controlContainer.style.display = 'flex';
        controlContainer.style.flexDirection = 'row'; // Make the control horizontal
        controlContainer.style.alignItems = 'center';
        controlContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // White background for the bar
        controlContainer.style.padding = '10px'; // Add padding for spacing
        controlContainer.style.borderRadius = '5px'; // Optional: Rounded corners
        controlContainer.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)'; // Optional: Shadow for better visibility

        // Move the control higher up
        controlContainer.style.position = 'absolute';
        controlContainer.style.top = '10px'; // Adjust this value to move it higher or lower
        controlContainer.style.left = '35px'; // Keep it on the left side

        // Add label "Choose a Commodity" at the top of the control
        const label = document.createElement('div');
        label.innerHTML = '<strong>Choose a Commodity</strong>';
        label.style.marginRight = '20px'; // Add some space between label and checkboxes
        controlContainer.insertBefore(label, controlContainer.firstChild);

        // Loop through each commodity and create a checkbox for each
        Object.keys(layers).forEach(commodity => {
            const checkboxLabel = document.createElement('label');
            checkboxLabel.innerHTML = commodity;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true; // Default to checked (visible)
            checkbox.style.marginLeft = '5px';

            // Event listener for checkbox to toggle layer visibility
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    layers[commodity].addTo(map); // Add layer to map if checked
                } else {
                    map.removeLayer(layers[commodity]); // Remove layer from map if unchecked
                }
            });

            checkboxLabel.appendChild(checkbox);
            controlContainer.appendChild(checkboxLabel);

            // Add the layer to the map immediately (visible by default)
            layers[commodity].addTo(map);
        });

        // Create the commodity legend and insert it into the "Choose a Commodity" control
        const legendDiv = document.createElement('div');
        legendDiv.classList.add('commodity-legend');
        legendDiv.style.marginTop = '10px'; // Add space between legend and checkboxes

        // Create the "Commodities" title for the legend on the right side of the map
        const legendTitle = document.createElement('div');
        legendTitle.innerHTML = '<strong>Commodities</strong>';
        legendTitle.style.marginBottom = '10px'; // Add space below the title

        // Add the title to the legend
        const legendContainer = L.DomUtil.create('div', 'info legend');
        legendContainer.appendChild(legendTitle);

        // Loop through each commodity and create a legend item with the correct color
        for (const commodity in legendItems) {
            if (legendItems.hasOwnProperty(commodity)) {
                legendContainer.innerHTML += `
                    <i style="background: ${legendItems[commodity]}; width: 15px; height: 15px; display: inline-block; margin-right: 5px;"></i>
                    ${commodity}<br>
                `;
            }
        }

        // Add the legend to the map and position it to the right
        const legend = L.control({ position: 'topright' });
        legend.onAdd = function () {
            return legendContainer;
        };
        legend.addTo(map);

        // Add a white box background to the legend (CSS style)
        const legendBox = legendContainer;
        legendBox.style.backgroundColor = 'white';
        legendBox.style.padding = '10px';
        legendBox.style.borderRadius = '5px';
        legendBox.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)'; // Optional: Add shadow for better visibility

    })
    .catch(error => console.error('Error: ', error)); // Error handling










///////////////////////////////////
////lets have a random question////
///////////////////////////////////
// Get the paragraph element by ID
const quizElement = document.getElementById("Quiz");

// Possible questions and answers related to Dune
const questions = [
    {
        question: "Why do you think the water is black?",
        answers: [
            "Spice Melange contamination",
            "Sandworm activity",
            "Demonstrate lack of visible water",
            "Toxic desert chemicals",
            "Other (Fremen belief)"
        ],
        correctAnswer: "Demonstrate lack of visible water"
    },
    
];

// Event listener for clicking the quiz question
quizElement.addEventListener("click", function() {
    // Randomly select a question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    // Update the quiz question displayed
    quizElement.innerText = randomQuestion.question;

    // Create a div to display the possible answers
    const answersDiv = document.getElementById("answers");
    const feedbackDiv = document.getElementById("feedback");
    
    // Clear previous answers (if any)
    answersDiv.innerHTML = "";
    feedbackDiv.innerHTML = ""; // Clear feedback text

    // Create a list of answers as clickable items
    randomQuestion.answers.forEach(answer => {
        const answerElement = document.createElement("button");
        answerElement.innerText = answer;
        answerElement.addEventListener("click", function() {
            // Check if the answer is correct
            if (answer === randomQuestion.correctAnswer) {
                feedbackDiv.innerText = "Correct! The lack of visible water is what makes it appear black. Water is rare commodity in the Dune Universe!";
            } else {
                feedbackDiv.innerText = "Incorrect, but good thought. Try again!";
            }
        });
        answersDiv.appendChild(answerElement);
    });
});


//Citing Sources: Built off of previous labs and referenced some of the tutorials. Did rely on Chatgpt to get things to work
// as there was a lot of trouble shooting in this lab for me (basemap kept breaking so this version is not as nice as originally intended :( )
