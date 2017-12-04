var Favourite = function(data){
    this.dish_id = data.dish_id,
    this.dish_name = data.dish_name;
    this.centre = ko.observable(data.centre)
}

var Center = function(data){
    this.name = data.name;
    this.id = data.id;
    this.streetname = data.streetname;
    this.streetno = data.streetno;
    this.postalcode = data.postalcode;
    this.lat = data.lat;
    this.lng = data.lng;
    this.rankings = data.rankings;
    this.foursquare_id = data.foursquare_id;
    this.filteredRankings = [];
    this.marker = data.marker;
}

var ViewModel = function(){

    var self = this;

    this.inMoreInfoLimit = ko.observable(5);
    this.editing = ko.observable();
    this.adding = ko.observable();
    this.viewing = ko.observable();
    this.topRanked = ko.observableArray();
    this.rankingList = ko.observableArray();
    this.favList = ko.observableArray([]);
    this.testCenters = ko.observableArray([]);
    this.centers = ko.observableArray([]);
    this.categories = ko.observableArray([]);
    this.markers = ko.observableArray([]);
    this.dishes = ko.pureComputed(function(){
        var tempDishes = [].concat.apply([],self.centers().map(function(d){return d.rankings.map(function(e){return e.dish_name;})}))
        tempDishes = $.grep(tempDishes, function(d, i){
            return $.inArray(d, tempDishes) === i;
        }).sort();
        return tempDishes;
    });
    this.filterRanking = ko.observable();
    this.iconHeight = 35;
    this.iconWidth = this.iconHeight/1.42857143;
    this.iconStyles = {
        gold: {url: './img/markers-full.png', origin: new google.maps.Point(0, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        silver: {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        bronze: {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth * 2, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        red: {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth * 3, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        '1': {url: './img/markers-full.png', origin: new google.maps.Point(0, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        '2': {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
        '3': {url: './img/markers-full.png', origin: new google.maps.Point(this.iconWidth * 2, 0), size: new google.maps.Size(this.iconWidth, this.iconHeight), scaledSize: new google.maps.Size(this.iconWidth * 4, this.iconHeight)},
    };

    this.setIcon = function(marker, rank, visible){
        var rank = parseInt(rank);
        var markerRank = (rank && rank <= 3) ? rank : 'red';
        var zIndex = rank ? -rank : -100;
        marker.setIcon(self.iconStyles[markerRank]);
        marker.setZIndex(zIndex);
        marker.setVisible(visible);
    }

    this.generalSearch = ko.observable();
    this.dishExists = ko.pureComputed(function(){
        var searchTerm = self.generalSearch() ? self.generalSearch().toLowerCase() : '';
        return self.dishes()[$.inArray(searchTerm, self.dishes().map(function(d){return d.toLowerCase()}))];
    });

    this.updateInfoWindow = function(item){
        var makeInfoWindowContent = function(item){
            var rankingHTML = '';
            var rankings = item.filteredRankings;
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

        if(item.marker.getPosition()==self.infoWindow().getPosition()){
            var content = makeInfoWindowContent(item);
            self.infoWindow().setContent(content);
            self.infoWindow().open(map, item.marker);
        };
        item.marker.addListener('click', (function(thisItem){
            var content = makeInfoWindowContent(thisItem);
            return function(){
                self.changeViewing(thisItem.id);
                self.infoWindow().setContent(content);
                self.infoWindow().open(map, thisItem.marker);
                thisItem.marker.setAnimation(google.maps.Animation.DROP);
                ko.applyBindings(self, document.getElementById('info-window'));
            }
        })(item));
    }

    this.visibleMarkers = ko.computed(function(){
        console.log('making visible marker');
        var searchTerm = new RegExp(self.generalSearch(), 'i');
        var filterRanking = parseInt(self.filterRanking());
        return self.centers().filter(function(d){
            d.filteredRankings = d.rankings.filter(function(e){
                var dishMatch = e.dish_name.match(searchTerm) ? true : false;
                var rankMatch = filterRanking ? parseInt(e.rank) <= filterRanking : true;
                return dishMatch && rankMatch;
            });


            if((!self.generalSearch() && !self.filterRanking()) || d.filteredRankings.length){
                return true;
            }
        });
    });

    this.dishRankings = ko.pureComputed(function(){
        var dishRankings = [];
        if(self.dishExists()){
            self.visibleMarkers().forEach(function(d){
                var rank = d.filteredRankings[0].rank;
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

    self.infoWindow = ko.observable(new google.maps.InfoWindow({}));

    this.clearMap = function(){
        self.centers().forEach(function(d){
            d.marker.setVisible(false);
        });
    }

    this.setMarkers = ko.computed(function(){
        self.clearMap();
        console.log('setting marker colors');
        self.visibleMarkers().forEach(function(d){
            self.updateInfoWindow(d);
            var rank = d.filteredRankings[0] ? d.filteredRankings[0].rank : null;
            self.setIcon(d.marker, rank, true);
        });
    });

    this.makeCentresFromData = function(data){
        self.clearMap();

        console.log('running makeCentresFromData function');

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
            });

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
            tempArray.push(new Center(item));
            self.markers.push(marker);
        }
        self.centers(tempArray);
    }

    this.init = function(){
        console.log('running init function');
        $.ajax({
            'url': 'http://andreacrawford.design/hawkerdb/centres',
            'success': function(data){
                self.makeCentresFromData(data);
                $.ajax({
                    'url': 'http://andreacrawford.design/hawkerdb/user/1',
                    'success': function(data){
                        var tempFavs = [];
                        for(var i = 0; i<data.favourites.length; i++){
                            var item = data.favourites[i];
                            tempFavs.push(new Favourite({
                                'centre': $.grep(self.centers(), function(e){return e.id == item.centre_id})[0],
                                'dish_id': item.dish_id,
                                'dish_name': item.dish_name})
                            );
                        }
                        self.favList(tempFavs);
                    }
                })

                $('#centres-loading-icon').hide();
            }
        })
    };

    // track which view model should be shown on screen
    this.route = ko.observable();
    this.favouriteSearch = ko.observable();
    this.categorySearch = ko.observable();

    this.exitFavourites = function(){
        self.route(null);
        self.favouriteSearch('');
    };

    this.editFavourites = function(){
        this.route('favourites');
    };

    this.stopPropagation = function(data, event){
        event.stopPropagation();
    };

    this.cancelAdd = function(){
        self.adding(null);
    };

    this.addItem = function(item){
        self.adding(null);
        var selectedName = centers2[parseInt(item.centerId())].name;
        item.center(selectedName);
        self.favList.push(item);
        $.ajax({
            'url': 'http://andreacrawford.design/hawkerdb/votes/',
            'data' : self.editing(),
            'success': function(data){
                console.log(self.editing());
            }
        })
        // db.collection('users').doc('acrawford').collection('favourites').doc(item.dishId())
        //     .set({centreId: item.centerId(), centreName: item.center(), dishName: item.category(), dishId: item.dishId()})
        //     .then(function(){self.updateFavourites();});

    };

    this.deleteItem = function(item){
        self.adding(null);
        item.centre(null);
        $.ajax({
            'url': 'http://andreacrawford.design/hawkerdb/deletevote',
            'method': 'post',
            'data' : {dish_id: item.dish_id, user_id: 1},
            'success': function(data){
                console.log('ducc');
            }
        })
    };

    this.addNew = function(){
        self.adding(new Favourite({category: null, center: null, centerId: null, dishId: null}));
    };

    this.addCategory = function(category){
        self.adding(new Favourite({category: null, center: null, centerId: null, dishId: null}));
        self.adding().category(category.name);
        self.adding().dishId(category.id);
    };

    this.foursquareTips = ko.observableArray([]);
    this.foursquareImages = ko.observableArray([]);
    this.foursquareUrl = ko.observableArray();

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
                    // itemInfo = JSON.parse(d.response.venue);
                    console.log(d.response.venue);
                    self.foursquareTips(d.response.venue.tips.groups[0].items);
                    var prefix = d.response.venue.bestPhoto.prefix;
                    var size = '300x300';
                    var suffix = d.response.venue.bestPhoto.suffix;
                    self.foursquareImages(d.response.venue.photos.groups[0].items);
                    self.foursquareUrl(d.response.venue.canonicalUrl);
                    // self.foursquareHours(d.response.venue);
                    // return d.response.venue.tips.groups[0].items[0].text;
                }
            })
        }
    }

    this.moreInfo = function(id){
        var item = $.grep(self.centers(), function(e){return e.id == id})[0]
        self.viewing(item);
        self.route(null);
        self.foursquare();
    };

    this.changeViewing = function(id){
        var item = $.grep(self.centers(), function(e){return e.id == id})[0]
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
                    self.editing(null);
            } else {
                self.editing(favourite);
            }
        } else if (favourite.centre()){
            $.ajax({
                'url':'http://andreacrawford.design/hawkerdb/votes',
                'method':'post',
                'data':{
                    'dish_id': favourite.dish_id,
                    'user_id': 1,
                    'centre_id': favourite.centre().id,
                },
                'success':function(){console.log(favourite.centre())}
            });
            // console.log(favourite);
            self.editing(!self.editing);
        }
    };

    this.favouritesList = ko.observableArray([]);

    this.searchResults = ko.computed(function(){
        console.log('running searchResults function');
        var searchTerm = new RegExp(self.favouriteSearch(), 'ig');
        var list = self.favList().filter(function(d){
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

    // this probably shouldn't be computed - what should be computed is visibleMarkers
    // this.getVisibleMarkers = ko.computed(function(){
    //     console.log('running getVisibleMarkers function');
    //     // general search bar
    //     var searchTerm = new RegExp(self.generalSearch(), 'ig');
    //
    //     //find which markers should be visible
    //     var visibleMarkers = self.centers().filter(
    //         function(d){
    //             return d.rankings.filter(
    //                 function(e){
    //                     return e['dish_name'].match(searchTerm);
    //                 }).length > 0;
    //     });
    //
    //
    //     // if self.generalSearch is defined, searchString is the lowercase version
    //     // otherwise it's an empty string
    //     var searchString = self.generalSearch() ? self.generalSearch().toLowerCase() : '';
    //     var dishIndex = $.inArray(searchString, self.dishes().map(function(d){
    //         return d.toLowerCase();
    //     }));
    //
    //     if(dishIndex == -1){
    //         self.dishExists(false);
    //     } else {
    //         self.dishExists(self.dishes()[dishIndex]);
    //     }
    //
    //     if(!self.dishExists()){
    //         // if the searchString is not a dish name, highlight the first ranking in each item's list
    //         // and set topRanked to empty
    //         self.topRanked([]);
    //     } else {
    //         // else populate top ranked with the visible markers
    //         // this is the same data as visibleMarkers, just re-ordered
    //         self.topRanked(visibleMarkers.map(function(d){return {'name': d.name, 'id': d.id, 'rank': d.rankings.filter(function(e){return e.dish_name.toLowerCase()==searchString})[0].rank}}).sort(function(a,b){return a.rank - b.rank}))
    //     }
    //
    //     visibleMarkers.forEach(function(d){
    //         var index = 0;
    //
    //         if(self.dishExists()){
    //             index = $.inArray(searchString, d.rankings.map(function(e){
    //                 return e.dish_name.toLowerCase();
    //             }));
    //         } else {
    //             d.rankings.find(function(e, i){
    //                 if(e.dish_name.match(searchTerm)){
    //                     index = i;
    //                     return true;
    //                 }
    //             })
    //         }
    //
    //         // get the marker style for each item based on its rank
    //         var markerRank = d.rankings[index].rank <= 3 ? d.rankings[index].rank : 'red';
    //
    //         // set the icon
    //         d.marker.setIcon(self.iconStyles[markerRank]);
    //     });
    //
    //     // self.visibleMarkers(visibleMarkers);
    //     self.updateMap();
    // });



        // set visibleMarkers to the temporary variable visibleMarkers
        // self.visibleMarkers(visibleMarkers);

        // find which markers should be hidden
        // var hiddenMarkers = self.centers().filter(
        //     function(d){
        //         return d.rankings.filter(
        //             function(e){
        //                 return e['dish_name'].match(searchTerm);
        //             }).length == 0;
        // });

        // hide all the hidden markers
        // hiddenMarkers.forEach(function(d){
        //     if(d.marker){
        //         d.marker.setMap(null);
        //     }
        //     console.log('hiding marker:', d);
        // });

        // console.log('hiddenMarkers');

        // if self.generalSearch is defined, searchString is the lowercase version
        // otherwise it's an empty string
        // var searchString = self.generalSearch() ? self.generalSearch().toLowerCase() : '';

        // if($.inArray(searchString, self.dishes().map(function(d){
        //     return d.toLowerCase();
        // })) == -1){
        //     self.dishExists(false);
        // } else {
        //     self.dishExists(true);
        // }
        //
        // if(!self.dishExists()){
        //     // if the searchString is not a dish name, highlight the first ranking in each item's list
        //     // and set topRanked to empty
        //     self.topRanked([]);
        // } else {
        //     // else populate top ranked with the visible markers
        //     // this is the same data as visibleMarkers, just re-ordered
        //     self.topRanked(self.visibleMarkers().map(function(d){return {'name': d.name, 'id': d.id, 'rank': d.rankings.filter(function(e){return e.dish_name.toLowerCase()==searchString})[0].rank}}).sort(function(a,b){return a.rank - b.rank}))
        // }
        //
        // visibleMarkers.forEach(function(d){
        //     // if the marker should be visible and has no map set, set the map
        //     if (d.marker.getMap()==null){
        //         d.marker.setMap(map);
        //     }
        //
        //     var index = 0;
        //
        //     if(self.dishExists()){
        //         index = $.inArray(searchString, d.rankings.map(function(e){
        //             return e.dish_name.toLowerCase();
        //         }));
        //     }
        //     // get the marker style for each item based on its rank
        //     var markerRank = d.rankings[index].rank <= 3 ? d.rankings[index].rank : 'red';
        //
        //     // set the icon
        //     d.marker.setIcon(self.iconStyles[markerRank]);
        // });
        //
        // test = self.visibleMarkers();
        //
        // // make a temporary ranking array to push info to
        // var tempRanking = [];
        //
        // // topRanked, rankingList and visibleMarkers all show the same info
        // // just rearranged...
        //
        // self.topRanked().forEach(function(f){
        // 	if(tempRanking[f.rank]){
        // 		tempRanking[f.rank].push(f);
        //     } else {
        // 		tempRanking[f.rank] = [f];
        //     }
        // });
        //
        // self.rankingList(tempRanking);
        //
        // return self.visibleMarkers();
    // });

    // this.changeRank = ko.computed(function(){
    //     console.log('running changeRank function');
    //     if(self.filterRanking() > 0){
    //         $('#centres-loading-icon').show();
    //         // $('#rankingFilter').attr('disabled', true);
    //         self.centers().forEach(
    //             function(d){
    //                 d.filteredRankings = d.rankings.filter(function(e){return e.rank <= self.filterRanking();
    //                 });
    //             });

            // $.ajax({
            //     // you need to fix this. if you limit the ranking,
            //     // centres with no rank above the limit will not be fetched.
            //     // this causes problems when the user has that in their favourites
            //     // (and cause we never fetch that center EVER);
            //     'url': 'http://andreacrawford.design/hawkerdb/centres?ranklimit=' + self.filterRanking(),
            //     'success': function(data){
            //         // console.log('these are the centers we have:', self.centers());
            //         // self.init();
            //
            //         // self.centers(tempArray);
            //         self.makeCentresFromData(data);
            //         // self.visibleMarkers(self.centers().filter(function(d){
            //         //     return d.rankings.length;
            //         // }));
            //         self.updateMap();
            //         $('#rankingFilter').attr('disabled', false);
            //         $('#rankingFilter').focus();
            //         // $('#centres-loading-icon').hide();
            //     },
            // });
    //
    //     };
    // });

    // this.updateMarkers = ko.computed(function(){
    //     console.log(self.markers());
    //     for(var i=0; i<self.markers().length; i++){
    //         self.markers()[i].setMap(null);
    //     };
    //
    //     self.markers([]);
    //
    //     var infoWindow = new google.maps.InfoWindow({});
    //
    //     // console.log(map.markers.length);
    //     console.log('aaaaaaaaaaaaaaaand here i am');
    //     console.log(self.centers().length);
    //
    //     for(var i=0; i<self.visibleCenters().length; i++){
    //         var marker = new google.maps.Marker({
    //             position: {lng:parseFloat(self.visibleCenters()[i]['lng']), lat:parseFloat(self.visibleCenters()[i]['lat'])},
    //             map: map,
    //         });
    //
    //         marker.addListener('click', (function(thisMarker, thisInfo){
    //             var rankingHTML = '';
    //             if(thisInfo.rankings.length > 0){
    //                 rankingHTML += '<hr/>';
    //                 for(var i = 0; i<thisInfo.rankings.length && i<3; i++){
    //                     rankingHTML += '<i class="fa fa-certificate c-ranking--' + thisInfo.rankings[i].rank + '"></i> <strong>#' + thisInfo.rankings[i].rank + '</strong> for ' + thisInfo.rankings[i].dish_name + '</br>';
    //                 };
    //                 if(thisInfo.rankings.length > 3){
    //                     rankingHTML += 'And '+ (thisInfo.rankings.length - 3) +' more&hellip;';
    //                 };
    //             }
    //             return function(){
    //                 self.changeViewing(thisInfo.id);
    //                 thisMarker.setAnimation(google.maps.Animation.DROP);
    //                 infoWindow.setContent('<div id="info-window" data-bind="click: function(){moreInfo(' + thisInfo.id + ')}" class="c-infowindow"><h4>' + thisInfo.name + '</h4>'+
    //                 rankingHTML +
    //                 '</div>');
    //                 infoWindow.open(map, thisMarker);
    //                 ko.applyBindings(self, document.getElementById('info-window'));
    //             }
    //         })(marker, self.visibleCenters()[i]))
    //
    //         self.markers.push(marker);
    //
    //         infoWindow.addListener('closeclick', function(){
    //             self.clearViewing();
    //         });
    //
    //
    //         }
    //     $('#centres-loading-icon').hide();
    // });


    //
    // this.generalResults = ko.computed(function(){
    //     var searchTerm = new RegExp(self.generalSearch(), 'ig');
    //     // var searchTerm = new RegExp('chicken porridge', 'ig');
    //     console.log('running generalResults');
    //     // self.updateMarkers(self.centers().filter(
    //     //     function(d){
    //     //         return d.rankings.filter(
    //     //             function(e){
    //     //                 return e['dish_name'].match(searchTerm);
    //     //             }).length > 0;
    //     //         }));
    //     // test = self.centers();
    //     self.visibleCenters(self.centers().filter(
    //         function(d){
    //             return d.rankings.filter(
    //                 function(e){
    //                     return e['dish_name'].match(searchTerm);
    //                 }).length > 0;
    //             }));
    //     // self.updateMarkers();
    //     // return self.centers().filter(function(d){
    //     //     // console.log(d);
    //     //     return d.rankings[0]['dish_name'].match(searchTerm);
    //     // }).sort(function(a, b){
    //     //     if(a.dish_name < b.dish_name){
    //     //         return -1;
    //     //     }
    //     //     if(a.dish_name > b.dish_name){
    //     //         return 1;
    //     //     }
    //     //     return 0;
    //     // });
    // });

    this.clearSelected = function(){
        if(self.adding()){
            self.adding().category(null);
        }
    };

    this.categorySearchResults = ko.computed(function(){
        if(self.adding()){
            // self.adding().category(null);
        };
        var existing = self.favList().map(function(d){return d.dish_name});
        var searchTerm = new RegExp(self.categorySearch(), 'ig');
        return self.categories().filter(function(d){
            return d.name.match(searchTerm) && $.inArray(d.name, existing)==-1;
        }).sort(function(a, b){
            return a.name.localeCompare(b.name);
        });
    });
    this.messages = ko.observableArray([]);

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
        // var category = self.generalSearch() ? ' in the category <span class="c-message-list__emphasis">' + self.generalSearch() + '</span>' : ' in <span class="c-message-list__emphasis">any</span> category';
        if(self.generalSearch() || self.filterRanking()){
            return "Showing <span class='c-message-list__emphasis'>" +  self.visibleMarkers().length + "</span> result" + plural + " with " + ranking + category;
        }
    });
}

$(document).ready(function(){
    // ko.options.deferUpdates = true;

    vm = new ViewModel();
    ko.applyBindings(vm);
    vm.init();
})
