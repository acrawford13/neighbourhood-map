var Favourite = function(data){
    this.dish_id = data.dish_id,
    this.dish_name = data.dish_name;
    this.centre = ko.observable(data.centre).extend({notify: 'always'})
}

var Centre = function(data){
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

var ViewModel = function(){
    var self = this;

    // user favourite variables
    this.favouriteSearch = ko.observable();
    this.userFavourites = ko.observableArray([]);
    this.favouritesList = ko.observableArray([]);
    this.favError = ko.observable();

    // map variables
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

    // single hawker centre view
    this.rankFilter = ko.observable(5);
    this.foursquareTips = ko.observableArray([]);
    this.foursquareImages = ko.observableArray([]);
    this.foursquareUrl = ko.observable();
    this.foursquareErrorMsg = ko.observable();
    this.rankFilterOptions = [3, 5, 10, 20];

    this.dishFavList = ko.pureComputed(function(){
        return self.userFavourites().filter(function(d){
            return d.centre() && (d.centre().id == self.viewing().id);
        });
    })

    // top bar
    this.generalSearch = ko.observable();
    this.filterRanking = ko.observable();
    this.dishExists = ko.pureComputed(function(){
        var searchTerm = self.generalSearch() ? self.generalSearch().toLowerCase() : '';
        return self.dishes()[$.inArray(searchTerm, self.dishes().map(function(d){return d.toLowerCase()}))];
    });

    // list view
    this.centreListVisible = ko.observable(false);
    this.toggleCentreList = function(){
        self.centreListVisible(!self.centreListVisible());
        $('.scrollbar-outer').scrollbar();
    }

    // app variables
    this.loggedInUser = ko.observable(2);
    this.appError = ko.observable();
    this.loading = ko.observable(true);
    this.route = ko.observable();
    this.viewing = ko.observable();
    this.editing = ko.observable();
    this.adding = ko.observable();
    this.centres = ko.observableArray([]);
    this.dishes = ko.pureComputed(function(){
        var tempDishes = [].concat.apply([],self.centres().map(function(d){return d.rankings.map(function(e){return e.dish_name;})}))
        tempDishes = $.grep(tempDishes, function(d, i){
            return $.inArray(d, tempDishes) === i;
        }).sort();
        return tempDishes;
    });

    // map functions
    this.setIcon = function(marker, rank, visible){
        var rank = parseInt(rank);
        var markerRank = (rank && rank <= 3) ? rank : 'red';
        var zIndex = rank ? -rank : -100;
        marker.setIcon(self.iconStyles[markerRank]);
        marker.setZIndex(zIndex);
        marker.setVisible(visible);
    }

    this.updateInfoWindow = function(item){
        // construct HTML content for the info window
        var makeInfoWindowContent = function(item){
            var rankingHTML = '';
            var rankings = item.filteredRankings.peek();
            if(rankings.length > 0){
                rankingHTML += '<hr/>';
                for(var i = 0; i<rankings.length && i<3; i++){
                    rankingHTML += '<i class="fa fa-certificate c-ranking--' + rankings[i].rank + '"></i> <strong>#' + rankings[i].rank + '</strong> for ' + rankings[i].dish_name + '</br>';
                };
                if(rankings.length > 3){
                    rankingHTML += 'And '+ (rankings.length - 3) +' more&hellip;';
                };
            }
            return '<div id="info-window" data-bind="click: function(){moreInfo(' + item.id + ')}" class="c-infowindow"><h4>' + item.name + '</h4>'+
            rankingHTML +
            '</div>';
        }

        // if the selected marker already has an infoWindow open,
        // update the information in the infoWindow
        if(item.marker.getPosition()==self.infoWindow().getPosition()){
            var content = makeInfoWindowContent(item);
            self.infoWindow().setContent(content);
            self.infoWindow().open(map, item.marker);
        };

        // update the marker's click event listener with new infoWindow content
        item.marker.addListener('click', (function(thisItem){
            var content = makeInfoWindowContent(thisItem);
            return function(){
                thisItem.marker.setAnimation(google.maps.Animation.DROP);
                self.changeViewing(thisItem.id);
                self.infoWindow().setContent(content);
                self.infoWindow().open(map, thisItem.marker);
                ko.applyBindings(self, document.getElementById('info-window'));
            }
        })(item));
    }

    this.visibleMarkers = ko.computed(function(){
        var searchTerm = new RegExp(self.generalSearch(), 'i');
        var filterRanking = parseInt(self.filterRanking());
        return self.centres().filter(function(d){
            var rank = d.rankings.filter(function(e){
                var dishMatch = e.dish_name.match(searchTerm) ? true : false;
                var rankMatch = filterRanking ? parseInt(e.rank) <= filterRanking : true;
                return dishMatch && rankMatch;
            });
            d.filteredRankings(rank);
            if((!self.generalSearch() && !self.filterRanking()) || d.filteredRankings.peek().length){
                return true;
            }
        });
    });

    this.dishRankings = ko.pureComputed(function(){
        var dishRankings = [];
        if(self.dishExists()){
            self.visibleMarkers().forEach(function(d){
                var rank = d.filteredRankings.peek()[0].rank;
                if(dishRankings[rank]){
                    dishRankings[rank].push(d);
                } else {
                    dishRankings[rank] = [d]
                }
            })
        }
        dishRankings.forEach(function(d){
            d.sort(function(a, b){
                return a.name.localeCompare(b.name);
            })
        });
        return dishRankings;
    });

    this.clearMap = function(){
        self.centres().forEach(function(d){
            d.marker.setVisible(false);
        });
    }

    this.setMarkers = ko.computed(function(){
        self.clearMap();
        self.visibleMarkers().forEach(function(d){
            self.updateInfoWindow(d);
            var rank = d.filteredRankings.peek()[0] ? d.filteredRankings.peek()[0].rank : null;
            self.setIcon(d.marker, rank, true);
        });
    });

    this.makeCentresFromData = function(data){
        self.clearMap();

        // make a temporary array to store the centres in so we can update the whole array in one shot
        var tempArray = [];

        // loop through each item in the results
        for(var key in data){
            // store the item in a variable
            var item = data[key];

            // create a new marker for it
            var marker = new google.maps.Marker({
                position: {lng:parseFloat(data[key]['lng']), lat:parseFloat(data[key]['lat'])},
                map: map,
                visible: true,
                icon: self.iconStyles.red,
            });;

            marker.addListener('visible_changed', function(thisMarker){
                return function(){
                    if(thisMarker.getPosition()==self.infoWindow().getPosition() && !thisMarker.getVisible()){
                        self.infoWindow().close();
                    }
                }
            }(marker));

            self.infoWindow().addListener('closeclick', function(){
                self.clearViewing();
            });

            item['marker'] = marker;
            tempArray.push(new Centre(item));
        }
        tempArray.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });
        self.centres(tempArray);
    }

    this.init = function(){
        $.ajax({
            'url': 'http://andreacrawford.design/hawkerdb/centres',
            'success': function(data){
                self.makeCentresFromData(data);
                $.ajax({
                    'url': 'http://andreacrawford.design/hawkerdb/user/' + self.loggedInUser(),
                    'success': function(data){
                        var tempFavs = [];
                        for(var i = 0; i<data.favourites.length; i++){
                            var item = data.favourites[i];
                            tempFavs.push(new Favourite({
                                'centre': $.grep(self.centres(), function(e){return e.id == item.centre_id})[0],
                                'dish_id': item.dish_id,
                                'dish_name': item.dish_name})
                            );
                        }
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



    this.exitFavourites = function(){
        self.route(null);
        self.favouriteSearch('');
        self.favError('');
    };

    this.editFavourites = function(){
        this.route('favourites');
        $('.scrollbar-outer').scrollbar();
    };

    this.cancelAdd = function(){
        self.adding(null);
    };

    this.deleteItem = function(item){
        self.adding(null);
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

    this.foursquare = function(){
        var item = self.viewing();
        if(item.foursquare_id){
            $.ajax({
                'url': 'https://api.foursquare.com/v2/venues/' + item.foursquare_id,
                'data': {
                    client_id:"2MC5VARD1M4I2N1ODQ0TFPLR1UNG2OSZPXGG5FVJK1P4NCGT",
                    client_secret:"RTYLP5PAYEWFBWS02LM2U4MMUARWJLIPA3LAGQBUFMPHGMB5",
                    v:"20170801"
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

    this.moreInfo = function(id){
        var item = $.grep(self.centres(), function(e){return e.id == id})[0]
        self.viewing(item);
        self.route(null);
        self.centreListVisible(false);
        self.foursquare();
        $('.scrollbar-outer').scrollbar();
    };

    this.changeViewing = function(id){
        var item = $.grep(self.centres(), function(e){return e.id == id})[0]
        if(self.viewing()){
            self.viewing(item);
        }
    };

    this.clearViewing = function(){
        self.viewing(null);
        self.foursquareTips([]);
        self.foursquareImages([]);
    };

    this.categoryTemplate = function(category){
        return self.adding() && category.name == self.adding().category() ? 'adding-item' : 'category-item';
    };

    this.toggleEditing = function(favourite){
        if (!self.editing()){
            if (self.editing() == favourite){
                    self.editing(false);
            } else {
                self.editing(favourite);
            }
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


    this.searchResults = ko.computed(function(){
        var searchTerm = new RegExp(self.favouriteSearch(), 'ig');
        var list = self.userFavourites().filter(function(d){
            var centreMatch = d.centre() ? d.centre().name.match(searchTerm) : false;
            var dishMatch = d.dish_name.match(searchTerm) ;
            return dishMatch || centreMatch;
        }).sort(function(a, b){
            if(typeof(a.centre()) == typeof(b.centre())){
                return a.dish_name.localeCompare(b.dish_name);
            } else if(a.centre()) {
                return -1;
            } else {
                return 1;
            }
        });
        if(!self.editing()){
            self.favouritesList(list);
        }
    });

    this.filterMessage = ko.computed(function(){
        var plural = self.visibleMarkers().length == 1 ? '' : 's';
        var category, ranking;
        if(self.generalSearch()){
            if(self.dishExists()){
                category = ' in the category <span class="c-message-list__emphasis">' + self.dishExists() + '</span>';
            } else {
                category = ' in categories containing <span class="c-message-list__emphasis">\'' + self.generalSearch() + '\'</span>';
            }
        } else {
            category = ' in <span class="c-message-list__emphasis">any</span> category';
        }
        if(self.filterRanking()){
            ranking = "a ranking of <span class='c-message-list__emphasis'>" + self.filterRanking();
            ranking += self.filterRanking() == 1 ? '' : ' or higher';
            ranking += "</span>";
        } else {
            ranking = "<span class='c-message-list__emphasis'>any</span> ranking";
        }
        if(self.generalSearch() || self.filterRanking()){
            return "Showing <span class='c-message-list__emphasis'>" +  self.visibleMarkers().length + "</span> result" + plural + " with " + ranking + category;
        }
    });
}
