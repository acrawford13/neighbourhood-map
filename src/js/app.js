const Favourite = function(data){
    this.dish_id = data.dish_id,
    this.dish_name = data.dish_name;
    this.centre = ko.observable(data.centre);
}

const Centre = function(data){
    this.name = data.name;
    this.id = data.id;
    this.streetname = data.streetname;
    this.streetno = data.streetno;
    this.postalcode = data.postalcode;
    this.lat = data.lat;
    this.lng = data.lng;
    this.rankings = data.rankings;
    this.foursquare_id = data.foursquare_id;
    this.filteredRankings = ko.observableArray([]);
    this.marker = data.marker;
}

const ViewModel = function(){
    const self = this;

    // variables: app
    this.loggedInUser = ko.observable(1);
    this.centres = ko.observableArray([]);
    this.appError = ko.observable();
    this.loading = ko.observable(true);

    // variables: user favourites
    this.showFavourites = ko.observable(false);
    this.favouriteSearch = ko.observable();
    this.userFavourites = ko.observableArray([]);
    this.filteredFavourites = ko.observableArray([]);
    this.editing = ko.observable();
    this.favError = ko.observable();

    // variables: map
    this.infoWindow = ko.observable(new google.maps.InfoWindow({}));
    this.baseIcon = {
        url: './img/markers-full.png',
        size: new google.maps.Size(24, 32),
        scaledSize: new google.maps.Size(96, 32)
    };

    this.iconStyles = {
        '1': $.extend({origin: new google.maps.Point(0, 0)}, this.baseIcon),
        '2': $.extend({origin: new google.maps.Point(24, 0)}, this.baseIcon),
        '3': $.extend({origin: new google.maps.Point(48, 0)}, this.baseIcon),
        'red': $.extend({origin: new google.maps.Point(72, 0)}, this.baseIcon),
    };

    // variables: single hawker centre
    this.viewing = ko.observable();
    this.rankFilter = ko.observable(5);
    this.rankFilterOptions = [3, 5, 10, 20];
    this.foursquareTips = ko.observableArray([]);
    this.foursquareImages = ko.observableArray([]);
    this.foursquareUrl = ko.observable();
    this.foursquareErrorMsg = ko.observable();

    // variables: top bar
    this.dishSearch = ko.observable();
    this.filterRanking = ko.observable();
    this.dishes = ko.observableArray([]);
    this.dishExists = ko.pureComputed(function(){
        const searchTerm = self.dishSearch() ? self.dishSearch().toLowerCase() : '';
        return self.dishes()[$.inArray(searchTerm, self.dishes().map(function(d){return d.toLowerCase()}))];
    });

    // variables: list view of hawker centres
    this.showCentreList = ko.observable(false);
    this.toggleCentreList = function(){
        self.showCentreList(!self.showCentreList());
        $('.scrollbar-outer').scrollbar();
    }

    // functions: user favourites

    // open favourites modal
    this.openFavourites = function(){
        self.showFavourites(true);
        $('.scrollbar-outer').scrollbar();
    }

    // close favourites modal
    this.closeFavourites = function(){
        self.showFavourites(false);
        self.favouriteSearch('');
        self.favError('');
    }

    // delete a favourite item
    this.deleteFavourite = function(item){
        item.centre(undefined);
        $.ajax({
            'url': 'http://andreacrawford.design/hawkerdb/deletevote',
            'method': 'post',
            'data' : {dish_id: item.dish_id, user_id: self.loggedInUser()},
            'error':function(){
                self.favError("Couldn't update your favourites. Please try again later.");
            }
        })
    };

    // toggle editing of favourite item
    this.toggleEditing = function(favourite){
        if (!self.editing()){
            self.editing(favourite);
        } else if (favourite.centre()){
            $.ajax({
                'url':'http://andreacrawford.design/hawkerdb/votes',
                'method':'post',
                'data':{
                    'dish_id': favourite.dish_id,
                    'user_id': self.loggedInUser(),
                    'centre_id': favourite.centre().id,
                },
                'error':function(){
                    self.favError("Couldn't update your favourites. Please try again later.");
                }
            });
            self.editing(!self.editing);
        }
    };

    // filter favourites list based on search
    this.filterFavourites = ko.computed(function(){
        const searchTerm = new RegExp(self.favouriteSearch(), 'i');

        // show user favourites with dish or centre matching search term
        const list = self.userFavourites().filter(function(d){
            const centreMatch = d.centre() ? d.centre().name.match(searchTerm) : false;
            const dishMatch = d.dish_name.match(searchTerm) ;
            return dishMatch || centreMatch;
        }).sort(function(a, b){
            // sort by whether a centre is set, then by dish name
            if(typeof(a.centre()) == typeof(b.centre())){
                return a.dish_name.localeCompare(b.dish_name);
            } else if(a.centre()) {
                return -1;
            } else {
                return 1;
            }
        });

        // re-sort favourites list after the user has finished editing
        if(!self.editing()){
            self.filteredFavourites(list);
        }
    });

    // map functions

    // the filtered list of markers to be shown on the map
    this.visibleMarkers = ko.computed(function(){
        const searchTerm = new RegExp(self.dishSearch(), 'i');
        const filterRanking = parseInt(self.filterRanking());

        return self.centres().filter(function(d){
            d.filteredRankings(d.rankings.filter(function(e){
                const dishMatch = e.dish_name.match(searchTerm) ? true : false;
                const rankMatch = filterRanking ? parseInt(e.rank) <= filterRanking : true;
                return dishMatch && rankMatch;
            }));

            if((!self.dishSearch() && !self.filterRanking()) || d.filteredRankings.peek().length){
                return true;
            }
        });
    });

    // set a marker's appearance and z-index based on its rank
    this.setIcon = function(marker, rank, visible){
        const rankNum = parseInt(rank);
        const markerRank = (rankNum && rankNum <= 3) ? rankNum : 'red';
        const zIndex = rankNum ? -rankNum : -100;
        marker.setIcon(self.iconStyles[markerRank]);
        marker.setZIndex(zIndex);
        marker.setVisible(visible);
    }

    // update the contents of the info window based on the search filters
    this.updateInfoWindow = function(item){
        // construct HTML content for the info window
        const makeInfoWindowContent = function(item){
            let rankingHTML = '';
            const rankings = item.filteredRankings.peek();
            if(rankings.length > 0){
                rankingHTML += '<hr/><p class="c-infowindow__text">';
                for(let i = 0; i<rankings.length && i<3; i++){
                    rankingHTML += '<i class="fa fa-certificate c-ranking--' + rankings[i].rank + '"></i> <strong>#' + rankings[i].rank + '</strong> for ' + rankings[i].dish_name + '</br>';
                };
                if(rankings.length > 3){
                    rankingHTML += 'and '+ (rankings.length - 3) +' more&hellip;';
                };
                rankingHTML += '</p>';
            }
            return '<div id="info-window" data-bind="click: function(){showCentre(' + item.id + ')}" class="c-infowindow">' +
                    '<h4>' + item.name + '</h4>'+
                    rankingHTML +
                    '<span class="c-button c-button--small c-infowindow__button">See more</span>' +
            '</div>';
        }

        // if the selected marker already has an infoWindow open,
        // update the information in the infoWindow
        if(item.marker.getPosition()==self.infoWindow().getPosition()){
            const content = makeInfoWindowContent(item);
            self.infoWindow().setContent(content);
            self.infoWindow().open(map, item.marker);
        };

        // update the marker's click event listener with new infoWindow content
        item.marker.addListener('click', (function(thisItem){
            const content = makeInfoWindowContent(thisItem);
            return function(){
                thisItem.marker.setAnimation(google.maps.Animation.DROP);
                self.infoWindow().setContent(content);
                self.infoWindow().open(map, thisItem.marker);
                ko.applyBindings(self, document.getElementById('info-window'));
            }
        })(item));
    }

    // clear the map
    this.clearMap = function(){
        self.centres().forEach(function(d){
            d.marker.setVisible(false);
        });
    }

    // update the markers on the map when visibleMarkers changes
    this.updateMarkers = ko.computed(function(){
        self.clearMap();
        self.visibleMarkers().forEach(function(d){
            self.updateInfoWindow(d);
            const rank = d.filteredRankings.peek()[0] ? d.filteredRankings.peek()[0].rank : null;
            self.setIcon(d.marker, rank, true);
        });
    });

    // create centre objects from the json data
    this.makeCentresFromData = function(data){
        self.clearMap();

        // make a temporary array to store the centres in so we can update the whole array in one shot
        let tempArray = [];

        data.forEach(function(item){
            const marker = new google.maps.Marker({
                position: {lng:parseFloat(item['lng']), lat:parseFloat(item['lat'])},
                map: map,
                visible: true,
                icon: self.iconStyles.red,
            });;

            // add event listener: if the marker is hidden, close the info window
            marker.addListener('visible_changed', function(thisMarker){
                return function(){
                    if(thisMarker.getPosition()==self.infoWindow().getPosition() && !thisMarker.getVisible()){
                        self.infoWindow().close();
                    }
                }
            }(marker));

            item['marker'] = marker;
            tempArray.push(new Centre(item));
        })

        // sort the array by name
        tempArray.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });

        self.centres(tempArray);
    }

    // initialise the app
    this.init = function(){
        $.ajax({
            // get hawker centre data
            'url': 'http://andreacrawford.design/hawkerdb/centres',
            'success': function(data){
                // populate the centres array
                self.makeCentresFromData(data);

                $.ajax({
                    // get user favourites data
                    'url': 'http://andreacrawford.design/hawkerdb/user/' + self.loggedInUser(),
                    'success': function(data){
                        // populate the userFavourites array
                        const tempFavs = [];
                        for(let i = 0; i<data.favourites.length; i++){
                            const item = data.favourites[i];
                            tempFavs.push(new Favourite({
                                'centre': $.grep(self.centres(), function(e){return e.id == item.centre_id})[0],
                                'dish_id': item.dish_id,
                                'dish_name': item.dish_name})
                            );
                        }
                        self.dishes(tempFavs.map(function(d){return d.dish_name}));
                        self.userFavourites(tempFavs);
                    },
                    'error': function(){
                        self.loading(false);
                        self.favError("Couldn't load your favourites.<br>Please try again later.");
                    }
                })
                self.loading(false);
            },
            'error': function(){
                self.loading(false);
                self.appError("Couldn't load hawker centre data.<br>Please try again later.");
            }
        })
    };

    // functions: single hawker centre view

    // show single hawker centre modal
    this.showCentre = function(id){
        const item = $.grep(self.centres(), function(e){return e.id == id})[0]
        self.viewing(item);
        self.showFavourites(false);
        self.showCentreList(false);
        self.foursquare();
        $('.scrollbar-outer').scrollbar();
    };

    // close single hawker centre modal
    this.closeCentre = function(){
        self.viewing(null);
        self.foursquareTips([]);
        self.foursquareImages([]);
    };

    // user's favourites from a specific hawker centre
    this.dishFavList = ko.pureComputed(function(){
        return self.userFavourites().filter(function(d){
            return d.centre() && (d.centre().id == self.viewing().id);
        });
    })

    // retrieve hawker centre data from foursquare
    this.foursquare = function(){
        const item = self.viewing();
        if(item.foursquare_id){
            $.ajax({
                'url': 'https://api.foursquare.com/v2/venues/' + item.foursquare_id,
                'data': {
                    client_id:"2MC5VARD1M4I2N1ODQ0TFPLR1UNG2OSZPXGG5FVJK1P4NCGT",
                    client_secret:"RTYLP5PAYEWFBWS02LM2U4MMUARWJLIPA3LAGQBUFMPHGMB5",
                    v:"20171205"
                },
                'success':function(d){
                    self.foursquareTips(d.response.venue.tips.groups[0].items);
                    self.foursquareImages(d.response.venue.photos.groups[0].items);
                    self.foursquareUrl(d.response.venue.canonicalUrl);
                },
                'error':function(){
                    self.foursquareErrorMsg('Couldn\'t retrieve data from Foursquare');
                }
            })
        }
    }

    // functions: top bar

    // message that displays below the top bar
    this.filterMessage = ko.pureComputed(function(){
        const plural = self.visibleMarkers().length == 1 ? '' : 's';
        let category, ranking;

        // message section: ranking
        if(self.filterRanking()){
            ranking = 'a ranking of <span class="c-message-list__emphasis">' + self.filterRanking();
            ranking += self.filterRanking() == 1 ? '' : ' or higher';
            ranking += '</span>';
        } else {
            ranking = '<span class="c-message-list__emphasis">any</span> ranking';
        }

        // message section: dish
        if(self.dishSearch()){
            if(self.dishExists()){
                category = ' in the category <span class="c-message-list__emphasis">' + self.dishExists() + '</span>';
            } else {
                category = ' in categories containing <span class="c-message-list__emphasis">\'' + self.dishSearch() + '\'</span>';
            }
        } else {
            category = ' in <span class="c-message-list__emphasis">any</span> category';
        }

        // construct message
        if(self.dishSearch() || self.filterRanking()){
            return 'Showing <span class="c-message-list__emphasis">' +  self.visibleMarkers().length + '</span> result' + plural + ' with ' + ranking + category;
        }
    });
}
