# Hawker

[View the demo](http://andreacrawford.design/hawker)

## About this app
This app displays information about hawker centres in Singapore, using data from [data.gov.sg](https://data.gov.sg/dataset/hawker-centres) and the [Foursquare API](https://developer.foursquare.com/docs).

Users can cast votes for their favourite hawker centre for each dish by updating their list of favourites, and this information is collected to create a ranking of the best hawker centres for each dish. The map displays this information, using gold, silver and bronze markers to indicate hawker centres ranked in the top 3 for any dish. The search feature allows users to filter these markers by dish and by ranking.

Clicking on a marker opens up an information window with a short summary of the hawker centre's rankings, and clicking on this info window brings up more information about the hawker centre, including tips and images pulled from Foursquare.

There is also a list view of the visible markers in the bottom left of the screen.

Note: There's currently no provision for users to log in and out, the app will run as though a user is already logged in and has selected some favourites.

## Downloading & Running the app

Clone this repository and use npm to install the dependencies

    git clone https://github.com/acrawford13/neighbourhood-map.git
    cd neighbourhood-map
    npm install

Then use `gulp serve` to launch a browser running the app, or `gulp build` to update the `dist` folder with all necessary files to run the app (this is already included with the latest files when you download the repository).
